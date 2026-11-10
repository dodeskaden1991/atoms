/* ===================================================================
   ATMOS CHAKRAS — 7-те енергийни центъра
   Команди: /chakras, /chakras <име>, /chakras practice,
            /chakras today, /chakras me, /chakras share, /chakras clear
=================================================================== */

const CHAKRA_STYLE = {
  bgTop:      "#0a0614",
  bgMid:      "#150a2e",
  bgBot:      "#05020a",
  accent:     "#c77dff",
  accentSoft: "rgba(199, 125, 255, 0.35)",
  accentDeep: "#ffd700",
  textPrimary:"#f0e6ff",
  textMuted:  "rgba(240, 230, 255, 0.55)",
  fontHead:   "serif",
  fontMono:   "monospace"
};

const CHAKRA_ALIASES = {
  "1": "muladhara", "root": "muladhara", "корен": "muladhara", "муладхара": "muladhara",
  "2": "svadhisthana", "sacral": "svadhisthana", "свадхистхана": "svadhisthana", "кръстна": "svadhisthana",
  "3": "manipura", "solar": "manipura", "манипура": "manipura", "слънчева": "manipura",
  "4": "anahata", "heart": "anahata", "анахата": "anahata", "сърце": "anahata", "сърдечна": "anahata",
  "5": "vishuddha", "throat": "vishuddha", "вишудха": "vishuddha", "гърло": "vishuddha", "гърлена": "vishuddha",
  "6": "ajna", "third-eye": "ajna", "аджна": "ajna", "трето-око": "ajna", "третооко": "ajna",
  "7": "sahasrara", "crown": "sahasrara", "сахасрара": "sahasrara", "корона": "sahasrara", "коронна": "sahasrara"
};

/* =========================================================
   ПОМОЩНИ
========================================================= */

function chakraGetDateStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function getChakraById(id) {
  return (window.atmosChakras || []).find(c => c.id === id);
}

function resolveChakraName(input) {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  if (CHAKRA_ALIASES[lower]) return CHAKRA_ALIASES[lower];
  const direct = (window.atmosChakras || []).find(c => c.id === lower);
  return direct ? direct.id : null;
}

