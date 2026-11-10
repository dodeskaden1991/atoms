/* ===================================================================
   ATMOS PSYCHE — Психологически анализ v3.0
   Базиран на: Фройд, Юнг, Адлер
   С multilayered blending, tint и aspect ratio
=================================================================== */

const PSYCHE_STYLE = {
  bgTop: "#0a1a1a", bgMid: "#0d2020", bgBot: "#050d0d",
  accent: "#4ecdc4", accentSoft: "rgba(78, 205, 196, 0.35)",
  accentDeep: "#d4af37", accentRed: "#8b2020",
  textPrimary: "#e6f5f4", textMuted: "rgba(230, 245, 244, 0.55)",
  fontHead: "serif", fontMono: "monospace"
};

/* =========================================================
   ПОМОЩНИ
========================================================= */

function psycheGetDateStr() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function psycheGenerateId(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 5).toUpperCase().padStart(5, '0');
}

function ensurePsycheRoom() {
  try {
    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
    if (!rooms.includes("psyche")) {
      rooms.push("psyche");
      localStorage.setItem("rooms", JSON.stringify(rooms));
    }
  } catch (e) {}
}

function psychePushToChat(text, room) {
  ensurePsycheRoom();
  if (typeof db !== "undefined") {
    db.ref("atmos_chat").push({
      name: "[PSYCHE]",
      text: text,
      timestamp: Date.now(),
      room: room || "psyche"
    });
  }
}

function psycheSaveLast(data) {
  try { localStorage.setItem("atmos_psyche_last", JSON.stringify(data)); } catch (e) {}
}

