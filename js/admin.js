/* ===========================
   FIREBASE CONFIG
=========================== */

const firebaseConfig = {
  apiKey: "AIzaSyAGF9BsM0_OMADMYiTIpIFQ3rlWPQIcP-M",
  authDomain: "atoms-32b0d.firebaseapp.com",
  databaseURL: "https://atoms-32b0d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "atoms-32b0d",
  storageBucket: "atoms-32b0d.appspot.com",
  messagingSenderId: "358321648052",
  appId: "1:358321648052:web:2f58f230f8b1384121c2e1",
  measurementId: "G-MFJNLQMEH2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

/* ===========================
   HELPERS
=========================== */

function log(msg, isError = false) {
  const el = document.getElementById("adminStatus");
  if (!el) return;
  const time = new Date().toLocaleTimeString("bg-BG");
  el.innerHTML += `<br>[${time}] ${isError ? "❌ " : "✅ "}${msg}`;
  el.scrollTop = el.scrollHeight;
}

function logClear() {
  const el = document.getElementById("adminStatus");
  if (el) el.innerHTML = "";
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(2) + " MB";
}

/* ===========================
   LOGIN
=========================== */

function adminLogin() {
  const email = document.getElementById("adminEmail").value;
  const pass = document.getElementById("adminPass").value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      document.getElementById("loginStatus").textContent = "";
      loadStats();
    })
    .catch(() => {
      document.getElementById("loginStatus").textContent = "Грешен email или парола.";
    });
}

/* ===========================
   СТАТИСТИКА
=========================== */

async function loadStats() {
  const box = document.getElementById("statsBox");
  box.innerHTML = "⏳ Зареждане...";

  try {
    const snap = await db.ref("atmos_chat").once("value");
    const data = snap.val() || {};
    const keys = Object.keys(data);

    if (keys.length === 0) {
      box.innerHTML = "📭 Базата е празна.";
      return;
    }

    const byRoom = {};
    const byUser = {};
    let oldest = Infinity;
    let newest = 0;
    let oldestKey = null;
    let newestKey = null;

    keys.forEach(k => {
      const m = data[k];
      const room = m.room || "main";
      byRoom[room] = (byRoom[room] || 0) + 1;

      const user = m.name || "[unknown]";
      byUser[user] = (byUser[user] || 0) + 1;

      if (m.timestamp) {
        if (m.timestamp < oldest) { oldest = m.timestamp; oldestKey = k; }
        if (m.timestamp > newest) { newest = m.timestamp; newestKey = k; }
      }
    });

    const sizeBytes = JSON.stringify(data).length;

    // Топ 5 потребители
    const topUsers = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Стаи сортирани по брой
    const roomEntries = Object.entries(byRoom)
      .sort((a, b) => b[1] - a[1]);

    let html = "";
    html += `<div style="margin-bottom:12px;"><b>📊 Общо:</b> ${keys.length} съобщения • ${formatBytes(sizeBytes)}</div>`;

    if (oldestKey) {
      html += `<div style="margin-bottom:12px;"><b>🕐 Най-старо:</b> ${new Date(oldest).toLocaleString("bg-BG")}<br>`;
      html += `<b>🕐 Най-ново:</b> ${new Date(newest).toLocaleString("bg-BG")}</div>`;
    }

    html += `<div style="margin-bottom:12px;"><b>📡 По стаи:</b><br>`;
    roomEntries.forEach(([room, count]) => {
      html += `&nbsp;&nbsp;• #${room}: <b>${count}</b><br>`;
    });
    html += `</div>`;

    html += `<div><b>👤 Топ 5 потребители:</b><br>`;
    topUsers.forEach(([user, count]) => {
      html += `&nbsp;&nbsp;• ${user}: <b>${count}</b><br>`;
    });
    html += `</div>`;

    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = "❌ Грешка: " + e.message;
  }
}

/* ===========================
   ИЗТРИВАНЕ ПО СТАЯ
=========================== */