function ensureChakrasRoom() {
  try {
    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (!rooms.includes("chakras")) {
      rooms.push("chakras");
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  } catch (e) {}
}

function chakraPushToChat(text) {
  const pushFn = function() {
    if (typeof db !== "undefined") {
      db.ref("atmos_chat").push({
        name: "[CHAKRAS]",
        text: text,
        timestamp: Date.now(),
        room: "chakras"
      });
    }
  };

  if (window.__isOraclePage) {
    window.__oracleLastPush = pushFn;
    return;
  }

  ensureChakrasRoom();
  pushFn();
}

function chakraSaveLast(data) {
  try { localStorage.setItem("atmos_chakras_last", JSON.stringify(data)); } catch (e) {}
}

function chakraLoadLast() {
  try {
    const raw = localStorage.getItem("atmos_chakras_last");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function chakraWrapText(ctx, text, maxWidth, maxLines) {
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

/* Levenshtein distance — колко букви трябва да се сменят */
function levenshteinDistance(a, b) {
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

/* =========================================================
   RESOLVED DATA (за Firebase → download.html без data файл)
========================================================= */

function resolveChakraData(c) {
  return {
    id: c.id,
    number: c.number,
    name: c.name,
    nameSanskrit: c.nameSanskrit,
    nameBg: c.nameBg,
    meaning: c.meaning,
    position: c.position,
    color: c.color,
    colorHex: c.colorHex,
    element: c.element,
    petals: c.petals,
    mantra: c.mantra,
    mantraDevanagari: c.mantraDevanagari,
    vibration: c.vibration,
    planet: c.planet,
    gland: c.gland,
    age: c.age,
    body: c.body,
    description: c.description,
    balanced: c.balanced,
    imbalance: c.imbalance,
    healing: c.healing,
    crystals: c.crystals,
    oils: c.oils,
    flowers: c.flowers,
    foods: c.foods,
    yogaPose: c.yogaPose,
    meditation: c.meditation,
    affirmation: c.affirmation,
    summary: c.summary
  };
}

/* =========================================================
   DISPATCHER
========================================================= */

function chakrasMessage(cmd) {
  if (!cmd) return chakraShowList();
  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);

  if (parts.length === 1) return chakraShowList();

  const sub = parts[1].toLowerCase();

  if (sub === "practice") {
    const rest = cmd.replace(/^\/chakras\s+practice\s*/i, "").trim();
    return chakraPractice(rest);
  }

  if (sub === "today") {
    return chakraToday();
  }

  if (sub === "me") {
    const rest = cmd.replace(/^\/chakras\s+me\s*/i, "").trim();
    if (!rest) {
      const saved = chakraLoadPersonalProfile();
      if (!saved) return "Error: Използвай /chakras me <име> <ДД.ММ.ГГГГ>";
      return chakraShowPersonalProfile(saved);
    }
    return chakraPersonalProfile(rest);
  }

  if (sub === "share") {
    return chakraShare();
  }

  if (sub === "clear") {
    try { localStorage.removeItem("atmos_chakras_me"); } catch (e) {}
    return "✅ Личният чакра профил е изтрит.";
  }

  const chakraId = resolveChakraName(sub);
  if (chakraId) return chakraShowInfo(chakraId);

  return `Error: Непозната чакра "${sub}". Използвай /chakras за списък.`;
}

/* =========================================================
   СПИСЪК
========================================================= */

function chakraShowList() {
  const list = window.atmosChakras || [];
  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🕉  7-ТЕ ЧАКРИ\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const sorted = [...list].sort((a, b) => b.number - a.number);
  sorted.forEach(c => {
    out += `${c.number}. ${c.name} (${c.nameBg})\n`;
    out += `   ${c.color} • ${c.element} • ${c.mantra}\n\n`;
  });

  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `Употреба:\n`;
  out += `  /chakras <име>            → инфо за чакра\n`;
  out += `  /chakras practice <тема>  → практика\n`;
  out += `  /chakras today            → чакра на деня\n`;
  out += `  /chakras me <име> <дата>  → личен профил\n`;
  out += `  /chakras share            → картинка\n`;

  return out;
}

/* =========================================================
   ИНФО ЗА ЧАКРА
========================================================= */

function chakraShowInfo(id) {
  const c = getChakraById(id);
  if (!c) return "Error: чакрата не е намерена.";

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🕉  ${c.name.toUpperCase()} — ${c.nameBg}\n`;
  out += `${c.nameSanskrit} • „${c.meaning}"\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  out += `📍 Позиция: ${c.position}\n`;
  out += `🎨 Цвят: ${c.color}\n`;
  out += `🌍 Елемент: ${c.element}\n`;
  out += `🌸 Листенца: ${c.petals}\n`;
  out += `🔔 Мантра: ${c.mantra} (${c.mantraDevanagari})\n`;
  out += `🎵 Вибрация: ${c.vibration}\n`;
  out += `🪐 Планета: ${c.planet}\n`;
  out += `⚗️ Жлеза: ${c.gland}\n`;
  out += `👶 Възраст: ${c.age}\n`;
  out += `🫀 Тяло: ${c.body}\n\n`;

  out += `━━━ ОПИСАНИЕ ━━━\n${c.description}\n\n`;
  out += `━━━ В БАЛАНС ━━━\n${c.balanced}\n\n`;
  out += `━━━ В ДИСБАЛАНС ━━━\n${c.imbalance}\n\n`;

  out += `━━━ ФИЗИЧЕСКИ СИМПТОМИ ━━━\n`;
  c.physicalProblems.forEach(p => out += `  • ${p}\n`);
  out += `\n`;

  out += `━━━ ЕМОЦИОНАЛНИ СИМПТОМИ ━━━\n`;
  c.emotionalProblems.forEach(p => out += `  • ${p}\n`);
  out += `\n`;

  out += `━━━ ИЗЦЕЛЕНИЕ ━━━\n`;
  c.healing.forEach(h => out += `  • ${h}\n`);
  out += `\n`;

  out += `━━━ КРИСТАЛИ ━━━\n  ${c.crystals.join(", ")}\n\n`;
  out += `━━━ ЕТЕРИЧНИ МАСЛА ━━━\n  ${c.oils.join(", ")}\n\n`;
  out += `━━━ ЦВЕТЯ ━━━\n  ${c.flowers.join(", ")}\n\n`;
  out += `━━━ ХРАНИ ━━━\n  ${c.foods.join(", ")}\n\n`;
  out += `━━━ ЙОГА ПОЗА ━━━\n  ${c.yogaPose}\n\n`;
  out += `━━━ МЕДИТАЦИЯ ━━━\n${c.meditation}\n\n`;
  out += `━━━ АФИРМАЦИЯ ━━━\n„${c.affirmation}"\n`;

  chakraSaveLast({ type: "info", data: resolveChakraData(c) });
  chakraPushToChat(out);

  return out;
}

/* =========================================================
   PRACTICE — хибриден resolveTopic
========================================================= */

function resolvePracticeTopic(input) {
  if (!input) return null;
  const lower = input.toLowerCase().trim();

  if (window.CHAKRA_PRACTICES[lower]) return lower;

  const words = lower.split(/\s+/);
  const scores = {};
  for (const key in window.CHAKRA_PRACTICE_KEYWORDS) {
    scores[key] = 0;
    window.CHAKRA_PRACTICE_KEYWORDS[key].forEach(kw => {
      if (lower.includes(kw)) scores[key] += 3;
      words.forEach(w => { if (w === kw) scores[key] += 2; });
    });
  }

  for (const key in window.CHAKRA_PRACTICE_KEYWORDS) {
    window.CHAKRA_PRACTICE_KEYWORDS[key].forEach(kw => {
      words.forEach(w => {
        if (w.length < 3) return;
        const dist = levenshteinDistance(w, kw);
        const threshold = Math.max(1, Math.floor(kw.length / 3));
        if (dist <= threshold) {
          scores[key] = (scores[key] || 0) + (3 - dist);
        }
      });
    });
  }

  let best = null, bestScore = 0;
  for (const k in scores) {
    if (scores[k] > bestScore) { best = k; bestScore = scores[k]; }
  }
  return bestScore > 0 ? best : null;
}

function chakraPractice(rest) {
  if (!rest) {
    let out = "";
    out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    out += `🧘 ДОСТЪПНИ ПРАКТИКИ\n`;
    out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const key in window.CHAKRA_PRACTICES) {
      const p = window.CHAKRA_PRACTICES[key];
      out += `  ${key.padEnd(16)} → ${p.title}\n`;
    }
    out += `\nУпотреба: /chakras practice <тема>\n`;
    out += `Можеш да напишеш и свободен текст — ще разпозная темата.\n`;
    return out;
  }

  const topicKey = resolvePracticeTopic(rest);
  if (!topicKey) {
    let fallback = `Не разпознах темата "${rest}".\n\n`;
    fallback += `Ето всички налични теми:\n\n`;
    for (const key in window.CHAKRA_PRACTICES) {
      const p = window.CHAKRA_PRACTICES[key];
      fallback += `  ${key.padEnd(16)} → ${p.title}\n`;
    }
    fallback += `\nУпотреба: /chakras practice <тема>\n`;
    fallback += `Можеш да напишеш и свободен текст — ще се опитам да разпозная темата.`;
    return fallback;
  }

  const practice = window.CHAKRA_PRACTICES[topicKey];
  const c = getChakraById(practice.chakra);
  if (!c) return "Error: чакрата на практиката не е намерена.";

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🧘 ПРАКТИКА: ${practice.title.toUpperCase()}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `${practice.description}\n\n`;

  out += `🎯 Чакра: ${c.name} (${c.nameBg})\n`;
  out += `📍 Позиция: ${c.position}\n\n`;
  out += `🔔 Мантра: ${c.mantra} (${c.mantraDevanagari})\n`;
  out += `   Повтаряй 108 пъти на глас или на ум.\n\n`;
  out += `💎 Кристали: ${c.crystals.slice(0, 3).join(", ")}\n`;
  out += `   Дръж в ръка или постави на позицията на чакрата.\n\n`;
  out += `🌿 Етерични масла: ${c.oils.slice(0, 2).join(", ")}\n`;
  out += `   2 капки на китката или в дифузер.\n\n`;
  out += `🧘 Йога поза: ${c.yogaPose.split(",")[0]}\n\n`;
  out += `✨ Афирмация:\n   „${c.affirmation}"\n\n`;
  out += `⏱ Продължителност: ${practice.duration}\n\n`;
  out += `📖 Как да практикуваш:\n${c.meditation}\n`;

  const resolved = {
    topicKey,
    title: practice.title,
    description: practice.description,
    duration: practice.duration,
    chakra: resolveChakraData(c),
    crystal: c.crystals[0],
    oil: c.oils[0]
  };

  chakraSaveLast({ type: "practice", data: resolved });
  chakraPushToChat(out);

  return out;
}

/* =========================================================
   TODAY — планетарен ден
========================================================= */

function chakraToday() {
  const dayIdx = new Date().getDay();
  const info = window.CHAKRA_PLANETARY_DAYS[dayIdx];
  if (!info) return "Error: не мога да определя деня.";

  const c = getChakraById(info.chakra);
  if (!c) return "Error: чакрата не е намерена.";

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `☀️ ЧАКРА НА ДЕНЯ — ${info.day}\n`;
  out += `Планета: ${info.planet}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `🕉 ${c.name} (${c.nameBg})\n`;
  out += `${c.color} • ${c.element} • ${c.mantra}\n\n`;
  out += `📖 ${c.summary}\n\n`;
  out += `🔔 Мантра за деня: ${c.mantra} (${c.mantraDevanagari})\n`;
  out += `✨ Афирмация: „${c.affirmation}"\n\n`;
  out += `💎 Кристал: ${c.crystals[0]}\n`;
  out += `🌿 Масло: ${c.oils[0]}\n`;
  out += `🧘 Поза: ${c.yogaPose.split(",")[0]}\n`;

  const resolved = {
    day: info.day,
    planet: info.planet,
    chakra: resolveChakraData(c),
    affirmation: c.affirmation,
    mantra: c.mantra,
    mantraDeva: c.mantraDevanagari,
    crystal: c.crystals[0],
    oil: c.oils[0],
    yoga: c.yogaPose.split(",")[0],
    summary: c.summary
  };

  chakraSaveLast({ type: "today", data: resolved });
  chakraPushToChat(out);

  return out;
}

/* =========================================================
   ME — личен профил чрез нумерология
========================================================= */

function chakraLoadPersonalProfile() {
  try {
    const raw = localStorage.getItem("atmos_chakras_me");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function chakraPersonalProfile(rest) {
  if (typeof numParseNameAndDate !== "function") {
    return "Error: Нумерологичният модул не е зареден.";
  }
  const parsed = numParseNameAndDate(rest);
  if (!parsed.ok) return "Error: " + parsed.error;

  const lifePath = numCalcLifePath(parsed.day, parsed.month, parsed.year);
  const expression = numCalcExpression(parsed.name);
  const soulUrge = numCalcSoulUrge(parsed.name);

  const mainId = window.CHAKRA_NUMEROLOGY_MAP[lifePath] || "anahata";
  const secondId = window.CHAKRA_NUMEROLOGY_MAP[expression] || "vishuddha";
  const growthId = window.CHAKRA_NUMEROLOGY_MAP[soulUrge] || "anahata";

  const profile = {
    name: parsed.name,
    date: parsed.date,
    lifePath, expression, soulUrge,
    mainId, secondId, growthId,
    savedAt: Date.now()
  };

  try { localStorage.setItem("atmos_chakras_me", JSON.stringify(profile)); } catch (e) {}

  return chakraShowPersonalProfile(profile);
}

function chakraShowPersonalProfile(profile) {
  const main = getChakraById(profile.mainId) || getChakraById("muladhara");
  const second = getChakraById(profile.secondId) || getChakraById("anahata");
  const growth = getChakraById(profile.growthId) || getChakraById("vishuddha");

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🕉 ЛИЧЕН ЧАКРА ПРОФИЛ\n`;
  out += `${profile.name} • ${profile.date}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  out += `🌟 ОСНОВНА ЧАКРА: ${main.name} (${main.nameBg})\n`;
  out += `Число на живота: ${profile.lifePath}\n`;
  out += `${main.color} • ${main.element} • ${main.mantra}\n`;
  out += `${main.summary}\n\n`;

  out += `💫 ВТОРОСТЕПЕННА ЧАКРА: ${second.name}\n`;
  out += `Число на израза: ${profile.expression}\n`;
  out += `${second.summary}\n\n`;

  out += `🌱 ЗОНА ЗА РАСТЕЖ: ${growth.name}\n`;
  out += `Число на сърцето: ${profile.soulUrge}\n`;
  out += `Тук имаш потенциал да работиш — не защото нещо липсва, а защото тук имаш най-голяма възможност за растеж.\n\n`;

  out += `🔔 Препоръчана мантра: ${main.mantra}\n`;
  out += `💎 Препоръчан кристал: ${main.crystals[0]}\n`;
  out += `✨ Афирмация: „${main.affirmation}"\n`;

  const resolved = {
    name: profile.name,
    date: profile.date,
    main: resolveChakraData(main),
    second: resolveChakraData(second),
    growth: resolveChakraData(growth),
    lifePath: profile.lifePath,
    expression: profile.expression,
    soulUrge: profile.soulUrge,
    affirmation: main.affirmation,
    mantra: main.mantra,
    mantraDeva: main.mantraDevanagari,
    crystal: main.crystals[0]
  };

  chakraSaveLast({ type: "profile", data: resolved });
  chakraPushToChat(out);

  return out;
}

/* =========================================================
   SHARE
========================================================= */

async function chakraShare() {
  const last = chakraLoadLast();
  if (!last) {
    return `Няма скорошен резултат за споделяне.

Направи едно от следните първо:
  /chakras <име>            → инфо за чакра (напр. /chakras anahata)
  /chakras practice <тема>  → практика
  /chakras today            → чакра на деня
  /chakras me <име> <дата>  → личен профил`;
  }
  if (last.type === "info") return await chakraRenderInfoCard(last.data);
  if (last.type === "practice") return await chakraRenderPracticeCard(last.data);
  if (last.type === "today") return await chakraRenderTodayCard(last.data);
  if (last.type === "profile") return await chakraRenderProfileCard(last.data);
  return "Error: непознат тип резултат.";
}

/* =========================================================
   РЕНДЕР: LOTUS
========================================================= */

function drawLotus(ctx, cx, cy, radius, petals, color, mantra) {
  const petalCount = petals > 40 ? 40 : petals;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    const py = -radius * 0.75;
    const rx = radius * 0.22;
    const ry = radius * 0.5;
    ctx.ellipse(0, py, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color + "30";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = color + "60";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  if (mantra) {
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.floor(radius * 0.55)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mantra, cx, cy);
  }
}

/* =========================================================
   РЕНДЕР: INFO CARD
========================================================= */

async function chakraRenderInfoCard(data) {
  const S = CHAKRA_STYLE;
  const c = data;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080; canvas.height = 1920;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(240, 230, 255, 0.06)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  ctx.fillStyle = S.accent; ctx.font = `bold 44px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS CHAKRAS ✦", canvas.width / 2, 110);

  ctx.fillStyle = S.textMuted; ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`CHAKRA ${c.number} // ${chakraGetDateStr()}`, canvas.width / 2, 155);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 190); ctx.lineTo(canvas.width - 120, 190); ctx.stroke();

  drawLotus(ctx, canvas.width / 2, 460, 180, c.petals, c.colorHex, c.mantra);

  ctx.fillStyle = c.colorHex;
  ctx.font = `bold 58px ${S.fontHead}`;
  ctx.fillText(c.name, canvas.width / 2, 720);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 28px ${S.fontHead}`;
  ctx.fillText(`${c.nameSanskrit} • ${c.nameBg}`, canvas.width / 2, 770);

  ctx.fillStyle = S.textMuted;
  ctx.font = `22px ${S.fontMono}`;
  ctx.fillText(`${c.color} • ${c.element} • ${c.planet}`, canvas.width / 2, 820);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 26px ${S.fontHead}`;
  const sLines = chakraWrapText(ctx, c.summary, canvas.width - 200, 4);
  sLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 900 + i * 38);
  });
  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("АФИРМАЦИЯ", canvas.width / 2, 1100);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 28px ${S.fontHead}`;
  const affLines = chakraWrapText(ctx, `„${c.affirmation || ""}"`, canvas.width - 200, 3);
  let yPos = 1150;
  affLines.forEach((line) => {
    ctx.fillText(line, canvas.width / 2, yPos);
    yPos += 38;
  });

  yPos += 30;
  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("МАНТРА", canvas.width / 2, yPos);
  yPos += 40;

  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 36px ${S.fontHead}`;
  ctx.fillText(`${c.mantra} (${c.mantraDevanagari})`, canvas.width / 2, yPos);
  yPos += 50;

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("ПОЗИЦИЯ", canvas.width / 2, yPos);
  yPos += 40;

  ctx.fillStyle = S.textMuted;
  ctx.font = `22px ${S.fontHead}`;
  const posLines = chakraWrapText(ctx, c.position, canvas.width - 200, 3);
  posLines.forEach(line => {
    ctx.fillText(line, canvas.width / 2, yPos);
    yPos += 32;
  });
  
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS CHAKRAS ENGINE", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен."; }

  return chakraOutputImage(imageBase64, { type: "chakra_info", resolved: data });
}

/* =========================================================
   РЕНДЕР: PRACTICE CARD
========================================================= */

async function chakraRenderPracticeCard(data) {
  const S = CHAKRA_STYLE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080; canvas.height = 1920;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(240, 230, 255, 0.06)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  ctx.fillStyle = S.accent; ctx.font = `bold 42px ${S.fontHead}`;
  ctx.fillText("✦ ПРАКТИКА ✦", canvas.width / 2, 110);

  ctx.fillStyle = S.textMuted; ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(chakraGetDateStr(), canvas.width / 2, 155);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 190); ctx.lineTo(canvas.width - 120, 190); ctx.stroke();

  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 50px ${S.fontHead}`;
  const titleLines = chakraWrapText(ctx, data.title, canvas.width - 200, 2);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 260 + i * 55);
  });

  drawLotus(ctx, canvas.width / 2, 520, 120, data.chakra.petals, data.chakra.colorHex, data.chakra.mantra);

  ctx.fillStyle = data.chakra.colorHex;
  ctx.font = `bold 42px ${S.fontHead}`;
  ctx.fillText(data.chakra.name, canvas.width / 2, 740);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `22px ${S.fontMono}`;
  ctx.fillText(`${data.chakra.nameBg} • ${data.chakra.mantra}`, canvas.width / 2, 785);

  ctx.fillStyle = S.textMuted;
  ctx.font = `italic 24px ${S.fontHead}`;
  const descLines = chakraWrapText(ctx, data.description, canvas.width - 200, 4);
  descLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 860 + i * 34);
  });

  let yCursor = 1040;
  const sectionH = 100;

  function section(label, value) {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(140, yCursor - 35, canvas.width - 280, sectionH - 20);
    ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
    ctx.strokeRect(140, yCursor - 35, canvas.width - 280, sectionH - 20);

    ctx.fillStyle = S.accent;
    ctx.font = `bold 20px ${S.fontMono}`;
    ctx.fillText(label, canvas.width / 2, yCursor);

    ctx.fillStyle = S.textPrimary;
    ctx.font = `bold 26px ${S.fontHead}`;
    ctx.fillText(value, canvas.width / 2, yCursor + 38);

    yCursor += sectionH;
  }

  section("МАНТРА (108x)", `${data.chakra.mantra} (${data.chakra.mantraDevanagari})`);
  section("КРИСТАЛ", data.crystal || "—");
  section("МАСЛО", data.oil || "—");
  section("ЙОГА ПОЗА", data.chakra.yogaPose ? data.chakra.yogaPose.split(",")[0].trim() : "—");
  section("ПРОДЪЛЖИТЕЛНОСТ", data.duration);

  yCursor += 20;
  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("АФИРМАЦИЯ", canvas.width / 2, yCursor);
  yCursor += 40;

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 26px ${S.fontHead}`;
  const affLines = chakraWrapText(ctx, `„${data.chakra.affirmation || ""}"`, canvas.width - 240, 3);
  affLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, yCursor + i * 34);
  });

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS CHAKRAS ENGINE // PRACTICE", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен."; }

  return chakraOutputImage(imageBase64, { type: "chakra_practice", resolved: data });
}

