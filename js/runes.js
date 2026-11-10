/* ===================================================================
   ATMOS RUNES — Elder Futhark
   Spreads: default (3) • odin (5) • hammer (3) • cross (4) • wheel (12)
=================================================================== */

const RUNE_STYLE = {
  bgTop:      "#071018",
  bgMid:      "#0d1b2a",
  bgBot:      "#030608",
  accent:     "#8ecae6",
  accentSoft: "rgba(142, 202, 230, 0.35)",
  accentDeep: "#64ffda",
  textPrimary:"#e0f4ff",
  textMuted:  "rgba(224, 244, 255, 0.55)",
  fontHead:   "serif",
  fontMono:   "monospace"
};

const RUNE_SPREADS = {
  default: {
    name: "THREE_NORNS",
    label: "МИНАЛО / НАСТОЯЩЕ / БЪДЕЩЕ",
    count: 3,
    positions: ["МИНАЛО", "НАСТОЯЩЕ", "БЪДЕЩЕ"]
  },
  odin: {
    name: "ODINS_CROSS",
    label: "КРЪСТЪТ НА ОДИН",
    count: 5,
    positions: ["СИТУАЦИЯ", "МИНАЛО", "БЪДЕЩЕ", "ДЕЙСТВИЕ", "РЕЗУЛТАТ"]
  },
  hammer: {
    name: "THORS_HAMMER",
    label: "МЬОЛНИР",
    count: 3,
    positions: ["СИТУАЦИЯ", "ПРЕЧКА", "ДЕЙСТВИЕ"]
  },
  cross: {
    name: "RUNE_CROSS",
    label: "РУНИЧЕСКИ КРЪСТ",
    count: 4,
    positions: ["ТИ", "СИТУАЦИЯ", "СЪВЕТ", "РЕЗУЛТАТ"]
  },
  wheel: {
    name: "RUNIC_WHEEL",
    label: "РУНЕН КРЪГ",
    count: 12,
    positions: [
      "ТИ СЕГА",
      "ПАРИ И КАРИЕРА",
      "КОМУНИКАЦИЯ",
      "ДОМ И СЕМЕЙСТВО",
      "ТВОРЧЕСТВО",
      "ЗДРАВЕ И ТЯЛО",
      "ПАРТНЬОРСТВО",
      "ТРАНСФОРМАЦИЯ",
      "ВЯРА И ФИЛОСОФИЯ",
      "КАРИЕРА И СТАТУС",
      "ПРИЯТЕЛИ И НАДЕЖДИ",
      "ПОДСЪЗНАНИЕ"
    ]
  }
};

/* =========================================================
   ПОМОЩНИ
========================================================= */

function runesGetDateStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function drawRandomRune() {
  const deck = window.atmosRunes || [];
  if (deck.length === 0) return null;
  const rune = Object.assign({}, deck[Math.floor(Math.random() * deck.length)]);
  rune.isReversed = rune.noReversed ? false : (Math.random() < 0.5);
  return rune;
}

function ensureRunesRoom() {
  try {
    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (!rooms.includes("runes")) {
      rooms.push("runes");
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  } catch (e) {}
}

function loadRuneImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error("no-url"));
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load-failed"));
    img.src = url;
  });
}

