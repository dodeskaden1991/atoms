/* ===================================================================
   ATMOS OGHAM — /ogham, /ogham share, /ogham read, /ogham read share
   Разклади: default (3) • druid (3) • grove (5) • cross (4)
=================================================================== */

const OGHAM_STYLE = {
  bgTop:      "#0a1410",
  bgMid:      "#14261c",
  bgBot:      "#050a07",
  accent:     "#88c999",
  accentSoft: "rgba(136, 201, 153, 0.35)",
  accentDeep: "#d4af37",
  textPrimary:"#e8f5e9",
  textMuted:  "rgba(232, 245, 233, 0.55)",
  fontHead:   "serif",
  fontMono:   "monospace"
};

const OGHAM_SPREADS = {
  default: {
    name: "THREE_TREES",
    label: "МИНАЛО / НАСТОЯЩЕ / БЪДЕЩЕ",
    count: 3,
    positions: ["МИНАЛО", "НАСТОЯЩЕ", "БЪДЕЩЕ"]
  },
  druid: {
    name: "DRUIDS_PATH",
    label: "ПЪТЯТ НА ДРУИДА",
    count: 3,
    positions: ["СИТУАЦИЯ", "ПРЕЧКА", "ДЕЙСТВИЕ"]
  },
  grove: {
    name: "SACRED_GROVE",
    label: "СВЕЩЕНАТА ГОРА",
    count: 5,
    positions: ["СИТУАЦИЯ", "ПРЕЧКА", "СЪВЕТ", "ДЕЙСТВИЕ", "ИЗХОД"]
  },
  cross: {
    name: "TREE_CROSS",
    label: "ДЪРВЕСЕН КРЪСТ",
    count: 4,
    positions: ["ТИ", "СИТУАЦИЯ", "СЪВЕТ", "РЕЗУЛТАТ"]
  }
};

/* =========================================================
   ПОМОЩНИ
========================================================= */

function oghamGetDateStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function drawRandomOgham() {
  const deck = window.atmosOgham || [];
  if (deck.length === 0) return null;
  const o = Object.assign({}, deck[Math.floor(Math.random() * deck.length)]);
  o.isReversed = Math.random() < 0.5;
  return o;
}

function ensureOghamRoom() {
  try {
    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (!rooms.includes("ogham")) {
      rooms.push("ogham");
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  } catch (e) {}
}

function loadOghamImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error("no-url"));
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load-failed"));
    img.src = url;
  });
}