/* =========================================================
   РЕНДЕР: TODAY CARD
========================================================= */

async function chakraRenderTodayCard(data) {
  const S = CHAKRA_STYLE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080; canvas.height = 1920;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(240, 230, 255, 0.06)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  ctx.fillStyle = S.accent; ctx.font = `bold 42px ${S.fontHead}`;
  ctx.fillText("✦ ЧАКРА НА ДЕНЯ ✦", canvas.width / 2, 110);

  ctx.fillStyle = S.textMuted; ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(`${data.day.toUpperCase()} • ${data.planet} • ${chakraGetDateStr()}`, canvas.width / 2, 160);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 195); ctx.lineTo(canvas.width - 120, 195); ctx.stroke();

  drawLotus(ctx, canvas.width / 2, 520, 200, data.chakra.petals, data.chakra.colorHex, data.mantra);

  ctx.fillStyle = data.chakra.colorHex;
  ctx.font = `bold 62px ${S.fontHead}`;
  ctx.fillText(data.chakra.name, canvas.width / 2, 800);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 28px ${S.fontHead}`;
  ctx.fillText(`${data.chakra.nameSanskrit} • ${data.chakra.nameBg}`, canvas.width / 2, 855);

  ctx.fillStyle = S.textMuted;
  ctx.font = `22px ${S.fontMono}`;
  ctx.fillText(`${data.chakra.color} • ${data.chakra.element}`, canvas.width / 2, 905);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 26px ${S.fontHead}`;
  const sLines = chakraWrapText(ctx, data.summary, canvas.width - 200, 4);
  sLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 1000 + i * 38);
  });

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("МАНТРА", canvas.width / 2, 1200);
  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 52px ${S.fontHead}`;
  ctx.fillText(`${data.mantra} ${data.mantraDeva}`, canvas.width / 2, 1270);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("АФИРМАЦИЯ", canvas.width / 2, 1360);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 26px ${S.fontHead}`;
  const aLines = chakraWrapText(ctx, `„${data.affirmation}"`, canvas.width - 200, 3);
  aLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 1420 + i * 34);
  });

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS CHAKRAS ENGINE // DAILY", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен."; }

  return chakraOutputImage(imageBase64, { type: "chakra_today", resolved: data });
}

