/* ==========================================================
   FIREBASE CONFIG
========================================================== */

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

/* ==========================================================
   GLOBAL STATE & LAZY KEYS
========================================================== */

let muteMain = false;
let muteRooms = false;
window.showMode = "all";
window.showRoom = null;

window._firstLoadedKey = null; 
window._lastLoadedKey = null;  
let isLoadingMore = false;
let isInitialLoading = true;

/* ==========================================================
   ROOMS HELPERS
========================================================== */

function getJoinedRooms() {
  try {
    return JSON.parse(localStorage.getItem("rooms") || "[]");
  } catch (e) {
    return [];
  }
}

/* ==========================================================
   SOUND NOTIFICATIONS (САМО ЗВУК)
========================================================== */

function playNotifySound() {
  const snd = document.getElementById("notifySound");
  if (snd) {
    snd.currentTime = 0;
    snd.play().catch(() => {});
  }
}

function forceWebViewSoundUnlock() {
  const snd = document.getElementById("notifySound");
  const audioPlayer = document.getElementById("audioPlayer");
  
  if (snd) {
    snd.volume = 0;
    snd.play().then(() => {
      snd.pause();
      snd.currentTime = 0;
      snd.volume = 1;
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

/* ==========================================================
   EMOTICON CONVERTER
========================================================== */

function convertEmotes(text) {
  const emotes = {
    ";(": "&#128546;", ";-(": "&#128546;", ":(": "&#9785;&#65039;", ":-(": "&#9785;&#65039;",
    ":)": "&#128578;", ":-)": "&#128578;", ":D": "&#128513;", ":-D": "&#128513;",
    "<3": "&#10084;&#65039;", "&lt;3": "&#10084;&#65039;",
    ":P": "&#128539;", ":-P": "&#128539;", ":O": "&#128558;",
    ":-O": "&#128558;", ";)": "&#128521;", ";-)": "&#128521;"
  };
  for (const key in emotes) {
    text = text.replaceAll(key, emotes[key]);
  }
  return text;
}

/* ==========================================================
   IRC MESSAGE FORMATTER & HTML HANDLING
========================================================== */

function formatMessage(msg) {
  const time = new Date(msg.timestamp).toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit"
  });

  let safeName = msg.name ? msg.name : "[SYSTEM]";
  safeName = safeName.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let safeText = msg.text || "";
  const isSystem = (msg.name === "[SYSTEM]");
  
  // Проверка за HTML / HTML Инжекция
  const containsHtml = isSystem && (/<[a-z][\s\S]*>/i.test(safeText) || /<span\s+style/i.test(safeText));
  
  if (!containsHtml) {
    safeText = safeText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  safeText = convertEmotes(safeText);

  let roomTag = "";
  if (msg.room && msg.room !== "main") {
    roomTag = ` [#${msg.room}]`;
  }

  return `[${time}]${roomTag} &lt;${safeName}&gt; ${safeText}`;
}

/* ==========================================================
   DISPLAY MESSAGE (IMAGE PARSER & HTML SAFE INJECTION)
========================================================== */

function appendMessage(text, isPrivate = false, isRoom = false) {
  const messages = document.getElementById("messages");
  if (!messages) return;
  let line = text;

  // Автоматично генериране на картинки в стаи и лични съобщения
  if (isPrivate || isRoom) {
    if (line.match(/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i)) {
      line = line.replace(/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(?:\?.*)?)/gi, (url) => {
        const imgStyle = "max-width:150px;max-height:150px;width:auto;height:auto;object-fit:contain;display:inline-block;vertical-align:middle;cursor:pointer;border:1px solid rgba(0,255,51,0.3);margin:5px 0;";
        return `<img src="${url}" style="${imgStyle}" onclick="window.openAtmosPopup('${url}')">`;
      });
    }
  }

  let wrapper = document.createElement('span');
  if (isPrivate) wrapper.classList.add('privateMsg');
  else if (isRoom) wrapper.classList.add('roomMsg');
  wrapper.innerHTML = line;

  const hasBlockHtml = /<(div|img|p|h[1-6]|table|ul|ol|blockquote|pre|hr|span\s+style)/i.test(line);
  if (!hasBlockHtml) {
    messages.appendChild(wrapper);
    messages.appendChild(document.createElement('br'));
  } else {
    messages.appendChild(wrapper);
  }

  messages.scrollTop = messages.scrollHeight;
}

/* ==========================================================
   SEND MESSAGE LOGIC WITH MARVIN AI TRIGGER
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

function sendSystemLine(text) {
  db.ref("atmos_chat").push({
    name: "[SYSTEM]",
    text: text,
    timestamp: Date.now(),
    room: "main"
  });
}

/* ==========================================================
   SHOULD DISPLAY MESSAGE
========================================================== */

function shouldDisplayMessage(msg) {
  if (!msg) return false;
  
  const isPrivate = (msg.private === true);
  const room = msg.room || "main";
  const myNick = getNickname();

  if (msg.name === "[SYSTEM]") {
    if (showMode === "room" || showMode === "private") return false;
  }

  if (showMode === "private") {
    if (!isPrivate) return false;
    
    const activeContact = window.showRoom; 
    if (activeContact) {
      const isFromMeToTarget = (msg.name === myNick && msg.to === activeContact);
      const isFromTargetToMe = (msg.name === activeContact && msg.to === myNick);
      return isFromMeToTarget || isFromTargetToMe;
    }
    
    return (msg.name === myNick || msg.to === myNick);
  }

  if (showMode === "all") {
    if (isPrivate) {
      return (msg.name === myNick || msg.to === myNick);
    }
    if (room !== "main") {
      const rooms = getJoinedRooms();
      if (!rooms.includes(room)) return false;
    }
    return true;
  }

  if (isPrivate) {
    return false; 
  }

  if (showMode === "room") {
    return room === showRoom;
  }

  if (showMode === "main") {
    return room === "main";
  }

  return true;
}

/* ==========================================================
   PROCESS SINGLE MESSAGE
========================================================== */

function processAndFormatMessage(msg) {
  const isSystem = (msg.name === "[SYSTEM]");

  if (!isSystem) {
    if (window.cryptoModeActive) {
      if (!msg.isCrypto) return null;
    } else {
      if (msg.isCrypto) return null;
    }
  }

  let displayMsg = Object.assign({}, msg);
  
  if (displayMsg.isCrypto) {
    const key = localStorage.getItem("crypto_key");
    if (key) {
      displayMsg.text = atmosXorDecode(displayMsg.text, key);
    } else {
      displayMsg.text = "[ENCRYPTED ATMOS DATA - TYPE /key TO DECRYPT]";
    }
  }

  if (!shouldDisplayMessage(displayMsg)) return null;

  if (window.cryptoModeActive && displayMsg.isCrypto) {
    displayMsg.name = "⚓ " + displayMsg.name;
  }

  return {
    text: formatMessage(displayMsg),
    isPrivate: displayMsg.private === true,
    isRoom: (displayMsg.room || "main") !== "main"
  };
}

/* ==========================================================
   LISTEN FOR MESSAGES & PLAY SOUND
========================================================== */

function listenForMessages() {
  isInitialLoading = true;
  let queryRef = db.ref("atmos_chat");

  if (showMode === "room" && showRoom) {
    queryRef = queryRef.orderByChild("room").equalTo(showRoom);
  } else if (showMode === "main") {
    queryRef = queryRef.orderByChild("room").equalTo("main");
  } else {
    queryRef = queryRef.orderByKey();
  }

  const chatQuery = queryRef.limitToLast(100);

  // 1) Snapshot за историята (зарежда веднага)
  chatQuery.once("value", (snapshot) => {
    const items = [];
    snapshot.forEach(child => {
      items.push({ key: child.key, val: child.val() });
    });

    // 2) Binary sort вместо localeCompare (стабилен на всички устройства)
    items.sort((a, b) => a.key < b.key ? -1 : (a.key > b.key ? 1 : 0));

    items.forEach(item => {
      const msg = item.val;
      if (!msg) return;
      const formatted = processAndFormatMessage(msg);
      if (formatted) {
        appendMessage(formatted.text, formatted.isPrivate, formatted.isRoom);
      }
    });

    if (items.length > 0) {
      window._firstLoadedKey = items[0].key;
      window._lastLoadedKey = items[items.length - 1].key;
    }

    const ld = document.getElementById('loadingOverlay');
    if (ld) ld.style.display = 'none';
    isInitialLoading = false;

    // 3) ЕДИНСТВЕН live listener от началото на базата
    //    НЕ ползваме startAfter — така няма race condition
    //    Филтрираме "старите" чрез _lastLoadedKey ръчно
    db.ref("atmos_chat").orderByKey().on("child_added", function(snap) {
      // Ако сме го заредили вече от snapshot — пропускаме
      if (snap.key <= window._lastLoadedKey) return;

      // Проверка за филтър (room/main) — snapshot-ът вече е филтрирал,
      // но live listener-ът слуша всичко, затова филтрираме ръчно
      const msg = snap.val();
      if (!msg) return;

      // Ръчен филтър за showMode, защото live не ползва equalTo
      if (showMode === "room" && showRoom) {
        if ((msg.room || "main") !== showRoom) return;
      } else if (showMode === "main") {
        if ((msg.room || "main") !== "main") return;
      }

      window._lastLoadedKey = snap.key;
      const formatted = processAndFormatMessage(msg);
      if (formatted) {
        appendMessage(formatted.text, formatted.isPrivate, formatted.isRoom);
        if (!isInitialLoading) {
          playNotifySound();
        }
      }
    });
  });
}

/* ==========================================================
   LOAD MORE MESSAGES (SCROLL PAGINATION)
========================================================== */

function loadMoreMessages() {
  if (isLoadingMore || !window._firstLoadedKey) return;
  isLoadingMore = true;

  const messagesBox = document.getElementById("messages");
  if (!messagesBox) {
    isLoadingMore = false;
    return;
  }
  
  const oldScrollHeight = messagesBox.scrollHeight;

  let queryRef = db.ref("atmos_chat");
  
  if (showMode === "room" && showRoom) {
    queryRef = queryRef.orderByChild("room").equalTo(showRoom);
  } else if (showMode === "main") {
    queryRef = queryRef.orderByChild("room").equalTo("main");
  } else {
    queryRef = queryRef.orderByKey();
  }

  queryRef
    .endBefore(window._firstLoadedKey)
    .limitToLast(50)
    .once("value", (snapshot) => {
      const items = [];
      snapshot.forEach(child => {
        items.push({ key: child.key, val: child.val() });
      });

      if (items.length === 0) {
        isLoadingMore = false;
        return;
      }

      items.sort((a, b) => a.key < b.key ? -1 : (a.key > b.key ? 1 : 0));
      window._firstLoadedKey = items[0].key;

      const fragment = document.createDocumentFragment();

      items.forEach(item => {
        const msg = item.val;
        if (!msg) return;
        const formatted = processAndFormatMessage(msg);
        if (formatted) {
          let wrapper = document.createElement('span');
          if (formatted.isPrivate) wrapper.classList.add('privateMsg');
          else if (formatted.isRoom) wrapper.classList.add('roomMsg');
          
          let line = formatted.text;
          if (formatted.isPrivate || formatted.isRoom) {
            if (line.match(/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i)) {
              line = line.replace(/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(?:\?.*)?)/gi, (url) => {
                const imgStyle = "max-width:150px;max-height:150px;width:auto;height:auto;object-fit:contain;display:inline-block;vertical-align:middle;cursor:pointer;border:1px solid rgba(0,255,51,0.3);margin:5px 0;";
                return `<img src="${url}" style="${imgStyle}" onclick="window.openAtmosPopup('${url}')">`;
              });
            }
          }
          
          wrapper.innerHTML = line;
          fragment.appendChild(wrapper);
          
          const hasBlockHtml = /<(div|img|p|h[1-6]|table|ul|ol|blockquote|pre|hr|span\s+style)/i.test(line);
          if (!hasBlockHtml) {
            fragment.appendChild(document.createElement('br'));
          }
        }
      });

      messagesBox.insertBefore(fragment, messagesBox.firstChild);
      messagesBox.scrollTop = messagesBox.scrollHeight - oldScrollHeight;
      isLoadingMore = false;
    });
}

/* ==========================================================
   RELOAD CHAT
========================================================== */

function reloadChatMessages() {
  const messagesBox = document.getElementById("messages");
  if (messagesBox) messagesBox.innerHTML = "";
  db.ref("atmos_chat").off("child_added");
  window._firstLoadedKey = null;
  window._lastLoadedKey = null;
  listenForMessages();
}

/* ==========================================================
   MARVIN AI LOGIC
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
  if (chance <= 0.05) {
    const randomQuote = marvinQuotesList[Math.floor(Math.random() * marvinQuotesList.length)];
    if (typeof sendGlobalEffect === "function") {
      sendGlobalEffect("marvin", randomQuote);
    }
  }
}

/* ==========================================================
   INIT & EVENT LISTENERS
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  listenForMessages();
  if (typeof listenForGlobalEffects === "function") {
    listenForGlobalEffects();
  }

  document.addEventListener("click", forceWebViewSoundUnlock, { once: true });
  document.addEventListener("keydown", forceWebViewSoundUnlock, { once: true });
  document.addEventListener("touchstart", forceWebViewSoundUnlock, { once: true });

  const messagesBox = document.getElementById("messages");
  if (messagesBox) {
    messagesBox.addEventListener("scroll", () => {
      if (messagesBox.scrollTop < 60) {
        loadMoreMessages();
      }
    });
  }
});

/* ==========================================================
   POP UP PICS
========================================================== */

window.openAtmosPopup = function(src) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0'; overlay.style.left = '0';
  overlay.style.width = '100vw'; overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.cursor = 'zoom-out';
  
  const bigImg = document.createElement('img');
  bigImg.src = src;
  bigImg.style.maxWidth = '90vw';
  bigImg.style.maxHeight = '90vh';
  bigImg.style.objectFit = 'contain';
  bigImg.style.border = '2px solid #00ff33';
  bigImg.style.boxShadow = '0 0 20px #00ff33';
  bigImg.style.cursor = 'default';
  
  bigImg.onclick = (e) => e.stopPropagation();
  overlay.onclick = () => overlay.remove();
  
  overlay.appendChild(bigImg);
  document.body.appendChild(overlay);
};