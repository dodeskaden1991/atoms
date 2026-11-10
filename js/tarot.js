/* ===================================================================
   ATMOS TAROT — Single / Share / Read (4 spreads) / Read Share
   Разклади: default (3) • love (3) • cross (4) • five (5)
=================================================================== */

/* =========================================================
   КОНСТАНТИ
========================================================= */

const TAROT_STYLE = {
  bgTop:      "#0a0514",
  bgMid:      "#1a0b2e",
  bgBot:      "#05020a",
  accent:     "#d4af37",
  accentSoft: "rgba(212, 175, 55, 0.35)",
  textPrimary:"#f5e6c8",
  textMuted:  "rgba(245, 230, 200, 0.55)",
  fontHead:   "serif",
  fontMono:   "monospace"
};

const TAROT_SPREADS = {
  default: {
    name: "THREE_CARD",
    label: "МИНАЛО / НАСТОЯЩЕ / БЪДЕЩЕ",
    count: 3,
    positions: ["МИНАЛО", "НАСТОЯЩЕ", "БЪДЕЩЕ"]
  },
  love: {
    name: "LOVE",
    label: "ТИ / ПАРТНЬОРЪТ / ВРЪЗКАТА",
    count: 3,
    positions: ["ТИ", "ПАРТНЬОРЪТ", "ВРЪЗКАТА"]
  },
  cross: {
    name: "CROSSROADS",
    label: "КРЪСТОПЪТ",
    count: 4,
    positions: ["ТИ СЕГА", "ПЪТ А", "ПЪТ Б", "СЪВЕТ"]
  },
  five: {
    name: "FIVE_CARD",
    label: "СИТУАЦИЯ / ПРЕЧКА / СЪВЕТ / ДЕЙСТВИЕ / ИЗХОД",
    count: 5,
    positions: ["СИТУАЦИЯ", "ПРЕЧКА", "СЪВЕТ", "ДЕЙСТВИЕ", "ИЗХОД"]
  }
};

/* =========================================================
   ПОМОЩНИ
========================================================= */

function tarotGetDateStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function drawRandomTarotCard() {
  const deck = window.atmosTarot || [];
  if (deck.length === 0) return null;
  const card = Object.assign({}, deck[Math.floor(Math.random() * deck.length)]);
  card.isReversed = Math.random() < 0.5;
  return card;
}

function ensureTarotRoom() {
  try {
    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (!rooms.includes("tarot")) {
      rooms.push("tarot");
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  } catch (e) {}
}

function loadTarotImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error("no-url"));
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load-failed"));
    img.src = url;
  });
}