function runesWrapText(ctx, text, maxWidth, maxLines) {
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

function runesGetCardLayout(count) {
  const usable = 1080 - 200;
  let gap, cardW;
  if (count <= 3) { gap = 30; }
  else if (count === 4) { gap = 22; }
  else { gap = 16; }

  cardW = Math.floor((usable - gap * (count - 1)) / count);
  if (count <= 3) cardW = Math.min(cardW, 260);

  const cardH = Math.floor(cardW * 1.5);
  const totalW = count * cardW + (count - 1) * gap;
  const startX = (1080 - totalW) / 2;
  return { cardW, cardH, gap, startX, cardY: 500 };
}

/* =========================================================
   ОБОБЩЕНИЕ
========================================================= */

function generateRunesSummary(runes) {
  const n = runes.length;
  if (n === 0) return "";

  const upright = runes.filter(r => !r.isReversed).length;
  const ratio = upright / n;

  const aetts = { 1: 0, 2: 0, 3: 0 };
  runes.forEach(r => {
    if (r.number <= 8) aetts[1]++;
    else if (r.number <= 16) aetts[2]++;
    else aetts[3]++;
  });

  const dominantAett = Object.keys(aetts).reduce(
    (a, b) => aetts[a] > aetts[b] ? a : b,
    "1"
  );

  const aettLabels = {
    "1": "първият ет (Freyr) — материално, съзидание и начало",
    "2": "вторият ет (Hagal) — трансформация, изпитания и промяна",
    "3": "третият ет (Tyr) — дух, справедливост и висше съзнание"
  };

  let summary = "";

  if (ratio >= 0.8) {
    summary += "Силно положително четене. Руните са предимно в права позиция — силите са на твоя страна. ";
  } else if (ratio >= 0.6) {
    summary += "Като цяло положително четене с леки предупреждения. Посоката е добра. ";
  } else if (ratio >= 0.4) {
    summary += "Смесено четене. Силите са в баланс — важно е как ще подходиш. ";
  } else {
    summary += "Предизвикателно четене. Повечето руни са обърнати — има блокажи, изискващи внимание. ";
  }

  const hasNoReversed = runes.some(r => r.noReversed);
  if (hasNoReversed) {
    summary += "Присъстват и руни, които не се обръщат — тяхната сила е константна и насочваща. ";
  }

  if (aetts[dominantAett] >= Math.ceil(n / 6)) {
    summary += `Основната тема е свързана с ${aettLabels[dominantAett]}.`;
  }

  return summary.trim();
}

/* =========================================================
   DISPATCHER
========================================================= */

function runesMessage(cmd) {
  if (!cmd) cmd = "/runes";
  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);

  if (parts.length === 1) return runeSingle();

  if (parts.length === 2 && parts[1].toLowerCase() === "share") {
    return generateRuneCard();
  }

  if (parts.length >= 2 && parts[1].toLowerCase() === "read") {
    if (parts.length === 3 && parts[2].toLowerCase() === "share") {
      return runesReadShare();
    }
    return runesRead(cmd);
  }

  return "Използвай: /runes | /runes share | /runes read [odin|hammer|cross|wheel] <въпрос> | /runes read share";
}

/* =========================================================
   /runes — ЕДНА РУНА
========================================================= */

function runeSingle() {
  const rune = drawRandomRune();
  if (!rune) return "Грешка: липсват руни в runes_data.js";

  const pos = rune.noReversed ? "ПРАВА (не се обръща)" : (rune.isReversed ? "ОБЪРНАТА" : "ПРАВА");
  const meaning = rune.isReversed ? rune.reversed : rune.upright;
  const kws = rune.keywords[rune.isReversed ? "reversed" : "upright"];

  const text =
    `[RUNES] ${rune.symbol} ${rune.name} (№${rune.number}) — ${pos} позиция\n` +
    `Ключови думи: ${kws.join(", ")}\n` +
    `${meaning}`;

  sendSystemLine(text);

  if (window.__isOraclePage) return text;
  return "Rune drawn.";
}

/* =========================================================
   /runes read [odin|hammer|cross|wheel] <въпрос>
========================================================= */

