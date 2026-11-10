/* ===================================================================
   ATMOS SIGILS — Персонални сигили + Goetia справочник
   Команди: /sigil <намерение>, /sigil share, /sigil reverse,
            /sigil goetia, /sigil goetia share, /sigil goetia <име>
=================================================================== */

const SIGIL_STYLE = {
  bgTop:      "#0a0a0a",
  bgMid:      "#141414",
  bgBot:      "#050505",
  accent:     "#d4af37",
  accentSoft: "rgba(212, 175, 55, 0.35)",
  accentDeep: "#ffd700",
  textPrimary:"#f5e6c8",
  textMuted:  "rgba(245, 230, 200, 0.55)",
  fontHead:   "serif",
  fontMono:   "monospace"
};

const GOETIA_STYLE = {
  bg:         "#f5f0e6",
  bgDark:     "#e8dfc8",
  textDark:   "#1a1a1a",
  textRed:    "#8b0000",
  accent:     "#d4af37",
  border:     "#8b0000",
  fontHead:   "serif",
  fontMono:   "monospace"
};

/* =========================================================
   БУКВЕНИ ТАБЛИЦИ
========================================================= */

const SIGIL_CYRILLIC = {
  'А':1,'Б':2,'В':3,'Г':4,'Д':5,'Е':6,'Ж':7,'З':8,'И':9,'Й':10,
  'К':11,'Л':12,'М':13,'Н':14,'О':15,'П':16,'Р':17,'С':18,'Т':19,'У':20,
  'Ф':21,'Х':22,'Ц':23,'Ч':24,'Ш':25,'Щ':26,'Ъ':27,'Ь':28,'Ю':29,'Я':30
};

const SIGIL_LATIN = {
  'A':1,'B':2,'C':3,'D':4,'E':5,'F':6,'G':7,'H':8,'I':9,'J':10,
  'K':11,'L':12,'M':13,'N':14,'O':15,'P':16,'Q':17,'R':18,'S':19,'T':20,
  'U':21,'V':22,'W':23,'X':24,'Y':25,'Z':26
};

/* =========================================================
   ПОМОЩНИ
========================================================= */

function sigilGetDateStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function sigilGenerateId(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 5).toUpperCase().padStart(5, '0');
}

