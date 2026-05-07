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

/* ===========================
   EMOTICON CONVERTER
=========================== */

function convertEmotes(text) {
  const emotes = {
    ";(": "😢",
    ";-(": "😢",
    ":(": "☹️",
    ":-(": "☹️",
    ":)": "🙂",
    ":-)": "🙂",
    ":D": "😁",
    ":-D": "😁",
    "<3": "❤️",
    ":P": "😛",
    ":-P": "😛",
    ":O": "😮",
    ":-O": "😮",
    ";)": "😉",
    ";-)": "😉"
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

  const cleanText = convertEmotes(msg.text);

  const safeName = msg.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeText = cleanText.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `[${time}] &lt;${safeName}&gt; ${safeText}`;
}

/* ===========================
   DISPLAY MESSAGE
=========================== */

function appendMessage(text, isPrivate = false) {
  const messages = document.getElementById("messages");

  if (isPrivate) {
    messages.innerHTML += `<span class="privateMsg">${text}</span>\n`;
  } else {
    messages.innerHTML += text + "\n";
  }

  messages.scrollTop = messages.scrollHeight;
}

/* ===========================
   SEND MESSAGE
=========================== */

function sendChatMessage(text) {
  const msg = {
    name: getNickname(),
    text: text,
    timestamp: Date.now(),
    room: "main"
  };

  db.ref("atmos_chat").push(msg);
}

function sendPrivateMessage(to, text) {
  const msg = {
    name: getNickname(),
    text: text,
    timestamp: Date.now(),
    room: "main",
    private: true,
    to: to
  };

  db.ref("atmos_chat").push(msg);
}

/* ===========================
   LISTEN FOR NEW MESSAGES
=========================== */

function listenForMessages() {
  console.log("Listener started");

  db.ref("atmos_chat")
  .limitToLast(500)
  .on("child_added", snapshot => {
    const msg = snapshot.val();
    if (!msg) return;

    // PRIVATE FILTER
    if (msg.private === true && msg.to !== getNickname()) {
      return;
    }

    if (document.hidden && !notificationsMuted) {
    notifyNewMessage();
    playNotifySound();
    navigator.vibrate(1000);
}
    appendMessage(formatMessage(msg), msg.private);
  });
}

/* ===========================
   NOTIFICATIONS
=========================== */

function playNotifySound() {
  const snd = document.getElementById("notifySound");
  snd.currentTime = 0;
  snd.play().catch(() => {});
}

let unread = 0;

function notifyNewMessage() {
  unread++;
  document.title = `(${unread}) Atmos — дигитална свободна зона`;
}

window.addEventListener("focus", () => {
  unread = 0;
  document.title = "Atmos — дигитална свободна зона";
});

/* ===========================
   INIT
=========================== */

document.addEventListener("DOMContentLoaded", () => {
  listenForMessages();
  document.addEventListener("click", enableSoundOnce, { once: true });
  document.addEventListener("keydown", enableSoundOnce, { once: true });
  let notificationsMuted = false;

  function enableSoundOnce() {
    const snd = document.getElementById("notifySound");
    snd.play().catch(() => {});
  }

});
