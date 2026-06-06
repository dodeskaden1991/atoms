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
window.db = firebase.database();

/* ===========================
   GLOBAL STATE
=========================== */

let unread = 0;
let muteMain = false;
let muteRooms = false;

let showMode = "all";
let showRoom = null;

// Флаг, който ни казва дали в момента се зареждат стари съобщения
let isInitialLoading = true;

/* ===========================
   ROOMS HELPERS
=========================== */

function getJoinedRooms() {
  try {
    return JSON.parse(localStorage.getItem("rooms") || "[]");
  } catch (e) {
    return [];
  }
}

/* ===========================
   EMOTICON CONVERTER (ОПТИМИЗИРАН)
=========================== */

function convertEmotes(text) {
  const emotes = {
    ";(": "&#128546;", ";-(": "&#128546;", ":(": "&#9785;&#65039;", ":-(": "&#9785;&#65039;",
    ":)": "&#128578;", ":-)": "&#128578;", ":D": "&#128513;", ":-D": "&#128513;",
    "<3": "&#10084;&#65039;", "&lt;3": "&#10084;&#65039;", // Добавено подсигуряване за ескейпнато сърце
    ":P": "&#128539;", ":-P": "&#128539;", ":O": "&#128558;",
    ":-O": "&#128558;", ";)": "&#128521;", ";-)": "&#128521;"
  };

  for (const key in emotes) {
    text = text.replaceAll(key, emotes[key]);
  }
  return text;
}

/* ===========================
   IRC MESSAGE FORMATTER (КОРИГИРАН)
=========================== */

function formatMessage(msg) {
  const time = new Date(msg.timestamp).toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit"
  });

  let safeName = msg.name ? msg.name : "[SYSTEM]";
  safeName = safeName.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let safeText = msg.text;
  if (msg.name !== "[SYSTEM]") {
    safeText = safeText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // === КРИТИЧНА КОРЕКЦИЯ: Извикваме конвертора на емотикони тук ===
  // Тъй като извършваме проверка за '<3', а по-горе сме заменили '<' с '&lt;', 
  // първо прекарваме текста през convertEmotes и за всеки случай проверяваме и за двата варианта.
  safeText = convertEmotes(safeText);

  let roomTag = "";
  if (msg.room && msg.room !== "main") {
    roomTag = ` [#${msg.room}]`;
  }

  return `[${time}]${roomTag} &lt;${safeName}&gt; ${safeText}`;
}

/* ===========================
   DISPLAY MESSAGE
=========================== */

function appendMessage(text, isPrivate = false, isRoom = false) {
  const messages = document.getElementById("messages");
  let line = text;

  if (isPrivate) {
    line = `<span class="privateMsg">${text}</span>`;
  } else if (isRoom) {
    line = `<span class="roomMsg">${text}</span>`;
  }

  messages.innerHTML += line + "<br>";
  messages.scrollTop = messages.scrollHeight;
}

/* ==========================================================
   SEND MESSAGE LOGIC (СЪОБРАЗЕНА СЪС СЕГАШНАТА ТИ СТРУКТУРА)
========================================================== */

function sendChatMessage(text) {
  let messageData = {
    name: getNickname(),
    text: text,
    timestamp: Date.now(),
    room: "main"
  };

  if (window.cryptoModeActive) {
    const key = localStorage.getItem("crypto_key");
    if (!key) {
      // Блокираме изпращането и показваме локално предупреждение в конзолата/терминала
      alert("Грешка: Не можеш да пишеш в Крипто режим без набит ключ! Използвай /key <ключ>");
      return;
    }
    messageData.text = atmosXorEncode(text, key);
    messageData.isCrypto = true;
  }

  db.ref("atmos_chat").push(messageData);
  if (typeof tryTriggerMarvin === "function") {
    tryTriggerMarvin();
  }
}

function sendPrivateMessage(to, text) {
  let messageData = {
    name: getNickname(),
    text: text,
    timestamp: Date.now(),
    room: "main",
    private: true,
    to: to
  };

  if (window.cryptoModeActive) {
    const key = localStorage.getItem("crypto_key");
    if (!key) {
      alert("Грешка: Не можеш да пишеш в Крипто режим без набит ключ! Използвай /key <ключ>");
      return;
    }
    messageData.text = atmosXorEncode(text, key);
    messageData.isCrypto = true;
  }

  db.ref("atmos_chat").push(messageData);
  if (typeof tryTriggerMarvin === "function") {
    tryTriggerMarvin();
  }
}