function runesRead(cmd) {
  const afterRead = cmd.replace(/^\/runes\s+read\s*/i, "").trim();

  let spreadKey = "default";
  let question = afterRead;

  const firstWord = afterRead.split(/\s+/)[0].toLowerCase();
  if (firstWord === "odin") {
    spreadKey = "odin";
    question = afterRead.substring(4).trim();
  } else if (firstWord === "hammer") {
    spreadKey = "hammer";
    question = afterRead.substring(6).trim();
  } else if (firstWord === "cross") {
    spreadKey = "cross";
    question = afterRead.substring(5).trim();
  } else if (firstWord === "wheel") {
    spreadKey = "wheel";
    question = afterRead.substring(5).trim();
  }

  if (!question) question = "(без въпрос)";
  if (question.length > 200) question = question.substring(0, 200) + "...";

  const spread = RUNE_SPREADS[spreadKey];
  const runes = [];
  for (let i = 0; i < spread.count; i++) {
    const r = drawRandomRune();
    if (!r) return "Грешка: липсват руни в runes_data.js";
    runes.push(r);
  }

  const summary = generateRunesSummary(runes);
  const dateStr = runesGetDateStr();

  let readingText = `[RUNES READING — ${spread.label}]\nВъпрос: "${question}"\n\n`;
  runes.forEach((rune, i) => {
    const pos = spread.positions[i];
    const dir = rune.noReversed ? "права (не се обръща)" : (rune.isReversed ? "обърната" : "права");
    const meaning = rune.isReversed ? rune.reversed : rune.upright;
    readingText += `[${pos}] ${rune.symbol} ${rune.name} (${dir})\n${meaning}\n\n`;
  });
  readingText += `[ОБОБЩЕНИЕ]\n${summary}`;

  const readingData = {
    spreadKey: spreadKey,
    spreadName: spread.name,
    spreadLabel: spread.label,
    question: question,
    positions: spread.positions,
    runes: runes.map(r => ({
      id: r.id,
      number: r.number,
      isReversed: r.isReversed,
      noReversed: r.noReversed,
      name: r.name,
      symbol: r.symbol,
      imageUrl: (typeof getRuneImageUrl === "function") ? getRuneImageUrl(r) : r.override,
      meaning: r.isReversed ? r.reversed : r.upright
    })),
    summary: summary,
    date: dateStr,
    timestamp: Date.now()
  };

   try {
    localStorage.setItem('atmos_runes_last_read', JSON.stringify(readingData));
  } catch (e) {}

   const pushFn = function() {
    if (typeof db !== "undefined") {
      db.ref("atmos_chat").push({
        name: "[RUNES]",
        text: readingText,
        timestamp: Date.now(),
        room: "runes"
      });
    }
  };

  if (window.__isOraclePage) {
    window.__oracleLastPush = pushFn;
  } else {
    ensureRunesRoom();
    pushFn();
  }

  return readingText;
}

/* =========================================================
   /runes read share
========================================================= */

async function runesReadShare() {
  let reading = null;
  try {
    reading = JSON.parse(localStorage.getItem('atmos_runes_last_read') || 'null');
  } catch (e) {}

  if (!reading) {
    return "Няма предишно четене. Използвай /runes read <въпрос> първо.";
  }

  return await renderRunesReadingCard(reading);
}

