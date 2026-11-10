/* ===================================================================
   ATMOS LENORMAND — 36 карти, комбинации, Grand Tableau
   Команди: /lenormand, /lenormand share, /lenormand <номер>,
            /lenormand read <въпрос>, /lenormand read share,
            /lenormand grand [man|woman] <въпрос>, /lenormand grand share
=================================================================== */

const LENORMAND_STYLE = {
  bgTop:      "#0a1020",
  bgMid:      "#1a2540",
  bgBot:      "#050810",
  accent:     "#d4af37",
  accentSoft: "rgba(212, 175, 55, 0.35)",
  accentDeep: "#ffd700",
  accentBlue: "#4a90d9",
  accentBlueSoft: "rgba(74, 144, 217, 0.35)",
  textPrimary:"#e6eef8",
  textMuted:  "rgba(230, 238, 248, 0.55)",
  fontHead:   "serif",
  fontMono:   "monospace"
};

/* Категорийни цветове */
const LENORMAND_CATEGORY_COLORS = {
  light:   "#4a90d9",
  neutral: "#d4af37",
  shadow:  "#8b2020"
};

/* =========================================================
   ПОМОЩНИ
========================================================= */

function lenormandGetDateStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function drawRandomLenormand() {
  const deck = window.atmosLenormand || [];
  if (deck.length === 0) return null;
  return deck[Math.floor(Math.random() * deck.length)];
}

function getLenormandByNumber(n) {
  return (window.atmosLenormand || []).find(c => c.number === parseInt(n));
}

