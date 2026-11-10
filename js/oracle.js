/* =========================================================
   ATMOS ORACLE — Friendly UI за всички оракули
========================================================= */
window.__isOraclePage = true;

/* ---------- PROFILE ---------- */
function oracleLoadProfile() {
  try { return JSON.parse(localStorage.getItem('atmos_profile') || '{}'); }
  catch (e) { return {}; }
}
function oracleSaveProfileField(slot, name, date) {
  const p = oracleLoadProfile();
  p[slot] = { name, date };
  localStorage.setItem('atmos_profile', JSON.stringify(p));
}
function oracleSyncProfiles() {
  const p = oracleLoadProfile();
  const syncOne = function(slot, key) {
    if (!p[slot] || !p[slot].name || !p[slot].date) return;
    try {
      const parsed = numParseNameAndDate(p[slot].name + ' ' + p[slot].date);
      if (!parsed.ok) return;
      numSaveProfile(key, {
        name: parsed.name, date: parsed.date,
        day: parsed.day, month: parsed.month, year: parsed.year,
        savedAt: Date.now()
      });
    } catch (e) {}
  };
  syncOne('me', 'atmos_numerology_me');
  syncOne('you', 'atmos_numerology_you');
}

/* ---------- CONFIG ---------- */
const ORACLE_CONFIG = {
  tarot: {
    icon: '🎴', name: 'Таро',
    commands: [
      { label: '🃏 Тегли 1 карта (в main чата)', exec: () => tarotSingle() },
      { label: '🖼️ Тегли 1 карта (картинка)', exec: () => generateTarotCard() },
      { label: '3 карти (минало/настояще/бъдеще)', askQuestion: true, exec: q => tarotRead(`/tarot read ${q}`) },
      { label: 'Любов (ти/партньор/връзка)', askQuestion: true, exec: q => tarotRead(`/tarot read love ${q}`) },
      { label: 'Кръстопът (4 карти)', askQuestion: true, exec: q => tarotRead(`/tarot read cross ${q}`) },
      { label: '5 карти (дълбоко)', askQuestion: true, exec: q => tarotRead(`/tarot read 5 ${q}`) },
      { label: '🖼️ Картинка на последното четене', exec: () => tarotReadShare() }
    ]
  },
  runes: {
    icon: 'ᚠ', name: 'Руни',
    commands: [
      { label: 'ᚠ Тегли 1 руна (в main чата)', exec: () => runeSingle() },
      { label: '🖼️ Тегли 1 руна (картинка)', exec: () => generateRuneCard() },
      { label: '3 руни (минало/настояще/бъдеще)', askQuestion: true, exec: q => runesRead(`/runes read ${q}`) },
      { label: 'Кръстът на Один (5 руни)', askQuestion: true, exec: q => runesRead(`/runes read odin ${q}`) },
      { label: 'Мьолнир (3 руни)', askQuestion: true, exec: q => runesRead(`/runes read hammer ${q}`) },
      { label: 'Рунически кръст (4 руни)', askQuestion: true, exec: q => runesRead(`/runes read cross ${q}`) },
      { label: 'Рунен кръг (12 руни)', askQuestion: true, exec: q => runesRead(`/runes read wheel ${q}`) },
      { label: '🖼️ Картинка на последното четене', exec: () => runesReadShare() }
    ]
  },
  ogham: {
    icon: 'ᚁ', name: 'Огхам',
    commands: [
      { label: 'ᚁ Тегли 1 буква (в main чата)', exec: () => oghamSingle() },
      { label: '🖼️ Тегли 1 буква (картинка)', exec: () => generateOghamCard() },
      { label: '3 дървета (минало/настояще/бъдеще)', askQuestion: true, exec: q => oghamRead(`/ogham read ${q}`) },
      { label: 'Пътят на друида (3)', askQuestion: true, exec: q => oghamRead(`/ogham read druid ${q}`) },
      { label: 'Свещената гора (5)', askQuestion: true, exec: q => oghamRead(`/ogham read grove ${q}`) },
      { label: 'Дървесен кръст (4)', askQuestion: true, exec: q => oghamRead(`/ogham read cross ${q}`) },
      { label: '🖼️ Картинка на последното четене', exec: () => oghamReadShare() }
    ]
  },
  lenormand: {
    icon: '🃏', name: 'Ленорман',
    commands: [
      { label: '🃏 Случайна карта (в main чата)', exec: () => lenormandRandom() },
      { label: '🖼️ Случайна карта (картинка)', exec: () => lenormandShare() },
      { label: '🔍 Конкретна карта (номер/име)', askQuestion: true, questionLabel: 'Номер (1-36) или име', exec: q => lenormandShowCard(q) },
      { label: '3 карти (четене)', askQuestion: true, exec: q => lenormandRead(q) },
      { label: 'Grand Tableau (жена)', askQuestion: true, exec: q => lenormandGrand('woman', q) },
      { label: 'Grand Tableau (мъж)', askQuestion: true, exec: q => lenormandGrand('man', q) },
      { label: '🖼️ Картинка на последното четене', exec: () => lenormandReadShare() },
      { label: '🖼️ Картинка на последния Grand', exec: () => lenormandGrandShare() }
    ]
  },
  numerology: {
    icon: '🔢', name: 'Нумерология',
    commands: [
      { label: 'Пълен анализ (мой)', exec: () => {
        oracleSyncProfiles();
        if (!localStorage.getItem('atmos_numerology_me')) return '⚠️ Попълни име и дата в лявата лента.';
        return numerologyMessage('/num');
      }},
      { label: 'Любовна съвместимост', exec: () => {
        oracleSyncProfiles();
        if (!localStorage.getItem('atmos_numerology_me')) return '⚠️ Попълни своите данни.';
        if (!localStorage.getItem('atmos_numerology_you')) return '⚠️ Попълни и втория човек.';
        return numerologyMessage('/num love');
      }},
      { label: 'Бизнес съвместимост', exec: () => {
        oracleSyncProfiles();
        if (!localStorage.getItem('atmos_numerology_me')) return '⚠️ Попълни своите данни.';
        if (!localStorage.getItem('atmos_numerology_you')) return '⚠️ Попълни и втория човек.';
        return numerologyMessage('/num biz');
      }},
      { label: 'Приятелска съвместимост', exec: () => {
        oracleSyncProfiles();
        if (!localStorage.getItem('atmos_numerology_me')) return '⚠️ Попълни своите данни.';
        if (!localStorage.getItem('atmos_numerology_you')) return '⚠️ Попълни и втория човек.';
        return numerologyMessage('/num friend');
      }},
      { label: 'Личен ден', exec: () => {
        oracleSyncProfiles();
        if (!localStorage.getItem('atmos_numerology_me')) return '⚠️ Попълни своите данни.';
        return numerologyMessage('/num today');
      }},
      { label: '🖼️ Картинка на последното', exec: () => numShare() },
      { label: 'Изтрий моя профил', exec: () => {
        numClearProfile('atmos_numerology_me');
        return '✅ Твоят профил е изтрит.';
      }},
      { label: 'Изтрий втория профил', exec: () => {
        numClearProfile('atmos_numerology_you');
        return '✅ Вторият профил е изтрит.';
      }}
    ]
  },
  chakras: {
    icon: '🕉', name: 'Чакри',
    commands: [
      { label: 'Списък на 7-те чакри', exec: () => chakrasMessage('/chakras') },
      { label: 'Инфо за чакра', askQuestion: true, questionLabel: 'Име (напр. anahata, 4, heart)', exec: q => chakrasMessage(`/chakras ${q}`) },
      { label: 'Практика по тема', askQuestion: true, questionLabel: 'Тема (напр. love, protection)', exec: q => chakrasMessage(`/chakras practice ${q}`) },
      { label: 'Чакра на деня', exec: () => chakrasMessage('/chakras today') },
      { label: 'Личен профил', exec: () => {
        oracleSyncProfiles();
        const me = JSON.parse(localStorage.getItem('atmos_numerology_me') || 'null');
        if (!me) return '⚠️ Попълни име и дата в лявата лента.';
        return chakrasMessage(`/chakras me ${me.name} ${me.date}`);
      }},
      { label: '🖼️ Картинка на последното', exec: () => chakraShare() },
      { label: 'Изтрий личния профил', exec: () => {
        try { localStorage.removeItem('atmos_chakras_me'); } catch (e) {}
        return '✅ Личният профил е изтрит.';
      }}
    ]
  },
  sigil: {
    icon: '✡', name: 'Сигил',
    commands: [
      { label: 'Генерирай сигил', askQuestion: true, questionLabel: 'Намерение', exec: q => sigilGenerate(q, false) },
      { label: 'Обратен сигил (за отблъскване)', askQuestion: true, questionLabel: 'Намерение', exec: q => sigilGenerate(q, true) },
      { label: 'Случаен Goetia демон (в main)', exec: () => sigilGoetiaRandom() },
      { label: '🖼️ Случаен Goetia (картинка)', exec: () => sigilGoetiaShare() },
      { label: 'Инфо за Goetia демон', askQuestion: true, questionLabel: 'Име (напр. bael, paimon)', exec: q => sigilGoetiaShow(q) },
      { label: '🖼️ Повтори последния сигил', exec: () => sigilShare() }
    ]
  },
  fortune: {
    icon: '🎲', name: 'Късмет',
    commands: [
      { label: '🎲 Изтегли късметче (в main чата)', exec: () => fortuneMessage('/fortune') },
      { label: '🖼️ Генерирай картинка на късметче', exec: () => fortuneMessage('/fortune share') }
    ]
  },
  mantra: {
    icon: 'ॐ', name: 'Мантри',
    commands: [
      { label: 'ॐ Случайна мантра (в main чата)', exec: () => mantraRandom() },
      { label: '🖼️ Случайна мантра (картинка)', exec: () => mantraShare() },
      { label: 'Инфо за мантра', askQuestion: true, questionLabel: 'Име (напр. om, gayatri)', exec: q => mantraShowByName(q) },
      { label: 'Практика по тема', askQuestion: true, questionLabel: 'Тема (напр. love, healing)', exec: q => mantraPractice(q) },
      { label: 'Списък с теми', exec: () => mantraShowThemes() }
    ]
  },
  psyche: {
    icon: '🧠', name: 'Психология',
    commands: [
      { label: 'Анализирай текст', askQuestion: true, questionLabel: 'Разказ / сън / текст', isTextarea: true, exec: async q => {
        if (!q || q.length < 10) return '⚠️ Текстът трябва да е поне 10 символа.';
        return await psycheAnalyze(q);
      }},
      { label: '🖼️ Картинка на последния анализ', exec: () => psycheShare() }
    ]
  }
};