async function renderRunesReadingCard(reading) {
  if (reading.spreadKey === "wheel") {
    return await renderRunicWheelCard(reading);
  }

  const S = RUNE_STYLE;
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

  ctx.fillStyle = "rgba(200, 230, 255, 0.10)";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  ctx.fillStyle = "rgba(100, 255, 218, 0.05)";
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(0, Math.random() * canvas.height, canvas.width, 1 + Math.random() * 3);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = S.accentDeep; ctx.font = `bold 36px serif`;
  ctx.fillText("ᚠ", 95, 95);
  ctx.fillText("ᛟ", canvas.width - 95, 95);
  ctx.fillText("ᚦ", 95, canvas.height - 95);
  ctx.fillText("ᛞ", canvas.width - 95, canvas.height - 95);

  ctx.fillStyle = S.accent; ctx.font = `bold 40px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS RUNES READING ✦", canvas.width / 2, 110);

  ctx.fillStyle = S.textMuted; ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`${reading.spreadName || 'SPREAD'} // ${reading.date || ''}`, canvas.width / 2, 155);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 190); ctx.lineTo(canvas.width - 120, 190); ctx.stroke();

  ctx.fillStyle = S.accent; ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("ВЪПРОС", canvas.width / 2, 235);

  ctx.fillStyle = S.textPrimary; ctx.font = `bold 32px ${S.fontHead}`;
  const qLines = runesWrapText(ctx, reading.question, canvas.width - 200, 3);
  qLines.forEach((line, i) => {
    const prefix = i === 0 ? '"' : '';
    const suffix = i === qLines.length - 1 ? '"' : '';
    ctx.fillText(prefix + line + suffix, canvas.width / 2, 285 + i * 42);
  });

  const runes = reading.runes || [];
  const layout = runesGetCardLayout(runes.length);
  const cardY = layout.cardY;

  for (let i = 0; i < runes.length; i++) {
    const r = runes[i];
    const cx = layout.startX + i * (layout.cardW + layout.gap);

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(cx - 4, cardY - 4, layout.cardW + 8, layout.cardH + 8);
    ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
    ctx.strokeRect(cx - 4, cardY - 4, layout.cardW + 8, layout.cardH + 8);

    let drawn = false;
    if (r.imageUrl) {
      try {
        const img = await loadRuneImage(r.imageUrl);
        const imgRatio = img.width / img.height;
        const boxRatio = layout.cardW / layout.cardH;
        let dw, dh;
        if (imgRatio > boxRatio) { dw = layout.cardW; dh = layout.cardW / imgRatio; }
        else { dh = layout.cardH; dw = layout.cardH * imgRatio; }
        const dx = cx + (layout.cardW - dw) / 2;
        const dy = cardY + (layout.cardH - dh) / 2;

        if (r.isReversed) {
          ctx.save();
          ctx.translate(dx + dw / 2, dy + dh / 2);
          ctx.rotate(Math.PI);
          ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        } else {
          ctx.drawImage(img, dx, dy, dw, dh);
        }
        drawn = true;
      } catch (e) {}
    }

    if (!drawn) {
      ctx.fillStyle = S.accent;
      ctx.font = `bold ${Math.floor(layout.cardW * 0.7)}px serif`;
      ctx.fillText(r.symbol || "ᚠ", cx + layout.cardW / 2, cardY + layout.cardH / 2);
    }
  }

  let yCursor = cardY + layout.cardH + 60;
  const posFontSize = runes.length >= 5 ? 20 : 24;
  const nameFontSize = runes.length >= 5 ? 22 : 26;
  const meaningFontSize = runes.length >= 5 ? 22 : 24;

  for (let i = 0; i < runes.length; i++) {
    const r = runes[i];
    const pos = reading.positions[i] || `РУНА ${i + 1}`;
    const dir = r.noReversed ? "права" : (r.isReversed ? "обърната" : "права");

    ctx.fillStyle = S.accent;
    ctx.font = `bold ${posFontSize}px ${S.fontMono}`;
    ctx.fillText(`[${pos}]`, canvas.width / 2, yCursor);
    yCursor += posFontSize + 10;

    ctx.fillStyle = S.textPrimary;
    ctx.font = `bold ${nameFontSize}px ${S.fontHead}`;
    ctx.fillText(`${r.symbol} ${r.name} (${dir})`, canvas.width / 2, yCursor);
    yCursor += nameFontSize + 10;

    ctx.fillStyle = S.textMuted;
    ctx.font = `${meaningFontSize}px ${S.fontHead}`;
    const mLines = runesWrapText(ctx, r.meaning, canvas.width - 260, 2);
    mLines.forEach(line => {
      ctx.fillText(line, canvas.width / 2, yCursor);
      yCursor += meaningFontSize + 8;
    });

    yCursor += 12;
  }

  yCursor += 6;
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, yCursor); ctx.lineTo(canvas.width - 120, yCursor); ctx.stroke();
  yCursor += 46;

  ctx.fillStyle = S.accent;
  ctx.font = `bold 24px ${S.fontMono}`;
  ctx.fillText("[ОБОБЩЕНИЕ]", canvas.width / 2, yCursor);
  yCursor += 40;

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 24px ${S.fontHead}`;
  const sLines = runesWrapText(ctx, reading.summary, canvas.width - 200, 4);
  sLines.forEach(line => {
    ctx.fillText(line, canvas.width / 2, yCursor);
    yCursor += 34;
  });

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`ATMOS RUNES ENGINE // ${reading.spreadName || 'SPREAD'}`, canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен от CORS."; }

  try {
    let cache = JSON.parse(localStorage.getItem('fortune_cache') || '[]');
    cache.push({
      text: `RUNES ${reading.spreadName}: ${reading.question}`,
      date: reading.date, timestamp: Date.now(),
      type: 'runes_reading', image: imageBase64
    });
    if (cache.length > 50) cache.shift();
    localStorage.setItem('fortune_cache', JSON.stringify(cache));
  } catch (e) {}

    const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    activeDb.ref("fortune_buffer").set({
      type: 'runes_reading',
      spreadKey: reading.spreadKey,
      spreadName: reading.spreadName,
      spreadLabel: reading.spreadLabel,
      question: reading.question,
      positions: reading.positions,
      runes: reading.runes,
      summary: reading.summary,
      date: reading.date,
      timestamp: Date.now()
    }).catch(() => {});
  }

  if (window.__isOraclePage) {
    window.__oracleLastImage = imageBase64;
    return imageBase64;
  }

  return runesOutputImage(imageBase64, reading);
}