function ensureSigilsRoom() {
  try {
    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (!rooms.includes("sigils")) {
      rooms.push("sigils");
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  } catch (e) {}
}

function sigilPushToChat(text, room) {
  const pushFn = function() {
    if (typeof db !== "undefined") {
      db.ref("atmos_chat").push({
        name: "[SIGILS]",
        text: text,
        timestamp: Date.now(),
        room: room || "sigils"
      });
    }
  };

  if (window.__isOraclePage) {
    window.__oracleLastPush = pushFn;
    return;
  }

  ensureSigilsRoom();
  pushFn();
}

function sigilSaveLast(data) {
  try { localStorage.setItem("atmos_sigils_last", JSON.stringify(data)); } catch (e) {}
}

function sigilLoadLast() {
  try {
    const raw = localStorage.getItem("atmos_sigils_last");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function sigilWrapText(ctx, text, maxWidth, maxLines) {
  const words = (text || "").split(" ");
  const lines = [];
  let cur = "";
  for (let i = 0; i < words.length; i++) {
    const test = cur + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      lines.push(cur.trim());
      cur = words[i] + " ";
      if (maxLines && lines.length >= maxLines) {
        if (cur.trim()) lines[lines.length - 1] += "...";
        return lines;
      }
    } else {
      cur = test;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

/* =========================================================
   FUZZY MATCHING за Goetia имена
========================================================= */

function sigilLevenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findGoetia(query) {
  const list = window.atmosGoetia || [];
  const q = query.toLowerCase().trim();
  if (!q) return { found: null, suggestions: [] };

  // Точно по id или name
  for (const d of list) {
    if (d.id.toLowerCase() === q || d.name.toLowerCase() === q) {
      return { found: d, suggestions: [] };
    }
  }

  // Проверка в aliases
  for (const d of list) {
    if (d.aliases) {
      for (const a of d.aliases) {
        if (a.toLowerCase() === q) return { found: d, suggestions: [] };
      }
    }
  }

  // Частично съвпадение
  const partial = list.filter(d => 
    d.id.toLowerCase().includes(q) || 
    d.name.toLowerCase().includes(q)
  );
  if (partial.length === 1) return { found: partial[0], suggestions: [] };
  if (partial.length > 1) return { found: null, suggestions: partial.slice(0, 3) };

  // Fuzzy
  const scored = [];
  for (const d of list) {
    let bestScore = sigilLevenshtein(q, d.name.toLowerCase());
    if (d.aliases) {
      for (const a of d.aliases) {
        const s = sigilLevenshtein(q, a.toLowerCase());
        if (s < bestScore) bestScore = s;
      }
    }
    const threshold = Math.max(2, Math.floor(q.length / 3));
    if (bestScore <= threshold) {
      scored.push({ demon: d, score: bestScore });
    }
  }

  scored.sort((a, b) => a.score - b.score);
  if (scored.length > 0) {
    return { found: null, suggestions: scored.slice(0, 3).map(s => s.demon) };
  }

  return { found: null, suggestions: [] };
}

/* =========================================================
   АЛГОРИТЪМ ЗА ПЕРСОНАЛЕН СИГИЛ
========================================================= */

function sigilPrepareIntention(text) {
  // Изчистваме препинателни знаци и цифри
  let cleaned = text.replace(/[^A-Za-zА-Яа-яЁё\s]/g, '');
  cleaned = cleaned.toUpperCase().trim();
  if (!cleaned) return null;

  // Премахваме повторения (оставяме само уникални букви, в реда на първа поява)
  const seen = new Set();
  const unique = [];
  for (const ch of cleaned) {
    if (ch === ' ') continue;
    if (!seen.has(ch)) {
      seen.add(ch);
      unique.push(ch);
    }
  }

  if (unique.length === 0) return null;

  // Трансформираме в числа
  const numbers = [];
  for (const ch of unique) {
    if (SIGIL_CYRILLIC[ch]) numbers.push(SIGIL_CYRILLIC[ch]);
    else if (SIGIL_LATIN[ch]) numbers.push(SIGIL_LATIN[ch]);
  }

  return { text: cleaned, letters: unique, numbers: numbers };
}

function sigilBuildPoints(numbers, cx, cy, radius) {
  const points = [];
  const isCyrillic = Math.max(...numbers) > 26;

  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    const maxN = isCyrillic ? 30 : 26;
    const angle = (n * 2 * Math.PI) / maxN;
    const length = radius * (0.35 + (n / maxN) * 0.6);
    const x = cx + length * Math.cos(angle);
    const y = cy + length * Math.sin(angle);
    points.push({ x, y });
  }

  return points;
}

function sigilDrawGeometry(ctx, points, cx, cy, isReverse) {
  if (points.length === 0) return;

  const S = SIGIL_STYLE;

  // Главни линии
  ctx.strokeStyle = S.accent;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // Затваряща линия към центъра
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  // Точки във всеки връх
  ctx.fillStyle = S.accentDeep;
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Централна точка
  ctx.fillStyle = "#fff8dc";
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = S.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.stroke();
}

/* =========================================================
   DISPATCHER (синхронна)
========================================================= */

function sigilsMessage(cmd) {
  if (!cmd) cmd = "/sigil";
  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);

  // /sigil
  if (parts.length === 1) {
    return sigilShowHelp();
  }

  const sub = parts[1].toLowerCase();

  // /sigil share
  if (sub === "share") {
    sigilShare();
    return "";
  }

  // /sigil reverse <намерение>
  if (sub === "reverse") {
    const rest = cmd.replace(/^\/sigil\s+reverse\s*/i, "").trim();
    if (!rest) return "Error: Използвай /sigil reverse <намерение>";
    return sigilGenerate(rest, true);
  }

  // /sigil goetia ...
  if (sub === "goetia") {
    const rest = cmd.replace(/^\/sigil\s+goetia\s*/i, "").trim();

    if (!rest) {
      // /sigil goetia → случаен в main
      return sigilGoetiaRandom();
    }

    if (rest.toLowerCase() === "share") {
      // /sigil goetia share → случаен като картинка
      sigilGoetiaShare();
      return "";
    }

    // /sigil goetia <име>
    return sigilGoetiaShow(rest);
  }

  // /sigil <намерение>
  const rest = cmd.replace(/^\/sigil\s+/i, "").trim();
  return sigilGenerate(rest, false);
}

/* =========================================================
   HELP
========================================================= */

function sigilShowHelp() {
  return `ATMOS SIGILS — Персонални сигили и Goetia справочник

ПЕРСОНАЛНИ СИГИЛИ
  /sigil <намерение>          Генерира сигил от изречението
  /sigil share                Повтаря последния сигил
  /sigil reverse <намерение>  Сигил за отблъскване

GOETIA СПРАВОЧНИК (72 демона от Ars Goetia)
  /sigil goetia               Случаен демон (в main чата)
  /sigil goetia share         Случаен демон като картинка
  /sigil goetia <име>         Детайли за конкретен демон

Примери:
  /sigil Искам да намеря работа
  /sigil reverse Страхът да изчезне
  /sigil goetia Bael
  /sigil goetia                 (случаен)`;
}

/* =========================================================
   /sigil <намерение> — ГЕНЕРИРА ПЕРСОНАЛЕН СИГИЛ
========================================================= */

async function sigilGenerate(intention, isReverse) {
  if (!intention || intention.length < 3) {
    return "Error: Намерението трябва да е поне 3 символа.";
  }

  const prepared = sigilPrepareIntention(intention);
  if (!prepared || prepared.numbers.length === 0) {
    return "Error: Не мога да извлека букви от намерението.";
  }

  // При reverse обръщаме реда на числата
  if (isReverse) {
    prepared.numbers.reverse();
    prepared.letters.reverse();
  }

  const id = sigilGenerateId(intention + (isReverse ? "_rev" : ""));
  const dateStr = sigilGetDateStr();

  // Записваме последния сигил
  const lastData = {
    type: isReverse ? "reverse" : "personal",
    intention: intention,
    prepared: prepared,
    id: id,
    date: dateStr
  };
  sigilSaveLast(lastData);

  // Генерираме картинката
  const imageBase64 = await sigilRenderPersonalCard(lastData);

  if (!imageBase64) {
    return "Error: Не успях да генерирам картинката.";
  }

  // Текст за чата
  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `✦ ${isReverse ? "ОБРАТЕН СИГИЛ" : "ПЕРСОНАЛЕН СИГИЛ"}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `📜 Намерение: „${intention}"\n`;
  out += `🔤 Уникални букви: ${prepared.letters.join(" ")}\n`;
  out += `🔢 Числа: ${prepared.numbers.join(" ")}\n`;
  out += `🆔 ID: ${id}\n`;
  out += `📅 Дата: ${dateStr}\n`;

  sigilPushToChat(out, "sigils");

  // UI — показваме картинката
  sigilOutputImage(imageBase64, "atmos_sigil", {
    type: "sigil",
    resolved: {
      intention: intention,
      letters: prepared.letters,
      numbers: prepared.numbers,
      id: id,
      isReverse: isReverse
    },
    date: dateStr
  });

  return "Сигилът е генериран.";
}

/* =========================================================
   /sigil share — ПОВТАРЯ ПОСЛЕДНИЯ
========================================================= */

async function sigilShare() {
  const last = sigilLoadLast();

  if (!last || last.type === "goetia") {
    // Ако последният е бил goetia, share работи като goetia share
    if (last && last.type === "goetia") {
      return await sigilGoetiaShareRender(last.demon);
    }
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nНяма последен сигил за споделяне.\n\nИзползвай първо:\n  /sigil <намерение>\n  /sigil reverse <намерение>\n  /sigil goetia <име>\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  if (last.type === "personal" || last.type === "reverse") {
    const imageBase64 = await sigilRenderPersonalCard(last);
    if (!imageBase64) {
      const output = document.getElementById("terminalOutput");
      if (output) {
        output.innerHTML += `\nГрешка при рендиране.\n`;
        output.scrollTop = output.scrollHeight;
      }
      return;
    }
    sigilOutputImage(imageBase64, "atmos_sigil", {
      type: "sigil",
      resolved: {
        intention: last.intention,
        letters: last.prepared.letters,
        numbers: last.prepared.numbers,
        id: last.id,
        isReverse: last.type === "reverse"
      },
      date: last.date
    });
  }
}

/* =========================================================
   /sigil goetia — СЛУЧАЕН ДЕМОН (в main)
========================================================= */

function sigilGoetiaRandom() {
  const list = window.atmosGoetia || [];
  if (list.length === 0) return "Error: Липсват демони в goetia_data.js";

  const d = list[Math.floor(Math.random() * list.length)];

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `✦ GOETIA: ${d.name} (№${d.number})\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `👑 Ранг: ${d.rank} • ${d.legions} легиона\n\n`;
  out += `👁 Форма: ${d.appearance}\n\n`;
  out += `⚡ Сили: ${d.powers}\n\n`;
  out += `📖 ${d.description}\n`;

      sigilSaveLast({ type: "goetia", demon: d, date: sigilGetDateStr() });

  // Отива в MAIN (винаги — системна команда)
  if (typeof sendSystemLine === "function") {
    sendSystemLine(out);
  } else if (typeof db !== "undefined") {
    db.ref("atmos_chat").push({
      name: "[SYSTEM]",
      text: out,
      timestamp: Date.now(),
      room: "main"
    });
  }

  if (window.__isOraclePage) return out;
  return "Демонът е публикуван в main чата.";
}

/* =========================================================
   /sigil goetia share — СЛУЧАЕН ДЕМОН КАТО КАРТИНКА
========================================================= */

async function sigilGoetiaShare() {
  const list = window.atmosGoetia || [];
  if (list.length === 0) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nError: Липсват демони в goetia_data.js\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  const d = list[Math.floor(Math.random() * list.length)];
  sigilSaveLast({ type: "goetia", demon: d, date: sigilGetDateStr() });
  await sigilGoetiaShareRender(d);
}

async function sigilGoetiaShareRender(demon) {
  const imageBase64 = await sigilRenderGoetiaCard(demon);
  if (!imageBase64) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nГрешка при рендиране на демона.\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  sigilOutputImage(imageBase64, "atmos_goetia", {
    type: "goetia",
    resolved: {
      id: demon.id,
      number: demon.number,
      name: demon.name,
      rank: demon.rank,
      legions: demon.legions,
      appearance: demon.appearance,
      powers: demon.powers,
      description: demon.description,
      sigilUrl: demon.sigilUrl
    },
    date: sigilGetDateStr()
  });
}

/* =========================================================
   /sigil goetia <име> — ДЕТАЙЛИ ЗА КОНКРЕТЕН ДЕМОН
========================================================= */

function sigilGoetiaShow(query) {
  const result = findGoetia(query);

  if (result.found) {
    return sigilGoetiaShowDetail(result.found);
  }

  if (result.suggestions.length > 0) {
    let out = `Не открих демон „${query}".\n\n`;
    out += `Може би имахте предвид:\n\n`;
    result.suggestions.forEach(s => {
      out += `  • ${s.name} (№${s.number})\n`;
    });
    out += `\nУпотреба: /sigil goetia <име>`;
    return out;
  }

  // Нищо не намерихме — показваме първите няколко като пример
  let out = `Не открих демон „${query}".\n\n`;
  out += `Ето няколко примера:\n\n`;
  const samples = (window.atmosGoetia || []).slice(0, 6);
  samples.forEach(s => {
    out += `  • ${s.name} (№${s.number})\n`;
  });
  out += `\nУпотреба: /sigil goetia <име>`;
  return out;
}

function sigilGoetiaShowDetail(d) {
  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `✦ GOETIA: ${d.name.toUpperCase()} (№${d.number})\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  out += `👑 Ранг: ${d.rank}\n`;
  out += `⚔️ Легиони: ${d.legions}\n`;
  if (d.aliases && d.aliases.length > 0) {
    out += `📝 Псевдоними: ${d.aliases.join(", ")}\n`;
  }
  out += `\n`;

  out += `━━━ ФОРМА ━━━\n`;
  out += `${d.appearance}\n\n`;

  out += `━━━ СИЛИ ━━━\n`;
  out += `${d.powers}\n\n`;

  out += `━━━ ОПИСАНИЕ ━━━\n`;
  out += `${d.description}\n\n`;

  out += `🔗 Sigil: ${d.sigilUrl}\n`;

  sigilPushToChat(out, "sigils");
  sigilSaveLast({ type: "goetia", demon: d, date: sigilGetDateStr() });

  return out;
}

/* =========================================================
   РЕНДЕР: ПЕРСОНАЛЕН СИГИЛ (черно-бял, златен)
========================================================= */

async function sigilRenderPersonalCard(data) {
  const S = SIGIL_STYLE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080;
  canvas.height = 1920;

  /* ФОН */
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* ЗВЕЗДИ */
  ctx.fillStyle = "rgba(245, 230, 200, 0.08)";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  /* ВЪНШНА РАМКА */
  ctx.strokeStyle = S.accentSoft;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  /* ЪГЛОВИ ОРНАМЕНТИ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 36px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", 95, 95);
  ctx.fillText("✦", canvas.width - 95, 95);
  ctx.fillText("✦", 95, canvas.height - 95);
  ctx.fillText("✦", canvas.width - 95, canvas.height - 95);

  /* ЗАГЛАВИЕ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 40px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS SIGIL ✦", canvas.width / 2, 120);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(data.type === "reverse" ? "REVERSE SIGIL" : "PERSONAL SIGIL", canvas.width / 2, 165);

  /* ГОРЕН НАДПИС — НАМЕРЕНИЕТО */
  const intentText = "◄◄◄ " + data.intention.toUpperCase() + " ►►►";
  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 28px ${S.fontHead}`;
  const intentLines = sigilWrapText(ctx, intentText, canvas.width - 200, 3);
  const intentStartY = 240;
  intentLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, intentStartY + i * 38);
  });

  /* ДВОЕН КРЪГ */
  const cx = canvas.width / 2;
  const cy = 960;
  const outerRadius = 400;
  const innerRadius = 360;

  ctx.strokeStyle = S.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = S.accentSoft;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  /* ЛЕКИ ДЕКОРАТИВНИ ТОЧКИ ПО ВЪНШНИЯ КРЪГ */
  ctx.fillStyle = S.accent;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const px = cx + outerRadius * Math.cos(angle);
    const py = cy + outerRadius * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /* СИГИЛЪТ — построяваме точките */
  const points = sigilBuildPoints(data.prepared.numbers, cx, cy, innerRadius * 0.85);
  sigilDrawGeometry(ctx, points, cx, cy, data.type === "reverse");

  /* ДОЛЕН НАДПИС */
  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("✦ ATMOS SIGIL ENGINE ✦", canvas.width / 2, 1520);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 20px ${S.fontMono}`;
  ctx.fillText(`${data.date} // ${data.id}`, canvas.width / 2, 1560);

  /* FOOTER */
  ctx.strokeStyle = S.accentSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, canvas.height - 130);
  ctx.lineTo(canvas.width - 120, canvas.height - 130);
  ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("GEOMETRIC SIGIL GENERATOR", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  /* ЕКСПОРТ */
  try {
    return canvas.toDataURL("image/png");
  } catch (e) {
    return null;
  }
}