async function deleteRoom() {
  const room = prompt("Име на стая за изтриване (напр. tarot, main):");
  if (!room) return;

  if (!confirm(`Сигурен ли си? Ще изтриеш ВСИЧКИ съобщения от #${room}.`)) return;

  logClear();
  log(`Търся съобщения в #${room}...`);

  try {
    const snap = await db.ref("atmos_chat").orderByChild("room").equalTo(room).once("value");
    const data = snap.val() || {};
    const keys = Object.keys(data);

    if (keys.length === 0) {
      log(`Няма съобщения в #${room}.`);
      return;
    }

    log(`Намерени ${keys.length} съобщения. Изтриване...`);

    const updates = {};
    keys.forEach(k => { updates[k] = null; });
    await db.ref("atmos_chat").update(updates);

    log(`✅ Изтрити ${keys.length} съобщения от #${room}.`);
    loadStats();
  } catch (e) {
    log("Грешка: " + e.message, true);
  }
}

/* ===========================
   ИЗТРИВАНЕ ПО ПОТРЕБИТЕЛ
=========================== */

async function deleteUser() {
  const user = prompt("Ник на потребителя за изтриване:");
  if (!user) return;

  if (!confirm(`Сигурен ли си? Ще изтриеш ВСИЧКИ съобщения от "${user}".`)) return;

  logClear();
  log(`Търся съобщения от "${user}"...`);

  try {
    const snap = await db.ref("atmos_chat").orderByChild("name").equalTo(user).once("value");
    const data = snap.val() || {};
    const keys = Object.keys(data);

    if (keys.length === 0) {
      log(`Няма съобщения от "${user}".`);
      return;
    }

    log(`Намерени ${keys.length} съобщения. Изтриване...`);

    const updates = {};
    keys.forEach(k => { updates[k] = null; });
    await db.ref("atmos_chat").update(updates);

    log(`✅ Изтрити ${keys.length} съобщения от "${user}".`);
    loadStats();
  } catch (e) {
    log("Грешка: " + e.message, true);
  }
}

/* ===========================
   ИЗТРИВАНЕ ПО ДНИ
=========================== */

async function deleteOlderThan() {
  const days = parseInt(prompt("Изтрий съобщения по-стари от колко ДНИ? (напр. 30):"));
  if (!days || days <= 0) return;

  if (!confirm(`Сигурен ли си? Ще изтриеш съобщения по-стари от ${days} дни.`)) return;

  logClear();
  log(`Изчислявам cutoff...`);

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  log(`Cutoff: ${new Date(cutoff).toLocaleString("bg-BG")}`);

  try {
    const snap = await db.ref("atmos_chat").orderByChild("timestamp").endAt(cutoff).once("value");
    const data = snap.val() || {};
    const keys = Object.keys(data);

    if (keys.length === 0) {
      log(`Няма съобщения по-стари от ${days} дни.`);
      return;
    }

    log(`Намерени ${keys.length} съобщения. Изтриване...`);

    const updates = {};
    keys.forEach(k => { updates[k] = null; });
    await db.ref("atmos_chat").update(updates);

    log(`✅ Изтрити ${keys.length} стари съобщения.`);
    loadStats();
  } catch (e) {
    log("Грешка: " + e.message, true);
  }
}

/* ===========================
   ИЗТРИВАНЕ НА ЕДНО СЪОБЩЕНИЕ
=========================== */

async function deleteOne() {
  const key = prompt("Firebase ключ на съобщението за изтриване (напр. -NxAbCdEfGh):");
  if (!key) return;

  if (!confirm(`Сигурен ли си? Ще изтриеш съобщение с ключ "${key}".`)) return;

  logClear();
  try {
    await db.ref("atmos_chat/" + key).remove();
    log(`✅ Изтрито съобщение ${key}.`);
    loadStats();
  } catch (e) {
    log("Грешка: " + e.message, true);
  }
}

/* ===========================
   ИЗТРИВАНЕ НА ВСИЧКО
=========================== */

function deleteAll() {
  if (!confirm("⚠️ ТОВА ЩЕ ИЗТРИЕ ВСИЧКИ СЪОБЩЕНИЯ! Сигурен ли си?")) return;
  if (!confirm("⚠️ ПОСЛЕДНО ПРЕДУПРЕЖДЕНИЕ! Наистина ли?")) return;

  logClear();
  db.ref("atmos_chat").remove()
    .then(() => {
      log("✅ Всички съобщения са изтрити.");
      loadStats();
    })
    .catch(e => log("Грешка: " + e.message, true));
}

/* ===========================
   ЕФЕКТИ И BUFFER
=========================== */