let currentOracle = null;

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', function() {
  const p = oracleLoadProfile();
  if (p.me) {
    document.getElementById('meName').value = p.me.name || '';
    document.getElementById('meDate').value = p.me.date || '';
  }
  if (p.you) {
    document.getElementById('youName').value = p.you.name || '';
    document.getElementById('youDate').value = p.you.date || '';
  }
  document.getElementById('meName').addEventListener('input', e => oracleSaveProfileField('me', e.target.value, document.getElementById('meDate').value));
  document.getElementById('meDate').addEventListener('input', e => oracleSaveProfileField('me', document.getElementById('meName').value, e.target.value));
  document.getElementById('youName').addEventListener('input', e => oracleSaveProfileField('you', e.target.value, document.getElementById('youDate').value));
  document.getElementById('youDate').addEventListener('input', e => oracleSaveProfileField('you', document.getElementById('youName').value, e.target.value));

  const tabs = document.getElementById('oracleTabs');
  Object.keys(ORACLE_CONFIG).forEach(function(key) {
    const cfg = ORACLE_CONFIG[key];
    const btn = document.createElement('button');
    btn.textContent = cfg.icon + ' ' + cfg.name;
    btn.dataset.key = key;
    btn.addEventListener('click', function() { oracleSelect(key); });
    tabs.appendChild(btn);
  });

  document.getElementById('oracleGenerateBtn').addEventListener('click', oracleExecute);
  document.getElementById('oraclePublishBtn').addEventListener('click', function() {
    if (typeof window.__oracleLastPush === 'function') {
      window.__oracleLastPush();
      window.__oracleLastPush = null;
      this.style.display = 'none';
      this.disabled = true;
    }
  });

  oracleSelect('tarot');
});

