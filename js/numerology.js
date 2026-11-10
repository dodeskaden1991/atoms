/* ===================================================================
   ATMOS NUMEROLOGY — /num
   Питагорова система с профили me / you
   Версия: resolved buffer (download.html не зависи от data файл)
=================================================================== */

const NUM_STYLE = {
  bgTop:      "#1a0505",
  bgMid:      "#2d0a0a",
  bgBot:      "#0a0202",
  accent:     "#d4af37",
  accentSoft: "rgba(212, 175, 55, 0.35)",
  accentDeep: "#ffd700",
  textPrimary:"#f5e6c8",
  textMuted:  "rgba(245, 230, 200, 0.55)",
  fontHead:   "serif",
  fontMono:   "monospace"
};

/* =========================================================
   ПОМОЩНИ
========================================================= */

function numGetDateStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function numReduce(n, allowMaster = true) {
  if (allowMaster && window.NUM_MASTER_NUMBERS.includes(n)) return n;
  while (n > 9) {
    n = String(n).split("").reduce((a, b) => a + parseInt(b), 0);
    if (allowMaster && window.NUM_MASTER_NUMBERS.includes(n)) return n;
  }
  return n;
}

function numCharValue(ch) {
  const upper = ch.toUpperCase();
  if (window.NUM_LETTERS.latin[upper]) return window.NUM_LETTERS.latin[upper];
  if (window.NUM_LETTERS.cyrillic[upper]) return window.NUM_LETTERS.cyrillic[upper];
  return null;
}

function numIsVowel(ch) {
  const upper = ch.toUpperCase();
  return window.NUM_VOWELS.latin.includes(upper) || window.NUM_VOWELS.cyrillic.includes(upper);
}

function numIsLetter(ch) {
  return /[A-Za-zА-Яа-яЁё]/.test(ch);
}

function numValidateDate(dateStr) {
  const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return { ok: false, error: "Невалидна дата. Формат: ДД.ММ.ГГГГ" };

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);

  if (month < 1 || month > 12) return { ok: false, error: "Невалиден месец (1-12)." };
  if (day < 1 || day > 31) return { ok: false, error: "Невалиден ден (1-31)." };

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return { ok: false, error: `Невалиден ден за месец ${month}.` };

  const currentYear = new Date().getFullYear();
  if (year < 1800) return { ok: false, error: "Годината е твърде стара (мин. 1800)." };
  if (year > currentYear) return { ok: false, error: "Годината не може да е в бъдещето." };

  return { ok: true, day, month, year };
}

function numParseNameAndDate(input) {
  const parts = input.trim().split(/\s+/);
  if (parts.length < 2) return { ok: false, error: "Липсват данни. Формат: <име> <ДД.ММ.ГГГГ>" };

  const lastPart = parts[parts.length - 1];
  if (!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(lastPart)) {
    return { ok: false, error: "Липсва дата. Формат: <име> <ДД.ММ.ГГГГ>" };
  }

  const name = parts.slice(0, -1).join(" ");
  const dateValidation = numValidateDate(lastPart);
  if (!dateValidation.ok) return dateValidation;

  const cleanName = name.replace(/[^A-Za-zА-Яа-яЁё\s\-]/g, "").trim();
  if (cleanName.length < 2) return { ok: false, error: "Невалидно име. Използвай кирилица или латиница." };

  return { ok: true, name: cleanName, date: lastPart, ...dateValidation };
}

function numSaveProfile(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
}