/* =========================================================
   РЕНДЕР: PROFILE CARD
========================================================= */

async function chakraRenderProfileCard(data) {
  const S = CHAKRA_STYLE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080; canvas.height = 1920;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(240, 230, 255, 0.06)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  ctx.fillStyle = S.accent; ctx.font = `bold 42px ${S.fontHead}`;
  ctx.fillText("✦ ЛИЧЕН ЧАКРА ПРОФИЛ ✦", canvas.width / 2, 110);

  ctx.fillStyle = S.textMuted; ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(chakraGetDateStr(), canvas.width / 2, 155);

  ctx.fillStyle = S.textPrimary; ctx.font = `bold 38px ${S.fontHead}`;
  ctx.fillText(data.name, canvas.width / 2, 215);

  ctx.fillStyle = S.textMuted; ctx.font = `22px ${S.fontMono}`;
  ctx.fillText(data.date, canvas.width / 2, 260);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 295); ctx.lineTo(canvas.width - 120, 295); ctx.stroke();

  ctx.fillStyle = S.accent;
  ctx.font = `bold 20px ${S.fontMono}`;
  ctx.fillText("ОСНОВНА ЧАКРА", canvas.width / 2, 340);

  drawLotus(ctx, canvas.width / 2, 540, 140, data.main.petals, data.main.colorHex, data.main.mantra);

  ctx.fillStyle = data.main.colorHex;
  ctx.font = `bold 48px ${S.fontHead}`;
  ctx.fillText(data.main.name, canvas.width / 2, 730);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 24px ${S.fontHead}`;
  ctx.fillText(`${data.main.nameSanskrit} • ${data.main.nameBg}`, canvas.width / 2, 775);

  ctx.fillStyle = S.textMuted;
  ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(`LIFE PATH: ${data.lifePath}`, canvas.width / 2, 815);

  let yCursor = 900;

  ctx.fillStyle = S.accent;
  ctx.font = `bold 20px ${S.fontMono}`;
  ctx.fillText("ВТОРОСТЕПЕННА ЧАКРА", canvas.width / 2, yCursor);
  yCursor += 45;

  ctx.fillStyle = data.second.colorHex;
  ctx.font = `bold 38px ${S.fontHead}`;
  ctx.fillText(data.second.name, canvas.width / 2, yCursor);
  yCursor += 40;

  ctx.fillStyle = S.textMuted;
  ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(`EXPRESSION: ${data.expression}`, canvas.width / 2, yCursor);
  yCursor += 80;

  ctx.fillStyle = S.accent;
  ctx.font = `bold 20px ${S.fontMono}`;
  ctx.fillText("ЗОНА ЗА РАСТЕЖ", canvas.width / 2, yCursor);
  yCursor += 45;

  ctx.fillStyle = data.growth.colorHex;
  ctx.font = `bold 38px ${S.fontHead}`;
  ctx.fillText(data.growth.name, canvas.width / 2, yCursor);
  yCursor += 40;

  ctx.fillStyle = S.textMuted;
  ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(`SOUL URGE: ${data.soulUrge}`, canvas.width / 2, yCursor);
  yCursor += 80;

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("АФИРМАЦИЯ", canvas.width / 2, yCursor);
  yCursor += 45;

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 26px ${S.fontHead}`;
  const affLines = chakraWrapText(ctx, `„${data.affirmation}"`, canvas.width - 240, 3);
  affLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, yCursor + i * 34);
  });

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS CHAKRAS ENGINE // PERSONAL PROFILE", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен."; }

  return chakraOutputImage(imageBase64, { type: "chakra_profile", resolved: data });
}