function clearEffects() {
  if (!confirm("Изчисти всички ефекти (atmos_effects)?")) return;
  db.ref("atmos_effects").remove()
    .then(() => log("✅ Ефектите са изчистени."))
    .catch(e => log("Грешка: " + e.message, true));
}

function clearBuffer() {
  if (!confirm("Изчисти fortune_buffer?")) return;
  db.ref("fortune_buffer").remove()
    .then(() => log("✅ Buffer-ът е изчистен."))
    .catch(e => log("Грешка: " + e.message, true));
}

/* ===========================
   EXPORT / BACKUP
=========================== */

async function exportAll() {
  logClear();
  log("Сваляне на всички съобщения...");

  try {
    const snap = await db.ref("atmos_chat").once("value");
    const data = snap.val() || {};
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `atmos_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    log(`✅ Свалени ${Object.keys(data).length} съобщения.`);
  } catch (e) {
    log("Грешка: " + e.message, true);
  }
}

async function exportRoom() {
  const room = prompt("Коя стая да сваля? (напр. tarot)");
  if (!room) return;

  logClear();
  log(`Сваляне на #${room}...`);

  try {
    const snap = await db.ref("atmos_chat").orderByChild("room").equalTo(room).once("value");
    const data = snap.val() || {};

    if (Object.keys(data).length === 0) {
      log(`Няма съобщения в #${room}.`);
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `atmos_${room}_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    log(`✅ Свалени ${Object.keys(data).length} съобщения от #${room}.`);
  } catch (e) {
    log("Грешка: " + e.message, true);
  }
}

/* ===========================
   АВТО-REFRESH
=========================== */

let autoRefreshTimer = null;

function toggleAutoRefresh() {
  const btn = document.getElementById("autoRefreshBtn");
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
    btn.textContent = "▶️ Авто-refresh: ИЗКЛ";
  } else {
    autoRefreshTimer = setInterval(loadStats, 15000);
    btn.textContent = "⏸️ Авто-refresh: ВКЛ (15s)";
    loadStats();
  }
}

/* ===========================
   IMPORT / RESTORE
=========================== */

async function importAll() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    logClear();
    log(`📂 Файл: ${file.name} (${formatBytes(file.size)})`);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const keys = Object.keys(data);

      if (keys.length === 0) {
        log("Файлът е празен.", true);
        return;
      }

      // Питаме: merge или replace
      const replace = confirm(
        `Файлът съдържа ${keys.length} съобщения.\n\n` +
        `OK = ЗАМЕНИ всичко в базата с файла (ОПАСНО)\n` +
        `Cancel = ДОБАВИ само новите (merge)`
      );

      if (replace) {
        if (!confirm("⚠️ ТОВА ЩЕ ИЗТРИЕ ТЕКУЩАТА БАЗА И ЩЕ СЛОЖИ ФАЙЛА! Сигурен ли си?")) {
          log("Отказано.");
          return;
        }
        log("🗑️ Изтриване на текущите съобщения...");
        await db.ref("atmos_chat").remove();
        log("📤 Качване на новите...");
        await db.ref("atmos_chat").set(data);
        log(`✅ Заменени с ${keys.length} съобщения.`);
      } else {
        log("📤 Merge-ване...");
        await db.ref("atmos_chat").update(data);
        log(`✅ Добавени/обновени ${keys.length} съобщения.`);
      }

      loadStats();
    } catch (err) {
      log("Грешка: " + err.message, true);
      console.error(err);
    }
  };

  input.click();
}

async function importRoom() {
  const room = prompt("Към коя стая да кача съобщения? (напр. tarot, main)");
  if (!room) return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    logClear();
    log(`📂 Файл: ${file.name} → #${room}`);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const keys = Object.keys(data);

      if (keys.length === 0) {
        log("Файлът е празен.", true);
        return;
      }

      // Ако файлът е от export на стая — съобщенията вече имат room поле.
      // Ако е от export на всичко — също.
      // Но ако потребителят иска да ги премести в друга стая — питаме.
      const changeRoom = confirm(
        `Файлът съдържа ${keys.length} съобщения.\n\n` +
        `OK = ПРОМЕНИ room полето на "${room}" за всички\n` +
        `Cancel = Запази оригиналните room стойности`
      );

      if (changeRoom) {
        keys.forEach(k => {
          if (data[k] && typeof data[k] === "object") {
            data[k].room = room;
          }
        });
      }

      log("📤 Качване...");
      await db.ref("atmos_chat").update(data);
      log(`✅ Добавени ${keys.length} съобщения.`);
      loadStats();
    } catch (err) {
      log("Грешка: " + err.message, true);
    }
  };

  input.click();
}