function numLoadProfile(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function numClearProfile(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

/* =========================================================
   СТАЯ #numerology
========================================================= */

function ensureNumerologyRoom() {
  try {
    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (!rooms.includes("numerology")) {
      rooms.push("numerology");
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  } catch (e) {}
}

function numPushToChat(text) {
  const pushFn = function() {
    if (typeof db !== "undefined") {
      db.ref("atmos_chat").push({
        name: "[NUMEROLOGY]",
        text: text,
        timestamp: Date.now(),
        room: "numerology"
      });
    }
  };

  if (window.__isOraclePage) {
    window.__oracleLastPush = pushFn;
    return;
  }

  ensureNumerologyRoom();
  pushFn();
}

/* =========================================================
   ИЗЧИСЛЕНИЯ
========================================================= */

function numCalcLifePath(day, month, year) {
  const d = numReduce(day, false);
  const m = numReduce(month, false);
  const y = numReduce(year, false);
  return numReduce(d + m + y, true);
}

function numCalcBirthday(day) {
  return numReduce(day, true);
}

function numCalcExpression(name) {
  let sum = 0;
  for (const ch of name) {
    const v = numCharValue(ch);
    if (v) sum += v;
  }
  return numReduce(sum, true);
}

function numCalcSoulUrge(name) {
  let sum = 0;
  for (const ch of name) {
    if (numIsVowel(ch)) {
      const v = numCharValue(ch);
      if (v) sum += v;
    }
  }
  return numReduce(sum, true);
}

function numCalcPersonality(name) {
  let sum = 0;
  for (const ch of name) {
    if (numIsLetter(ch) && !numIsVowel(ch)) {
      const v = numCharValue(ch);
      if (v) sum += v;
    }
  }
  return numReduce(sum, true);
}

function numCalcMaturity(lifePath, expression) {
  return numReduce(lifePath + expression, true);
}

function numCalcBalance(name) {
  const words = name.split(/\s+/).filter(w => w.length > 0);
  let sum = 0;
  for (const w of words) {
    const firstLetter = w.charAt(0);
    const v = numCharValue(firstLetter);
    if (v) sum += v;
  }
  return numReduce(sum, false);
}

function numCalcKarmicLessons(name) {
  const present = new Set();
  for (const ch of name) {
    const v = numCharValue(ch);
    if (v) present.add(v);
  }
  const missing = [];
  for (let i = 1; i <= 9; i++) {
    if (!present.has(i)) missing.push(i);
  }
  return missing;
}

function numCalcHiddenPassion(name) {
  const counts = {};
  for (const ch of name) {
    const v = numCharValue(ch);
    if (v) counts[v] = (counts[v] || 0) + 1;
  }
  let maxCount = 0;
  let winner = null;
  for (const k in counts) {
    if (counts[k] > maxCount) {
      maxCount = counts[k];
      winner = parseInt(k);
    }
  }
  return winner;
}

function numCalcLifeCycles(day, month, year) {
  return {
    forming: numReduce(month, false),
    productive: numReduce(day, false),
    harvest: numReduce(year, false)
  };
}

function numCalcPinnacles(day, month, year) {
  const d = numReduce(day, false);
  const m = numReduce(month, false);
  const y = numReduce(year, false);
  const p1 = numReduce(m + d, false);
  const p2 = numReduce(d + y, false);
  const p3 = numReduce(p1 + p2, false);
  const p4 = numReduce(m + y, false);
  return { p1, p2, p3, p4 };
}

function numCalcChallenges(day, month, year) {
  const d = numReduce(day, false);
  const m = numReduce(month, false);
  const y = numReduce(year, false);
  const c1 = Math.abs(m - d);
  const c2 = Math.abs(d - y);
  const c3 = Math.abs(c1 - c2);
  const c4 = Math.abs(m - y);
  return { c1, c2, c3, c4 };
}

function numCalcPersonalYear(day, month, currentYear) {
  const d = numReduce(day, false);
  const m = numReduce(month, false);
  const y = numReduce(currentYear, false);
  return numReduce(d + m + y, false);
}

function numCalcPersonalMonth(personalYear, currentMonth) {
  return numReduce(personalYear + currentMonth, false);
}

function numCalcPersonalDay(personalMonth, currentDay) {
  return numReduce(personalMonth + currentDay, false);
}

/* =========================================================
   СЪВМЕСТИМОСТ
========================================================= */

function numCalcCompatibility(type, meData, youData) {
  const meLP = numCalcLifePath(meData.day, meData.month, meData.year);
  const youLP = numCalcLifePath(youData.day, youData.month, youData.year);
  const meExpr = numCalcExpression(meData.name);
  const youExpr = numCalcExpression(youData.name);
  const meSoul = numCalcSoulUrge(meData.name);
  const youSoul = numCalcSoulUrge(youData.name);
  const mePers = numCalcPersonality(meData.name);
  const youPers = numCalcPersonality(youData.name);

  let score = 0;
  let details = [];

  if (type === "love") {
    const s1 = getScore(meSoul, youSoul);
    const s2 = getScore(meExpr, youExpr);
    const s3 = getScore(meLP, youLP);
    score = Math.round(s1 * 0.5 + s2 * 0.3 + s3 * 0.2);
    details.push({ label: "Сърдечна връзка", score: s1, desc: "Доколко вътрешните ви желания си пасват" });
    details.push({ label: "Жизнена енергия", score: s2, desc: "Как изразявате себе си заедно" });
    details.push({ label: "Житейски път", score: s3, desc: "Дали вървите в една посока" });
  } else if (type === "biz") {
    const s1 = getScore(meExpr, youExpr);
    const s2 = getScore(meLP, youLP);
    score = Math.round(s1 * 0.6 + s2 * 0.4);
    details.push({ label: "Работни таланти", score: s1, desc: "Дали уменията ви се допълват" });
    details.push({ label: "Стратегическа посока", score: s2, desc: "Дали виждате бизнеса по един начин" });
  } else if (type === "friend") {
    const s1 = getScore(mePers, youPers);
    const s2 = getScore(meSoul, youSoul);
    score = Math.round(s1 * 0.5 + s2 * 0.5);
    details.push({ label: "Социална химия", score: s1, desc: "Как се виждате един друг" });
    details.push({ label: "Емоционална връзка", score: s2, desc: "Дали сърцата ви си говорят" });
  }

  let verdict;
  if (score >= 85) verdict = "high";
  else if (score >= 70) verdict = "mid";
  else verdict = "low";

  return { score, verdict, details, type };
}

function getScore(a, b) {
  const matrix = window.NUM_COMPATIBILITY_SCORES;
  const ra = a > 9 ? numReduce(a, false) : a;
  const rb = b > 9 ? numReduce(b, false) : b;
  return matrix[ra] && matrix[ra][rb] ? matrix[ra][rb] : 50;
}

/* =========================================================
   DISPATCHER
========================================================= */

function numerologyMessage(cmd) {
  if (!cmd) return numShowHelp();

  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);

  if (parts.length === 1) {
    const me = numLoadProfile("atmos_numerology_me");
    if (!me) return numShowHelp();
    return numShowFullAnalysis(me, "me");
  }

  const sub = parts[1].toLowerCase();

  if (sub === "me") {
    const rest = cmd.replace(/^\/num\s+me\s*/i, "").trim();
    if (!rest) {
      const me = numLoadProfile("atmos_numerology_me");
      if (!me) return "Error: Няма записан профил. Използвай: /num me <име> <ДД.ММ.ГГГГ>";
      return numShowFullAnalysis(me, "me");
    }
    const parsed = numParseNameAndDate(rest);
    if (!parsed.ok) return "Error: " + parsed.error;
    const profile = {
      name: parsed.name,
      date: parsed.date,
      day: parsed.day,
      month: parsed.month,
      year: parsed.year,
      savedAt: Date.now()
    };
    numSaveProfile("atmos_numerology_me", profile);
    return "✅ Профил записан.\n\n" + numShowFullAnalysis(profile, "me");
  }

  if (sub === "you") {
    if (parts.length === 2) {
      const you = numLoadProfile("atmos_numerology_you");
      if (!you) return "Error: Няма записан втори профил. Използвай: /num you <име> <ДД.ММ.ГГГГ>";
      return numShowFullAnalysis(you, "you");
    }
    const rest = cmd.replace(/^\/num\s+you\s*/i, "").trim();
    const parsed = numParseNameAndDate(rest);
    if (!parsed.ok) return "Error: " + parsed.error;
    const profile = {
      name: parsed.name,
      date: parsed.date,
      day: parsed.day,
      month: parsed.month,
      year: parsed.year,
      savedAt: Date.now()
    };
    numSaveProfile("atmos_numerology_you", profile);
    return "✅ Втори профил записан.\n\n" + numShowFullAnalysis(profile, "you");
  }

  if (sub === "love" || sub === "biz" || sub === "friend") {
    return numShowCompatibility(sub);
  }

  if (sub === "today") {
    return numShowToday();
  }

  if (sub === "share") {
    return numShare();
  }

  if (sub === "clear") {
    const target = parts[2];
    if (target === "me") {
      numClearProfile("atmos_numerology_me");
      return "✅ Твоят профил е изтрит.";
    } else if (target === "you") {
      numClearProfile("atmos_numerology_you");
      return "✅ Вторият профил е изтрит.";
    }
    return "Error: Използвай /num clear me или /num clear you";
  }

  return "Error: Непозната команда. Използвай /num за помощ.";
}

/* =========================================================
   HELP
========================================================= */

function numShowHelp() {
  return `ATMOS NUMEROLOGY — Питагорова система

Начин на употреба:

1) Запиши своя профил:
   /num me <име> <ДД.ММ.ГГГГ>
   Пример: /num me Иван Петров 14.03.1990

2) Запиши втори човек (за съвместимост):
   /num you <име> <ДД.ММ.ГГГГ>
   Пример: /num you Мария Иванова 22.07.1992

3) Виж анализи:
   /num           → твоят пълен анализ
   /num you       → анализът на другия

4) Съвместимост:
   /num love      → любовна съвместимост
   /num biz       → бизнес съвместимост
   /num friend    → приятелска съвместимост

5) Дневно:
   /num today     → лично послание за днес

6) Други:
   /num share     → генерирай картинка на последния резултат
   /num clear me  → изтрий твоя профил
   /num clear you → изтрий втория профил

Името може да е на кирилица или латиница.
Датата е във формат ДД.ММ.ГГГГ (1800 — днес).`;
}

/* =========================================================
   ПЪЛЕН АНАЛИЗ
========================================================= */

function numShowFullAnalysis(profile, slot) {
  const { name, day, month, year, date } = profile;
  const lifePath = numCalcLifePath(day, month, year);
  const birthday = numCalcBirthday(day);
  const expression = numCalcExpression(name);
  const soulUrge = numCalcSoulUrge(name);
  const personality = numCalcPersonality(name);
  const maturity = numCalcMaturity(lifePath, expression);
  const balance = numCalcBalance(name);
  const karmic = numCalcKarmicLessons(name);
  const hiddenPassion = numCalcHiddenPassion(name);

  const lp = window.NUM_LIFE_PATH[lifePath] || { title: "—", keywords: [], description: "" };
  const ex = window.NUM_EXPRESSION[expression] || { title: "—", keywords: [], description: "" };
  const su = window.NUM_SOUL_URGE[soulUrge] || { title: "—", keywords: [], description: "" };
  const pe = window.NUM_PERSONALITY[personality] || { title: "—", keywords: [], description: "" };
  const bd = window.NUM_BIRTHDAY[birthday] || { title: "—", description: "" };
  const mt = window.NUM_MATURITY[maturity] || { title: "—", description: "" };
  const hp = window.NUM_HIDDEN_PASSION[hiddenPassion] || null;

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `📊 ПЪЛЕН НУМЕРОЛОГИЧЕН АНАЛИЗ\n`;
  out += `Име: ${name}\nДата: ${date}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  out += `🎯 LIFE PATH (Рожденна пътека) — ${lifePath}\n`;
  out += `„${lp.title}"\n`;
  out += `Ключови думи: ${lp.keywords.join(", ")}\n`;
  out += `${lp.description}\n\n`;

  out += `💫 EXPRESSION (Израз) — ${expression}\n`;
  out += `„${ex.title}"\n`;
  out += `Ключови думи: ${ex.keywords.join(", ")}\n`;
  out += `${ex.description}\n\n`;

  out += `❤️ SOUL URGE (Желание на сърцето) — ${soulUrge}\n`;
  out += `„${su.title}"\n`;
  out += `Ключови думи: ${su.keywords.join(", ")}\n`;
  out += `${su.description}\n\n`;

  out += `🎭 PERSONALITY (Личност) — ${personality}\n`;
  out += `„${pe.title}"\n`;
  out += `Ключови думи: ${pe.keywords.join(", ")}\n`;
  out += `${pe.description}\n\n`;

  out += `🎁 BIRTHDAY (Рождено число) — ${birthday}\n`;
  out += `„${bd.title}"\n`;
  out += `${bd.description}\n\n`;

  out += `🌱 MATURITY (Зрялост) — ${maturity}\n`;
  out += `„${mt.title}"\n`;
  out += `${mt.description}\n\n`;

  if (hp) {
    out += `🔍 HIDDEN PASSION (Скрита страст) — ${hiddenPassion}\n`;
    out += `„${hp.title}"\n`;
    out += `${hp.description}\n\n`;
  }

  if (karmic.length > 0) {
    out += `⚖️ KARMIC LESSONS (Кармични уроци)\n`;
    out += `Липсващи числа: ${karmic.join(", ")}\n`;
    karmic.forEach(k => {
      out += `  [${k}] ${window.NUM_KARMIC[k]}\n`;
    });
    out += `\n`;
  } else {
    out += `⚖️ KARMIC LESSONS: Няма липсващи числа — всички уроци са научени.\n\n`;
  }

  out += `⚖️ BALANCE (Баланс) — ${balance}\n${window.NUM_BALANCE[balance]}\n`;

  numSaveLastResult({ type: "full", slot, profile, lifePath, expression, soulUrge, personality, birthday, maturity });
  numPushToChat(out);

  return out;
}

/* =========================================================
   СЪВМЕСТИМОСТ
========================================================= */

function numShowCompatibility(type) {
  const me = numLoadProfile("atmos_numerology_me");
  const you = numLoadProfile("atmos_numerology_you");

  if (!me) return "Error: Първо запиши себе си: /num me <име> <ДД.ММ.ГГГГ>";
  if (!you) return "Error: Няма втори профил. Запиши го: /num you <име> <ДД.ММ.ГГГГ>";

  const result = numCalcCompatibility(type, me, you);
  const typeLabels = { love: "ЛЮБОВ", biz: "БИЗНЕС", friend: "ПРИЯТЕЛСТВО" };

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `💞 СЪВМЕСТИМОСТ — ${typeLabels[type]}\n`;
  out += `${me.name}  ✕  ${you.name}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `📊 ОБЩ РЕЗУЛТАТ: ${result.score}%\n\n`;

  result.details.forEach(d => {
    out += `• ${d.label}: ${d.score}%\n  ${d.desc}\n\n`;
  });

  const verdictText = window.NUM_COMPATIBILITY_TEXT[type][result.verdict];
  out += `📝 ОБОБЩЕНИЕ:\n${verdictText}\n`;

  numSaveLastResult({ type, me, you, result });
  numPushToChat(out);

  return out;
}

/* =========================================================
   TODAY
========================================================= */

function numShowToday() {
  const me = numLoadProfile("atmos_numerology_me");
  if (!me) return "Error: Първо запиши себе си: /num me <име> <ДД.ММ.ГГГГ>";

  const today = new Date();
  const py = numCalcPersonalYear(me.day, me.month, today.getFullYear());
  const pm = numCalcPersonalMonth(py, today.getMonth() + 1);
  const pd = numCalcPersonalDay(pm, today.getDate());

  const pyData = window.NUM_PERSONAL_YEAR[py];
  const pmText = window.NUM_PERSONAL_MONTH[pm];
  const pdText = window.NUM_PERSONAL_DAY[pd];

  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `📅 ЛИЧЕН ДЕН — ${numGetDateStr()}\n`;
  out += `${me.name}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `Лична година: ${py} — ${pyData.title}\n`;
  out += `${pyData.description}\n\n`;
  out += `Личен месец: ${pm}\n${pmText}\n\n`;
  out += `Личен ден: ${pd}\n${pdText}\n`;

  numSaveLastResult({ type: "today", me, py, pm, pd });
  numPushToChat(out);

  return out;
}

/* =========================================================
   LAST RESULT
========================================================= */

function numSaveLastResult(data) {
  try { localStorage.setItem("atmos_numerology_last", JSON.stringify(data)); } catch (e) {}
}

function numLoadLastResult() {
  try {
    const raw = localStorage.getItem("atmos_numerology_last");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

/* =========================================================
   SHARE
========================================================= */

async function numShare() {
  const last = numLoadLastResult();
  if (!last) return "Error: Няма скорошен резултат. Използвай /num, /num love, /num today първо.";

  if (last.type === "full") return await numRenderFullCard(last);
  if (last.type === "love" || last.type === "biz" || last.type === "friend") return await numRenderCompatCard(last);
  if (last.type === "today") return await numRenderTodayCard(last);

  return "Error: Непознат тип резултат.";
}

/* ---------- РЕНДЕР: Full ---------- */

async function numRenderFullCard(data) {
  const S = NUM_STYLE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080;
  canvas.height = 1920;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(245, 230, 200, 0.06)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = S.accent;
  ctx.font = `bold 42px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS NUMEROLOGY ✦", canvas.width / 2, 120);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`FULL ANALYSIS // ${numGetDateStr()}`, canvas.width / 2, 165);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 38px ${S.fontHead}`;
  ctx.fillText(data.profile.name, canvas.width / 2, 220);

  ctx.fillStyle = S.textMuted;
  ctx.font = `22px ${S.fontMono}`;
  ctx.fillText(data.profile.date, canvas.width / 2, 260);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 295); ctx.lineTo(canvas.width - 120, 295); ctx.stroke();

  const numbers = [
    { label: "LIFE PATH", value: data.lifePath, title: window.NUM_LIFE_PATH[data.lifePath].title },
    { label: "EXPRESSION", value: data.expression, title: window.NUM_EXPRESSION[data.expression].title },
    { label: "SOUL URGE", value: data.soulUrge, title: window.NUM_SOUL_URGE[data.soulUrge].title },
    { label: "PERSONALITY", value: data.personality, title: window.NUM_PERSONALITY[data.personality].title },
    { label: "BIRTHDAY", value: data.birthday, title: window.NUM_BIRTHDAY[data.birthday].title }
  ];

  const boxW = 800;
  const boxH = 160;
  const startY = 340;
  const gapY = 30;

  numbers.forEach((n, i) => {
    const y = startY + i * (boxH + gapY);
    const x = (canvas.width - boxW) / 2;

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = S.accentSoft;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.fillStyle = S.accentDeep;
    ctx.font = `bold 100px ${S.fontHead}`;
    ctx.fillText(n.value, x + 110, y + boxH / 2);

    ctx.textAlign = "left";
    ctx.fillStyle = S.accent;
    ctx.font = `bold 22px ${S.fontMono}`;
    ctx.fillText(n.label, x + 220, y + 55);

    ctx.fillStyle = S.textPrimary;
    ctx.font = `bold 30px ${S.fontHead}`;
    ctx.fillText(n.title, x + 220, y + 100);

    ctx.textAlign = "center";
  });

  const matY = startY + numbers.length * (boxH + gapY) + 20;
  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`MATURITY: ${data.maturity} — ${window.NUM_MATURITY[data.maturity].title}`, canvas.width / 2, matY + 30);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS NUMEROLOGY ENGINE // PYTHAGOREAN", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен от CORS."; }

  return numOutputImage(imageBase64, "atmos_numerology", data);
}

/* ---------- РЕНДЕР: Compatibility ---------- */

async function numRenderCompatCard(data) {
  const S = NUM_STYLE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080;
  canvas.height = 1920;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(245, 230, 200, 0.06)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const typeLabels = { love: "ЛЮБОВ", biz: "БИЗНЕС", friend: "ПРИЯТЕЛСТВО" };

  ctx.fillStyle = S.accent;
  ctx.font = `bold 40px ${S.fontHead}`;
  ctx.fillText(`✦ СЪВМЕСТИМОСТ ✦`, canvas.width / 2, 110);

  ctx.fillStyle = S.textMuted;
  ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(`${typeLabels[data.type]} // ${numGetDateStr()}`, canvas.width / 2, 155);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 190); ctx.lineTo(canvas.width - 120, 190); ctx.stroke();

  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 34px ${S.fontHead}`;
  ctx.fillText(data.me.name, canvas.width / 2, 250);
  ctx.fillStyle = S.accent;
  ctx.font = `bold 40px ${S.fontHead}`;
  ctx.fillText("✕", canvas.width / 2, 310);
  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 34px ${S.fontHead}`;
  ctx.fillText(data.you.name, canvas.width / 2, 370);

  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 220px ${S.fontHead}`;
  ctx.fillText(data.result.score + "%", canvas.width / 2, 680);

  const verdictText = window.NUM_COMPATIBILITY_TEXT[data.type][data.result.verdict];
  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 28px ${S.fontHead}`;
  const vLines = numWrapText(ctx, verdictText, canvas.width - 240, 5);
  vLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 900 + i * 44);
  });

  let yCursor = 1180;
  data.result.details.forEach(d => {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(140, yCursor - 40, canvas.width - 280, 130);
    ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
    ctx.strokeRect(140, yCursor - 40, canvas.width - 280, 130);

    ctx.fillStyle = S.accent;
    ctx.font = `bold 24px ${S.fontMono}`;
    ctx.fillText(d.label, canvas.width / 2, yCursor);

    ctx.fillStyle = S.textPrimary;
    ctx.font = `bold 36px ${S.fontHead}`;
    ctx.fillText(d.score + "%", canvas.width / 2, yCursor + 45);

    yCursor += 160;
  });

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS NUMEROLOGY ENGINE // COMPATIBILITY", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен."; }

  return numOutputImage(imageBase64, "atmos_numerology_" + data.type, data);
}

