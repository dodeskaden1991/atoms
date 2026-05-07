/* ===========================
   NICKNAME SYSTEM
=========================== */

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

/* ===========================
   TERMINAL PROMPT
=========================== */

function updatePrompt() {
  const nick = getNickname();
  const prompt = document.getElementById("terminalPrompt");

  prompt.textContent = `${nick}@atmos:~$ `;
}

/* ===========================
   THEME SYSTEM
=========================== */

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

/* ===========================
   MUSIC BACKEND (NO UI)
=========================== */

const stations = [
  // BG
  { name: "Radio Tangra (BG)", url: "https://restreamer.radiotangra.com/Tangra-high" },
  { name: "Power FM (BG)", url: "https://lounge.powerfm.bg:28001/live" },
  { name: "Energy (BG)", url: "http://play.global.audio:443/nrj.opus" },
  { name: "Radio 1 (BG)", url: "http://play.global.audio:8000/radio1.opus" },

  // NOT BG
  { name: "Psy Trance", url: "https://radio.mugadavanje.rs/listen/mugadavanje/mugadavanje" }
];


function playStation(url) {
  const audio = document.getElementById("audioPlayer");
  audio.src = url;
  audio.play();
}

function pauseMusic() {
  const audio = document.getElementById("audioPlayer");
  audio.pause();
}

/* ===========================
   INIT
=========================== */

function initAtmos() {
  applySavedTheme();
  updatePrompt();
}

document.addEventListener("DOMContentLoaded", initAtmos);