/* ---------- SELECT ---------- */
function oracleSelect(key) {
  currentOracle = key;
  document.querySelectorAll('#oracleTabs button').forEach(function(b) {
    b.classList.toggle('active', b.dataset.key === key);
  });
  const cfg = ORACLE_CONFIG[key];
  const form = document.getElementById('oracleForm');
  let html = '<label>Команда:<select id="o-command">';
  cfg.commands.forEach(function(c, i) {
    html += '<option value="' + i + '"' + (i === 0 ? ' selected' : '') + '>' + c.label + '</option>';
  });
  html += '</select></label>';
  form.innerHTML = html;

  const qWrap = document.createElement('div');
  qWrap.id = 'o-question-wrap';
  qWrap.style.marginTop = '10px';
  form.appendChild(qWrap);

  updateQuestionField();
  document.getElementById('o-command').addEventListener('change', updateQuestionField);

  document.getElementById('oracleResult').style.display = 'none';
}

function updateQuestionField() {
  const wrap = document.getElementById('o-question-wrap');
  const idx = parseInt(document.getElementById('o-command').value);
  const cmd = ORACLE_CONFIG[currentOracle].commands[idx];
  wrap.innerHTML = '';
  if (cmd.askQuestion) {
    const label = document.createElement('label');
    label.textContent = cmd.questionLabel || 'Въпрос';
    const input = cmd.isTextarea ? document.createElement('textarea') : document.createElement('input');
    input.id = 'o-question';
    input.placeholder = cmd.isTextarea ? 'Опиши...' : 'Въведи...';
    label.appendChild(input);
    wrap.appendChild(label);
  }
}