function ensureLenormandRoom() {
  try {
    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (!rooms.includes("lenormand")) {
      rooms.push("lenormand");
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  } catch (e) {}
}

function lenormandPushToChat(text, room) {
  ensureLenormandRoom();
  if (typeof db !== "undefined") {
    db.ref("atmos_chat").push({
      name: "[LENORMAND]",
      text: text,
      timestamp: Date.now(),
      room: room || "lenormand"
    });
  }
}

function lenormandSaveLast(data) {
  try { localStorage.setItem("atmos_lenormand_last", JSON.stringify(data)); } catch (e) {}
}

function lenormandLoadLast() {
  try {
    const raw = localStorage.getItem("atmos_lenormand_last");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function lenormandWrapText(ctx, text, maxWidth, maxLines) {
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
   ALGORITHM: КОМБИНАЦИИ ОТ КАРТИ (изречения)
   Всяка карта има keywords + light/shadow
   Генерираме изречения по шаблони
========================================================= */

/* Вземаме "първа ключова дума" от карта — за изречение */
function lenormandPrimaryKeyword(card, useShadow) {
  if (!card) return "";
  if (useShadow && card.shadow) {
    // Първата дума от shadow значението
    const words = card.shadow.split(",");
    return words[0].trim().toLowerCase();
  }
  if (card.keywords && card.keywords.length > 0) {
    return card.keywords[0];
  }
  return card.name.toLowerCase();
}

/* Генерира изречение от 2 карти */
function lenormandCombine2(c1, c2, useShadow) {
  const k1 = lenormandPrimaryKeyword(c1, useShadow);
  const k2 = lenormandPrimaryKeyword(c2, useShadow);

  const templates = [
    `${k1} среща ${k2}`,
    `${k1} води до ${k2}`,
    `${k2} идва след ${k1}`,
    `${k1} и ${k2} се преплитат`,
    `${k1} — а зад нея ${k2}`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/* Генерира изречение от 3 карти */
function lenormandCombine3(c1, c2, c3, useShadow) {
  const k1 = lenormandPrimaryKeyword(c1, useShadow);
  const k2 = lenormandPrimaryKeyword(c2, useShadow);
  const k3 = lenormandPrimaryKeyword(c3, useShadow);

  const templates = [
    `${k1} води до ${k2}, което завършва с ${k3}`,
    `${k1} — в центъра ${k2}, резултат: ${k3}`,
    `Започва с ${k1}, минава през ${k2}, стига до ${k3}`,
    `${k1} се превръща в ${k2}, а после в ${k3}`,
    `Тема: ${k1}. Модификатор: ${k2}. Резултат: ${k3}`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/* Анализира общата "тежест" на разклада
   Връща 'light' | 'neutral' | 'shadow' */
function lenormandOverallMood(cards) {
  let lightCount = 0;
  let shadowCount = 0;
  for (const c of cards) {
    if (c.category === 'light') lightCount++;
    else if (c.category === 'shadow') shadowCount++;
  }
  if (lightCount > shadowCount) return 'light';
  if (shadowCount > lightCount) return 'shadow';
  return 'neutral';
}

/* Генерира обобщение за разклад */
function lenormandGenerateSummary(cards, question) {
  const mood = lenormandOverallMood(cards);
  const names = cards.map(c => c.name).join(" + ");

  let moodText = "";
  if (mood === 'light') {
    moodText = "Като цяло положително четене — картите сочат към развитие и успех. ";
  } else if (mood === 'shadow') {
    moodText = "Предизвикателно четене — картите предупреждават за препятствия или трудности. ";
  } else {
    moodText = "Смесено четене — има както положителни, така и предизвикателни елементи. ";
  }

  // Ако има въпрос — споменаваме го
  if (question && question !== "(без въпрос)") {
    moodText += `На въпроса „${question}" картите отговарят чрез комбинацията: `;
  }

  moodText += lenormandCombine3(cards[0], cards[1], cards[2], mood === 'shadow') + ".";

  return moodText;
}

/* =========================================================
   FUZZY MATCHING за търсене по име или номер
========================================================= */

function lenormandLevenshtein(a, b) {
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

function findLenormand(query) {
  const list = window.atmosLenormand || [];
  const q = query.toLowerCase().trim();
  if (!q) return { found: null, suggestions: [] };

  // Точно по номер
  const num = parseInt(q);
  if (!isNaN(num) && num >= 1 && num <= 36) {
    const found = list.find(c => c.number === num);
    if (found) return { found, suggestions: [] };
  }

  // Точно по id / name
  for (const c of list) {
    if (c.id.toLowerCase() === q || c.name.toLowerCase() === q) {
      return { found: c, suggestions: [] };
    }
    if (c.nameBg && c.nameBg.toLowerCase() === q) {
      return { found: c, suggestions: [] };
    }
  }

  // Частично
  const partial = list.filter(c =>
    c.id.toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q) ||
    (c.nameBg && c.nameBg.toLowerCase().includes(q))
  );
  if (partial.length === 1) return { found: partial[0], suggestions: [] };
  if (partial.length > 1) return { found: null, suggestions: partial.slice(0, 3) };

  // Fuzzy
  const scored = [];
  for (const c of list) {
    let bestScore = lenormandLevenshtein(q, c.name.toLowerCase());
    if (c.nameBg) {
      const s = lenormandLevenshtein(q, c.nameBg.toLowerCase());
      if (s < bestScore) bestScore = s;
    }
    const threshold = Math.max(2, Math.floor(q.length / 3));
    if (bestScore <= threshold) {
      scored.push({ card: c, score: bestScore });
    }
  }
  scored.sort((a, b) => a.score - b.score);
  if (scored.length > 0) {
    return { found: null, suggestions: scored.slice(0, 3).map(s => s.card) };
  }

  return { found: null, suggestions: [] };
}

/* =========================================================
   DISPATCHER (синхронна)
========================================================= */

function lenormandMessage(cmd) {
  if (!cmd) cmd = "/lenormand";
  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);

  // /lenormand — случайна в main
  if (parts.length === 1) {
    return lenormandRandom();
  }

  const sub = parts[1].toLowerCase();

  // /lenormand share — случайна картинка
  if (sub === "share") {
    lenormandShare();
    return "";
  }

  // /lenormand read ...
  if (sub === "read") {
    if (parts[2] && parts[2].toLowerCase() === "share") {
      lenormandReadShare();
      return "";
    }
    const rest = cmd.replace(/^\/lenormand\s+read\s*/i, "").trim();
    return lenormandRead(rest);
  }

  // /lenormand grand ...
  if (sub === "grand") {
    const afterGrand = parts.slice(2);

    // /lenormand grand share
    if (afterGrand.length >= 1 && afterGrand[0].toLowerCase() === "share") {
      lenormandGrandShare();
      return "";
    }

    // /lenormand grand man <въпрос>
    // /lenormand grand woman <въпрос>
    // /lenormand grand <въпрос>
    let gender = "woman"; // default
    let questionParts = afterGrand;

    if (afterGrand.length > 0) {
      const first = afterGrand[0].toLowerCase();
      if (first === "man" || first === "мъж") {
        gender = "man";
        questionParts = afterGrand.slice(1);
      } else if (first === "woman" || first === "жена") {
        gender = "woman";
        questionParts = afterGrand.slice(1);
      }
    }

    const question = questionParts.join(" ").trim() || "(без въпрос)";
    return lenormandGrand(gender, question);
  }

  // /lenormand <номер|име>
  const rest = cmd.replace(/^\/lenormand\s+/i, "").trim();
  return lenormandShowCard(rest);
}

/* =========================================================
   /lenormand — СЛУЧАЙНА КАРТА (в main, като /fortune)
========================================================= */

function lenormandRandom() {
  const c = drawRandomLenormand();
  if (!c) return "Error: липсват карти в lenormand_data.js";

  const catLabel = c.category === 'light' ? '☀' : (c.category === 'shadow' ? '🌑' : '◆');

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `${catLabel}  ${c.name} (${c.nameBg}) — №${c.number}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `🔑 Ключови думи: ${c.keywords.join(", ")}\n\n`;
  out += `☀ Light: ${c.light}\n\n`;
  out += `🌑 Shadow: ${c.shadow}\n\n`;
  out += `📖 ${c.meaning}\n`;

    lenormandSaveLast({ type: "single", card: c, date: lenormandGetDateStr() });

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
  return "Картата е публикувана в main чата.";
}

/* =========================================================
   /lenormand share — СЛУЧАЙНА КАРТА КАТО КАРТИНКА
========================================================= */

async function lenormandShare() {
  const c = drawRandomLenormand();
  if (!c) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nError: липсват карти в lenormand_data.js\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  lenormandSaveLast({ type: "single", card: c, date: lenormandGetDateStr() });

  const imageBase64 = await lenormandRenderSingleCard(c);
  if (!imageBase64) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nГрешка при рендиране.\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  lenormandOutputImage(imageBase64, {
    type: 'lenormand_single',
    resolved: {
      id: c.id,
      number: c.number,
      name: c.name,
      nameBg: c.nameBg,
      category: c.category,
      keywords: c.keywords,
      light: c.light,
      shadow: c.shadow,
      meaning: c.meaning,
      imageUrl: c.imageUrl
    },
    date: lenormandGetDateStr()
  });
}

/* =========================================================
   /lenormand <номер|име> — ДЕТАЙЛИ (в #lenormand)
========================================================= */

function lenormandShowCard(query) {
  const result = findLenormand(query);

  if (result.found) {
    const c = result.found;
    const catLabel = c.category === 'light' ? '☀ LIGHT' : (c.category === 'shadow' ? '🌑 SHADOW' : '◆ NEUTRAL');

    let out = "";
    out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    out += `🃏 ${c.name.toUpperCase()} (${c.nameBg}) — №${c.number}\n`;
    out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    out += `📊 Категория: ${catLabel}\n\n`;
    out += `🔑 Ключови думи: ${c.keywords.join(", ")}\n\n`;
    out += `☀ Light: ${c.light}\n\n`;
    out += `🌑 Shadow: ${c.shadow}\n\n`;
    out += `━━━ ОПИСАНИЕ ━━━\n`;
    out += `${c.meaning}\n\n`;
    out += `🖼 Изображение: ${c.imageUrl}`;

        if (window.__isOraclePage) {
      window.__oracleLastPush = function() { lenormandPushToChat(out, "lenormand"); };
    } else {
      lenormandPushToChat(out, "lenormand");
    }
    lenormandSaveLast({ type: "single", card: c, date: lenormandGetDateStr() });

    return out;
  }

  if (result.suggestions.length > 0) {
    let out = `Не открих карта „${query}".\n\n`;
    out += `Може би имахте предвид:\n\n`;
    result.suggestions.forEach(s => {
      out += `  • №${s.number} — ${s.name} (${s.nameBg})\n`;
    });
    out += `\nУпотреба: /lenormand <номер> или /lenormand <име>`;
    return out;
  }

  // Нищо не намерихме
  let out = `Не открих карта „${query}".\n\n`;
  out += `Опитай с номер (1-36) или име на карта.\n`;
  out += `Например: /lenormand 24 (Сърце)\n`;
  out += `Или: /lenormand Rider\n`;
  return out;
}

/* =========================================================
   /lenormand read <въпрос> — 3-КАРТЕНО ЧЕТЕНЕ
========================================================= */

async function lenormandRead(question) {
  if (!question) question = "(без въпрос)";
  if (question.length > 200) question = question.substring(0, 200) + "...";

  const list = window.atmosLenormand || [];
  if (list.length < 3) return "Error: липсват карти.";

  // Избираме 3 случайни карти БЕЗ повторение
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  const cards = [shuffled[0], shuffled[1], shuffled[2]];

  // Генерираме четене
  const combination = lenormandCombine3(cards[0], cards[1], cards[2], false);
  const summary = lenormandGenerateSummary(cards, question);
  const dateStr = lenormandGetDateStr();

  // Текст за чата
  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🃏 LENORMAND READING // 3 КАРТИ\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `❓ Въпрос: „${question}"\n\n`;

  cards.forEach((c, i) => {
    const catLabel = c.category === 'light' ? '☀' : (c.category === 'shadow' ? '🌑' : '◆');
    out += `[${i + 1}] ${catLabel} ${c.name} (${c.nameBg})\n`;
    out += `    ${c.keywords.join(", ")}\n\n`;
  });

  out += `━━━ КОМБИНАЦИЯ ━━━\n`;
  out += `${combination}\n\n`;

  out += `━━━ ОБОБЩЕНИЕ ━━━\n`;
  out += `${summary}\n`;

  // Записваме последното четене
  const readingData = {
    type: "read",
    question: question,
    cards: cards.map(c => ({
      id: c.id,
      number: c.number,
      name: c.name,
      nameBg: c.nameBg,
      category: c.category,
      keywords: c.keywords,
      light: c.light,
      shadow: c.shadow,
      meaning: c.meaning,
      imageUrl: c.imageUrl
    })),
    combination: combination,
    summary: summary,
    date: dateStr
  };
      lenormandSaveLast(readingData);

  if (window.__isOraclePage) {
    window.__oracleLastPush = function() { lenormandPushToChat(out, "lenormand"); };
  } else {
    lenormandPushToChat(out, "lenormand");
  }

  // Показваме картинката
  const imageBase64 = await lenormandRenderReadCard(readingData);
  if (imageBase64) {
    lenormandOutputImage(imageBase64, {
      type: 'lenormand_read',
      resolved: readingData,
      date: dateStr
    });
  }

  return window.__isOraclePage ? out : "Четенето е генерирано.";
}

/* =========================================================
   /lenormand read share — картинка на последното четене
========================================================= */

async function lenormandReadShare() {
  const last = lenormandLoadLast();

  if (!last || (last.type !== "read" && last.type !== "grand")) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nНяма последно четене за споделяне.\n\nИзползвай първо:\n  /lenormand read <въпрос>\n  /lenormand grand <въпрос>\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  let imageBase64 = null;
  if (last.type === "read") {
    imageBase64 = await lenormandRenderReadCard(last);
  } else if (last.type === "grand") {
    imageBase64 = await lenormandRenderGrandCard(last);
  }

  if (!imageBase64) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nГрешка при рендиране.\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  lenormandOutputImage(imageBase64, {
    type: last.type === "read" ? 'lenormand_read' : 'lenormand_grand',
    resolved: last,
    date: last.date
  });
}

/* =========================================================
   /lenormand grand [man|woman] <въпрос> — GRAND TABLEAU
========================================================= */

async function lenormandGrand(gender, question) {
  if (!question) question = "(без въпрос)";
  if (question.length > 150) question = question.substring(0, 150) + "...";

  const list = window.atmosLenormand || [];
  if (list.length < 36) return "Error: трябват 36 карти за Grand Tableau.";

  // Разбъркваме всичките 36 карти
  const shuffled = [...list].sort(() => Math.random() - 0.5);

  // Намираме Significator
  const sigNumber = gender === "man" ? 28 : 29;
  const sigIndex = shuffled.findIndex(c => c.number === sigNumber);
  const sigCard = shuffled[sigIndex];

  // Позиция в grid 4×9
  const sigRow = Math.floor(sigIndex / 9);
  const sigCol = sigIndex % 9;

  // Кутията на 9-те (3×3 около Significator)
  const box9 = getBox9(shuffled, sigRow, sigCol);

  // Ход на коня (8 възможни скока)
  const knightCards = getKnightMoves(shuffled, sigRow, sigCol);

  // Огледални двойки (по хоризонтала и вертикала)
  const mirrors = getMirrorPairs(shuffled);

  // Генериране на текстово четене
  const readingText = generateGrandReading(question, sigCard, box9, knightCards, mirrors, gender);

  const dateStr = lenormandGetDateStr();

  const readingData = {
    type: "grand",
    question: question,
    gender: gender,
    grid: shuffled.map(c => ({
      id: c.id,
      number: c.number,
      name: c.name,
      nameBg: c.nameBg,
      category: c.category,
      keywords: c.keywords,
      light: c.light,
      shadow: c.shadow,
      meaning: c.meaning,
      imageUrl: c.imageUrl
    })),
    sigIndex: sigIndex,
    sigRow: sigRow,
    sigCol: sigCol,
    sigCard: {
      id: sigCard.id,
      number: sigCard.number,
      name: sigCard.name,
      nameBg: sigCard.nameBg
    },
    box9Indexes: box9.map(b => b.index),
    knightIndexes: knightCards.map(k => k.index),
    mirrorPairs: mirrors,
    readingText: readingText,
    date: dateStr
  };
    lenormandSaveLast(readingData);

  // Текст в чата
  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🃏 GRAND TABLEAU — 36 КАРТИ\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `❓ Въпрос: „${question}"\n`;
  out += `👤 Significator: ${sigCard.name} (${sigCard.nameBg})\n`;
  out += `📍 Позиция в grid: ред ${sigRow + 1}, колона ${sigCol + 1}\n\n`;
  out += readingText;

  if (window.__isOraclePage) {
    window.__oracleLastPush = function() { lenormandPushToChat(out, "lenormand"); };
  } else {
    lenormandPushToChat(out, "lenormand");
  }

  // Рендираме картинката
  const imageBase64 = await lenormandRenderGrandCard(readingData);
  if (imageBase64) {
    lenormandOutputImage(imageBase64, {
      type: 'lenormand_grand',
      resolved: readingData,
      date: dateStr
    });
  }

  return window.__isOraclePage ? out : "Grand Tableau е генериран.";
}

/* =========================================================
   /lenormand grand share — картинка на последния Grand
========================================================= */

async function lenormandGrandShare() {
  const last = lenormandLoadLast();

  if (!last || last.type !== "grand") {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nНяма последен Grand Tableau за споделяне.\n\nИзползвай първо:\n  /lenormand grand <въпрос>\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  const imageBase64 = await lenormandRenderGrandCard(last);
  if (!imageBase64) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nГрешка при рендиране.\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  lenormandOutputImage(imageBase64, {
    type: 'lenormand_grand',
    resolved: last,
    date: last.date
  });
}

/* =========================================================
   GRAND TABLEAU: ПОМОЩНИ АЛГОРИТМИ
========================================================= */

/* Кутията на 9-те — 3×3 около дадена позиция */
function getBox9(grid, row, col) {
  const result = [];
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r < 0 || r > 3 || c < 0 || c > 8) continue;
      const index = r * 9 + c;
      if (index === row * 9 + col) continue; // без самия Significator
      if (grid[index]) {
        result.push({ index: index, card: grid[index] });
      }
    }
  }
  return result;
}

/* Ход на коня — 8 възможни L-образни скока */
function getKnightMoves(grid, row, col) {
  const moves = [
    [-2, -1], [-2, +1], [-1, -2], [-1, +2],
    [+1, -2], [+1, +2], [+2, -1], [+2, +1]
  ];
  const result = [];
  for (const [dr, dc] of moves) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r > 3 || c < 0 || c > 8) continue;
    const index = r * 9 + c;
    if (grid[index]) {
      result.push({ index: index, row: r, col: c, card: grid[index] });
    }
  }
  return result;
}

/* Огледални двойки — карти на една и съща позиция, но от двете страни */
function getMirrorPairs(grid) {
  const pairs = [];
  // Хоризонтални огледала: (0,0) ↔ (0,8), (0,1) ↔ (0,7), ...
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const i1 = r * 9 + c;
      const i2 = r * 9 + (8 - c);
      if (grid[i1] && grid[i2]) {
        pairs.push({ a: { index: i1, card: grid[i1] }, b: { index: i2, card: grid[i2] }, type: 'horizontal' });
      }
    }
  }
  // Вертикални огледала: (0, c) ↔ (3, c)
  for (let c = 0; c < 9; c++) {
    const i1 = 0 * 9 + c;
    const i2 = 3 * 9 + c;
    if (grid[i1] && grid[i2]) {
      pairs.push({ a: { index: i1, card: grid[i1] }, b: { index: i2, card: grid[i2] }, type: 'vertical' });
    }
  }
  return pairs;
}