async function importEffects() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    logClear();
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const keys = Object.keys(data);

      if (keys.length === 0) {
        log("Файлът е празен.", true);
        return;
      }

      if (!confirm(`Ще добавиш ${keys.length} ефекта. Продължаваме?`)) return;

      await db.ref("atmos_effects").update(data);
      log(`✅ Добавени ${keys.length} ефекта.`);
    } catch (err) {
      log("Грешка: " + err.message, true);
    }
  };

  input.click();
}

/* ===========================
   ТРИЕНЕ ПО ТЕКСТ (REGEX / KEYWORD)
=========================== */

async function deleteByText() {
  const pattern = prompt(
    "Търси в съобщенията (regex или просто текст):\n\n" +
    "Примери:\n" +
    "  спам\n" +
    "  https?://\\S+\n" +
    "  (купи|евтино|отстъпка)\n" +
    "  (?i)BADWORD"
  );
  if (!pattern) return;

  let useRegex = confirm(
    "Използвай го като REGEX?\n\n" +
    "OK = REGEX (сложни шаблони)\n" +
    "Cancel = ЧИСТ ТЕКСТ (търси буквално)"
  );

  let matcher;
  try {
    if (useRegex) {
      matcher = new RegExp(pattern, "i");
    } else {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      matcher = new RegExp(escaped, "i");
    }
  } catch (e) {
    alert("Невалиден regex: " + e.message);
    return;
  }

  logClear();
  log(`🔍 Търся "${pattern}" (${useRegex ? "regex" : "текст"})...`);

  try {
    const snap = await db.ref("atmos_chat").once("value");
    const data = snap.val() || {};
    const matched = [];

    Object.entries(data).forEach(([key, msg]) => {
      if (msg && msg.text && matcher.test(msg.text)) {
        matched.push({ key, msg });
      }
    });

    if (matched.length === 0) {
      log("Няма съвпадения.");
      return;
    }

    log(`Намерени ${matched.length} съобщения.`);

    // Покажи първите 5 като preview
    log("Примери:");
    matched.slice(0, 5).forEach(({ key, msg }) => {
      const preview = (msg.text || "").substring(0, 60);
      log(`  [${key}] ${msg.name}: ${preview}${msg.text.length > 60 ? "..." : ""}`);
    });

    if (!confirm(`Изтрий ${matched.length} съобщения?`)) {
      log("Отказано.");
      return;
    }

    const updates = {};
    matched.forEach(({ key }) => { updates[key] = null; });
    await db.ref("atmos_chat").update(updates);

    log(`✅ Изтрити ${matched.length} съобщения.`);
    loadStats();
  } catch (e) {
    log("Грешка: " + e.message, true);
  }
}

/* ===========================
   PREVIEW (без триене)
=========================== */

async function previewByText() {
  const pattern = prompt("Провери какво съдържа:");
  if (!pattern) return;

  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(escaped, "i");

  logClear();
  log(`👁 Преглед на съвпадения за "${pattern}"...`);

  try {
    const snap = await db.ref("atmos_chat").once("value");
    const data = snap.val() || {};
    const matched = [];

    Object.entries(data).forEach(([key, msg]) => {
      if (msg && msg.text && matcher.test(msg.text)) {
        matched.push({ key, msg });
      }
    });

    if (matched.length === 0) {
      log("Няма съвпадения.");
      return;
    }

    log(`Намерени ${matched.length} съобщения:`);
    matched.slice(0, 30).forEach(({ key, msg }) => {
      const time = new Date(msg.timestamp).toLocaleString("bg-BG");
      const room = msg.room || "main";
      log(`  [#${room}] [${time}] ${msg.name}: ${(msg.text || "").substring(0, 80)}`);
    });

    if (matched.length > 30) {
      log(`  ... и още ${matched.length - 30} съобщения.`);
    }
  } catch (e) {
    log("Грешка: " + e.message, true);
  }
}