/* =========================================================
   РЕНДЕР: RUNIC WHEEL (12 руни в кръг)
========================================================= */

async function renderRunicWheelCard(reading) {
  const S = RUNE_STYLE;
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

  ctx.fillStyle = "rgba(200, 230, 255, 0.10)";
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

  /* ЪГЛОВИ РУНИ */
  ctx.fillStyle = S.accentDeep; ctx.font = `bold 36px serif`;
  ctx.fillText("ᚠ", 95, 95);
  ctx.fillText("ᛟ", canvas.width - 95, 95);
  ctx.fillText("ᚦ", 95, canvas.height - 95);
  ctx.fillText("ᛞ", canvas.width - 95, canvas.height - 95);

  /* ХЕДЪР */
  ctx.fillStyle = S.accent; ctx.font = `bold 44px ${S.fontHead}`;
  ctx.fillText("✦ РУНЕН КРЪГ ✦", canvas.width / 2, 100);

  ctx.fillStyle = S.textMuted; ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`RUNIC WHEEL // ${reading.date || ''}`, canvas.width / 2, 145);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 175); ctx.lineTo(canvas.width - 120, 175); ctx.stroke();

  /* ВЪПРОС */
  ctx.fillStyle = S.accent; ctx.font = `bold 18px ${S.fontMono}`;
  ctx.fillText("ВЪПРОС", canvas.width / 2, 205);

  ctx.fillStyle = S.textPrimary; ctx.font = `bold 26px ${S.fontHead}`;
  const qLines = runesWrapText(ctx, reading.question, canvas.width - 220, 2);
  qLines.forEach((line, i) => {
    const prefix = i === 0 ? '"' : '';
    const suffix = i === qLines.length - 1 ? '"' : '';
    ctx.fillText(prefix + line + suffix, canvas.width / 2, 240 + i * 32);
  });

  /* КРЪГ — 12 руни */
  const runes = reading.runes || [];
  const n = runes.length;
  const wheelCX = 540;
  const wheelCY = 740;
  const radius = 340;
  const cardW = 130;
  const cardH = 180;

  /* Декоративен кръг зад картите */
  ctx.strokeStyle = "rgba(142, 202, 230, 0.10)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(wheelCX, wheelCY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(wheelCX, wheelCY, radius + 110, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(wheelCX, wheelCY, radius - 110, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < n; i++) {
    const angleDeg = i * (360 / n);
    const angleRad = angleDeg * Math.PI / 180;

    const pcx = wheelCX + radius * Math.sin(angleRad);
    const pcy = wheelCY - radius * Math.cos(angleRad);

    const cardX = pcx - cardW / 2;
    const cardY = pcy - cardH / 2;

    /* Рамка на картата */
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(cardX - 3, cardY - 3, cardW + 6, cardH + 6);
    ctx.strokeStyle = S.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX - 3, cardY - 3, cardW + 6, cardH + 6);

    /* Картинка на руната */
    const r = runes[i];
    let drawn = false;
    if (r.imageUrl) {
      try {
        const img = await loadRuneImage(r.imageUrl);
        const imgRatio = img.width / img.height;
        const boxRatio = cardW / cardH;
        let dw, dh;
        if (imgRatio > boxRatio) { dw = cardW; dh = cardW / imgRatio; }
        else { dh = cardH; dw = cardH * imgRatio; }
        const dx = cardX + (cardW - dw) / 2;
        const dy = cardY + (cardH - dh) / 2;

        if (r.isReversed) {
          ctx.save();
          ctx.translate(dx + dw / 2, dy + dh / 2);
          ctx.rotate(Math.PI);
          ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        } else {
          ctx.drawImage(img, dx, dy, dw, dh);
        }
        drawn = true;
      } catch (e) {}
    }

    if (!drawn) {
      ctx.fillStyle = S.accent;
      ctx.font = `bold ${Math.floor(cardW * 0.7)}px serif`;
      ctx.fillText(r.symbol || "ᚠ", pcx, pcy);
    }

    /* Номер на позицията — малък кръг в ъгъла на картата */
    ctx.fillStyle = S.accentDeep;
    ctx.beginPath();
    ctx.arc(cardX + 4, cardY + 4, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = S.bgTop;
    ctx.font = `bold 18px ${S.fontMono}`;
    ctx.textAlign = "center";
    ctx.fillText(String(i + 1), cardX + 4, cardY + 5);
  }

  /* ЛЕГЕНДА */
  const legendTop = 1200;
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, legendTop - 20); ctx.lineTo(canvas.width - 120, legendTop - 20); ctx.stroke();

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.textAlign = "center";
  ctx.fillText("[ЛЕГЕНДА]", canvas.width / 2, legendTop + 10);

  const col1X = 90;
  const col2X = 570;
  const listStartY = legendTop + 60;
  const lineH = 34;
  const fs = 18;

  for (let i = 0; i < runes.length; i++) {
    const r = runes[i];
    const col = i < 6 ? 0 : 1;
    const row = i < 6 ? i : i - 6;
    const x = col === 0 ? col1X : col2X;
    const y = listStartY + row * lineH;

    ctx.textAlign = "left";

    ctx.fillStyle = S.accent;
    ctx.font = `bold ${fs}px ${S.fontMono}`;
    ctx.fillText(`${i + 1}.`, x, y);

    ctx.fillStyle = S.textPrimary;
    ctx.font = `bold ${fs}px ${S.fontHead}`;
    ctx.fillText(r.name || "", x + 35, y);

    ctx.fillStyle = S.textMuted;
    ctx.font = `${fs - 2}px ${S.fontHead}`;
    const dir = r.isReversed ? "(обърн.)" : "(права)";
    ctx.fillText(dir, x + 35 + 120, y);
  }
  ctx.textAlign = "center";

  /* ОБОБЩЕНИЕ */
  const summaryY = listStartY + 6 * lineH + 55;
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, summaryY - 20); ctx.lineTo(canvas.width - 120, summaryY - 20); ctx.stroke();

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("[ОБОБЩЕНИЕ]", canvas.width / 2, summaryY + 10);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `italic 20px ${S.fontHead}`;
  const sLines = runesWrapText(ctx, reading.summary || "", canvas.width - 200, 3);
  sLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, summaryY + 50 + i * 30);
  });

  /* FOOTER */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS RUNES ENGINE // RUNIC WHEEL", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  /* ЕКСПОРТ */
  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен от CORS."; }

  try {
    let cache = JSON.parse(localStorage.getItem('fortune_cache') || '[]');
    cache.push({
      text: `RUNES WHEEL: ${reading.question}`,
      date: reading.date, timestamp: Date.now(),
      type: 'runes_reading', image: imageBase64
    });
    if (cache.length > 50) cache.shift();
    localStorage.setItem('fortune_cache', JSON.stringify(cache));
  } catch (e) {}

    const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    activeDb.ref("fortune_buffer").set({
      type: 'runes_reading',
      spreadKey: reading.spreadKey,
      spreadName: reading.spreadName,
      spreadLabel: reading.spreadLabel,
      question: reading.question,
      positions: reading.positions,
      runes: reading.runes,
      summary: reading.summary,
      date: reading.date,
      timestamp: Date.now()
    }).catch(() => {});
  }

  if (window.__isOraclePage) {
    window.__oracleLastImage = imageBase64;
    return imageBase64;
  }

  return runesOutputImage(imageBase64, reading);
}