/* Генериране на текстово четене на Grand Tableau */
function generateGrandReading(question, sigCard, box9, knightCards, mirrors, gender) {
  let out = "";

  /* SIGNIFICATOR */
  out += `━━━ SIGNIFICATOR ━━━\n`;
  out += `Твоята карта е ${sigCard.name} (${sigCard.nameBg}). `;
  out += `Тя показва твоето състояние в момента: ${sigCard.keywords.join(", ")}.\n\n`;

  /* КУТИЯТА НА 9-ТЕ */
  if (box9.length > 0) {
    out += `━━━ НЕПОСРЕДСТВЕНА СИТУАЦИЯ (Кутията на 9-те) ━━━\n`;
    const boxNames = box9.map(b => b.card.name).join(" + ");
    out += `Около теб са: ${boxNames}\n\n`;

    // Анализираме mood на кутията
    const boxCards = box9.map(b => b.card);
    const mood = lenormandOverallMood(boxCards);
    if (mood === 'light') {
      out += `Тези карти са предимно положителни — ситуацията около теб е благоприятна.\n`;
    } else if (mood === 'shadow') {
      out += `Тези карти са предимно предизвикателни — има трудности, с които се сблъскваш.\n`;
    } else {
      out += `Тези карти са смесени — има както възможности, така и предизвикателства.\n`;
    }

    // Ако има 3+ карти — правим изречение
    if (boxCards.length >= 3) {
      out += `Комбинация: ${lenormandCombine3(boxCards[0], boxCards[1], boxCards[2], mood === 'shadow')}.\n`;
    }
    out += `\n`;
  }

  /* ХОД НА КОНЯ */
  if (knightCards.length > 0) {
    out += `━━━ РАЗВОЙ (Ход на коня) ━━━\n`;
    out += `Скритите връзки от твоята позиция сочат към:\n`;
    knightCards.slice(0, 4).forEach(k => {
      const combo = lenormandCombine2(sigCard, k.card, false);
      out += `  • ${combo}\n`;
    });
    out += `\n`;
  }

  /* ОГЛЕДАЛА */
  if (mirrors.length > 0) {
    out += `━━━ СКРИТИ ПРИЧИНИ (Огледала) ━━━\n`;
    const sampleMirrors = mirrors.slice(0, 3);
    sampleMirrors.forEach(m => {
      out += `  • ${m.a.card.name} ↔ ${m.b.card.name}\n`;
    });
    out += `\n`;
  }

  /* ОБОБЩЕНИЕ */
  out += `━━━ ОБОБЩЕНИЕ ━━━\n`;
  const allCards = [sigCard].concat(box9.map(b => b.card));
  const overallMood = lenormandOverallMood(allCards);
  if (overallMood === 'light') {
    out += `Цялостната картина е положителна. Вселената е на твоя страна.\n`;
  } else if (overallMood === 'shadow') {
    out += `Цялостната картина е предизвикателна. Внимавай с решенията си.\n`;
  } else {
    out += `Цялостната картина е смесена — баланс между възможности и препятствия.\n`;
  }

  out += `\n🃏 Пълната подредба е в картинката по-долу.\n`;

  return out;
}