function psycheLoadLast() {
  try {
    const raw = localStorage.getItem("atmos_psyche_last");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function psycheWrapText(ctx, text, maxWidth, maxLines) {
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
   PARSER
========================================================= */

function psycheFindBasicModels(text) {
  const lower = " " + text.toLowerCase() + " ";
  const models = window.atmosPsycheBasic || [];
  const endings = window.atmosPsycheEndings || [''];
  const negations = window.atmosPsycheNegations || ['не ', 'без '];

  const modelWeights = new Map();

  for (const model of models) {
    const blacklist = (model.blacklist || []).map(b => b.toLowerCase());

    for (const root of model.roots) {
      const rootLower = root.toLowerCase();
      let idx = 0;

      while ((idx = lower.indexOf(rootLower, idx)) !== -1) {
        const before = lower[idx - 1];
        const isLeftBoundary = /[\s.,!?;:()\-—"'«»]/.test(before);

        if (isLeftBoundary) {
          const contextBefore = lower.substring(Math.max(0, idx - 20), idx);
          const isNegated = negations.some(n => contextBefore.endsWith(n));

          if (!isNegated) {
            const afterIdx = idx + rootLower.length;
            const context = lower.substring(
              Math.max(0, idx - 3),
              Math.min(lower.length, afterIdx + 15)
            );
            const isBlacklisted = blacklist.some(b => context.includes(b));

            if (!isBlacklisted) {
              const after = lower.substring(afterIdx);
              const isValidEnding = endings.some(e => {
                if (e === '') return /^[\s.,!?;:()\-—"'«»]/.test(after) || after === '';
                return after.startsWith(e);
              });

              if (isValidEnding) {
                if (!modelWeights.has(model.id)) {
                  modelWeights.set(model.id, {
                    model: model,
                    hits: 0,
                    matchedWords: new Set()
                  });
                }
                const entry = modelWeights.get(model.id);
                entry.hits++;
                entry.matchedWords.add(rootLower);
              }
            }
          }
        }

        idx += rootLower.length;
        if (idx >= lower.length) break;
      }
    }
  }

  const found = [];
  for (const [id, entry] of modelWeights) {
    const rawWeight = entry.hits * entry.model.baseWeight;
    const weight = Math.min(10, rawWeight);

    found.push({
      model: entry.model,
      id: entry.model.id,
      name: entry.model.name,
      group: entry.model.group,
      category: entry.model.category,
      imageKey: entry.model.imageKey,
      hits: entry.hits,
      matchedWords: [...entry.matchedWords].slice(0, 5),
      weight: weight
    });
  }

  found.sort((a, b) => b.weight - a.weight);
  return found;
}

/* =========================================================
   КОМБИНИРАНИ
========================================================= */

function psycheActivateCombinedModels(basicModels) {
  const combined = window.atmosPsycheCombined || [];
  const active = [];
  const foundMap = new Map();
  for (const m of basicModels) foundMap.set(m.id, m);

  for (const combo of combined) {
    const matched = [];
    const weights = [];
    for (const id of combo.condition) {
      if (foundMap.has(id)) {
        matched.push(id);
        weights.push(foundMap.get(id).weight);
      }
    }

    if (matched.length >= combo.minRequired) {
      const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
      const bonus = matched.length * 0.5;
      const weight = Math.min(10, Math.round(avgWeight * 0.7 + bonus + combo.baseWeight * 0.5));

      active.push({
        id: combo.id,
        name: combo.name,
        nameBg: combo.nameBg,
        group: combo.group,
        category: combo.category,
        weight: weight,
        matchedModels: matched,
        description: combo.description,
        advice: combo.advice
      });
    }
  }

  active.sort((a, b) => {
    if (b.matchedModels.length !== a.matchedModels.length) {
      return b.matchedModels.length - a.matchedModels.length;
    }
    return b.weight - a.weight;
  });

  const filtered = [];
  const seen = new Set();
  for (const c of active) {
    const sig = [...c.matchedModels].sort().join(",");
    if (seen.has(sig)) continue;
    seen.add(sig);
    filtered.push(c);
  }
  return filtered;
}

/* =========================================================
   ИЗБОР НА СЛОЕВЕ ЗА BLENDING
========================================================= */

function psycheSelectLayers(basicModels, combinedModels, questionText) {
  const rules = window.atmosPsycheImageRules || {};
  const sexualIds = rules.sexualModelIds || [];
  const images = window.atmosPsycheImages || {};
  const blendRules = window.atmosPsycheBlendRules || {};
  const tintRules = window.atmosPsycheTintRules || {};

  const totalBasic = basicModels.reduce((s, m) => s + m.weight, 0);
  if (totalBasic === 0) return { type: 'none', layers: [] };

  // Сексуална тежест
  const sexualBasic = basicModels.filter(m => sexualIds.includes(m.id));
  const sexualTotal = sexualBasic.reduce((s, m) => s + m.weight, 0);
  const sexualRatio = totalBasic > 0 ? sexualTotal / totalBasic : 0;

  // Най-силен сексуален с реален образ
  let dominantSexual = null;
  let maxSW = 0;
  for (const m of sexualBasic) {
    if (m.imageKey && images[m.imageKey] && m.weight > maxSW) {
      maxSW = m.weight;
      dominantSexual = m.id;
    }
  }

  // Взимаме не-сексуалните модели за слоеве
  const nonSexual = basicModels.filter(m => !sexualIds.includes(m.id));

  // Взимаме топ 4 слоя
  const topLayers = nonSexual.slice(0, 4);

  // Ако всички са сексуални → само сексуални слоеве
  if (topLayers.length === 0 && sexualBasic.length > 0) {
    return {
      type: 'sexual_only',
      layers: sexualBasic.slice(0, 3).map((m, i) => ({
        imageUrl: images[m.imageKey],
        opacity: [1.0, 0.5, 0.3][i] || 0.2,
        blend: blendRules[m.group] || 'screen',
        group: m.group
      })),
      sexualRatio: sexualRatio,
      dominantSexual: dominantSexual
    };
  }

  // Build layers от не-сексуални
  const layers = topLayers.map((m, i) => {
    const imgKey = m.imageKey || 'base_1';
    const imageUrl = images[imgKey] || images['base_1'];
    const blend = i === 0 ? 'source-over' : (blendRules[m.group] || 'screen');
    const opacities = [1.0, 0.45, 0.30, 0.20];
    const opacity = opacities[i] || 0.15;

    return {
      imageUrl: imageUrl,
      opacity: opacity,
      blend: blend,
      group: m.group,
      modelName: m.name,
      weight: m.weight
    };
  });

  // Определяме типа
  let type = 'base';
  if (sexualRatio > (rules.sexualDominanceThreshold || 0.55) && dominantSexual) {
    type = 'sexual_dominant';
  } else if (sexualRatio > (rules.sexualOverlayThreshold || 0.25) && dominantSexual) {
    type = 'overlay';
  }

  // Взимаме tint от топ слоя
 // Взимаме tint от топ слоя
const topGroup = topLayers[0] ? topLayers[0].group : 'jung_archetypes';
const tint = tintRules[topGroup] || 'rgba(255, 255, 255, 0.05)';

// НОВО: Ако няма валидни слоеве → търсим imageKey от комбинираните
if (layers.length === 0 || layers.every(l => !l.imageUrl)) {
  // Взимаме топ комбиниран модел
  if (combinedModels.length > 0) {
    const topCombined = combinedModels[0];
    const combImgKey = (window.atmosPsycheGroupToImage || {})[topCombined.group];
    if (combImgKey && images[combImgKey]) {
      layers.push({
        imageUrl: images[combImgKey],
        opacity: 1.0,
        blend: 'source-over',
        group: topCombined.group,
        modelName: topCombined.name,
        weight: topCombined.weight
      });
    }
  }
}

  return {
    type: type,
    layers: layers,
    tint: tint,
    sexualRatio: sexualRatio,
    dominantSexual: dominantSexual,
    sexualImageUrl: dominantSexual ? images['sexual_' + dominantSexual] || null : null
  };
}

/* =========================================================
   АНАЛИЗ (текст)
========================================================= */

function psycheGenerateAnalysis(question, basicModels, combinedModels, layerSelection) {
  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🧠 ATMOS PSYCHE — АНАЛИЗ\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const shortQ = question.length > 150 ? question.substring(0, 150) + "..." : question;
  out += `📝 Разказ: „${shortQ}"\n\n`;

  const totalWeight = basicModels.reduce((s, m) => s + m.weight, 0);
  const confidence = Math.min(100, Math.round(totalWeight * 2.5));
  const confLabel = confidence >= 70 ? 'висока' : confidence >= 40 ? 'средна' : 'ниска';
  out += `📊 Сигурност на анализа: ${confidence}% (${confLabel})\n\n`;

  out += `━━━ АКТИВИРАНИ МОДЕЛИ ━━━\n`;
  const topBasic = basicModels.slice(0, 8);
  for (const m of topBasic) {
    const filled = Math.min(5, Math.max(0, Math.round(m.weight / 2)));
    const bar = "█".repeat(filled) + "░".repeat(5 - filled);
    const words = (m.matchedWords || []).slice(0, 2).join(", ");
    out += `${bar} ${m.name} (${m.weight}/10)${words ? ` — „${words}"` : ''}\n`;
  }
  out += `\n`;

  if (combinedModels.length > 0) {
    out += `━━━ ОСНОВЕН ПРОФИЛ ━━━\n`;
    const top = combinedModels.slice(0, 2);
    for (const m of top) {
      out += `⚠ ${m.name} (${m.weight}/10)\n`;
      out += `   Съставни: ${m.matchedModels.join(", ")}\n`;
    }
    out += `\n`;
  }

  out += `━━━ ОБОБЩЕНИЕ ━━━\n`;
  if (combinedModels.length > 0) {
    out += `${combinedModels[0].description}\n\n`;
  } else if (basicModels.length > 0) {
    out += `${basicModels[0].model.description}\n\n`;
  }

  out += `━━━ СЪВЕТ ━━━\n`;
  if (combinedModels.length > 0) {
    out += `${combinedModels[0].advice}\n`;
  } else if (basicModels.length > 0) {
    out += `${basicModels[0].model.advice}\n`;
  }

  if (layerSelection && layerSelection.sexualRatio !== undefined) {
    const pct = Math.round(layerSelection.sexualRatio * 100);
    if (layerSelection.type === 'overlay') {
      out += `\n⚠ Сексуален подтекст: ${pct}% от тежестта.\n`;
    } else if (layerSelection.type === 'sexual_dominant' || layerSelection.type === 'sexual_only') {
      out += `\n⚠ Сексуалният подтекст доминира (${pct}%).\n`;
    }
  }

  return out;
}

/* =========================================================
   DISPATCHER
========================================================= */

function psycheMessage(cmd) {
  if (!cmd) return psycheShowHelp();
  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);
  if (parts.length === 1) return psycheShowHelp();

  const sub = parts[1].toLowerCase();
  if (sub === "share") { psycheShare(); return ""; }
  if (sub === "help") return psycheShowHelp();
  if (sub === "debug") return psycheDebug(cmd);

  const text = cmd.replace(/^\/psyche\s+/i, "").trim();
  return psycheAnalyze(text);
}

function psycheShowHelp() {
  return `ATMOS PSYCHE v3.0 — Психологически анализ

Базиран на: Фройд, Юнг, Адлер

Команди:
  /psyche <текст>   Анализирай текста
  /psyche share     Картинка с последния анализ

Пример:
  /psyche Сънувах, че влизам в стаята и пронизвам
          гардероба с огромен меч.

Системата разпознава ~110 психологически модела.`;
}

/* =========================================================
   ОСНОВНА
========================================================= */

async function psycheAnalyze(text) {
  if (!text || text.length < 10) {
    return "Error: Текстът трябва да е поне 10 символа.";
  }
  if (text.length > 3000) text = text.substring(0, 3000);

  const basicModels = psycheFindBasicModels(text);
  if (basicModels.length === 0) {
    return `Не открих познати психологически модели.

Опитай с по-конкретен разказ — символи, образи, чувства.`;
  }

  const combinedModels = psycheActivateCombinedModels(basicModels);
  const layerSelection = psycheSelectLayers(basicModels, combinedModels, text);
  const analysis = psycheGenerateAnalysis(text, basicModels, combinedModels, layerSelection);

  const dateStr = psycheGetDateStr();
  const id = psycheGenerateId(text);

  const lastData = {
    type: 'psyche',
    question: text,
    id: id,
    date: dateStr,
    basic: basicModels.map(m => ({
      id: m.id,
      name: m.name,
      group: m.group,
      category: m.category,
      weight: m.weight,
      hits: m.hits,
      imageKey: m.imageKey,
      description: m.model.description,   // ← ДОБАВИ
      advice: m.model.advice
    })),
    combined: combinedModels.map(m => ({
      id: m.id,
      name: m.name,
      group: m.group,
      category: m.category,
      weight: m.weight,
      description: m.description,
      advice: m.advice,
      matchedModels: m.matchedModels
    })),
    layerSelection: layerSelection
  };
  psycheSaveLast(lastData);

  psychePushToChat(analysis, "psyche");

  const imageBase64 = await psycheRenderCard(lastData);
  if (imageBase64) psycheOutputImage(imageBase64, lastData);

  return analysis;
}

async function psycheShare() {
  const last = psycheLoadLast();
  if (!last) {
    const output = document.getElementById("terminalOutput");
    if (output) {
      output.innerHTML += `\nНяма последен анализ.\n  /psyche <текст>\n`;
      output.scrollTop = output.scrollHeight;
    }
    return;
  }

  const imageBase64 = await psycheRenderCard(last);
  if (!imageBase64) return;
  psycheOutputImage(imageBase64, last);
}

/* =========================================================
   LOAD IMAGE
========================================================= */

function psycheLoadImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error("no-url"));
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load-failed"));
    img.src = url;
  });
}

