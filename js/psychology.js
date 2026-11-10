/* ===================================================================
   ATMOS PSYCHE — Психологически анализ v4.0
   Базиран на: Фройд, Юнг, Адлер
   С multilayered blending, tint, aspect ratio
   С positive/negative context, phrases, stems, homonyms
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
  const pushFn = function() {
    if (typeof db !== "undefined") {
      db.ref("atmos_chat").push({
        name: "[PSYCHE]",
        text: text,
        timestamp: Date.now(),
        room: room || "psyche"
      });
    }
  };

  if (window.__isOraclePage) {
    window.__oracleLastPush = pushFn;
    return;
  }

  ensurePsycheRoom();
  pushFn();
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
   КОНТЕКСТ
========================================================= */

function psycheDetectContext(text) {
  const lower = " " + text.toLowerCase() + " ";
  const posWords = window.atmosPsychePositiveWords || [];
  const negWords = window.atmosPsycheNegativeWords || [];

  let posScore = 0;
  let negScore = 0;

  for (const w of posWords) {
    const regex = new RegExp("(^|[\\s.,!?;:()\\-—\"'«»])" + w, "gi");
    const matches = lower.match(regex);
    if (matches) posScore += matches.length;
  }

  for (const w of negWords) {
    const regex = new RegExp("(^|[\\s.,!?;:()\\-—\"'«»])" + w, "gi");
    const matches = lower.match(regex);
    if (matches) negScore += matches.length;
  }

  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

function psycheDetectContextForModel(text, model, windowSize = 8) {
  const lower = " " + text.toLowerCase() + " ";
  const posWords = window.atmosPsychePositiveWords || [];
  const negWords = window.atmosPsycheNegativeWords || [];

  const positions = [];
  const allRoots = [
    ...(model.phrases || []),
    ...(model.stems || []),
    ...(model.words || [])
  ];

  for (const root of allRoots) {
    const r = root.toLowerCase();
    let idx = 0;
    while ((idx = lower.indexOf(r, idx)) !== -1) {
      positions.push(idx);
      idx += r.length;
    }
  }

  if (positions.length === 0) return 'neutral';

  let posScore = 0;
  let negScore = 0;

  for (const pos of positions) {
    const start = Math.max(0, pos - windowSize * 6);
    const end = Math.min(lower.length, pos + windowSize * 6);
    const contextWindow = lower.substring(start, end);

    for (const w of posWords) {
      const regex = new RegExp("(^|[\\s.,!?;:()\\-—\"'«»])" + w, "gi");
      const matches = contextWindow.match(regex);
      if (matches) posScore += matches.length;
    }

    for (const w of negWords) {
      const regex = new RegExp("(^|[\\s.,!?;:()\\-—\"'«»])" + w, "gi");
      const matches = contextWindow.match(regex);
      if (matches) negScore += matches.length;
    }
  }

  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

/* =========================================================
   ПРОВЕРКИ
========================================================= */

function psycheCheckPhrase(text, phrase) {
  if (!phrase) return false;
  const lower = text.toLowerCase();
  const p = phrase.toLowerCase();
  return lower.includes(p);
}

function psycheCheckWord(text, word) {
  if (!word) return false;
  const lower = " " + text.toLowerCase() + " ";
  const w = word.toLowerCase();
  const regex = new RegExp("(^|[\\s.,!?;:()\\-—\"'«»])" + w + "([\\s.,!?;:()\\-—\"'«»]|$)", "gi");
  return regex.test(lower);
}

function psycheCheckStem(text, stem, endings, negations, blacklist) {
  if (!stem) return { found: false, positions: [] };

  const lower = " " + text.toLowerCase() + " ";
  const s = stem.toLowerCase();
  const positions = [];

  let idx = 0;
  while ((idx = lower.indexOf(s, idx)) !== -1) {
    const before = lower[idx - 1];
    const isLeftBoundary = /[\s.,!?;:()\-—"'«»]/.test(before);

    if (isLeftBoundary) {
      const contextBefore = lower.substring(Math.max(0, idx - 20), idx);
      const isNegated = negations.some(n => contextBefore.endsWith(n));

      if (!isNegated) {
                const afterIdx = idx + s.length;
        const after = lower.substring(afterIdx);
        const isValidEnding = endings.some(e => {
          if (e === '') return /^[\s.,!?;:()\-—"'«»]/.test(after) || after === '';
          
          // Точно съвпадение: "изб" + "а" = "изба"
          if (after === e) return true;
          
          // Съставна наставка: "импулс" + "ивен" = "импулсивен"
          // Проверяваме дали after = e1 + e2, където e1, e2 ∈ endings
          if (after.startsWith(e)) {
            const remaining = after.substring(e.length);
            // remaining трябва да е друга валидна наставка или край на думата
            if (remaining === '' || /^[\s.,!?;:()\-—"'«»]/.test(remaining)) return true;
            return endings.some(e2 => e2 !== '' && remaining === e2);
          }
          
          return false;
        });

        if (isValidEnding) {
          const contextStart = Math.max(0, idx - 30);
          const contextEnd = Math.min(lower.length, afterIdx + 30);
          const context = lower.substring(contextStart, contextEnd);
          const isBlacklisted = blacklist.some(b => context.includes(b.toLowerCase()));

          if (!isBlacklisted) {
            positions.push(idx);
          }
        }
      }
    }

    idx += s.length;
    if (idx >= lower.length) break;
  }

  return { found: positions.length > 0, positions };
}

/* =========================================================
   PARSER
========================================================= */
function psycheTransliterate(text) {
  const map = {
    'sht': 'щ', 'ch': 'ч', 'sh': 'ш', 'zh': 'ж',
    'ya': 'я', 'yu': 'ю', 'yo': 'йо', 'ye': 'е',
    'ts': 'ц', 'ay': 'ай', 'ey': 'ей', 'oy': 'ой',
    'a': 'а', 'b': 'б', 'c': 'ц', 'd': 'д', 'e': 'е',
    'f': 'ф', 'g': 'г', 'h': 'х', 'i': 'и', 'j': 'й',
    'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
    'p': 'п', 'q': 'к', 'r': 'р', 's': 'с', 't': 'т',
    'u': 'у', 'v': 'в', 'w': 'у', 'x': 'кс', 'y': 'й',
    'z': 'з'
  };

  let result = text.toLowerCase();
  const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    result = result.split(key).join(map[key]);
  }

  return result;
}


function psycheFindBasicModels(text) {
  text = psycheTransliterate(text);
  const lower = " " + text.toLowerCase() + " ";
  const models = window.atmosPsycheBasic || [];
  const endings = window.atmosPsycheEndings || [''];
  const negations = window.atmosPsycheNegations || ['не ', 'без '];

  const modelEntries = new Map();

  for (const model of models) {
    const blacklist = (model.blacklist || []).map(b => b.toLowerCase());

    // ИЗРАЗИ
    if (model.phrases && model.phrases.length > 0) {
      for (const phrase of model.phrases) {
        if (psycheCheckPhrase(text, phrase)) {
          if (!modelEntries.has(model.id)) {
            modelEntries.set(model.id, {
              model: model, hits: 0,
              matchedPhrases: [], matchedWords: [], matchedStems: []
            });
          }
          const entry = modelEntries.get(model.id);
          entry.hits += 3;
          entry.matchedPhrases.push(phrase);
        }
      }
    }

    // ЦЕЛИ ДУМИ
    if (model.words && model.words.length > 0) {
      for (const word of model.words) {
        if (psycheCheckWord(text, word)) {
          const w = word.toLowerCase();
          const idx = lower.indexOf(w);
          const contextStart = Math.max(0, idx - 30);
          const contextEnd = Math.min(lower.length, idx + w.length + 30);
          const context = lower.substring(contextStart, contextEnd);
          const isBlacklisted = blacklist.some(b => context.includes(b));
          if (isBlacklisted) continue;

          const before = lower.substring(Math.max(0, idx - 20), idx);
          const isNegated = negations.some(n => before.endsWith(n));
          if (isNegated) continue;

          if (!modelEntries.has(model.id)) {
            modelEntries.set(model.id, {
              model: model, hits: 0,
              matchedPhrases: [], matchedWords: [], matchedStems: []
            });
          }
          const entry = modelEntries.get(model.id);
          entry.hits += 2;
          entry.matchedWords.push(word);
        }
      }
    }

    // ЯДРА
     if (model.stems && model.stems.length > 0) {
      const homonyms = (model.homonyms || []).map(h => h.toLowerCase());
      
      for (const stem of model.stems) {
        // Пропусни, ако stem е омоним
        if (homonyms.includes(stem.toLowerCase())) continue;
        
        const result = psycheCheckStem(text, stem, endings, negations, blacklist);
    if (result.found) {
          if (!modelEntries.has(model.id)) {
            modelEntries.set(model.id, {
              model: model, hits: 0,
              matchedPhrases: [], matchedWords: [], matchedStems: []
            });
          }
          const entry = modelEntries.get(model.id);
          entry.hits += result.positions.length;
          entry.matchedStems.push(stem);
        }
      }
    }
  }

  const found = [];
  for (const [id, entry] of modelEntries) {
    const rawWeight = entry.hits * entry.model.baseWeight;
    const weight = Math.min(10, rawWeight);
    const polarity = psycheDetectContextForModel(text, entry.model);

    const allMatched = [
      ...entry.matchedPhrases,
      ...entry.matchedWords,
      ...entry.matchedStems
    ].slice(0, 5);

    found.push({
      model: entry.model,
      id: entry.model.id,
      name: entry.model.name,
      group: entry.model.group,
      category: entry.model.category,
      imageKey: entry.model.imageKey,
      positiveImageKey: entry.model.positiveImageKey,
      hits: entry.hits,
      matchedWords: allMatched,
      matchedPhrases: entry.matchedPhrases,
      matchedWordsList: entry.matchedWords,
      matchedStems: entry.matchedStems,
      weight: weight,
      polarity: polarity,
      description: entry.model.description || "",
      positiveDescription: entry.model.positiveDescription || "",
      negativeDescription: entry.model.negativeDescription || "",
      advice: entry.model.advice || "",
      positiveAdvice: entry.model.positiveAdvice || "",
      negativeAdvice: entry.model.negativeAdvice || ""
    });
  }

  found.sort((a, b) => b.weight - a.weight);
  return found;
}

/* =========================================================
   КОМБИНИРАНИ
========================================================= */

function psycheActivateCombinedModels(basicModels, context) {
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

            const combImgKey = (window.atmosPsycheGroupToImage || {})[combo.group] || 'base_1';

      active.push({
        id: combo.id,
        name: combo.name,
        nameBg: combo.nameBg,
        group: combo.group,
        category: combo.category,
        weight: weight,
        matchedModels: matched,
        description: combo.description,
        advice: combo.advice,
        imageKey: combImgKey,
        positiveImageKey: null,
        type: 'combined'
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

    // Маркирай само съставните на ТОП комбиниран (първия)
  const topCombined = filtered[0];
  const subModelIds = new Set();
  if (topCombined) {
    for (const id of topCombined.matchedModels) {
      subModelIds.add(id);
    }
  }

  let standaloneBasic = basicModels.filter(m => !subModelIds.has(m.id));

  // === ФИЛТРИРАЙ ПО ПОЛЯРНОСТ ===
  const OPPOSITE_PAIRS = {
    'terrible_father': 'father_positive',
    'father_positive': 'terrible_father',
    'martyr': 'martyr_positive',
    'martyr_positive': 'martyr',
    'orphan': 'orphan_positive',
    'orphan_positive': 'orphan',
    'inferiority_feeling': 'inferiority_positive',
    'inferiority_positive': 'inferiority_feeling',
    'shadow': 'shadow_positive',
    'shadow_positive': 'shadow',
    'anima': 'anima_positive',
    'anima_positive': 'anima',
    'animus': 'animus_positive',
    'animus_positive': 'animus',
    'persona': 'persona_healthy',
    'persona_healthy': 'persona',
    'great_mother': 'great_mother_positive',
    'great_mother_positive': 'great_mother',
    'mana_persona': 'mana_persona_positive',
    'mana_persona_positive': 'mana_persona',
    'striving_superiority': 'striving_superiority_positive',
    'striving_superiority_positive': 'striving_superiority',
    'intercourse': 'intercourse_positive',
    'intercourse_positive': 'intercourse',
    'nudity': 'nudity_positive',
    'nudity_positive': 'nudity',
    'phallic': 'phallic_positive',
    'phallic_positive': 'phallic',
    'womb': 'womb_positive',
    'womb_positive': 'womb'
  };

  standaloneBasic = standaloneBasic.filter(m => {
    const oppositeId = OPPOSITE_PAIRS[m.id];
    if (!oppositeId) return true;

    const hasOpposite = basicModels.some(x => x.id === oppositeId);
    if (!hasOpposite) return true;

    if (context === 'positive') {
      return m.id.endsWith('_positive') || m.id === 'father_positive' || m.id === 'persona_healthy';
    }
    if (context === 'negative') {
      return !m.id.endsWith('_positive') && m.id !== 'father_positive' && m.id !== 'persona_healthy';
    }
    return true;
  });

  return {
    combined: filtered,
    standaloneBasic: standaloneBasic
  };
}

/* =========================================================
   ДОСТОВЕРНОСТ
========================================================= */

function psycheCalculateConfidence(text, basicModels, combinedModels) {
  const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;
  if (totalWords === 0) return 0;

  const allMatchedWords = new Set();
  for (const m of basicModels) {
    for (const w of (m.matchedWords || [])) {
      allMatchedWords.add(w.toLowerCase());
    }
  }
  const coverage = Math.min(1, allMatchedWords.size / Math.max(1, totalWords * 0.3));

  const totalWeight = basicModels.reduce((s, m) => s + m.weight, 0);
  const avgWeight = basicModels.length > 0 ? totalWeight / basicModels.length : 0;
  const strength = avgWeight / 10;

  const dominantScore = basicModels.length > 0 ? basicModels[0].weight / 10 : 0;

  let depthBonus = 0;
  if (combinedModels.length > 0) {
    const topCombined = combinedModels[0];
    depthBonus = Math.min(1, topCombined.matchedModels.length / 4);
  }

  const confidence = Math.min(100, Math.round(
    coverage * 40 + strength * 25 + dominantScore * 20 + depthBonus * 15
  ));

  return confidence;
}

/* =========================================================
   ИЗБОР НА СЛОЕВЕ
========================================================= */

function psycheSelectLayers(combined, standaloneBasic, questionText, context) {
  const rules = window.atmosPsycheImageRules || {};
  const sexualIds = rules.sexualModelIds || [];
  const images = window.atmosPsycheImages || {};
  const blendRules = window.atmosPsycheBlendRules || {};
  const tintRules = window.atmosPsycheTintRules || {};

  const allModels = [
    ...combined.map(c => ({ ...c, isCombined: true })),
    ...standaloneBasic.map(b => ({ ...b, isCombined: false }))
  ];

  const totalWeight = allModels.reduce((s, m) => s + m.weight, 0);
  if (totalWeight === 0) return { type: 'none', layers: [] };

  const top = allModels[0];
  const topRatio = top.weight / totalWeight;

  let selectedModels = [];
  if (topRatio >= 0.8) {
    selectedModels = [top];
  } else if (topRatio >= 0.5) {
    selectedModels = allModels.slice(0, 2);
  } else {
    selectedModels = allModels.slice(0, 4);
  }

  // Сексуален слой
  const sexualModels = allModels.filter(m => sexualIds.includes(m.id));
  let dominantSexual = null;
  let maxSW = 0;
  for (const m of sexualModels) {
    if (m.imageKey && images[m.imageKey] && m.weight > maxSW) {
      maxSW = m.weight;
      dominantSexual = m;
    }
  }

  const sexualWeight = dominantSexual ? dominantSexual.weight : 0;
  let sexualType = 'none';
  if (sexualWeight >= 8) sexualType = 'sexual_dominant';
  else if (sexualWeight >= 5) sexualType = 'sexual_visible';
  else if (sexualWeight >= 3) sexualType = 'sexual_overlay';

  // Слоеве
  const layers = selectedModels.map((m, i) => {
    let imgKey = m.imageKey || 'base_1';

    if (context === 'positive' && m.positiveImageKey) {
      imgKey = m.positiveImageKey;
    }

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
      weight: m.weight,
      isCombined: m.isCombined
    };
  });

  const topGroup = top ? top.group : 'jung_archetypes';
  const tint = tintRules[topGroup] || 'rgba(255, 255, 255, 0.05)';

  if (layers.length === 0) {
    if (combined.length > 0) {
      const topCombined = combined[0];
      const combImgKey = (window.atmosPsycheGroupToImage || {})[topCombined.group];
      if (combImgKey && images[combImgKey]) {
        layers.push({
          imageUrl: images[combImgKey],
          opacity: 1.0,
          blend: 'source-over',
          group: topCombined.group,
          modelName: topCombined.name,
          weight: topCombined.weight,
          isCombined: true
        });
      }
    }
  }

  let sexualImageUrl = null;
  if (dominantSexual) {
    const sexKey = 'sexual_' + dominantSexual.id;
    sexualImageUrl = images[sexKey] || null;
  }

  return {
    type: sexualType === 'sexual_dominant' ? 'sexual_dominant' :
          sexualType === 'sexual_visible' ? 'sexual_visible' :
          sexualType === 'sexual_overlay' ? 'overlay' : 'base',
    layers: layers,
    tint: tint,
    sexualRatio: dominantSexual ? sexualWeight / totalWeight : 0,
    dominantSexual: dominantSexual ? dominantSexual.id : null,
    sexualImageUrl: sexualImageUrl,
    sexualWeight: sexualWeight,
    dominantRatio: topRatio
  };
}

/* =========================================================
   АНАЛИЗ
========================================================= */

function psycheGenerateAnalysis(question, basicModels, combined, standaloneBasic, layerSelection, context) {
  let out = "";
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `🧠 ATMOS PSYCHE — АНАЛИЗ\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const shortQ = question.length > 150 ? question.substring(0, 150) + "..." : question;
  out += `📝 Разказ: „${shortQ}"\n\n`;

  const confidence = psycheCalculateConfidence(question, basicModels, combined);
  const confLabel = confidence >= 70 ? 'висока' : confidence >= 40 ? 'средна' : 'ниска';
  out += `📊 Сигурност на анализа: ${confidence}% (${confLabel})\n`;
  out += `🎭 Контекст: ${context === 'positive' ? 'положителен' : context === 'negative' ? 'отрицателен' : 'неутрален'}\n\n`;

  if (combined.length > 0) {
    out += `━━━ ОСНОВЕН ПРОФИЛ ━━━\n`;
    for (const m of combined.slice(0, 3)) {
      out += `⚠ ${m.name} (${m.weight}/10)\n`;
      out += `   Съставни: ${m.matchedModels.join(", ")}\n`;
    }
    out += `\n`;
  }

  if (standaloneBasic.length > 0) {
    out += `━━━ ПОДДЪРЖАЩИ МОДЕЛИ ━━━\n`;
    const topBasic = standaloneBasic.slice(0, 6);
    for (const m of topBasic) {
      const filled = Math.min(5, Math.max(0, Math.round(m.weight / 2)));
      const bar = "█".repeat(filled) + "░".repeat(5 - filled);
      const words = (m.matchedWords || []).slice(0, 2).join(", ");
      out += `${bar} ${m.name} (${m.weight}/10)${words ? ` — „${words}"` : ''}\n`;
    }
    out += `\n`;
  }

  out += `━━━ ОБОБЩЕНИЕ ━━━\n`;
  let summaryText = "";
  let adviceText = "";

  if (combined.length > 0) {
    summaryText = combined[0].description || "";
    adviceText = combined[0].advice || "";
  } else if (standaloneBasic.length > 0) {
    const m = standaloneBasic[0];
    const polarity = m.polarity || context;

    if (polarity === 'positive' && m.positiveDescription) {
      summaryText = m.positiveDescription;
      adviceText = m.positiveAdvice || m.advice;
    } else if (polarity === 'negative' && m.negativeDescription) {
      summaryText = m.negativeDescription;
      adviceText = m.negativeAdvice || m.advice;
    } else {
      summaryText = m.description || "";
      adviceText = m.advice || "";
    }
  }

  out += `${summaryText}\n\n`;

  out += `━━━ СЪВЕТ ━━━\n`;
  out += `${adviceText}\n`;

  if (layerSelection && layerSelection.sexualWeight >= 3) {
    const pct = Math.round(layerSelection.sexualRatio * 100);
    if (layerSelection.type === 'sexual_dominant') {
      out += `\n⚠ Сексуалният подтекст доминира (${pct}%).\n`;
    } else if (layerSelection.type === 'sexual_visible') {
      out += `\n⚠ Сексуален подтекст: ${pct}% от тежестта.\n`;
    } else if (layerSelection.type === 'overlay') {
      out += `\n⚠ Слаб сексуален подтекст: ${pct}%.\n`;
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
  return `ATMOS PSYCHE v4.0 — Психологически анализ

Базиран на: Фройд, Юнг, Адлер

Команди:
  /psyche <текст>   Анализирай текста
  /psyche share     Картинка с последния анализ

Пример:
  /psyche Сънувах, че влизам в стаята и пронизвам
          гардероба с огромен меч.

Системата разпознава 120+ психологически модела.`;
}

/* =========================================================
   ОСНОВНА
========================================================= */

async function psycheAnalyze(text) {
  if (!text || text.length < 10) {
    return "Error: Текстът трябва да е поне 10 символа.";
  }
  if (text.length > 3000) text = text.substring(0, 3000);

  text = psycheTransliterate(text);
  const context = psycheDetectContext(text);
  const basicModels = psycheFindBasicModels(text);
  if (basicModels.length === 0) {
    return `Не открих познати психологически модели.

Опитай с по-конкретен разказ — символи, образи, чувства.`;
  }

  const result = psycheActivateCombinedModels(basicModels, context);
  const combined = result.combined;
  const standaloneBasic = result.standaloneBasic;

  const layerSelection = psycheSelectLayers(combined, standaloneBasic, text, context);
  const analysis = psycheGenerateAnalysis(text, basicModels, combined, standaloneBasic, layerSelection, context);

  const dateStr = psycheGetDateStr();
  const id = psycheGenerateId(text);

  // Вземи summaryText и adviceText за картинката
  let summaryText = "";
  let adviceText = "";

  if (combined.length > 0) {
    summaryText = combined[0].description || "";
    adviceText = combined[0].advice || "";
  } else if (standaloneBasic.length > 0) {
    const m = standaloneBasic[0];
    const polarity = m.polarity || context;
    if (polarity === 'positive' && m.positiveDescription) {
      summaryText = m.positiveDescription;
      adviceText = m.positiveAdvice || m.advice;
    } else if (polarity === 'negative' && m.negativeDescription) {
      summaryText = m.negativeDescription;
      adviceText = m.negativeAdvice || m.advice;
    } else {
      summaryText = m.description || "";
      adviceText = m.advice || "";
    }
  }

  // ВАЖНО: Записваме САМО примитивни стойности в lastData
  const lastData = {
    type: 'psyche',
    question: text,
    id: id,
    date: dateStr,
    context: context,
    basic: basicModels.map(m => ({
      id: m.id,
      name: m.name,
      group: m.group,
      category: m.category,
      weight: m.weight,
      hits: m.hits,
      imageKey: m.imageKey,
      polarity: m.polarity,
      description: m.description,
      positiveDescription: m.positiveDescription,
      negativeDescription: m.negativeDescription,
      advice: m.advice,
      positiveAdvice: m.positiveAdvice,
      negativeAdvice: m.negativeAdvice
    })),
    combined: combined.map(m => ({
      id: m.id,
      name: m.name,
      group: m.group,
      category: m.category,
      weight: m.weight,
      description: m.description,
      advice: m.advice,
      matchedModels: m.matchedModels
    })),
    standaloneBasic: standaloneBasic.map(m => ({
      id: m.id,
      name: m.name,
      group: m.group,
      category: m.category,
      weight: m.weight,
      polarity: m.polarity,
      description: m.description,
      positiveDescription: m.positiveDescription,
      negativeDescription: m.negativeDescription,
      advice: m.advice,
      positiveAdvice: m.positiveAdvice,
      negativeAdvice: m.negativeAdvice
    })),
    layerSelection: layerSelection,
    summaryText: summaryText,
    adviceText: adviceText
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

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, S.bgTop);
  bgGrad.addColorStop(0.5, S.bgMid);
  bgGrad.addColorStop(1, S.bgBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(230, 245, 244, 0.06)";
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
  ctx.font = `bold 36px serif`;
  ctx.fillText("✦", 95, 95);
  ctx.fillText("✦", canvas.width - 95, 95);
  ctx.fillText("✦", 95, canvas.height - 95);
  ctx.fillText("✦", canvas.width - 95, canvas.height - 95);

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

  // ИЗОБРАЖЕНИЕ
  const imgY = 230;
  const imgMaxW = canvas.width - 200;
  const imgMaxH = 900;
  const imgLeftX = (canvas.width - imgMaxW) / 2;

  const sel = data.layerSelection || { type: 'none', layers: [] };
  let actualImgH = 0;
  let actualImgW = imgMaxW;
  let actualImgX = imgLeftX;

  if (sel.layers && sel.layers.length > 0) {
    const images = await Promise.all(
      sel.layers.map(l => psycheLoadImage(l.imageUrl).catch(() => null))
    );

    for (let i = 0; i < sel.layers.length; i++) {
      const layer = sel.layers[i];
      const img = images[i];
      if (!img) continue;

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

      if (i === 0) {
        actualImgH = dh;
        actualImgW = dw;
        actualImgX = dx;
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;

    if (sel.tint && actualImgH > 0) {
      ctx.fillStyle = sel.tint;
      ctx.fillRect(actualImgX, imgY, actualImgW, actualImgH);
    }
  }

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

  // Сексуален овърлей
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

  if (actualImgH > 0) {
    ctx.strokeStyle = S.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(actualImgX - 4, imgY - 4, actualImgW + 8, actualImgH + 8);
  }

  // МОДЕЛИ
  let yCursor = imgY + actualImgH + 60;
  const maxModels = 6;

  const displayModels = [];

  if (data.combined && data.combined.length > 0) {
    for (const c of data.combined) {
      displayModels.push({
        name: '⚠ ' + c.name,
        weight: c.weight,
        category: c.category
      });
    }
  }

  if (data.standaloneBasic && data.standaloneBasic.length > 0) {
    for (const s of data.standaloneBasic) {
      if (displayModels.length >= maxModels) break;
      const basicModel = (data.basic || []).find(b => b.id === s.id);
      displayModels.push({
        name: s.name,
        weight: s.weight,
        category: basicModel ? basicModel.category : s.category
      });
    }
  }

  const basic = displayModels.slice(0, maxModels);

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

  // ОБОБЩЕНИЕ
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

  const summaryText = data.summaryText || "";
  const sumLines = psycheWrapText(ctx, summaryText, canvas.width - 220, 5);
  sumLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, yCursor + i * 32);
  });
  yCursor += sumLines.length * 32 + 30;

  // СЪВЕТ
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

    const adviceText = data.adviceText || "";
    const advLines = psycheWrapText(ctx, adviceText, canvas.width - 220, 4);
    advLines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, yCursor + i * 32);
    });
  }

  // FOOTER
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

     if (window.__isOraclePage) {
    window.__oracleLastImage = imageBase64;
    return;
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

  const context = psycheDetectContext(text);
  const basicModels = psycheFindBasicModels(text);
  const result = psycheActivateCombinedModels(basicModels, context);

  let out = `━━━ DEBUG: НАМЕРЕНИ МОДЕЛИ ━━━\n`;
  out += `Контекст (глобален): ${context}\n\n`;

  if (basicModels.length === 0) {
    out += `Няма намерени модели.\n`;
  } else {
    for (const m of basicModels.slice(0, 20)) {
      out += `${m.name} (${m.weight}/10, ${m.hits} hits)\n`;
      out += `  Полярност: ${m.polarity}\n`;
      out += `  Думи: ${m.matchedWords.join(", ")}\n`;
      out += `  Изрази: ${m.matchedPhrases.join(", ") || "—"}\n`;
      out += `  Ядра: ${m.matchedStems.join(", ") || "—"}\n`;
      out += `  ImageKey: ${m.imageKey || "—"}\n`;
      out += `  Group: ${m.group}\n\n`;
    }
  }

  if (result.combined.length > 0) {
    out += `━━━ КОМБИНИРАНИ ━━━\n`;
    for (const c of result.combined) {
      out += `${c.name} (${c.weight}/10)\n`;
      out += `  Съставни: ${c.matchedModels.join(", ")}\n\n`;
    }
  }

  if (result.standaloneBasic.length > 0) {
    out += `━━━ STANDALONE ━━━\n`;
    for (const s of result.standaloneBasic) {
      out += `${s.name} (${s.weight}/10, ${s.polarity})\n`;
    }
  }

  return out;
}