/* ---------- РЕНДЕР: Today ---------- */

async function numRenderTodayCard(data) {
  const S = NUM_STYLE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080;
  canvas.height = 1920;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(245, 230, 200, 0.06)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = S.accent;
  ctx.font = `bold 40px ${S.fontHead}`;
  ctx.fillText("✦ ЛИЧЕН ДЕН ✦", canvas.width / 2, 120);

  ctx.fillStyle = S.textMuted;
  ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(numGetDateStr(), canvas.width / 2, 165);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 34px ${S.fontHead}`;
  ctx.fillText(data.me.name, canvas.width / 2, 220);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 260); ctx.lineTo(canvas.width - 120, 260); ctx.stroke();

  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 240px ${S.fontHead}`;
  ctx.fillText(data.pd, canvas.width / 2, 520);

  const pdData = window.NUM_PERSONAL_YEAR[data.py];
  const pdText = window.NUM_PERSONAL_DAY[data.pd];

  ctx.fillStyle = S.accent;
  ctx.font = `bold 28px ${S.fontMono}`;
  ctx.fillText(`ЛИЧНА ГОДИНА: ${data.py} // МЕСЕЦ: ${data.pm} // ДЕН: ${data.pd}`, canvas.width / 2, 700);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 42px ${S.fontHead}`;
  ctx.fillText(pdData.title, canvas.width / 2, 800);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 28px ${S.fontHead}`;
  const pLines = numWrapText(ctx, pdText, canvas.width - 240, 5);
  pLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 900 + i * 44);
  });

  ctx.fillStyle = S.textMuted;
  ctx.font = `24px ${S.fontHead}`;
  const dLines = numWrapText(ctx, pdData.description, canvas.width - 240, 6);
  dLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, 1200 + i * 40);
  });

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS NUMEROLOGY ENGINE // DAILY", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен."; }

  return numOutputImage(imageBase64, "atmos_numerology_today", data);
}

