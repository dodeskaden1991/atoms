<<<<<<< HEAD
/* ==========================================================
   NICKNAME SYSTEM
========================================================== */
=======
/* ===========================
   NICKNAME SYSTEM
=========================== */
>>>>>>> 3c7b51dcdb7aaf2300500fbcce31ea2d68faa6ef

function generateRandomNick() {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return "Anonymous-" + random;
}

function getNickname() {
  let nick = localStorage.getItem("nickname");

  if (!nick) {
    nick = generateRandomNick();
    localStorage.setItem("nickname", nick);
  }

  return nick;
}

function setNickname(newNick) {
  localStorage.setItem("nickname", newNick);
  updatePrompt();
}

<<<<<<< HEAD
/* ==========================================================
   TERMINAL PROMPT
========================================================== */
=======
/* ===========================
   TERMINAL PROMPT
=========================== */
>>>>>>> 3c7b51dcdb7aaf2300500fbcce31ea2d68faa6ef

function updatePrompt() {
  const nick = getNickname();
  const prompt = document.getElementById("terminalPrompt");
<<<<<<< HEAD
  if (prompt) prompt.textContent = `${nick}@atmos:~$ `;
}

/* ==========================================================
   THEME SYSTEM
========================================================== */
=======

  prompt.textContent = `${nick}@atmos:~$ `;
}

/* ===========================
   THEME SYSTEM
=========================== */
>>>>>>> 3c7b51dcdb7aaf2300500fbcce31ea2d68faa6ef

function applySavedTheme() {
  const saved = localStorage.getItem("theme");

  if (saved === "light") {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
  }
}

function setTheme(mode) {
  if (mode === "light") {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

<<<<<<< HEAD
/* ==========================================================
   MUSIC BACKEND (NO UI)
========================================================== */

const stations = [
=======
/* ===========================
   MUSIC BACKEND (NO UI)
=========================== */

const stations = [
  // BG
>>>>>>> 3c7b51dcdb7aaf2300500fbcce31ea2d68faa6ef
  { name: "Radio Tangra (BG)", url: "https://restreamer.radiotangra.com/Tangra-high" },
  { name: "Power FM (BG)", url: "https://lounge.powerfm.bg:28001/live" },
  { name: "Energy (BG)", url: "http://play.global.audio:443/nrj.opus" },
  { name: "Radio 1 (BG)", url: "http://play.global.audio:8000/radio1.opus" },
<<<<<<< HEAD
  { name: "Psy Trance", url: "https://radio.mugadavanje.rs/listen/mugadavanje/mugadavanje" }
];

function playStation(url) {
  const audio = document.getElementById("audioPlayer");
  if (!audio) return;
=======

  // NOT BG
  { name: "Psy Trance", url: "https://radio.mugadavanje.rs/listen/mugadavanje/mugadavanje" }
];


function playStation(url) {
  const audio = document.getElementById("audioPlayer");
>>>>>>> 3c7b51dcdb7aaf2300500fbcce31ea2d68faa6ef
  audio.src = url;
  audio.play();
}

function pauseMusic() {
  const audio = document.getElementById("audioPlayer");
<<<<<<< HEAD
  if (audio) audio.pause();
}

/* ==========================================================
   INIT
========================================================== */
=======
  audio.pause();
}

/* ===========================
   INIT
=========================== */
>>>>>>> 3c7b51dcdb7aaf2300500fbcce31ea2d68faa6ef

function initAtmos() {
  applySavedTheme();
  updatePrompt();
<<<<<<< HEAD
  listenForGlobalEffects(); // Инициализира се ЕДНОКРАТНО тук
}

document.addEventListener("DOMContentLoaded", initAtmos);

/* ==========================================================
   GLOBAL EFFECTS (FIREBASE)
========================================================== */

function sendGlobalEffect(name, payload = null) {
  db.ref("atmos_effects").push({
    name: name,
    payload: payload,
    timestamp: Date.now()
  });
}

function listenForGlobalEffects() {
  // if (!window.db) {
  //   setTimeout(listenForGlobalEffects, 200);
  //   return;
  // }

  db.ref("atmos_effects")
    .limitToLast(1)
    .on("child_added", snapshot => {
      const effect = snapshot.val();
      if (!effect) return;

      triggerEffect(effect.name, effect.payload);
      snapshot.ref.remove();
    });
}

function triggerEffect(name, payload) {
  switch (name) {
    case "matrix":
      triggerMatrixRain();
      break;

    case "glitch":
      triggerGlitchOverlay();
      break;

    case "kick":
      triggerKickPopup(payload);
      break;

    case "hack":
      triggerHackPopup(payload);
      break;
  }
}

/* ==========================================================
   MATRIX RAIN
========================================================= */

function triggerMatrixRain() {
  if (document.getElementById("matrixCanvas")) return;

  const canvas = document.createElement("canvas");
  canvas.id = "matrixCanvas";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const letters = "アァカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const size = 16;
  const columns = canvas.width / size;
  const drops = Array(Math.floor(columns)).fill(1);

  let active = true;

  function draw() {
    if (!active) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0F0";
    ctx.font = size + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const char = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillText(char, i * size, drops[i] * size);

      if (drops[i] * size > canvas.height && Math.random() > 0.95) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    requestAnimationFrame(draw);
  }

  draw();

  setTimeout(() => {
    active = false;
    canvas.remove();
  }, 5000);
}

/* ==========================================================
   GLITCH OVERLAY
========================================================== */

function triggerGlitchOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "glitchOverlay";
  document.body.appendChild(overlay);

  setTimeout(() => overlay.remove(), 600);
}

/* ==========================================================
   KICK POPUP
========================================================== */

function triggerKickPopup(target) {
  if (getNickname().toLowerCase() !== target.toLowerCase()) return;

  const popup = document.createElement("div");
  popup.className = "kickPopup";
  popup.textContent = "YOU WERE KICKED!";
  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 2000);
}

/* ==========================================================
   HACK POPUP
========================================================== */

function triggerHackPopup(target) {
  if (getNickname().toLowerCase() !== target.toLowerCase()) return;

  const popup = document.createElement("div");
  popup.className = "hackPopup";
  popup.textContent = "HACKED";
  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 1500);
}

/* ==========================================================
   SECRET FLASH
========================================================== */

function triggerSecretFlash() {
  const flash = document.createElement("div");
  flash.className = "secretFlash";
  document.body.appendChild(flash);

  setTimeout(() => flash.remove(), 800);
}
=======
}

document.addEventListener("DOMContentLoaded", initAtmos);
>>>>>>> 3c7b51dcdb7aaf2300500fbcce31ea2d68faa6ef