/* =========================================================
   РЕНДЕР: GOETIA ДЕМОН (червено-черен върху пергамент)
========================================================= */

async function sigilRenderGoetiaCard(d) {
  const G = GOETIA_STYLE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080;
  canvas.height = 1920;

  /* ФОН — ПЕРГАМЕНТ */
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, G.bg);
  bgGrad.addColorStop(1, G.bgDark);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* ТЕКСТУРА НА ПЕРГАМЕНТ */
  ctx.fillStyle = "rgba(139, 0, 0, 0.03)";
  for (let i = 0; i < 800; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  /* РАМКА — ЧЕРВЕНА */
  ctx.strokeStyle = G.border;
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  ctx.strokeStyle = G.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  /* ЪГЛОВИ ОРНАМЕНТИ */
  ctx.fillStyle = G.border;
  ctx.font = `bold 36px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✠", 95, 95);
  ctx.fillText("✠", canvas.width - 95, 95);
  ctx.fillText("✠", 95, canvas.height - 95);
  ctx.fillText("✠", canvas.width - 95, canvas.height - 95);

  /* ЗАГЛАВИЕ */
  ctx.fillStyle = G.border;
  ctx.font = `bold 44px ${G.fontHead}`;
  ctx.fillText("✦ ATMOS GOETIA ✦", canvas.width / 2, 120);

  ctx.fillStyle = G.textDark;
  ctx.font = `18px ${G.fontMono}`;
  ctx.fillText(`ARS GOETIA // №${d.number} // ${sigilGetDateStr()}`, canvas.width / 2, 165);

  ctx.strokeStyle = G.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 195);
  ctx.lineTo(canvas.width - 120, 195);
  ctx.stroke();

  /* СИГИЛ ИЗОБРАЖЕНИЕ */
  const sigilImgY = 260;
  const sigilImgSize = 500;

  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("load-failed"));
      i.src = d.sigilUrl;
    });

    // Рамка около сигнала
    ctx.fillStyle = "rgba(139, 0, 0, 0.05)";
    ctx.fillRect(canvas.width / 2 - sigilImgSize / 2 - 10, sigilImgY - 10, sigilImgSize + 20, sigilImgSize + 20);
    ctx.strokeStyle = G.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - sigilImgSize / 2 - 10, sigilImgY - 10, sigilImgSize + 20, sigilImgSize + 20);

    // Напасваме изображението
    const imgRatio = img.width / img.height;
    let dw, dh;
    if (imgRatio > 1) {
      dw = sigilImgSize;
      dh = sigilImgSize / imgRatio;
    } else {
      dh = sigilImgSize;
      dw = sigilImgSize * imgRatio;
    }
    const dx = canvas.width / 2 - dw / 2;
    const dy = sigilImgY + (sigilImgSize - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  } catch (e) {
    // Fallback — показваме текстово съобщение
    ctx.fillStyle = G.border;
    ctx.font = `bold 24px ${G.fontMono}`;
    ctx.fillText("[ сигналът не се зареди ]", canvas.width / 2, sigilImgY + sigilImgSize / 2);
  }

  /* ИМЕ НА ДЕМОНА */
  const nameY = sigilImgY + sigilImgSize + 80;
  ctx.fillStyle = G.textDark;
  ctx.font = `bold 68px ${G.fontHead}`;
  ctx.fillText(d.name, canvas.width / 2, nameY);

  /* РАНГ И ЛЕГИОНИ */
  ctx.fillStyle = G.textRed;
  ctx.font = `bold 26px ${G.fontMono}`;
  ctx.fillText(`${d.rank.toUpperCase()} • ${d.legions} LEGIONS`, canvas.width / 2, nameY + 55);

  /* ФОРМА */
  ctx.fillStyle = G.border;
  ctx.font = `bold 20px ${G.fontMono}`;
  ctx.fillText("ФОРМА", canvas.width / 2, nameY + 115);

  ctx.fillStyle = G.textDark;
  ctx.font = `italic 24px ${G.fontHead}`;
  const appLines = sigilWrapText(ctx, d.appearance, canvas.width - 200, 3);
  appLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, nameY + 155 + i * 32);
  });

  /* СИЛИ */
  const powersY = nameY + 155 + appLines.length * 32 + 40;
  ctx.fillStyle = G.border;
  ctx.font = `bold 20px ${G.fontMono}`;
  ctx.fillText("СИЛИ", canvas.width / 2, powersY);

  ctx.fillStyle = G.textDark;
  ctx.font = `22px ${G.fontHead}`;
  const powerLines = sigilWrapText(ctx, d.powers, canvas.width - 200, 4);
  powerLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, powersY + 40 + i * 30);
  });

  /* FOOTER */
  ctx.strokeStyle = G.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, canvas.height - 130);
  ctx.lineTo(canvas.width - 120, canvas.height - 130);
  ctx.stroke();

  ctx.fillStyle = G.textRed;
  ctx.font = `18px ${G.fontMono}`;
  ctx.fillText("ATMOS GOETIA ENGINE // ARS GOETIA", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = G.border;
  ctx.font = `bold 22px ${G.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  /* ЕКСПОРТ */
  try {
    return canvas.toDataURL("image/png");
  } catch (e) {
    return null;
  }
}

/* =========================================================
   OUTPUT — показва картинката в терминала
========================================================= */

function sigilOutputImage(imageBase64, prefix, payload) {
  // Firebase buffer за download.html
  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    activeDb.ref("fortune_buffer").set({
      type: payload.type,
      resolved: payload.resolved,
      timestamp: Date.now(),
      date: payload.date
    }).catch(() => {});
  }

     if (window.__isOraclePage) {
    window.__oracleLastImage = imageBase64;
    return;
  }

  const isModernUI = window.__isModernUI === true;
  const downloadHref = "https://tinyurl.com/bmnrux6t";
  const output = document.getElementById("terminalOutput") || document.body;

  const accentColor = payload.type === "goetia" ? "#8b0000" : "#d4af37";
  const label = payload.type === "goetia" ? "GOETIA" : "SIGIL";
  const title = payload.type === "goetia" 
    ? `[SIGILS] Демон: ${payload.resolved.name}` 
    : `[SIGILS] Сигилът е генериран`;

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${accentColor}; background: #000; font-family: monospace;">
          <p style="color: ${accentColor}; margin-bottom: 10px;">${title}:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${accentColor}; display: block; margin-bottom: 15px;" alt="Atmos ${label}"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${accentColor}; color: #fff; padding: 10px 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 10px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
            📥 [СВАЛИ КАРТИНКАТА]
          </a>
        </div>
      `;
      output.scrollTop = output.scrollHeight;
    }, 500);
  } else {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const fbShareUrl = isMobile ? "https://m.facebook.com/" : "https://www.facebook.com/";
    const xShareUrl = "https://x.com/intent/tweet";
    const igShareUrl = "https://www.instagram.com/";

    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${accentColor}; background: #000; font-family: monospace;">
          <p style="color: ${accentColor}; margin-bottom: 10px;">${title}:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${accentColor}; display: block; margin-bottom: 15px;" alt="Atmos ${label}"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${accentColor}; color: #fff; padding: 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
            [СВАЛИ КАРТИНКАТА]
          </a>
          <p style="color: #555; margin-bottom: 10px;">[СПОДЕЛЯНЕ] Качи от галерията:</p>
          <div class="share-buttons-group" style="display: flex; flex-wrap: wrap; gap: 10px;">
            <a href="${fbShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #3b5998; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; display: inline-block; border-radius: 4px;">[FACEBOOK]</a>
            <a href="${igShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #e1306c; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; display: inline-block; border-radius: 4px;">[INSTAGRAM]</a>
            <a href="${xShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #111; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; border: 1px solid #fff; display: inline-block; border-radius: 4px;">[X / TWITTER]</a>
          </div>
        </div>
      `;
      output.scrollTop = output.scrollHeight;
    }, 500);
  }
}