/* =========================================================
   РЕНДЕР: ЕДНА КАРТА (1080×1920)
========================================================= */

async function lenormandRenderSingleCard(card) {
  const S = LENORMAND_STYLE;
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
  ctx.fillStyle = "rgba(230, 238, 248, 0.08)";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  /* РАМКИ */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  /* ЪГЛОВИ ОРНАМЕНТИ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 36px serif`;
  ctx.fillText("✦", 95, 95);
  ctx.fillText("✦", canvas.width - 95, 95);
  ctx.fillText("✦", 95, canvas.height - 95);
  ctx.fillText("✦", canvas.width - 95, canvas.height - 95);

  /* ЗАГЛАВИЕ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 42px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS LENORMAND ✦", canvas.width / 2, 120);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`CARD №${card.number} // ${lenormandGetDateStr()}`, canvas.width / 2, 165);

  /* КАТЕГОРИЯ */
  const catLabel = card.category === 'light' ? '☀ LIGHT' : (card.category === 'shadow' ? '🌑 SHADOW' : '◆ NEUTRAL');
  const catColor = LENORMAND_CATEGORY_COLORS[card.category] || S.accent;
  ctx.fillStyle = catColor;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText(catLabel, canvas.width / 2, 215);

  /* РАЗДЕЛИТЕЛ */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 245);
  ctx.lineTo(canvas.width - 120, 245);
  ctx.stroke();

  /* КАРТА */
  const cardX = 240;
  const cardY = 290;
  const cardW = canvas.width - 480;
  const cardH = 780;

  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("load-failed"));
      i.src = card.imageUrl;
    });

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(cardX - 8, cardY - 8, cardW + 16, cardH + 16);
    ctx.strokeStyle = S.accent; ctx.lineWidth = 3;
    ctx.strokeRect(cardX - 8, cardY - 8, cardW + 16, cardH + 16);

    const imgRatio = img.width / img.height;
    const boxRatio = cardW / cardH;
    let dw, dh;
    if (imgRatio > boxRatio) { dw = cardW; dh = cardW / imgRatio; }
    else { dh = cardH; dw = cardH * imgRatio; }
    const dx = cardX + (cardW - dw) / 2;
    const dy = cardY + (cardH - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  } catch (e) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.fillStyle = S.accent;
    ctx.font = `bold 200px serif`;
    ctx.fillText("🃏", cardX + cardW / 2, cardY + cardH / 2);
  }

  /* ИМЕ */
  const nameY = cardY + cardH + 70;
  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 58px ${S.fontHead}`;
  ctx.fillText(`${card.name}`, canvas.width / 2, nameY);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 28px ${S.fontHead}`;
  ctx.fillText(`${card.nameBg}`, canvas.width / 2, nameY + 50);

  /* КЛЮЧОВИ ДУМИ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText(card.keywords.join("  •  ").toUpperCase(), canvas.width / 2, nameY + 105);

  /* LIGHT / SHADOW */
  const lsY = nameY + 160;

  ctx.fillStyle = S.accentBlue;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("☀ LIGHT", canvas.width / 2, lsY);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `22px ${S.fontHead}`;
  const lightLines = lenormandWrapText(ctx, card.light, canvas.width - 200, 2);
  lightLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, lsY + 35 + i * 28);
  });

  const shadowStartY = lsY + 35 + lightLines.length * 28 + 30;

  ctx.fillStyle = "#c77d7d";
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("🌑 SHADOW", canvas.width / 2, shadowStartY);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `22px ${S.fontHead}`;
  const shadowLines = lenormandWrapText(ctx, card.shadow, canvas.width - 200, 2);
  shadowLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, shadowStartY + 35 + i * 28);
  });

  /* FOOTER */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, canvas.height - 130);
  ctx.lineTo(canvas.width - 120, canvas.height - 130);
  ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS LENORMAND ENGINE // 36 CARDS", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  try {
    return canvas.toDataURL("image/png");
  } catch (e) { return null; }
}