/* ---------- EXECUTE ---------- */
async function oracleExecute() {
  if (!currentOracle) return;
  const cfg = ORACLE_CONFIG[currentOracle];
  const idx = parseInt(document.getElementById('o-command').value);
  const cmd = cfg.commands[idx];
  const q = (document.getElementById('o-question') ? document.getElementById('o-question').value : '').trim();

  const btn = document.getElementById('oracleGenerateBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Изпълнение...';

  const _img = document.getElementById('oracleResultImage');
  if (_img) { _img.src = ''; _img.style.display = 'none'; }
  const _dl = document.getElementById('oracleDownloadBtn');
  if (_dl) { _dl.style.display = 'none'; _dl.removeAttribute('onclick'); }

  window.__oracleLastImage = undefined;
  window.__oracleLastPush = null;

  let result = '';
  try {
    result = await cmd.exec(q);
  } catch (e) {
    result = '❌ Грешка: ' + (e.message || e);
  }

  if (window.__oracleLastImage === undefined) {
    for (let i = 0; i < 40; i++) {
      if (window.__oracleLastImage !== undefined) break;
      await new Promise(function(r) { setTimeout(r, 100); });
    }
  }

  let resultText = '';
  if (result === undefined || result === null) {
    resultText = window.__oracleLastImage ? '✅ Картинката е готова.' : '⚠️ Няма резултат.';
  } else if (typeof result === 'string' && result.indexOf('data:image/') === 0) {
    resultText = '✅ Картинката е готова.';
  } else {
    resultText = String(result);
  }

  document.getElementById('oracleResultText').textContent = resultText;
  document.getElementById('oracleResult').style.display = 'block';

  const img = document.getElementById('oracleResultImage');
  const dl = document.getElementById('oracleDownloadBtn');
  if (window.__oracleLastImage) {
    img.src = window.__oracleLastImage;
    img.style.display = 'block';
    dl.style.display = 'inline-block';
    dl.onclick = function(e) {
      e.preventDefault();
      if (typeof window.openAtmosLink === 'function') {
        window.openAtmosLink('https://tinyurl.com/bmnrux6t');
      } else {
        window.open('https://tinyurl.com/bmnrux6t', '_blank');
      }
    };
  } else {
    img.style.display = 'none';
    img.src = '';
    dl.style.display = 'none';
  }

  const pub = document.getElementById('oraclePublishBtn');
  if (typeof window.__oracleLastPush === 'function') {
    pub.style.display = 'inline-block';
    pub.disabled = false;
    pub.textContent = '📢 Публикувай в Atmos';
  } else {
    pub.style.display = 'none';
  }

  btn.disabled = false;
  btn.textContent = '✨ Изпълни';
}