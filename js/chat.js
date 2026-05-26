
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
   EMOTICON CONVERTER
=========================== */

function convertEmotes(text) {
  const emotes = {
    ";(": "&#128546;", ";-(": "&#128546;", ":(": "&#9785;&#65039;", ":-(": "&#9785;&#65039;",
    ":)": "&#128578;", ":-)": "&#128578;", ":D": "&#128513;", ":-D": "&#128513;",
    "<3": "&#10084;&#65039;", ":P": "&#128539;", ":-P": "&#128539;", ":O": "&#128558;",
    ":-O": "&#128558;", ";)": "&#128521;", ";-)": "&#128521;"
  };

  for (const key in emotes) {
    text = text.replaceAll(key, emotes[key]);
  }
  return text;
}

/* ===========================
   IRC MESSAGE FORMATTER
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

/* ===========================
   SEND MESSAGE
=========================== */

function sendChatMessage(text) {
  db.ref("atmos_chat").push({
    name: getNickname(),
    text: text,
    timestamp: Date.now(),
    room: "main"
  });
}

function sendPrivateMessage(to, text) {
  db.ref("atmos_chat").push({
    name: getNickname(),
    text: text,
    timestamp: Date.now(),
    room: "main",
    private: true,
    to: to
  });
}

function sendRoomMessage(roomName, text) {
  db.ref("atmos_chat").push({
    name: getNickname(),
    text: text,
    timestamp: Date.now(),
    room: roomName
  });
}

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

/* ===========================
   LISTEN FOR NEW MESSAGES
=========================== */

function listenForMessages() {
  isInitialLoading = true;

  const chatQuery = db.ref("atmos_chat").limitToLast(500);

  chatQuery.once("value", () => {
    isInitialLoading = false;
  });

  chatQuery.on("child_added", snapshot => {
    const msg = snapshot.val();
    if (!shouldDisplayMessage(msg)) return;

    const isPrivate = msg.private === true;
    const room = msg.room || "main";

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

    const text = formatMessage(msg);
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

  document.addEventListener("click", enableSoundOnce, { once: true });
  document.addEventListener("keydown", enableSoundOnce, { once: true });

  function enableSoundOnce() {
    const snd = document.getElementById("notifySound");
    if (snd) snd.play().catch(() => {});
  }
});