/* =========================================================
   РЕНДЕР: 3-КАРТЕНО ЧЕТЕНЕ (1080×1920)
========================================================= */

async function lenormandRenderReadCard(data) {
  const S = LENORMAND_STYLE;
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

  ctx.fillStyle = "rgba(230, 238, 248, 0.08)";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  /* РАМКИ */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  /* ЪГЛОВИ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 36px serif`;
  ctx.fillText("✦", 95, 95);
  ctx.fillText("✦", canvas.width - 95, 95);
  ctx.fillText("✦", 95, canvas.height - 95);
  ctx.fillText("✦", canvas.width - 95, canvas.height - 95);

  /* ЗАГЛАВИЕ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 40px ${S.fontHead}`;
  ctx.fillText("✦ LENORMAND READING ✦", canvas.width / 2, 110);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`3-CARD SPREAD // ${data.date}`, canvas.width / 2, 155);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 190);
  ctx.lineTo(canvas.width - 120, 190);
  ctx.stroke();

  /* ВЪПРОС */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 20px ${S.fontMono}`;
  ctx.fillText("ВЪПРОС", canvas.width / 2, 230);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 28px ${S.fontHead}`;
  const qLines = lenormandWrapText(ctx, `„${data.question}"`, canvas.width - 200, 3);
  qLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 275 + i * 36);
  });

  /* 3 КАРТИ */
  const cards = data.cards || [];
  const cardW = 260;
  const cardH = 400;
  const gap = 40;
  const totalW = 3 * cardW + 2 * gap;
  const startX = (canvas.width - totalW) / 2;
  const cardY = 480;

  for (let i = 0; i < cards.length && i < 3; i++) {
    const c = cards[i];
    const cx = startX + i * (cardW + gap);

    // Рамка
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(cx - 4, cardY - 4, cardW + 8, cardH + 8);
    ctx.strokeStyle = S.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 4, cardY - 4, cardW + 8, cardH + 8);

    // Картинка
    try {
      const img = await new Promise((resolve, reject) => {
        const i2 = new Image();
        i2.crossOrigin = "anonymous";
        i2.onload = () => resolve(i2);
        i2.onerror = () => reject(new Error("load-failed"));
        i2.src = c.imageUrl;
      });

      const imgRatio = img.width / img.height;
      const boxRatio = cardW / cardH;
      let dw, dh;
      if (imgRatio > boxRatio) { dw = cardW; dh = cardW / imgRatio; }
      else { dh = cardH; dw = cardH * imgRatio; }
      const dx = cx + (cardW - dw) / 2;
      const dy = cardY + (cardH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } catch (e) {
      ctx.fillStyle = S.accent;
      ctx.font = `bold 100px serif`;
      ctx.fillText("🃏", cx + cardW / 2, cardY + cardH / 2);
    }

    // Номер
    ctx.fillStyle = S.accentDeep;
    ctx.beginPath();
    ctx.arc(cx + 20, cardY + 20, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = S.bgTop;
    ctx.font = `bold 20px ${S.fontMono}`;
    ctx.fillText(String(i + 1), cx + 20, cardY + 21);

    // Име под картата
    ctx.fillStyle = S.textPrimary;
    ctx.font = `bold 24px ${S.fontHead}`;
    ctx.fillText(c.name, cx + cardW / 2, cardY + cardH + 30);

    ctx.fillStyle = S.textMuted;
    ctx.font = `18px ${S.fontHead}`;
    ctx.fillText(c.nameBg, cx + cardW / 2, cardY + cardH + 60);
  }

  /* КОМБИНАЦИЯ */
  const combY = cardY + cardH + 130;
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, combY);
  ctx.lineTo(canvas.width - 120, combY);
  ctx.stroke();

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("КОМБИНАЦИЯ", canvas.width / 2, combY + 40);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 26px ${S.fontHead}`;
  const combLines = lenormandWrapText(ctx, data.combination, canvas.width - 200, 4);
  combLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, combY + 85 + i * 36);
  });

  /* ОБОБЩЕНИЕ */
  const sumY = combY + 85 + combLines.length * 36 + 40;
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, sumY);
  ctx.lineTo(canvas.width - 120, sumY);
  ctx.stroke();

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("ОБОБЩЕНИЕ", canvas.width / 2, sumY + 40);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `24px ${S.fontHead}`;
  const sumLines = lenormandWrapText(ctx, data.summary, canvas.width - 200, 6);
  sumLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, sumY + 85 + i * 34);
  });

  /* FOOTER */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, canvas.height - 130);
  ctx.lineTo(canvas.width - 120, canvas.height - 130);
  ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS LENORMAND ENGINE // 3-CARD", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  try {
    return canvas.toDataURL("image/png");
  } catch (e) { return null; }
}

/* =========================================================
   РЕНДЕР: GRAND TABLEAU (1080×1920) — 4×9 grid
========================================================= */

async function lenormandRenderGrandCard(data) {
  const S = LENORMAND_STYLE;
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

  ctx.fillStyle = "rgba(230, 238, 248, 0.08)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  /* РАМКИ */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  /* ЪГЛОВИ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 36px serif`;
  ctx.fillText("✦", 95, 95);
  ctx.fillText("✦", canvas.width - 95, 95);
  ctx.fillText("✦", 95, canvas.height - 95);
  ctx.fillText("✦", canvas.width - 95, canvas.height - 95);

  /* ЗАГЛАВИЕ */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 40px ${S.fontHead}`;
  ctx.fillText("✦ GRAND TABLEAU ✦", canvas.width / 2, 100);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`36 CARDS // ${data.date}`, canvas.width / 2, 145);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 175);
  ctx.lineTo(canvas.width - 120, 175);
  ctx.stroke();

  /* ВЪПРОС */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 18px ${S.fontMono}`;
  ctx.fillText("ВЪПРОС", canvas.width / 2, 210);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 24px ${S.fontHead}`;
  const qLines = lenormandWrapText(ctx, `„${data.question}"`, canvas.width - 200, 2);
  qLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 245 + i * 32);
  });

  /* GRID 4×9 */
  const gridX = 60;
  const gridY = 320;
  const gridW = canvas.width - 120;
  const gridH = 900;

  const cardW = (gridW - 8 * 6) / 9; // 6px gap
  const cardH = (gridH - 3 * 6) / 4;
  const gap = 6;

  const grid = data.grid || [];
  const sigIndex = data.sigIndex;
  const box9Indexes = data.box9Indexes || [];
  const knightIndexes = data.knightIndexes || [];

  // Зареждаме всичките изображения паралелно (по-бързо)
  const images = await Promise.all(grid.map(c => {
    return new Promise((resolve) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = () => resolve(null);
      i.src = c.imageUrl;
    });
  }));

  for (let i = 0; i < 36; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const cx = gridX + c * (cardW + gap);
    const cy = gridY + r * (cardH + gap);
    const card = grid[i];
    if (!card) continue;

    const isSig = (i === sigIndex);
    const isBox = box9Indexes.includes(i);
    const isKnight = knightIndexes.includes(i);

    // Фон на картата
    if (isBox) {
      ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
      ctx.fillRect(cx - 2, cy - 2, cardW + 4, cardH + 4);
    }

    // Рамка
    if (isSig) {
      ctx.strokeStyle = S.accentDeep;
      ctx.lineWidth = 4;
    } else if (isKnight) {
      ctx.strokeStyle = S.accentBlue;
      ctx.lineWidth = 3;
    } else if (isBox) {
      ctx.strokeStyle = S.accent;
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = S.accentSoft;
      ctx.lineWidth = 1;
    }
    ctx.strokeRect(cx - 1, cy - 1, cardW + 2, cardH + 2);

    // Картинка
    const img = images[i];
    if (img) {
      const imgRatio = img.width / img.height;
      const boxRatio = cardW / cardH;
      let dw, dh;
      if (imgRatio > boxRatio) { dw = cardW; dh = cardW / imgRatio; }
      else { dh = cardH; dw = cardH * imgRatio; }
      const dx = cx + (cardW - dw) / 2;
      const dy = cy + (cardH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      // Fallback — номер
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.fillStyle = S.accent;
      ctx.font = `bold 24px ${S.fontMono}`;
      ctx.fillText(String(card.number), cx + cardW / 2, cy + cardH / 2);
    }

    // Номер (малък ъгъл)
    ctx.fillStyle = S.accentDeep;
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = S.bgTop;
    ctx.font = `bold 11px ${S.fontMono}`;
    ctx.fillText(String(card.number), cx + 8, cy + 9);

    // Ако е Significator — допълнителен маркер
    if (isSig) {
      ctx.fillStyle = S.accentDeep;
      ctx.font = `bold 12px ${S.fontMono}`;
      ctx.fillText("YOU", cx + cardW / 2, cy + cardH - 8);
    }
  }

  /* ЛЕГЕНДА */
  const legendY = gridY + gridH + 40;

  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 18px ${S.fontMono}`;
  ctx.fillText("● ЗЛАТНА РАМКА = ТИ (Significator)", canvas.width / 2, legendY);
  ctx.fillStyle = S.accent;
  ctx.fillText("● ЗЛАТЕН ФОН = Кутията на 9-те", canvas.width / 2, legendY + 28);
  ctx.fillStyle = S.accentBlue;
  ctx.fillText("● СИНЯ РАМКА = Ход на коня", canvas.width / 2, legendY + 56);

  /* РЕЗЮМЕ */
  const resY = legendY + 100;
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, resY);
  ctx.lineTo(canvas.width - 120, resY);
  ctx.stroke();

  ctx.fillStyle = S.accent;
  ctx.font = `bold 20px ${S.fontMono}`;
  ctx.fillText("РЕЗЮМЕ", canvas.width / 2, resY + 35);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `22px ${S.fontHead}`;

  // Извличаме само първите няколко реда от readingText
  const readingLines = (data.readingText || "").split("\n").filter(l => l.trim().length > 0);
  const summaryLines = readingLines.slice(0, 8);
  let cursorY = resY + 75;
  summaryLines.forEach((line) => {
    const wrapped = lenormandWrapText(ctx, line.trim(), canvas.width - 200, 2);
    wrapped.forEach(l => {
      ctx.fillText(l, canvas.width / 2, cursorY);
      cursorY += 30;
    });
  });

  /* FOOTER */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, canvas.height - 130);
  ctx.lineTo(canvas.width - 120, canvas.height - 130);
  ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS LENORMAND ENGINE // GRAND TABLEAU", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  try {
    return canvas.toDataURL("image/png");
  } catch (e) { return null; }
}

/* =========================================================
   OUTPUT — показва картинката в терминала
========================================================= */

function lenormandOutputImage(imageBase64, payload) {
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

  const labelMap = {
    lenormand_single: "LENORMAND — Карта",
    lenormand_read: "LENORMAND — Четене",
    lenormand_grand: "LENORMAND — Grand Tableau"
  };

  const title = labelMap[payload.type] || "LENORMAND";
  const accentColor = "#d4af37";

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${accentColor}; background: #000; font-family: monospace;">
          <p style="color: ${accentColor}; margin-bottom: 10px;">[${title}] Картичката е генерирана:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${accentColor}; display: block; margin-bottom: 15px;" alt="Atmos Lenormand"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${accentColor}; color: #000; padding: 10px 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 10px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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
          <p style="color: ${accentColor}; margin-bottom: 10px;">[${title}] Картичката е генерирана:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${accentColor}; display: block; margin-bottom: 15px;" alt="Atmos Lenormand"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${accentColor}; color: #000; padding: 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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