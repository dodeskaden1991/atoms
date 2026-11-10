/* ===================================================================
   ATMOS MANTRAS — Логика на мантрите
   Команди: /mantra, /mantra share, /mantra <име>, /mantra practice <тема>
=================================================================== */

const MANTRA_STYLE = {
  bgTop:      "#1a0d02",
  bgMid:      "#2d1505",
  bgBot:      "#0a0400",
  accent:     "#f4a261",
  accentSoft: "rgba(244, 162, 97, 0.35)",
  accentDeep: "#ffd700",
  textPrimary:"#fff3e0",
  textMuted:  "rgba(255, 243, 224, 0.55)",
  fontHead:   "serif",
  fontMono:   "monospace"
};

const MANTRA_THEMES = {
  protection:     { title: "Защита",       description: "Мантри за защита от негативни сили и опасности" },
  healing:        { title: "Изцеление",    description: "Мантри за физическо и емоционално изцеление" },
  love:           { title: "Любов",        description: "Мантри за любов, състрадание и отваряне на сърцето" },
  wisdom:         { title: "Мъдрост",      description: "Мантри за знание, яснота на ума и просветление" },
  peace:          { title: "Мир",          description: "Мантри за вътрешен мир и спокойствие" },
  abundance:      { title: "Изобилие",     description: "Мантри за просперитет, богатство и изобилие" },
  purification:   { title: "Пречистване",  description: "Мантри за пречистване на карма и негативни енергии" },
  courage:        { title: "Смелост",      description: "Мантри за смелост, сила и преодоляване на страх" },
  devotion:       { title: "Преданост",    description: "Мантри за преданост, отдаване и свързване с Бога" },
  spirituality:   { title: "Духовност",    description: "Мантри за духовно израстване и свързване с висшето" },
  creativity:     { title: "Творчество",   description: "Мантри за творчество, вдъхновение и изразяване" },
  health:         { title: "Здраве",       description: "Мантри за физическо здраве и жизненост" },
  forgiveness:    { title: "Прошка",       description: "Мантри за прошка и освобождаване от миналото" },
  transformation: { title: "Трансформация",description: "Мантри за трансформация и вътрешна промяна" }
};

/* Речник: кирилски думи → ключ на тема */
const MANTRA_THEME_ALIASES = {
  // protection
  "защита": "protection", "закрила": "protection", "сигурност": "protection",
  // healing
  "изцеление": "healing", "лечение": "healing", "здраве": "health", "здравословен": "health",
  // love
  "любов": "love", "обич": "love", "сърце": "love", "връзка": "love", "състрадание": "love",
  // wisdom
  "мъдрост": "wisdom", "знание": "wisdom", "просветление": "wisdom", "яснота": "wisdom",
  // peace
  "мир": "peace", "спокойствие": "peace", "тишина": "peace", "покой": "peace",
  // abundance
  "изобилие": "abundance", "богатство": "abundance", "просперитет": "abundance", "пари": "abundance",
  // purification
  "пречистване": "purification", "очистване": "purification", "карма": "purification",
  // courage
  "смелост": "courage", "сила": "courage", "кураж": "courage", "страх": "courage",
  // devotion
  "преданост": "devotion", "вяра": "devotion", "бог": "devotion", "молитва": "devotion",
  // spirituality
  "духовност": "spirituality", "дух": "spirituality", "душа": "spirituality",
  // creativity
  "творчество": "creativity", "вдъхновение": "creativity", "изкуство": "creativity",
  // health
  "здраве": "health", "жизненост": "health", "тяло": "health",
  // forgiveness
  "прошка": "forgiveness", "прощаване": "forgiveness", "освобождаване": "forgiveness",
  // transformation
  "трансформация": "transformation", "промяна": "transformation", "пътешествие": "transformation"
};

/* =========================================================
   ПОМОЩНИ
========================================================= */

function mantraGetDateStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function drawRandomMantra() {
  const deck = window.atmosMantras || [];
  if (deck.length === 0) return null;
  return deck[Math.floor(Math.random() * deck.length)];
}