/* =========================================================
   OUTPUT UI (споделен за всички рунни четения)
========================================================= */

function runesOutputImage(imageBase64, reading) {
   if (window.__isOraclePage) {
    window.__oracleHasImage = true;
    return imageBase64;
  }
  
  const isModernUI = window.__isModernUI === true;
  const downloadHref = "https://tinyurl.com/bmnrux6t";
  const output = document.getElementById("terminalOutput") || document.body;

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed #8ecae6; background: #000; font-family: monospace;">
          <p style="color: #8ecae6; margin-bottom: 10px;">[RUNES] ${reading.spreadName} четенето е рендирано успешно:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid #8ecae6; display: block; margin-bottom: 15px;" alt="Atmos Runes Reading"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: #8ecae6; color: #000; padding: 10px 18px; border: none; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 10px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed #8ecae6; background: #000; font-family: monospace;">
          <p style="color: #8ecae6; margin-bottom: 10px;">[RUNES] ${reading.spreadName} четенето е рендирано успешно:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid #8ecae6; display: block; margin-bottom: 15px;" alt="Atmos Runes Reading"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: #8ecae6; color: #000; padding: 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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

  return "Runes четенето е генерирано.";
}

/* =========================================================
   /runes share — ЕДНА РУНА
========================================================= */