function oghamWrapText(ctx, text, maxWidth, maxLines) {
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

function oghamGetCardLayout(count) {
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

function generateOghamSummary(oghams) {
  const n = oghams.length;
  if (n === 0) return "";

  const upright = oghams.filter(o => !o.isReversed).length;
  const ratio = upright / n;

  const aicmes = { 1: 0, 2: 0, 3: 0, 4: 0 };
  oghams.forEach(o => { aicmes[o.aicme]++; });

  const dominantAicme = Object.keys(aicmes).reduce(
    (a, b) => aicmes[a] > aicmes[b] ? a : b, "1"
  );

  const aicmeLabels = {
    "1": "първата група (Beith) — начало, пречистване и основи",
    "2": "втората група (Huath) — изпитания, търпение и трансформация",
    "3": "третата група (Muin) — истина, съдба и дълбоко познание",
    "4": "четвъртата група (Ailm) — визия, общност и завършване"
  };

  let summary = "";

  if (ratio >= 0.8) {
    summary += "Силно положително четене. Дърветата са предимно в права позиция — гората е с теб. ";
  } else if (ratio >= 0.6) {
    summary += "Като цяло положително четене. Има леки предупреждения, но пътят е открит. ";
  } else if (ratio >= 0.4) {
    summary += "Смесено четене. Силите са в баланс — важно е как ще подходиш. ";
  } else {
    summary += "Предизвикателно четене. Повечето дървета са обърнати — има блокажи, изискващи внимание. ";
  }

  if (aicmes[dominantAicme] >= 2) {
    summary += `Основната тема е свързана с ${aicmeLabels[dominantAicme]}.`;
  }

  return summary.trim();
}

/* =========================================================
   DISPATCHER
========================================================= */

function oghamMessage(cmd) {
  if (!cmd) cmd = "/ogham";
  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);

  if (parts.length === 1) return oghamSingle();

  if (parts.length === 2 && parts[1].toLowerCase() === "share") {
    return generateOghamCard();
  }

  if (parts.length >= 2 && parts[1].toLowerCase() === "read") {
    if (parts.length === 3 && parts[2].toLowerCase() === "share") {
      return oghamReadShare();
    }
    return oghamRead(cmd);
  }

  return "Използвай: /ogham | /ogham share | /ogham read [druid|grove|cross] <въпрос> | /ogham read share";
}

/* =========================================================
   /ogham — ЕДНА БУКВА
========================================================= */

function oghamSingle() {
  const o = drawRandomOgham();
  if (!o) return "Грешка: липсват огам букви в ogham_data.js";

  const pos = o.isReversed ? "ОБЪРНАТА" : "ПРАВА";
  const meaning = o.isReversed ? o.reversed : o.upright;
  const kws = o.keywords[o.isReversed ? "reversed" : "upright"];

  const text =
    `[OGHAM] ${o.symbol} ${o.name} (${o.tree}) — ${pos} позиция\n` +
    `Ключови думи: ${kws.join(", ")}\n` +
    `${meaning}`;

  sendSystemLine(text);

  if (window.__isOraclePage) return text;
  return "Ogham drawn.";
}

/* =========================================================
   /ogham read [druid|grove|cross] <въпрос>
========================================================= */

function oghamRead(cmd) {
  const afterRead = cmd.replace(/^\/ogham\s+read\s*/i, "").trim();

  let spreadKey = "default";
  let question = afterRead;

  const firstWord = afterRead.split(/\s+/)[0].toLowerCase();
  if (firstWord === "druid") {
    spreadKey = "druid";
    question = afterRead.substring(5).trim();
  } else if (firstWord === "grove") {
    spreadKey = "grove";
    question = afterRead.substring(5).trim();
  } else if (firstWord === "cross") {
    spreadKey = "cross";
    question = afterRead.substring(5).trim();
  }

  if (!question) question = "(без въпрос)";
  if (question.length > 200) question = question.substring(0, 200) + "...";

  const spread = OGHAM_SPREADS[spreadKey];
  const items = [];
  for (let i = 0; i < spread.count; i++) {
    const o = drawRandomOgham();
    if (!o) return "Грешка: липсват огам букви в ogham_data.js";
    items.push(o);
  }

  const summary = generateOghamSummary(items);
  const dateStr = oghamGetDateStr();

  let readingText = `[OGHAM READING — ${spread.label}]\nВъпрос: "${question}"\n\n`;
  items.forEach((o, i) => {
    const pos = spread.positions[i];
    const dir = o.isReversed ? "обърната" : "права";
    const meaning = o.isReversed ? o.reversed : o.upright;
    readingText += `[${pos}] ${o.symbol} ${o.name} (${o.tree}, ${dir})\n${meaning}\n\n`;
  });
  readingText += `[ОБОБЩЕНИЕ]\n${summary}`;

  const readingData = {
    spreadKey: spreadKey,
    spreadName: spread.name,
    spreadLabel: spread.label,
    question: question,
    positions: spread.positions,
    items: items.map(o => ({
      id: o.id,
      number: o.number,
      isReversed: o.isReversed,
      name: o.name,
      tree: o.tree,
      symbol: o.symbol,
      imageUrl: (typeof getOghamImageUrl === "function") ? getOghamImageUrl(o) : o.override,
      meaning: o.isReversed ? o.reversed : o.upright
    })),
    summary: summary,
    date: dateStr,
    timestamp: Date.now()
  };

   try {
    localStorage.setItem('atmos_ogham_last_read', JSON.stringify(readingData));
  } catch (e) {}

    const pushFn = function() {
    if (typeof db !== "undefined") {
      db.ref("atmos_chat").push({
        name: "[OGHAM]",
        text: readingText,
        timestamp: Date.now(),
        room: "ogham"
      });
    }
  };

  if (window.__isOraclePage) {
    window.__oracleLastPush = pushFn;
  } else {
    ensureOghamRoom();
    pushFn();
  }

  return readingText;
}

/* =========================================================
   /ogham read share
========================================================= */

async function oghamReadShare() {
  let reading = null;
  try {
    reading = JSON.parse(localStorage.getItem('atmos_ogham_last_read') || 'null');
  } catch (e) {}

  if (!reading) {
    return "Няма предишно четене. Използвай /ogham read <въпрос> първо.";
  }

  return await renderOghamReadingCard(reading);
}

async function renderOghamReadingCard(reading) {
  const S = OGHAM_STYLE;
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

  ctx.fillStyle = "rgba(200, 240, 210, 0.10)";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  ctx.fillStyle = "rgba(212, 175, 55, 0.04)";
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(0, Math.random() * canvas.height, canvas.width, 1 + Math.random() * 2);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 36px serif`;
  ctx.fillText("ᚁ", 95, 95);
  ctx.fillText("ᚔ", canvas.width - 95, 95);
  ctx.fillText("ᚂ", 95, canvas.height - 95);
  ctx.fillText("ᚓ", canvas.width - 95, canvas.height - 95);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 40px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS OGHAM READING ✦", canvas.width / 2, 110);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`${reading.spreadName || 'SPREAD'} // ${reading.date || ''}`, canvas.width / 2, 155);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 190); ctx.lineTo(canvas.width - 120, 190); ctx.stroke();

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("ВЪПРОС", canvas.width / 2, 235);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 32px ${S.fontHead}`;
  const qLines = oghamWrapText(ctx, reading.question, canvas.width - 200, 3);
  qLines.forEach((line, i) => {
    const prefix = i === 0 ? '"' : '';
    const suffix = i === qLines.length - 1 ? '"' : '';
    ctx.fillText(prefix + line + suffix, canvas.width / 2, 285 + i * 42);
  });

  const items = reading.items || [];
  const layout = oghamGetCardLayout(items.length);
  const cardY = layout.cardY;

  for (let i = 0; i < items.length; i++) {
    const o = items[i];
    const cx = layout.startX + i * (layout.cardW + layout.gap);

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(cx - 4, cardY - 4, layout.cardW + 8, layout.cardH + 8);
    ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
    ctx.strokeRect(cx - 4, cardY - 4, layout.cardW + 8, layout.cardH + 8);

    let drawn = false;
    if (o.imageUrl) {
      try {
        const img = await loadOghamImage(o.imageUrl);
        const imgRatio = img.width / img.height;
        const boxRatio = layout.cardW / layout.cardH;
        let dw, dh;
        if (imgRatio > boxRatio) { dw = layout.cardW; dh = layout.cardW / imgRatio; }
        else { dh = layout.cardH; dw = layout.cardH * imgRatio; }
        const dx = cx + (layout.cardW - dw) / 2;
        const dy = cardY + (layout.cardH - dh) / 2;

        if (o.isReversed) {
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
      ctx.fillText(o.symbol || "ᚁ", cx + layout.cardW / 2, cardY + layout.cardH / 2);
    }
  }

  let yCursor = cardY + layout.cardH + 60;
  const posFontSize = items.length >= 5 ? 20 : 24;
  const nameFontSize = items.length >= 5 ? 22 : 26;
  const meaningFontSize = items.length >= 5 ? 22 : 24;

  for (let i = 0; i < items.length; i++) {
    const o = items[i];
    const pos = reading.positions[i] || `БУКВА ${i + 1}`;
    const dir = o.isReversed ? "обърната" : "права";

    ctx.fillStyle = S.accent;
    ctx.font = `bold ${posFontSize}px ${S.fontMono}`;
    ctx.fillText(`[${pos}]`, canvas.width / 2, yCursor);
    yCursor += posFontSize + 10;

    ctx.fillStyle = S.textPrimary;
    ctx.font = `bold ${nameFontSize}px ${S.fontHead}`;
    ctx.fillText(`${o.symbol} ${o.name} (${o.tree}, ${dir})`, canvas.width / 2, yCursor);
    yCursor += nameFontSize + 10;

    ctx.fillStyle = S.textMuted;
    ctx.font = `${meaningFontSize}px ${S.fontHead}`;
    const mLines = oghamWrapText(ctx, o.meaning, canvas.width - 260, 2);
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
  const sLines = oghamWrapText(ctx, reading.summary, canvas.width - 200, 4);
  sLines.forEach(line => {
    ctx.fillText(line, canvas.width / 2, yCursor);
    yCursor += 34;
  });

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`ATMOS OGHAM ENGINE // ${reading.spreadName || 'SPREAD'}`, canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен от CORS."; }

  try {
    let cache = JSON.parse(localStorage.getItem('fortune_cache') || '[]');
    cache.push({
      text: `OGHAM ${reading.spreadName}: ${reading.question}`,
      date: reading.date, timestamp: Date.now(),
      type: 'ogham_reading', image: imageBase64
    });
    if (cache.length > 50) cache.shift();
    localStorage.setItem('fortune_cache', JSON.stringify(cache));
  } catch (e) {}

  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    activeDb.ref("fortune_buffer").set({
      type: 'ogham_reading',
      spreadKey: reading.spreadKey,
      spreadName: reading.spreadName,
      spreadLabel: reading.spreadLabel,
      question: reading.question,
      positions: reading.positions,
      items: reading.items,
      summary: reading.summary,
      date: reading.date,
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

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${S.accent}; background: #000; font-family: monospace;">
          <p style="color: ${S.accent}; margin-bottom: 10px;">[OGHAM] ${reading.spreadName} четенето е рендирано успешно:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Ogham Reading"/>
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
          <p style="color: ${S.accent}; margin-bottom: 10px;">[OGHAM] ${reading.spreadName} четенето е рендирано успешно:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Ogham Reading"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${S.accent}; color: #000; padding: 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
            [СВАЛИ КАРТИНКАТА]
          </a>
          <p style="color: #555; margin-bottom: 10px;">[СПОДЕЛЯНЕ] Качи квадрата от галерията си:</p>
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

  return "Ogham четенето е генерирано.";
}

/* =========================================================
   /ogham share — ЕДНА БУКВА
========================================================= */

async function generateOghamCard() {
  const o = drawRandomOgham();
  if (!o) return "Грешка: липсват огам букви в ogham_data.js";

  const S = OGHAM_STYLE;
  const dateStr = oghamGetDateStr();
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

  ctx.fillStyle = "rgba(200, 240, 210, 0.10)";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = S.accentDeep;
  ctx.font = `bold 36px serif`;
  ctx.fillText("ᚁ", 95, 95);
  ctx.fillText("ᚔ", canvas.width - 95, 95);
  ctx.fillText("ᚂ", 95, canvas.height - 95);
  ctx.fillText("ᚓ", canvas.width - 95, canvas.height - 95);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 42px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS OGHAM ✦", canvas.width / 2, 140);

  ctx.fillStyle = S.textMuted;
  ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(`TREE OF THE DAY // ${dateStr}`, canvas.width / 2, 190);

  const posText = o.isReversed ? "⚏ ОБЪРНАТА" : "⚏ ПРАВА";
  ctx.fillStyle = o.isReversed ? "#ff8888" : S.accent;
  ctx.font = `bold 24px ${S.fontMono}`;
  ctx.fillText(posText, canvas.width / 2, 245);

  const imgUrl = (typeof getOghamImageUrl === "function") ? getOghamImageUrl(o) : null;
  const cardX = 240, cardY = 320;
  const cardW = canvas.width - 480, cardH = 1060;
  const cardCX = cardX + cardW / 2, cardCY = cardY + cardH / 2;

  if (imgUrl) {
    try {
      const img = await loadOghamImage(imgUrl);
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

      if (o.isReversed) {
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
      ctx.fillText(o.symbol || "ᚁ", cardCX, cardCY);
    }
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.fillStyle = S.accent;
    ctx.font = `bold 380px serif`;
    ctx.fillText(o.symbol || "ᚁ", cardCX, cardCY);
  }

  const nameY = cardY + cardH + 80;
  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 58px ${S.fontHead}`;
  ctx.fillText(`${o.symbol}  ${o.name}`, canvas.width / 2, nameY);

  ctx.fillStyle = S.accentDeep;
  ctx.font = `italic 30px ${S.fontHead}`;
  ctx.fillText(o.tree, canvas.width / 2, nameY + 60);

  const kws = o.keywords[o.isReversed ? "reversed" : "upright"];
  const kwY = nameY + 130;
  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText(kws.join("  •  ").toUpperCase(), canvas.width / 2, kwY);

  const meaning = o.isReversed ? o.reversed : o.upright;
  ctx.fillStyle = S.textPrimary;
  ctx.font = `28px ${S.fontHead}`;
  const mLines = oghamWrapText(ctx, meaning, canvas.width - 200, 4);
  mLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, kwY + 70 + i * 42);
  });

  ctx.fillStyle = S.accentSoft;
  ctx.fillRect(120, canvas.height - 130, canvas.width - 240, 1);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS OGHAM ENGINE // CELTIC TREE ALPHABET", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен от CORS."; }

  try {
    let cache = JSON.parse(localStorage.getItem('fortune_cache') || '[]');
    cache.push({
      text: `${o.name} (${o.isReversed ? "reversed" : "upright"})`,
      date: dateStr, timestamp: Date.now(), type: 'ogham', oghamId: o.id, image: imageBase64
    });
    if (cache.length > 50) cache.shift();
    localStorage.setItem('fortune_cache', JSON.stringify(cache));
  } catch (e) {}

  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    const kwList = o.keywords[o.isReversed ? "reversed" : "upright"];
    const meaningForBuffer = o.isReversed ? o.reversed : o.upright;
    const imgUrlForBuffer = (typeof getOghamImageUrl === "function") ? getOghamImageUrl(o) : null;

    activeDb.ref("fortune_buffer").set({
      type: 'ogham',
      oghamId: o.id,
      oghamName: o.name,
      tree: o.tree,
      symbol: o.symbol,
      isReversed: o.isReversed,
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
  const posLabel = o.isReversed ? "ОБЪРНАТА" : "ПРАВА";

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${S.accent}; background: #000; font-family: monospace;">
          <p style="color: ${S.accent}; margin-bottom: 10px;">[OGHAM] Буквата е изтеглена — <b>${o.name}</b> (${posLabel}):</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Ogham"/>
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
          <p style="color: ${S.accent}; margin-bottom: 10px;">[OGHAM] Буквата е изтеглена — <b>${o.name}</b> (${posLabel}):</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Ogham"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${S.accent}; color: #000; padding: 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
            [СВАЛИ КАРТИНКАТА]
          </a>
          <p style="color: #555; margin-bottom: 10px;">[СПОДЕЛЯНЕ] Качи квадрата от галерията си:</p>
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

  return "Ogham картата е генерирана.";
}