function ensureMantrasRoom() {
  try {
    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (!rooms.includes("mantras")) {
      rooms.push("mantras");
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  } catch (e) {}
}

function mantraPushToChat(text) {
  const pushFn = function() {
    if (typeof db !== "undefined") {
      db.ref("atmos_chat").push({
        name: "[MANTRAS]",
        text: text,
        timestamp: Date.now(),
        room: "mantras"
      });
    }
  };

  if (window.__isOraclePage) {
    window.__oracleLastPush = pushFn;
    return;
  }

  ensureMantrasRoom();
  pushFn();
}

function mantraSaveLast(data) {
  try { localStorage.setItem("atmos_mantras_last", JSON.stringify(data)); } catch (e) {}
}

function mantraLoadLast() {
  try {
    const raw = localStorage.getItem("atmos_mantras_last");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function mantraWrapText(ctx, text, maxWidth, maxLines) {
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
   FUZZY MATCHING
========================================================= */

function mantraLevenshtein(a, b) {
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

function findMantra(query) {
  const mantras = window.atmosMantras || [];
  const q = query.toLowerCase().trim();
  if (!q) return { found: null, suggestions: [] };

  // 1. Точно по id
  for (const m of mantras) {
    if (m.id.toLowerCase() === q) return { found: m, suggestions: [] };
  }

  // 2. Точно по name
  for (const m of mantras) {
    if (m.name.toLowerCase() === q) return { found: m, suggestions: [] };
  }

  // 3. Частично съвпадение
  const partial = mantras.filter(m =>
    m.id.toLowerCase().includes(q) ||
    m.name.toLowerCase().includes(q)
  );
  if (partial.length === 1) return { found: partial[0], suggestions: [] };
  if (partial.length > 1) return { found: null, suggestions: partial.slice(0, 5) };

  // 4. Fuzzy
  const queryWords = q.split(/\s+/).filter(w => w.length >= 3);
  const scored = [];

  for (const m of mantras) {
    const nameWords = m.name.toLowerCase().split(/\s+/);
    const idWords = m.id.toLowerCase().split(/[_\s]+/);
    const allWords = nameWords.concat(idWords);
    let bestScore = Infinity;

    for (const qw of queryWords) {
      for (const nw of allWords) {
        const dist = mantraLevenshtein(qw, nw);
        if (dist < bestScore) bestScore = dist;
      }
    }

    const maxLen = Math.max(...queryWords.map(w => w.length), 3);
    const threshold = Math.max(1, Math.floor(maxLen / 3));

    if (bestScore <= threshold) {
      scored.push({ mantra: m, score: bestScore });
    }
  }

  scored.sort((a, b) => a.score - b.score);
  if (scored.length > 0) {
    return { found: null, suggestions: scored.slice(0, 5).map(s => s.mantra) };
  }

  return { found: null, suggestions: [] };
}

/* =========================================================
   DISPATCHER (синхронна!)
========================================================= */

function mantrasMessage(cmd) {
  if (!cmd) cmd = "/mantra";
  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);

  // /mantra
  if (parts.length === 1) {
    return mantraRandom();
  }

  const sub = parts[1].toLowerCase();

  // /mantra share
  if (sub === "share") {
    // Извикваме async функцията БЕЗ да я чакаме
    // Тя ще напише картинката сама в terminalOutput, когато е готова
    mantraShare();
    return "";
  }

  // /mantra practice <тема>
  if (sub === "practice") {
    const rest = cmd.replace(/^\/mantra\s+practice\s*/i, "").trim();
    return mantraPractice(rest);
  }

  // /mantra themes
  if (sub === "themes") {
    return mantraShowThemes();
  }

  // /mantra <име>
  const rest = cmd.replace(/^\/mantra\s+/i, "").trim();
  return mantraShowByName(rest);
}

/* =========================================================
   /mantra — СЛУЧАЙНА (в main)
========================================================= */

function mantraRandom() {
  const m = drawRandomMantra();
  if (!m) return "Error: липсват мантри в mantras_data.js";

    const line =
    `[MANTRAS] ${m.name}\n` +
    `${m.sanskrit}\n` +
    `${m.transliteration}\n` +
    `„${m.translation}"\n\n` +
    `${m.meaning}\n\n` +
    `✨ Ползи: ${m.benefit}\n` +
    `🔔 Повторения: ${m.repetitions}`;

   // ВИНАГИ пуши в main (системна команда)
  if (typeof sendSystemLine === "function") {
    sendSystemLine(line);
  } else if (typeof db !== "undefined") {
    db.ref("atmos_chat").push({
      name: "[SYSTEM]",
      text: line,
      timestamp: Date.now(),
      room: "main"
    });
  }

  mantraSaveLast({ type: "random", mantra: m });

  if (window.__isOraclePage) return line;
  return "Мантрата е публикувана в main чата.";
}

/* =========================================================
   /mantra <име>
========================================================= */

function mantraShowByName(query) {
  const result = findMantra(query);

  if (result.found) {
    return mantraShowDetail(result.found);
  }

  if (result.suggestions.length > 0) {
    let out = `Не открих мантра „${query}".\n\n`;
    out += `Може би имахте предвид:\n\n`;
    result.suggestions.forEach(s => {
      out += `  • ${s.name} (${s.id})\n`;
    });
    out += `\nУпотреба: /mantra <име>\n`;
    out += `За случаен избор: /mantra`;
    return out;
  }

  let out = `Не открих мантра „${query}".\n\n`;
  out += `Ето няколко примера:\n\n`;
  const samples = (window.atmosMantras || []).slice(0, 8);
  samples.forEach(s => {
    out += `  • ${s.name} (${s.id})\n`;
  });
  out += `\nУпотреба: /mantra <име>\n`;
  out += `За случаен избор: /mantra\n`;
  out += `За практика: /mantra practice <тема>`;
  return out;
}

function mantraShowDetail(m) {
  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🕉  ${m.name.toUpperCase()}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  out += `📜 ${m.sanskrit}\n`;
  out += `🔤 ${m.transliteration}\n`;
  out += `💬 „${m.translation}"\n\n`;

  out += `━━━ ПРОИЗХОД ━━━\n`;
  out += `Традиция: ${m.tradition}\n`;
  out += `Божество: ${m.deity}\n`;
  out += `Тема: ${MANTRA_THEMES[m.theme] ? MANTRA_THEMES[m.theme].title : m.theme}\n\n`;

  out += `━━━ ЗНАЧЕНИЕ ━━━\n`;
  out += `${m.meaning}\n\n`;

  out += `━━━ ПОДРОБНО ━━━\n`;
  out += `${m.detailed}\n\n`;

  out += `━━━ ПОЛЗИ ━━━\n`;
  out += `✨ ${m.benefit}\n\n`;

  out += `━━━ ПРАКТИКА ━━━\n`;
  out += `🔔 Повторения: ${m.repetitions}\n`;

  mantraPushToChat(out);
  mantraSaveLast({ type: "detail", mantra: m });
  return out;
}

/* =========================================================
   /mantra practice
========================================================= */

function mantraShowThemes() {
  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🕉  ТЕМИ ЗА ПРАКТИКА\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  for (const key in MANTRA_THEMES) {
    const count = (window.atmosMantras || []).filter(m => m.theme === key).length;
    out += `  ${key.padEnd(18)} → ${MANTRA_THEMES[key].title} (${count})\n`;
  }

  out += `\nУпотреба: /mantra practice <тема>\n`;
  out += `Пример: /mantra practice healing`;
  return out;
}

function mantraPractice(theme) {
  if (!theme) return mantraShowThemes();

  const t = theme.toLowerCase().trim();

  let themeKey = null;

  // 1. Точно съвпадение с английски ключ
  if (MANTRA_THEMES[t]) {
    themeKey = t;
  }

  // 2. Проверка в речника за кирилски думи (любов → love)
  if (!themeKey && MANTRA_THEME_ALIASES[t]) {
    themeKey = MANTRA_THEME_ALIASES[t];
  }

  // 3. Fuzzy matching по думи в речника (напр. "много любов" съдържа "любов")
  if (!themeKey) {
    const words = t.split(/\s+/);
    for (const w of words) {
      if (MANTRA_THEME_ALIASES[w]) {
        themeKey = MANTRA_THEME_ALIASES[w];
        break;
      }
    }
  }

  // 4. Fuzzy matching с английските ключове (за правописни грешки)
  if (!themeKey) {
    const keys = Object.keys(MANTRA_THEMES);
    let bestKey = null, bestScore = Infinity;
    for (const k of keys) {
      const dist = mantraLevenshtein(t, k);
      if (dist < bestScore) { bestScore = dist; bestKey = k; }
    }
    const threshold = Math.max(1, Math.floor(t.length / 3));
    if (bestScore <= threshold) themeKey = bestKey;
  }

  if (!themeKey) {
    let out = `Не разпознах тема „${theme}".\n\n`;
    out += `Ето всички налични теми:\n\n`;
    for (const key in MANTRA_THEMES) {
      out += `  ${key.padEnd(18)} → ${MANTRA_THEMES[key].title}\n`;
    }
    out += `\nУпотреба: /mantra practice <тема>`;
    return out;
  }

  const matches = (window.atmosMantras || []).filter(m => m.theme === themeKey);
  if (matches.length === 0) {
    return `Няма мантри с тема „${MANTRA_THEMES[themeKey].title}".`;
  }

  const m = matches[Math.floor(Math.random() * matches.length)];

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🕉  ПРАКТИКА: ${MANTRA_THEMES[themeKey].title.toUpperCase()}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `${MANTRA_THEMES[themeKey].description}\n\n`;

  out += `📜 ${m.name}\n`;
  out += `${m.sanskrit}\n`;
  out += `${m.transliteration}\n\n`;
  out += `„${m.translation}"\n\n`;
  out += `${m.meaning}\n\n`;
  out += `✨ Ползи: ${m.benefit}\n`;
  out += `🔔 Повторения: ${m.repetitions}\n`;

  mantraPushToChat(out);
  mantraSaveLast({ type: "practice", theme: themeKey, mantra: m });
  return out;
}

/* =========================================================
   /mantra share — async, пише директно в terminalOutput
========================================================= */
async function mantraShare() {
  // Теглим СЛУЧАЙНА мантра (като /fortune share)
  const m = drawRandomMantra();

  if (!m) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nГрешка: липсват мантри в базата.\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  const S = MANTRA_STYLE;
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

  ctx.fillStyle = "rgba(255, 243, 224, 0.08)";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  const cx = canvas.width / 2;
  const cy = 700;
  const radGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 400);
  radGrad.addColorStop(0, "rgba(244, 162, 97, 0.30)");
  radGrad.addColorStop(0.5, "rgba(244, 162, 97, 0.10)");
  radGrad.addColorStop(1, "rgba(244, 162, 97, 0)");
  ctx.fillStyle = radGrad;
  ctx.fillRect(cx - 400, cy - 400, 800, 800);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 36px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ॐ", 95, 95);
  ctx.fillText("ॐ", canvas.width - 95, 95);
  ctx.fillText("ॐ", 95, canvas.height - 95);
  ctx.fillText("ॐ", canvas.width - 95, canvas.height - 95);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 44px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS MANTRAS ✦", canvas.width / 2, 120);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`${m.tradition.toUpperCase()} // ${mantraGetDateStr()}`, canvas.width / 2, 165);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 195);
  ctx.lineTo(canvas.width - 120, 195);
  ctx.stroke();

  /* САНСКРИТ */
  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 90px serif`;
  const sLines = mantraWrapText(ctx, m.sanskrit, canvas.width - 200, 3);
  sLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 340 + i * 100);
  });

  /* ТРАНСЛИТЕРАЦИЯ */
  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 32px ${S.fontHead}`;
  const tLines = mantraWrapText(ctx, m.transliteration, canvas.width - 200, 3);
  tLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 680 + i * 40);
  });

  /* ПРЕВОД */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 26px ${S.fontMono}`;
  ctx.fillText("ПРЕВОД", canvas.width / 2, 900);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 28px ${S.fontHead}`;
  const tbgLines = mantraWrapText(ctx, `„${m.translation}"`, canvas.width - 200, 4);
  tbgLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 950 + i * 38);
  });

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 1160);
  ctx.lineTo(canvas.width - 200, 1160);
  ctx.stroke();

  /* SUMMARY */
  ctx.fillStyle = S.textPrimary;
  ctx.font = `26px ${S.fontHead}`;
  const summLines = mantraWrapText(ctx, m.summary, canvas.width - 200, 5);
  summLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 1230 + i * 40);
  });

  /* ПОЛЗИ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("✨ ПОЛЗИ", canvas.width / 2, 1500);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 24px ${S.fontHead}`;
  ctx.fillText(m.benefit, canvas.width / 2, 1550);

  ctx.fillStyle = S.textMuted;
  ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(`🔔 ${m.repetitions}`, canvas.width / 2, 1620);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, canvas.height - 130);
  ctx.lineTo(canvas.width - 120, canvas.height - 130);
  ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS MANTRAS ENGINE // SACRED SOUND", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try {
    imageBase64 = canvas.toDataURL("image/png");
  } catch (e) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nГрешка: canvas е замърсен от CORS.\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  /* FIREBASE BUFFER */
  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    activeDb.ref("fortune_buffer").set({
      type: 'mantra',
      resolved: {
        id: m.id,
        name: m.name,
        sanskrit: m.sanskrit,
        transliteration: m.transliteration,
        translation: m.translation,
        tradition: m.tradition,
        deity: m.deity,
        meaning: m.meaning,
        summary: m.summary,
        benefit: m.benefit,
        repetitions: m.repetitions
      },
      timestamp: Date.now(),
      date: mantraGetDateStr()
    }).catch(() => {});
  }

     if (window.__isOraclePage) {
    window.__oracleLastImage = imageBase64;
    return;
  }
  /* UI */
  const isModernUI = window.__isModernUI === true;
  const downloadHref = "https://tinyurl.com/bmnrux6t";
  const output = document.getElementById("terminalOutput") || document.body;

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${S.accent}; background: #000; font-family: monospace;">
          <p style="color: ${S.accent}; margin-bottom: 10px;">[MANTRAS] Мантрата е изтеглена — <b>${m.name}</b>:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Mantra"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${S.accent}; color: #000; padding: 10px 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 10px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${S.accent}; background: #000; font-family: monospace;">
          <p style="color: ${S.accent}; margin-bottom: 10px;">[MANTRAS] Мантрата е изтеглена — <b>${m.name}</b>:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Mantra"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${S.accent}; color: #000; padding: 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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