/* ---------- ПОМОЩНИ ЗА РЕНДЕР ---------- */

function numWrapText(ctx, text, maxWidth, maxLines) {
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
   OUTPUT — праща RESOLVED текстове в Firebase
   (download.html не се нуждае от numerology_data.js)
========================================================= */

function numOutputImage(imageBase64, prefix, data) {
  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    let resolved = {};

    if (data.type === "full") {
      resolved = {
        profile: data.profile,
        lifePath: data.lifePath,
        lifePathTitle: window.NUM_LIFE_PATH?.[data.lifePath]?.title || "",
        expression: data.expression,
        expressionTitle: window.NUM_EXPRESSION?.[data.expression]?.title || "",
        soulUrge: data.soulUrge,
        soulUrgeTitle: window.NUM_SOUL_URGE?.[data.soulUrge]?.title || "",
        personality: data.personality,
        personalityTitle: window.NUM_PERSONALITY?.[data.personality]?.title || "",
        birthday: data.birthday,
        birthdayTitle: window.NUM_BIRTHDAY?.[data.birthday]?.title || "",
        maturity: data.maturity,
        maturityTitle: window.NUM_MATURITY?.[data.maturity]?.title || ""
      };
    } else if (data.type === "love" || data.type === "biz" || data.type === "friend") {
      resolved = {
        meName: data.me.name,
        youName: data.you.name,
        score: data.result.score,
        verdictText: window.NUM_COMPATIBILITY_TEXT?.[data.type]?.[data.result.verdict] || "",
        details: data.result.details
      };
    } else if (data.type === "today") {
      const pyData = window.NUM_PERSONAL_YEAR?.[data.py] || {};
      resolved = {
        meName: data.me.name,
        py: data.py,
        pm: data.pm,
        pd: data.pd,
        title: pyData.title || "",
        pdText: window.NUM_PERSONAL_DAY?.[data.pd] || "",
        pyDescription: pyData.description || ""
      };
    }

    activeDb.ref("fortune_buffer").set({
      type: "numerology_" + (data.type || "full"),
      resolved: resolved,
      timestamp: Date.now(),
      date: numGetDateStr()
    }).catch(() => {});
  }
   if (window.__isOraclePage) {
    window.__oracleLastImage = imageBase64;
    return imageBase64;
  }

  const isModernUI = window.__isModernUI === true;
  const downloadHref = "https://tinyurl.com/bmnrux6t";
  const output = document.getElementById("terminalOutput") || document.body;

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed #d4af37; background: #000; font-family: monospace;">
          <p style="color: #d4af37; margin-bottom: 10px;">[NUMEROLOGY] Картичката е генерирана:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid #d4af37; display: block; margin-bottom: 15px;" alt="Atmos Numerology"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: #d4af37; color: #000; padding: 10px 18px; border: none; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 10px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed #d4af37; background: #000; font-family: monospace;">
          <p style="color: #d4af37; margin-bottom: 10px;">[NUMEROLOGY] Картичката е генерирана:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid #d4af37; display: block; margin-bottom: 15px;" alt="Atmos Numerology"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: #d4af37; color: #000; padding: 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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