async function generateRuneCard() {
  const rune = drawRandomRune();
  if (!rune) return "Грешка: липсват руни в runes_data.js";

  const S = RUNE_STYLE;
  const dateStr = runesGetDateStr();
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

  ctx.fillStyle = "rgba(200, 230, 255, 0.10)";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = S.accentDeep; ctx.font = `bold 36px serif`;
  ctx.fillText("ᚠ", 95, 95);
  ctx.fillText("ᛟ", canvas.width - 95, 95);
  ctx.fillText("ᚦ", 95, canvas.height - 95);
  ctx.fillText("ᛞ", canvas.width - 95, canvas.height - 95);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 42px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS RUNE ✦", canvas.width / 2, 140);

  ctx.fillStyle = S.textMuted;
  ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(`RUNE OF THE DAY // ${dateStr}`, canvas.width / 2, 190);

  const posText = rune.noReversed ? "⚏ ПРАВА (не се обръща)" : (rune.isReversed ? "⚏ ОБЪРНАТА" : "⚏ ПРАВА");
  ctx.fillStyle = rune.isReversed ? "#ff8888" : S.accent;
  ctx.font = `bold 24px ${S.fontMono}`;
  ctx.fillText(posText, canvas.width / 2, 245);

  const imgUrl = (typeof getRuneImageUrl === "function") ? getRuneImageUrl(rune) : null;
  const cardX = 240, cardY = 320;
  const cardW = canvas.width - 480, cardH = 1060;
  const cardCX = cardX + cardW / 2, cardCY = cardY + cardH / 2;

  if (imgUrl) {
    try {
      const img = await loadRuneImage(imgUrl);
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

      if (rune.isReversed) {
        ctx.save();
        ctx.translate(dx + dw / 2, dy + dh / 2);
        ctx.rotate(Math.PI);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(img, dx, dy, dw, dh);
      }
    } catch (e) {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
      ctx.strokeRect(cardX, cardY, cardW, cardH);
      ctx.fillStyle = S.accent;
      ctx.font = `bold 380px serif`;
      ctx.fillText(rune.symbol || "ᚠ", cardCX, cardCY);
    }
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.fillStyle = S.accent;
    ctx.font = `bold 380px serif`;
    ctx.fillText(rune.symbol || "ᚠ", cardCX, cardCY);
  }

  const nameY = cardY + cardH + 80;
  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 62px ${S.fontHead}`;
  ctx.fillText(`${rune.symbol}  ${rune.name}`, canvas.width / 2, nameY);

  const kws = rune.keywords[rune.isReversed ? "reversed" : "upright"];
  const kwY = nameY + 80;
  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText(kws.join("  •  ").toUpperCase(), canvas.width / 2, kwY);

  const meaning = rune.isReversed ? rune.reversed : rune.upright;
  ctx.fillStyle = S.textPrimary;
  ctx.font = `28px ${S.fontHead}`;
  const mLines = runesWrapText(ctx, meaning, canvas.width - 200, 4);
  mLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, kwY + 70 + i * 42);
  });

  ctx.fillStyle = S.accentSoft;
  ctx.fillRect(120, canvas.height - 130, canvas.width - 240, 1);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS RUNES ENGINE // ELDER FUTHARK", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен от CORS."; }

  try {
    let cache = JSON.parse(localStorage.getItem('fortune_cache') || '[]');
    cache.push({
      text: `${rune.name} (${rune.isReversed ? "reversed" : "upright"})`,
      date: dateStr, timestamp: Date.now(), type: 'rune', runeId: rune.id, image: imageBase64
    });
    if (cache.length > 50) cache.shift();
    localStorage.setItem('fortune_cache', JSON.stringify(cache));
  } catch (e) {}

  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    const kwList = rune.keywords[rune.isReversed ? "reversed" : "upright"];
    const meaningForBuffer = rune.isReversed ? rune.reversed : rune.upright;
    const imgUrlForBuffer = (typeof getRuneImageUrl === "function") ? getRuneImageUrl(rune) : null;

    activeDb.ref("fortune_buffer").set({
      type: 'rune',
      runeId: rune.id,
      runeName: rune.name,
      symbol: rune.symbol,
      isReversed: rune.isReversed,
      noReversed: rune.noReversed,
      imageUrl: imgUrlForBuffer,
      meaning: meaningForBuffer,
      keywords: kwList,
      date: dateStr,
      timestamp: Date.now()
    }).catch(() => {});
  }

  if (window.__isOraclePage) {
    window.__oracleLastImage = imageBase64;
    return imageBase64;
  }


  const isModernUI = window.__isModernUI === true;
  const downloadHref = "https://tinyurl.com/bmnrux6t";
  const output = document.getElementById("terminalOutput") || document.body;
  const posLabel = rune.noReversed ? "ПРАВА (не се обръща)" : (rune.isReversed ? "ОБЪРНАТА" : "ПРАВА");

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${S.accent}; background: #000; font-family: monospace;">
          <p style="color: ${S.accent}; margin-bottom: 10px;">[RUNES] Руната е изтеглена — <b>${rune.name}</b> (${posLabel}):</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Rune"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${S.accent}; color: #000; padding: 10px 18px; border: none; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 10px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${S.accent}; background: #000; font-family: monospace;">
          <p style="color: ${S.accent}; margin-bottom: 10px;">[RUNES] Руната е изтеглена — <b>${rune.name}</b> (${posLabel}):</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Rune"/>
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
      window.scrollTo(0, document.body.scrollHeight);
    }, 500);
  }

  return "Rune картата е генерирана.";
}