/* =========================================================
   РЕНДЕР
========================================================= */

async function psycheRenderCard(data) {
  const S = PSYCHE_STYLE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080;
  canvas.height = 1920;

  // Фон
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Звезди
  ctx.fillStyle = "rgba(230, 245, 244, 0.06)";
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  // Рамки
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.strokeStyle = S.accent; ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = S.accent;
  ctx.font = `bold 36px serif`;
  ctx.fillText("✦", 95, 95);
  ctx.fillText("✦", canvas.width - 95, 95);
  ctx.fillText("✦", 95, canvas.height - 95);
  ctx.fillText("✦", canvas.width - 95, canvas.height - 95);

  // Заглавие
  ctx.fillStyle = S.accent;
  ctx.font = `bold 44px ${S.fontHead}`;
  ctx.fillText("✦ ATMOS PSYCHE ✦", canvas.width / 2, 120);

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText(`DREAM ANALYSIS // ${data.date} // ID: ${data.id}`, canvas.width / 2, 165);

  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 195);
  ctx.lineTo(canvas.width - 120, 195);
  ctx.stroke();

  // =========================================================
  // ИЗОБРАЖЕНИЕ — MULTILAYERED BLEND
  // =========================================================
  const imgY = 230;
  const imgMaxW = canvas.width - 200;
  const imgMaxH = 900;
  const imgLeftX = (canvas.width - imgMaxW) / 2;

  const sel = data.layerSelection || { type: 'none', layers: [] };
  let actualImgH = 0;
  let actualImgW = imgMaxW;
  let actualImgX = imgLeftX;

  if (sel.layers && sel.layers.length > 0) {
    // Зареждаме всички изображения паралелно
    const images = await Promise.all(
      sel.layers.map(l => psycheLoadImage(l.imageUrl).catch(() => null))
    );

    // Рисуваме всеки слой
    for (let i = 0; i < sel.layers.length; i++) {
      const layer = sel.layers[i];
      const img = images[i];
      if (!img) continue;

      // Aspect ratio
      const ratio = img.width / img.height;
      let dw = imgMaxW;
      let dh = imgMaxW / ratio;
      if (dh > imgMaxH) {
        dh = imgMaxH;
        dw = imgMaxH * ratio;
      }
      const dx = (canvas.width - dw) / 2;

      ctx.globalCompositeOperation = layer.blend || 'source-over';
      ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;
      ctx.drawImage(img, dx, imgY, dw, dh);

      // Записваме размерите от първия слой
      if (i === 0) {
        actualImgH = dh;
        actualImgW = dw;
        actualImgX = dx;
      }
    }

    // Връщаме нормалния режим
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;

    // Тинт
    if (sel.tint && actualImgH > 0) {
      ctx.fillStyle = sel.tint;
      ctx.fillRect(actualImgX, imgY, actualImgW, actualImgH);
    }
  }

  // Ако няма изображение — placeholder
  if (actualImgH === 0) {
    actualImgH = 400;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(actualImgX, imgY, actualImgW, actualImgH);
    ctx.strokeStyle = S.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(actualImgX, imgY, actualImgW, actualImgH);
    ctx.fillStyle = S.accent;
    ctx.font = `bold 24px ${S.fontMono}`;
    ctx.fillText("[ изображението не е налично ]", canvas.width / 2, imgY + actualImgH / 2);
  }

  // Сексуален овърлей (radial gradient)
  if (sel.type === 'overlay' && sel.sexualImageUrl) {
    try {
      const sexImg = await psycheLoadImage(sel.sexualImageUrl);
      const ratio = sexImg.width / sexImg.height;
      let dw = actualImgW;
      let dh = actualImgW / ratio;
      if (dh > actualImgH) {
        dh = actualImgH;
        dw = actualImgH * ratio;
      }
      const dx = actualImgX + (actualImgW - dw) / 2;
      const dy = imgY + (actualImgH - dh) / 2;

      // Temp canvas за overlay
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = dw;
      tempCanvas.height = dh;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(sexImg, 0, 0, dw, dh);

      const cx = dw / 2;
      const cy = dh / 2;
      const radius = Math.max(dw, dh) * 0.6;
      const maskGrad = tempCtx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
      maskGrad.addColorStop(0, "rgba(255,255,255,0.9)");
      maskGrad.addColorStop(0.5, "rgba(255,255,255,0.4)");
      maskGrad.addColorStop(1, "rgba(255,255,255,0)");

      tempCtx.globalCompositeOperation = 'destination-in';
      tempCtx.fillStyle = maskGrad;
      tempCtx.fillRect(0, 0, dw, dh);

      ctx.globalAlpha = 0.65;
      ctx.drawImage(tempCanvas, dx, dy);
      ctx.globalAlpha = 1;
    } catch (e) {
      console.warn("Sexual overlay failed:", e);
    }
  }

  // Рамка около изображението
  if (actualImgH > 0) {
    ctx.strokeStyle = S.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(actualImgX - 4, imgY - 4, actualImgW + 8, actualImgH + 8);
  }

  // =========================================================
  // МОДЕЛИ
  // =========================================================
  let yCursor = imgY + actualImgH + 60;
  const maxModels = 6;
  const basic = (data.basic || []).slice(0, maxModels);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("АКТИВИРАНИ МОДЕЛИ", canvas.width / 2, yCursor);
  yCursor += 40;

  const barMaxW = 500;
  const barX = (canvas.width - barMaxW) / 2;
  const barH = 14;
  const lineH = 42;

  for (const m of basic) {
    ctx.fillStyle = S.textPrimary;
    ctx.font = `bold 20px ${S.fontHead}`;
    ctx.textAlign = "left";
    ctx.fillText(m.name, barX, yCursor);

    ctx.textAlign = "right";
    ctx.fillStyle = S.textMuted;
    ctx.font = `16px ${S.fontMono}`;
    ctx.fillText(`${m.weight}/10`, barX + barMaxW, yCursor);

    ctx.textAlign = "left";
    const barFillW = Math.min(barMaxW, Math.max(0, (m.weight / 10) * barMaxW));
    ctx.fillStyle = "rgba(78, 205, 196, 0.15)";
    ctx.fillRect(barX, yCursor + 8, barMaxW, barH);

    let barColor = S.accent;
    if (m.category === 'shadow') barColor = S.accentRed;
    else if (m.category === 'light') barColor = S.accentDeep;

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, yCursor + 8, barFillW, barH);

    yCursor += lineH;
  }
  ctx.textAlign = "center";

  // Обобщение
  yCursor += 20;
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, yCursor);
  ctx.lineTo(canvas.width - 120, yCursor);
  ctx.stroke();
  yCursor += 45;

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontMono}`;
  ctx.fillText("ОБОБЩЕНИЕ", canvas.width / 2, yCursor);
  yCursor += 40;

  ctx.fillStyle = S.textPrimary;
  ctx.font = `22px ${S.fontHead}`;

  let summaryText = "";
if (data.combined && data.combined.length > 0) {
  summaryText = data.combined[0].description || "";
} else if (data.basic && data.basic.length > 0) {
  summaryText = data.basic[0].description || "";
}

  const sumLines = psycheWrapText(ctx, summaryText, canvas.width - 220, 5);
  sumLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, yCursor + i * 32);
  });
  yCursor += sumLines.length * 32 + 30;

  // Съвет
  if (yCursor < canvas.height - 250) {
    ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, yCursor);
    ctx.lineTo(canvas.width - 120, yCursor);
    ctx.stroke();
    yCursor += 45;

    ctx.fillStyle = S.accentDeep;
    ctx.font = `bold 22px ${S.fontMono}`;
    ctx.fillText("СЪВЕТ", canvas.width / 2, yCursor);
    yCursor += 40;

    ctx.fillStyle = S.textPrimary;
    ctx.font = `italic 22px ${S.fontHead}`;

   let adviceText = data.adviceText || "";
if (!adviceText && data.combined && data.combined.length > 0) {
  adviceText = data.combined[0].advice || "";
}
if (!adviceText && data.basic && data.basic.length > 0) {
  adviceText = data.basic[0].advice || "";
}

    const advLines = psycheWrapText(ctx, adviceText, canvas.width - 220, 4);
    advLines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, yCursor + i * 32);
    });
  }

  // Footer
  ctx.strokeStyle = S.accentSoft; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, canvas.height - 130);
  ctx.lineTo(canvas.width - 120, canvas.height - 130);
  ctx.stroke();

  ctx.fillStyle = S.textMuted;
  ctx.font = `18px ${S.fontMono}`;
  ctx.fillText("ATMOS PSYCHE ENGINE // FREUD + JUNG + ADLER", canvas.width / 2, canvas.height - 90);

  ctx.fillStyle = S.accent;
  ctx.font = `bold 22px ${S.fontHead}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, canvas.height - 55);

  try {
    return canvas.toDataURL("image/png");
  } catch (e) {
    return null;
  }
}