/* =========================================================
   OUTPUT
========================================================= */

function chakraOutputImage(imageBase64, payload) {
  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    activeDb.ref("fortune_buffer").set({
      type: payload.type,
      resolved: payload.resolved,
      timestamp: Date.now(),
      date: chakraGetDateStr()
    }).catch(() => {});
  }

    if (window.__isOraclePage) {
    window.__oracleLastImage = imageBase64;
    return imageBase64;
}


  const isModernUI = window.__isModernUI === true;
  const downloadHref = "https://tinyurl.com/bmnrux6t";
  const output = document.getElementById("terminalOutput") || document.body;

  const msg = "[CHAKRAS] Картичката е генерирана:";
  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed #c77dff; background: #000; font-family: monospace;">
          <p style="color: #c77dff; margin-bottom: 10px;">${msg}</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid #c77dff; display: block; margin-bottom: 15px;" alt="Atmos Chakra"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: #c77dff; color: #000; padding: 10px 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 10px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
            📥 [СВАЛИ КАРТИНКАТА]
          </a>
        </div>
      `;
      window.scrollTo(0, document.body.scrollHeight);
    }, 500);
  } else {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const fbShareUrl = isMobile ? "https://m.facebook.com/" : "https://www.facebook.com/";
    const xShareUrl = "https://x.com/intent/tweet";
    const igShareUrl = "https://www.instagram.com/";

    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed #c77dff; background: #000; font-family: monospace;">
          <p style="color: #c77dff; margin-bottom: 10px;">${msg}</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid #c77dff; display: block; margin-bottom: 15px;" alt="Atmos Chakra"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: #c77dff; color: #000; padding: 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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
      window.scrollTo(0, document.body.scrollHeight);
    }, 500);
  }

  return "Картичката е генерирана.";
}