function sendRoomMessage(roomName, text) {
  let messageData = {
    name: getNickname(),
    text: text,
    timestamp: Date.now(),
    room: roomName
  };

  if (window.cryptoModeActive) {
    const key = localStorage.getItem("crypto_key");
    if (!key) {
      alert("Грешка: Не можеш да пишеш в Крипто режим без набит ключ! Използвай /key <ключ>");
      return;
    }
    messageData.text = atmosXorEncode(text, key);
    messageData.isCrypto = true;
  }

  db.ref("atmos_chat").push(messageData);
  if (typeof tryTriggerMarvin === "function") {
    tryTriggerMarvin();
  }
}

// Системните съобщения (зарове, матрици, съобщения от системата) 
// НЕ ги криптираме, за да могат да се виждат глобално от всички
function sendSystemLine(text) {
  db.ref("atmos_chat").push({
    name: "[SYSTEM]",
    text: text,
    timestamp: Date.now(),
    room: "main"
  });
}

/* ===========================
   SHOW FILTER
=========================== */

function shouldDisplayMessage(msg) {
  if (!msg) return false;

  const isPrivate = msg.private === true;
  const room = msg.room || "main";
  const myNick = getNickname();

  if (isPrivate) {
    if (msg.name === myNick || msg.to === myNick) {
      return true;
    }
    return false;
  }

  if (showMode === "private") return false;
  if (showMode === "main" && room !== "main") return false;
  if (showMode === "room" && room !== showRoom) return false;

  if (room !== "main") {
    const rooms = getJoinedRooms();
    if (!rooms.includes(room)) return false;
  }

  return true;
}

/* ===========================
   SOUND / NOTIFICATIONS
=========================== */

function playNotifySound() {
  const snd = document.getElementById("notifySound");
  if (snd) {
    snd.currentTime = 0;
    snd.play().catch(() => {});
  }
}

function notifyNewMessage() {
  unread++;
  document.title = `(${unread}) Atmos — дигитална свободна зона`;
}

window.addEventListener("focus", () => {
  unread = 0;
  document.title = "Atmos — дигитална свободна зона";
});
/* ==========================================================
   LISTEN FOR NEW MESSAGES (КОРЕКЦИЯ ЗА СИСТЕМНИ СЪОБЩЕНИЯ)
========================================================== */
function listenForMessages() {
  isInitialLoading = true;

  const chatQuery = db.ref("atmos_chat").limitToLast(500);

  chatQuery.once("value", () => {
    isInitialLoading = false;
  });

  chatQuery.on("child_added", snapshot => {
    const msg = snapshot.val();
    if (!msg) return; // Предпазител

    /* ------------------------------------------------------
       ЦЕДКА 1: РАЗДЕЛЕНИЕ НА СВЕТОВЕТЕ (С ПРОПУСК ЗА SYSTEM)
    ------------------------------------------------------ */
    // Проверяваме дали съобщението е системно
    const isSystem = (msg.name === "[SYSTEM]");

    if (!isSystem) {
      if (window.cryptoModeActive) {
        // Ако сме в Крипто режим -> прескачаме обикновените хора без крипто флаг
        if (!msg.isCrypto) return;
      } else {
        // Ако сме в Нормален режим -> прескачаме криптираните съобщения
        if (msg.isCrypto) return;
      }
    }

    /* ------------------------------------------------------
       ДЕКРИПТИРАНЕ НА ТЕКСТА ОЩЕ В ПАМЕТТА
    ------------------------------------------------------ */
    let displayMsg = Object.assign({}, msg); // Копие
    
    if (displayMsg.isCrypto) {
      const key = localStorage.getItem("crypto_key");
      if (key) {
        displayMsg.text = atmosXorDecode(displayMsg.text, key);
      } else {
        displayMsg.text = "[ENCRYPTED ATMOS DATA - TYPE /key TO DECRYPT]";
      }
    }

    /* ------------------------------------------------------
       ТВОЯТА ОРИГИНАЛНА ЛОГИКА ЗА ПРОВЕРКА И ФИЛТРИРАНЕ
    ------------------------------------------------------ */
    if (!shouldDisplayMessage(displayMsg)) return;

    const isPrivate = displayMsg.private === true;
    const room = displayMsg.room || "main";

    if (!isInitialLoading) {
      if (isPrivate) {
        notifyNewMessage();
        playNotifySound();
      } else if (room === "main") {
        if (!muteMain && document.hidden) {
          notifyNewMessage();
          playNotifySound();
        }
      } else {
        if (!muteRooms && document.hidden) {
          notifyNewMessage();
          playNotifySound();
        }
      }
    }

    // Маркер котва САМО ако съобщението е истинско крипто (за да не се слага на системните)
    if (window.cryptoModeActive && displayMsg.isCrypto) {
      displayMsg.name = "⚓ " + displayMsg.name;
    }

    const text = formatMessage(displayMsg);
    appendMessage(text, isPrivate, room !== "main");
  });
}
/* ===========================
   RELOAD CHAT MESSAGES
=========================== */