function wrapTarotText(ctx, text, maxWidth, maxLines) {
  const words = (text || "").split(" ");
  const lines = [];
  let cur = "";
  for (let i = 0; i < words.length; i++) {
    const test = cur + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      lines.push(cur.trim());
      cur = words[i] + " ";
      if (maxLines && lines.length >= maxLines) {
        if (cur.trim()) lines[lines.length - 1] = lines[lines.length - 1] + "...";
        return lines;
      }
    } else {
      cur = test;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

function getCardLayout(count) {
  const usable = 1080 - 200; // 880
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
   ОБОБЩЕНИЕ (работи с произволен брой карти)
========================================================= */

function generateReadingSummary(cards) {
  const n = cards.length;
  if (n === 0) return "";

  const upright = cards.filter(c => !c.isReversed).length;
  const ratio = upright / n;

  const suits = {};
  let majorCount = 0;
  cards.forEach(c => {
    if (c.arcana === "major") majorCount++;
    else suits[c.suit] = (suits[c.suit] || 0) + 1;
  });

  const dominantSuit = Object.keys(suits).reduce(
    (a, b) => (suits[a] || 0) > (suits[b] || 0) ? a : b,
    ""
  );

  const suitLabels = {
    wands: "действие, енергия и страст",
    cups: "емоции, взаимоотношения и интуиция",
    swords: "мисли, комуникация и предизвикателства",
    pentacles: "материя, работа и финанси"
  };

  let summary = "";

  if (ratio >= 0.8) {
    summary += "Много силно положително четене — почти всички карти са в права позиция. Вселената ти дава зелена светлина. ";
  } else if (ratio >= 0.6) {
    summary += "Като цяло положително четене. Има леки предупреждения, но посоката е добра. ";
  } else if (ratio >= 0.4) {
    summary += "Смесено четене. Силите са в баланс — важно е как ще подходиш. ";
  } else if (ratio >= 0.2) {
    summary += "Предизвикателно четене. Повечето карти са обърнати — има блокажи, изискващи внимание. ";
  } else {
    summary += "Трудно четене. Почти всички карти са обърнати — време е за пауза и преоценка. ";
  }

  if (majorCount >= Math.ceil(n / 2)) {
    summary += "Темата е съдбовна — предстоят важни промени, които не зависят само от теб.";
  } else if (dominantSuit && suits[dominantSuit] >= 2) {
    summary += `Основната тема е свързана с ${suitLabels[dominantSuit]}.`;
  }

  return summary.trim();
}

/* =========================================================
   DISPATCHER
========================================================= */

function tarotMessage(cmd) {
  if (!cmd) cmd = "/tarot";
  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);

  // /tarot
  if (parts.length === 1) return tarotSingle();

  // /tarot share
  if (parts.length === 2 && parts[1].toLowerCase() === "share") {
    return generateTarotCard();
  }

  // /tarot read ...
  if (parts.length >= 2 && parts[1].toLowerCase() === "read") {
    // /tarot read share
    if (parts.length === 3 && parts[2].toLowerCase() === "share") {
      return tarotReadShare();
    }
    // /tarot read <spread> <въпрос>  или  /tarot read <въпрос>
    return tarotRead(cmd);
  }

  return "Използвай: /tarot | /tarot share | /tarot read [love|cross|5] <въпрос> | /tarot read share";
}

/* =========================================================
   /tarot — ЕДНА КАРТА
========================================================= */

function tarotSingle() {
  const card = drawRandomTarotCard();
  if (!card) return "Грешка: липсват карти в tarot_data.js";

  const pos = card.isReversed ? "ОБЪРНАТА" : "ПРАВА";
  const meaning = card.isReversed ? card.reversed : card.upright;
  const kws = card.keywords[card.isReversed ? "reversed" : "upright"];

  const text =
    `[TAROT] ${card.symbol} ${card.name} (${card.nameEn}) — ${pos} позиция\n` +
    `Ключови думи: ${kws.join(", ")}\n` +
    `${meaning}`;

  sendSystemLine(text);

  if (window.__isOraclePage) return text;
  return "Tarot card drawn.";
}

/* =========================================================
   /tarot read [love|cross|5] <въпрос>
========================================================= */

function tarotRead(cmd) {
  const afterRead = cmd.replace(/^\/tarot\s+read\s*/i, "").trim();

  let spreadKey = "default";
  let question = afterRead;

  const firstWord = afterRead.split(/\s+/)[0].toLowerCase();
  if (firstWord === "love") {
    spreadKey = "love";
    question = afterRead.substring(4).trim();
  } else if (firstWord === "cross") {
    spreadKey = "cross";
    question = afterRead.substring(5).trim();
  } else if (firstWord === "5") {
    spreadKey = "five";
    question = afterRead.substring(1).trim();
  }

  if (!question) question = "(без въпрос)";
  if (question.length > 200) question = question.substring(0, 200) + "...";

  const spread = TAROT_SPREADS[spreadKey];
  const cards = [];
  for (let i = 0; i < spread.count; i++) {
    const c = drawRandomTarotCard();
    if (!c) return "Грешка: липсват карти в tarot_data.js";
    cards.push(c);
  }

  const summary = generateReadingSummary(cards);
  const dateStr = tarotGetDateStr();

  let readingText = `[TAROT READING — ${spread.label}]\nВъпрос: "${question}"\n\n`;
  cards.forEach((card, i) => {
    const pos = spread.positions[i];
    const dir = card.isReversed ? "обърната" : "права";
    const meaning = card.isReversed ? card.reversed : card.upright;
    readingText += `[${pos}] ${card.symbol} ${card.name} (${dir})\n${meaning}\n\n`;
  });
  readingText += `[ОБОБЩЕНИЕ]\n${summary}`;

  const readingData = {
    spreadKey: spreadKey,
    spreadName: spread.name,
    spreadLabel: spread.label,
    question: question,
    positions: spread.positions,
    cards: cards.map(c => ({
      id: c.id,
      isReversed: c.isReversed,
      name: c.name,
      nameEn: c.nameEn,
      symbol: c.symbol,
      imageUrl: (typeof getTarotImageUrl === "function") ? getTarotImageUrl(c) : c.override,
      meaning: c.isReversed ? c.reversed : c.upright
    })),
    summary: summary,
    date: dateStr,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem('atmos_tarot_last_read', JSON.stringify(readingData));
  } catch (e) {}

  const pushFn = function() {
    if (typeof db !== "undefined") {
      db.ref("atmos_chat").push({
        name: "[TAROT]",
        text: readingText,
        timestamp: Date.now(),
        room: "tarot"
      });
    }
  };

  if (window.__isOraclePage) {
    window.__oracleLastPush = pushFn;
  } else {
    ensureTarotRoom();
    pushFn();
  }

  return readingText;
}

/* =========================================================
   /tarot read share
========================================================= */

async function tarotReadShare() {
  let reading = null;
  try {
    reading = JSON.parse(localStorage.getItem('atmos_tarot_last_read') || 'null');
  } catch (e) {}

  if (!reading) {
    return "Няма предишно четене. Използвай /tarot read <въпрос> първо.";
  }

  return await renderTarotReadingCard(reading);
}

async function renderTarotReadingCard(reading) {
  const S = TAROT_STYLE;
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
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let i = 0; i < 300; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  /* РАМКИ */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  /* ХЕДЪР */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 40px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS TAROT READING ✦", canvas.width / 2, 110);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`${reading.spreadName || 'SPREAD'} // ${reading.date || ''}`, canvas.width / 2, 155);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 190); ctx.lineTo(canvas.width - 120, 190); ctx.stroke();

  /* ВЪПРОС */
  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("ВЪПРОС", canvas.width / 2, 235);

  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 32px ${S.fontHead}`;
  const qLines = wrapTarotText(ctx, reading.question, canvas.width - 200, 3);
  qLines.forEach((line, i) => {
    const prefix = i === 0 ? '"' : '';
    const suffix = i === qLines.length - 1 ? '"' : '';
    ctx.fillText(prefix + line + suffix, canvas.width / 2, 285 + i * 42);
  });

  /* РАЗКЛАД */
  const layout = getCardLayout(reading.cards.length);
  const cardY = layout.cardY;

  for (let i = 0; i < reading.cards.length; i++) {
    const c = reading.cards[i];
    const cx = layout.startX + i * (layout.cardW + layout.gap);

    // Рамка
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(cx - 4, cardY - 4, layout.cardW + 8, layout.cardH + 8);
    ctx.strokeStyle = S.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 4, cardY - 4, layout.cardW + 8, layout.cardH + 8);

    // Картинка
    let drawn = false;
    if (c.imageUrl) {
      try {
        const img = await loadTarotImage(c.imageUrl);
        const imgRatio = img.width / img.height;
        const boxRatio = layout.cardW / layout.cardH;
        let dw, dh;
        if (imgRatio > boxRatio) { dw = layout.cardW; dh = layout.cardW / imgRatio; }
        else { dh = layout.cardH; dw = layout.cardH * imgRatio; }
        const dx = cx + (layout.cardW - dw) / 2;
        const dy = cardY + (layout.cardH - dh) / 2;

        if (c.isReversed) {
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
      ctx.font = `bold ${Math.floor(layout.cardW * 0.6)}px serif`;
      ctx.fillText(c.symbol || "✦", cx + layout.cardW / 2, cardY + layout.cardH / 2);
    }
  }

  /* ПОЗИЦИИ / ИМЕНА / ЗНАЧЕНИЯ */
  let yCursor = cardY + layout.cardH + 60;
  const nameFontSize = reading.cards.length >= 5 ? 22 : 26;
  const posFontSize = reading.cards.length >= 5 ? 20 : 24;
  const meaningFontSize = reading.cards.length >= 5 ? 22 : 24;

  for (let i = 0; i < reading.cards.length; i++) {
    const c = reading.cards[i];
    const pos = reading.positions[i] || `КАРТА ${i + 1}`;
    const dir = c.isReversed ? "обърната" : "права";

    ctx.fillStyle = S.accent;
    ctx.font = `bold ${posFontSize}px ${S.fontMono}`;
    ctx.fillText(`[${pos}]`, canvas.width / 2, yCursor);
    yCursor += posFontSize + 10;

    ctx.fillStyle = S.textPrimary;
    ctx.font = `bold ${nameFontSize}px ${S.fontHead}`;
    ctx.fillText(`${c.name} (${dir})`, canvas.width / 2, yCursor);
    yCursor += nameFontSize + 10;

    ctx.fillStyle = S.textMuted;
    ctx.font = `${meaningFontSize}px ${S.fontHead}`;
    const mLines = wrapTarotText(ctx, c.meaning, canvas.width - 260, 2);
    mLines.forEach(line => {
      ctx.fillText(line, canvas.width / 2, yCursor);
      yCursor += meaningFontSize + 8;
    });

    yCursor += 12;
  }

  /* ОБОБЩЕНИЕ */
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
  const sLines = wrapTarotText(ctx, reading.summary, canvas.width - 200, 4);
  sLines.forEach(line => {
    ctx.fillText(line, canvas.width / 2, yCursor);
    yCursor += 34;
  });

  /* FOOTER */
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, canvas.height - 130); ctx.lineTo(canvas.width - 120, canvas.height - 130); ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`ATMOS TAROT ENGINE // ${reading.spreadName || 'SPREAD'}`, canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  /* ЕКСПОРТ */
  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен от CORS."; }

  /* КЕШ */
  try {
    let cache = JSON.parse(localStorage.getItem('fortune_cache') || '[]');
    cache.push({
      text: `TAROT ${reading.spreadName}: ${reading.question}`,
      date: reading.date,
      timestamp: Date.now(),
      type: 'tarot_reading',
      image: imageBase64
    });
    if (cache.length > 50) cache.shift();
    localStorage.setItem('fortune_cache', JSON.stringify(cache));
  } catch (e) {}

  /* FIREBASE BUFFER */
  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    activeDb.ref("fortune_buffer").set({
      type: 'tarot_reading',
      spreadKey: reading.spreadKey,
      spreadName: reading.spreadName,
      spreadLabel: reading.spreadLabel,
      question: reading.question,
      positions: reading.positions,
      cards: reading.cards,
      summary: reading.summary,
      date: reading.date,
      timestamp: Date.now()
    }).catch(() => {});
  }

   if (window.__isOraclePage) {
  window.__oracleLastImage = imageBase64;  // ← ПРАВИЛНАТА
  return;
}

  /* ИЗХОД КЪМ UI */
  const isModernUI = window.__isModernUI === true;
  const downloadHref = "https://tinyurl.com/bmnrux6t";
  const output = document.getElementById("terminalOutput") || document.body;

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${S.accent}; background: #000; font-family: monospace;">
          <p style="color: ${S.accent}; margin-bottom: 10px;">[TAROT] ${reading.spreadName} четенето е рендирано успешно:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Tarot Reading"/>
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
          <p style="color: ${S.accent}; margin-bottom: 10px;">[TAROT] ${reading.spreadName} четенето е рендирано успешно:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Tarot Reading"/>
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

  return "Tarot четенето е генерирано.";
}

/* =========================================================
   /tarot share — ЕДНА КАРТА
========================================================= */

async function generateTarotCard() {
  const card = drawRandomTarotCard();
  if (!card) return "Грешка: липсват карти в tarot_data.js";

  const S = TAROT_STYLE;
  const dateStr = tarotGetDateStr();
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

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let i = 0; i < 300; i++) {
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
  ctx.fillText("✦ ATMOS TAROT ✦", canvas.width / 2, 140);

  ctx.fillStyle = S.textMuted;
  ctx.font = `20px ${S.fontMono}`;
  ctx.fillText(`CARD OF THE DAY // ${dateStr}`, canvas.width / 2, 190);

  const posText = card.isReversed ? "⚏ ОБЪРНАТА" : "⚏ ПРАВА";
  ctx.fillStyle = card.isReversed ? "#ff8888" : S.accent;
  ctx.font = `bold 24px ${S.fontMono}`;
  ctx.fillText(posText, canvas.width / 2, 245);

  const imgUrl = (typeof getTarotImageUrl === "function") ? getTarotImageUrl(card) : null;
  const cardX = 190, cardY = 300;
  const cardW = canvas.width - 380, cardH = 1100;
  const cardCX = cardX + cardW / 2, cardCY = cardY + cardH / 2;

  if (imgUrl) {
    try {
      const img = await loadTarotImage(imgUrl);
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

      if (card.isReversed) {
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
      ctx.font = `bold 320px serif`;
      ctx.fillText(card.symbol || "✦", cardCX, cardCY);
    }
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.fillStyle = S.accent;
    ctx.font = `bold 320px serif`;
    ctx.fillText(card.symbol || "✦", cardCX, cardCY);
  }

  const nameY = cardY + cardH + 70;
  ctx.fillStyle = S.textPrimary;
  ctx.font = `bold 56px ${S.fontHead}`;
  ctx.fillText(card.name, canvas.width / 2, nameY);

  ctx.fillStyle = S.textMuted;
  ctx.font = `italic 26px ${S.fontHead}`;
  ctx.fillText(card.nameEn, canvas.width / 2, nameY + 50);

  const kws = card.keywords[card.isReversed ? "reversed" : "upright"];
  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText(kws.join("  •  ").toUpperCase(), canvas.width / 2, nameY + 110);

  const meaning = card.isReversed ? card.reversed : card.upright;
  ctx.fillStyle = S.textPrimary;
  ctx.font = `28px ${S.fontHead}`;
  const mLines = wrapTarotText(ctx, meaning, canvas.width - 200, 4);
  mLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, nameY + 180 + i * 42);
  });

  ctx.fillStyle = S.accentSoft;
  ctx.fillRect(120, canvas.height - 130, canvas.width - 240, 1);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS TAROT ENGINE // 78 CARDS", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  let imageBase64;
  try { imageBase64 = canvas.toDataURL("image/png"); }
  catch (e) { return "Грешка: canvas е замърсен от CORS."; }

  try {
    let cache = JSON.parse(localStorage.getItem('fortune_cache') || '[]');
    cache.push({
      text: `${card.name} (${card.isReversed ? "reversed" : "upright"})`,
      date: dateStr, timestamp: Date.now(), type: 'tarot',
      cardId: card.id, image: imageBase64
    });
    if (cache.length > 50) cache.shift();
    localStorage.setItem('fortune_cache', JSON.stringify(cache));
  } catch (e) {}

  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    const kwList = card.keywords[card.isReversed ? "reversed" : "upright"];
    const meaningForBuffer = card.isReversed ? card.reversed : card.upright;
    const imgUrlForBuffer = (typeof getTarotImageUrl === "function") ? getTarotImageUrl(card) : null;

    activeDb.ref("fortune_buffer").set({
      type: 'tarot',
      cardId: card.id,
      cardName: card.name,
      cardNameEn: card.nameEn,
      symbol: card.symbol,
      isReversed: card.isReversed,
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
  const posLabel = card.isReversed ? "ОБЪРНАТА" : "ПРАВА";

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${S.accent}; background: #000; font-family: monospace;">
          <p style="color: ${S.accent}; margin-bottom: 10px;">[TAROT] Картата е изтеглена — <b>${card.name}</b> (${posLabel}):</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Tarot"/>
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
          <p style="color: ${S.accent}; margin-bottom: 10px;">[TAROT] Картата е изтеглена — <b>${card.name}</b> (${posLabel}):</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${S.accent}; display: block; margin-bottom: 15px;" alt="Atmos Tarot"/>
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

  return "Tarot картата е генерирана.";
}