/* =========================================================
   OUTPUT
========================================================= */

function psycheOutputImage(imageBase64, data) {
  const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
  if (activeDb) {
    activeDb.ref("fortune_buffer").set({
      type: 'psyche',
      resolved: data,
      timestamp: Date.now(),
      date: data.date
    }).catch(() => {});
  }

  const isModernUI = window.__isModernUI === true;
  const downloadHref = "https://tinyurl.com/bmnrux6t";
  const output = document.getElementById("terminalOutput") || document.body;
  const accentColor = "#4ecdc4";

  if (isModernUI) {
    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${accentColor}; background: #000; font-family: monospace;">
          <p style="color: ${accentColor}; margin-bottom: 10px;">[PSYCHE] Анализът е рендиран:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${accentColor}; display: block; margin-bottom: 15px;" alt="Atmos Psyche"/>
          <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" style="background: ${accentColor}; color: #000; padding: 10px 18px; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
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
          <p style="color: ${accentColor}; margin-bottom: 10px;">[PSYCHE] Анализът е рендиран:</p>
          <img src="${imageBase64}" style="width: 100%; max-width: 260px; border: 1px solid ${accentColor}; display: block; margin-bottom: 15px;" alt="Atmos Psyche"/>
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

function psycheDebug(cmd) {
  const text = cmd.replace(/^\/psyche\s+debug\s*/i, "").trim();
  if (!text) return "Usage: /psyche debug <текст>";

  const basicModels = psycheFindBasicModels(text);
  let out = `━━━ DEBUG: НАМЕРЕНИ МОДЕЛИ ━━━\n\n`;

  if (basicModels.length === 0) {
    out += `Няма намерени модели.\n`;
  } else {
    for (const m of basicModels.slice(0, 15)) {
      out += `${m.name} (${m.weight}/10, ${m.hits} hits)\n`;
      out += `  Думи: ${m.matchedWords.join(", ")}\n`;
      out += `  ImageKey: ${m.imageKey || "—"}\n`;
      out += `  Group: ${m.group}\n\n`;
    }
  }

  return out;
}