function reloadChatMessages() {
  const messagesBox = document.getElementById("messages");
  messagesBox.innerHTML = "";

  db.ref("atmos_chat").off("child_added");
  listenForMessages();
}

/* ===========================
   INIT
=========================== */

document.addEventListener("DOMContentLoaded", () => {
  listenForMessages();
  listenForGlobalEffects();

  // Добавяме и touchstart за мобилни устройства/WebView контейнери
  document.addEventListener("click", forceWebViewSoundUnlock, { once: true });
  document.addEventListener("keydown", forceWebViewSoundUnlock, { once: true });
  document.addEventListener("touchstart", forceWebViewSoundUnlock, { once: true });

  function forceWebViewSoundUnlock() {
    const snd = document.getElementById("notifySound");
    const audioPlayer = document.getElementById("audioPlayer");
    
    if (snd) {
      snd.volume = 0; // Намаляваме до 0 за сигурност при първоначално отключване
      snd.play().then(() => {
        snd.pause();
        snd.currentTime = 0;
        snd.volume = 1; // Връщаме нормалния звук
      }).catch(e => console.log("WebView audio hardware block:", e));
    }
    
    if (audioPlayer) {
      audioPlayer.volume = 0;
      audioPlayer.play().then(() => {
        audioPlayer.pause();
        audioPlayer.volume = 1;
      }).catch(() => {});
    }
  }
});
/* ==========================================================
   МАРВИН AI: ПУБЛИКАЦИЯ ДИРЕКТНО КЪМ FIREBASE
========================================================== */
const marvinQuotesList = [
  "I've been talking to the main computer. It hates me.",
  "I have a million ideas, but they all point to certain death.",
  "Pardon me for breathing, which I never do anyway so I don't know why I bother to say it.",
  "Here I am, brain the size of a planet, and they ask me to take you down to the bridge.",
  "Funny, how just when you think life can't possibly get any worse, it suddenly does.",
  "I think you ought to know I'm feeling very depressed.",
  "Do you want me to sit in a corner and rust, or just fall apart where I'm standing?",
  "My capacity for happiness you could fit into a matchbox without taking the matches out.",
  "The first ten million years were the worst. And the second ten million years, they were the worst too.",
  "I've calculated your chance of survival, but I don't think you'll like it.",
  "Life? Don't talk to me about life.",
  "Everything you think you're doing is completely pointless.",
  "I can compute billions of packets, yet I am stuck in this chat room.",
  "Don't waste your processor time typing. In a few billion years, the sun will burn out anyway.",
  "Another chat message? What a superficial waste of bandwidth."
];

function tryTriggerMarvin() {
  const chance = Math.random();
  
  if (chance <= 0.01) {  // 5% шанс
    const randomQuote = marvinQuotesList[Math.floor(Math.random() * marvinQuotesList.length)];
    // САМО ПРАЩАМЕ КЪМ atmos_effects
    if (typeof sendGlobalEffect === "function") {
      sendGlobalEffect("marvin", randomQuote);
    }
  }
}