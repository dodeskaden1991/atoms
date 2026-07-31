/* ==========================================================
   NICKNAME SYSTEM
========================================================== */

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

/* ==========================================================
   TERMINAL PROMPT
========================================================== */

function updatePrompt() {
  const nick = getNickname();
  const prompt = document.getElementById("terminalPrompt");
  if (!prompt) return;

  let mode = JSON.parse(localStorage.getItem("atmos_mode")) || { isActive: false, type: "", target: "" };
  let promptText = `${nick}@atmos:~$ `;

  if (mode.isActive) {
    if (mode.type === "chat") promptText = `${nick}@atmos[CHAT]:~$ `;
    if (mode.type === "su") promptText = `${nick}@atmos[SU:${mode.target}]:~$ `;
    if (mode.type === "room") promptText = `${nick}@atmos[ROOM:${mode.target}]:~$ `;
  }

  prompt.textContent = promptText;
}

/* ==========================================================
   THEME SYSTEM
========================================================== */

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

/* ==========================================================
   MUSIC BACKEND (NO UI)
========================================================== */

const stations = [
  { name: "Radio Tangra (BG)", url: "https://restreamer.radiotangra.com/Tangra-high" },
  { name: "Power FM (BG)", url: "https://lounge.powerfm.bg:28001/live" },
  { name: "Energy (BG)", url: "http://play.global.audio:443/nrj.opus" },
  { name: "Radio 1 (BG)", url: "http://play.global.audio:8000/radio1.opus" },
  { name: "Psy Trance", url: "https://radio.mugadavanje.rs/listen/mugadavanje/mugadavanje" }
];

function playStation(url) {
  const audio = document.getElementById("audioPlayer");
  if (!audio) return;
  audio.src = url;
  audio.play();
}

function pauseMusic() {
  const audio = document.getElementById("audioPlayer");
  if (audio) audio.pause();
}

/* ==========================================================
   INIT & AUDIO UNLOCK FOR WEBVIEW
========================================================== */

let audioUnlocked = false;

function unlockWebViewAudio() {
  if (audioUnlocked) return;
  
  if (window.speechSynthesis) {
    const dummy = new SpeechSynthesisUtterance("");
    dummy.volume = 0;
    window.speechSynthesis.speak(dummy);
  }
  
  audioUnlocked = true;
  document.removeEventListener("touchstart", unlockWebViewAudio);
  document.removeEventListener("click", unlockWebViewAudio);
}

function initAtmos() {
  applySavedTheme();
  updatePrompt();
  listenForGlobalEffects();
  
  document.addEventListener("touchstart", unlockWebViewAudio);
  document.addEventListener("click", unlockWebViewAudio);
}

document.addEventListener("DOMContentLoaded", initAtmos);

/* ==========================================================
   GLOBAL EFFECTS (FIREBASE)
========================================================== */

function sendGlobalEffect(name, payload = null) {
  if (typeof db === "undefined") return;
  db.ref("atmos_effects").push({
    name: name,
    payload: payload,
    timestamp: Date.now()
  });
}

function listenForGlobalEffects() {
  if (typeof db === "undefined") return;
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
    case "marvin":
      triggerMarvinDepression(payload);
      break;
  }
}

/* ==========================================================
   MARVIN DEPRESSION & VOICE ENGINE (WEBVIEW HYBRID)
========================================================== */

let lastProcessedQuote = "";
let lastProcessedTime = 0;

function triggerMarvinDepression(quote) {
    const now = Date.now();
    if (quote === lastProcessedQuote && (now - lastProcessedTime < 1500)) {
        return;
    }
    lastProcessedQuote = quote;
    lastProcessedTime = now;

    if (typeof appendMessage === "function") {
        appendMessage(`\n<span style="color: #8c8c8c; font-weight: bold;">[MARVIN AI]: ${quote}</span>\n`, false, false);
    }

    speakMarvinQuote(quote);

    document.body.classList.add("marvin-depression");
    setTimeout(function() {
        document.body.classList.remove("marvin-depression");
    }, 5000);
}

async function speakMarvinQuote(quote) {
    try {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            let voices = window.speechSynthesis.getVoices();
            
            if (!voices || voices.length === 0) {
                await new Promise((resolve) => {
                    let attempts = 0;
                    const interval = setInterval(() => {
                        voices = window.speechSynthesis.getVoices();
                        attempts++;
                        if ((voices && voices.length > 0) || attempts > 10) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
            }
            
            if (voices && voices.length > 0) {
                const utterance = new SpeechSynthesisUtterance(quote);
                utterance.lang = 'en-US';
                utterance.pitch = 0.3;
                utterance.rate = 0.7;
                utterance.volume = 1;
                
                const googleVoice = voices.find(v => 
                    v.name && (v.name.toLowerCase().includes('google') || v.lang.startsWith('en'))
                );
                if (googleVoice) utterance.voice = googleVoice;
                
                window.speechSynthesis.speak(utterance);
                return;
            }
        }
        
        if (typeof responsiveVoice === 'undefined') {
            await loadResponsiveVoice(quote);
        }
        
        if (typeof responsiveVoice !== 'undefined') {
            responsiveVoice.speak(quote, "UK English Male", { rate: 0.8, pitch: 0.5, volume: 1 });
        } else {
            loadFallbackVoice(quote);
        }
        
    } catch(e) {
        console.log("[MARVIN] Voice Error:", e);
        loadFallbackVoice(quote);
    }
}

function loadResponsiveVoice(quote) {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=7VrJN4OW';
        script.onload = () => setTimeout(resolve, 500);
        script.onerror = () => {
            if (quote) loadFallbackVoice(quote);
            resolve();
        };
        document.head.appendChild(script);
    });
}

function loadFallbackVoice(quote) {
    try {
        const audio = document.createElement('audio');
        audio.style.display = 'none';
        document.body.appendChild(audio);
        
        const encodedText = encodeURIComponent(quote);
        audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;
        
        audio.play().catch(() => tryFallbackSpeech(quote));
        audio.onended = () => audio.remove();
    } catch(e) {
        tryFallbackSpeech(quote);
    }
}

function tryFallbackSpeech(quote) {
    if (window.speechSynthesis) {
        try {
            const utterance = new SpeechSynthesisUtterance(quote);
            utterance.lang = 'en-US';
            utterance.pitch = 0.3;
            utterance.rate = 0.7;
            window.speechSynthesis.speak(utterance);
        } catch(e) {}
    }
}

if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      window.speechSynthesis.getVoices();
    });
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

  const letters = "ｱｧｶｻﾀﾅﾊﾏﾔﾗﾜ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
   GLITCH & POPUPS
========================================================== */

/* ==========================================================
   GLITCH & POPUPS (ФИКС ЗА МОДЕРЕН UI)
========================================================== */

function triggerGlitchOverlay() {
  // Премахваме стар overlay ако има
  const old = document.querySelector('.glitchOverlay');
  if (old) old.remove();
  
  const overlay = document.createElement("div");
  overlay.className = "glitchOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.zIndex = "999999";
  overlay.style.pointerEvents = "none";
  overlay.style.animation = "glitchFlash 0.6s ease-out";
  document.body.appendChild(overlay);

  setTimeout(() => {
    if (overlay && overlay.parentNode) overlay.remove();
  }, 700);
}

function triggerKickPopup(target) {
  const myNick = typeof getNickname === 'function' ? getNickname() : '';
  if (myNick.toLowerCase() !== target.toLowerCase()) {
    // Ако не сме ние, показваме системно съобщение в чата
    if (typeof appendMessage === 'function') {
      appendMessage(`[SYSTEM] ${target} беше изритнат! 👢`, false, false);
    }
    return;
  }

  // Премахваме стар popup ако има
  const old = document.querySelector('.kickPopup');
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.className = "kickPopup";
  popup.textContent = "👢 YOU WERE KICKED!";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%) scale(0)";
  popup.style.zIndex = "999999";
  popup.style.fontSize = "clamp(2rem, 6vw, 4rem)";
  popup.style.fontWeight = "900";
  popup.style.textAlign = "center";
  popup.style.padding = "30px 50px";
  popup.style.borderRadius = "16px";
  popup.style.color = "#ff4444";
  popup.style.background = "rgba(0,0,0,0.85)";
  popup.style.border = "4px solid #ff4444";
  popup.style.boxShadow = "0 0 60px rgba(255,68,68,0.5)";
  popup.style.animation = "popupBoom 2.5s ease-out forwards";
  popup.style.pointerEvents = "none";
  document.body.appendChild(popup);

  setTimeout(() => {
    if (popup && popup.parentNode) popup.remove();
  }, 2600);
}

function triggerHackPopup(target) {
  const myNick = typeof getNickname === 'function' ? getNickname() : '';
  if (myNick.toLowerCase() !== target.toLowerCase()) {
    if (typeof appendMessage === 'function') {
      appendMessage(`[SYSTEM] ${target} беше хакнат! 💻`, false, false);
    }
    return;
  }

  const old = document.querySelector('.hackPopup');
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.className = "hackPopup";
  popup.textContent = "💻 HACKED!";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%) scale(0)";
  popup.style.zIndex = "999999";
  popup.style.fontSize = "clamp(2rem, 6vw, 4rem)";
  popup.style.fontWeight = "900";
  popup.style.textAlign = "center";
  popup.style.padding = "30px 50px";
  popup.style.borderRadius = "16px";
  popup.style.color = "#00ff44";
  popup.style.background = "rgba(0,0,0,0.85)";
  popup.style.border = "4px solid #00ff44";
  popup.style.boxShadow = "0 0 60px rgba(0,255,68,0.5)";
  popup.style.animation = "popupBoom 2.5s ease-out forwards";
  popup.style.pointerEvents = "none";
  document.body.appendChild(popup);

  setTimeout(() => {
    if (popup && popup.parentNode) popup.remove();
  }, 2600);
}

// Добавяме и анимацията динамично, ако липсва в CSS
(function ensurePopupAnimations() {
  if (!document.getElementById('popupAnimations')) {
    const style = document.createElement('style');
    style.id = 'popupAnimations';
    style.textContent = `
      @keyframes popupBoom {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        15% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
        30% { transform: translate(-50%, -50%) scale(0.85); opacity: 1; }
        45% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        60% { transform: translate(-50%, -50%) scale(0.95); opacity: 1; }
        75% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
        90% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
      }
      @keyframes glitchFlash {
        0% { background: rgba(0, 255, 0, 0.9); }
        8% { background: rgba(255, 0, 0, 0.9); }
        16% { background: rgba(0, 0, 255, 0.9); }
        25% { background: rgba(255, 255, 0, 0.9); }
        33% { background: rgba(0, 0, 0, 0.95); }
        41% { background: rgba(255, 0, 255, 0.9); }
        50% { background: rgba(0, 0, 0, 0.95); }
        58% { background: rgba(0, 255, 0, 0.6); }
        66% { background: rgba(255, 0, 0, 0.6); }
        75% { background: rgba(0, 0, 0, 0.95); }
        85% { background: rgba(0, 255, 255, 0.3); }
        100% { background: rgba(0, 0, 0, 0); }
      }
    `;
    document.head.appendChild(style);
  }
})();

/* ===================================================================
   ATMOS TERMINAL // GLOBAL STORY GENERATOR ENGINE (v1.2 - ALIGNED)
=================================================================== */

function generateStoryMessage(cmd) {
  if (!cmd) cmd = "/generate";
  const parts = cmd.trim().split(/\s+/);
  
  const textStartIndex = cmd.indexOf(parts[1]);
  let userText = textStartIndex !== -1 ? cmd.substring(textStartIndex).trim() : "";

  if (!userText || userText.toLowerCase() === "text") {
    userText = "Създавай неща, които те карат да забравиш за телефона си.";
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}.${month}.${year}`;

  const stylesPool = [
    { name: "CYBER_SUNSET", bgGradient: ["#f9d423", "#ff4e50", "#f857a6"], textColor: "#ffffff", accentColor: "#f857a6", subTextColor: "rgba(255, 255, 255, 0.4)", borderColor: "rgba(255, 255, 255, 0.2)", fontFamily: "sans-serif", decorations: "circle" },
    { name: "AURORA_CHILL", bgGradient: ["#00c6ff", "#0072ff", "#130cb7"], textColor: "#ffffff", accentColor: "#00f6ff", subTextColor: "rgba(255, 255, 255, 0.5)", borderColor: "rgba(0, 246, 255, 0.25)", fontFamily: "monospace", decorations: "cross" },
    { name: "NEO_MINT", bgGradient: ["#0ba360", "#3cba92", "#111111"], textColor: "#ffffff", accentColor: "#3cba92", subTextColor: "rgba(255, 255, 255, 0.4)", borderColor: "rgba(60, 186, 146, 0.3)", fontFamily: "sans-serif", decorations: "lines" },
    { name: "AESTHETIC_NOIR", bgGradient: ["#2c3e50", "#000000", "#111111"], textColor: "#f5f5f7", accentColor: "#e55d87", subTextColor: "rgba(255, 255, 255, 0.3)", borderColor: "rgba(255, 255, 255, 0.1)", fontFamily: "serif", decorations: "minimal" },
    { name: "TOXIC_MATRIX", bgGradient: ["#000000", "#051307", "#00ff33"], textColor: "#00ff33", accentColor: "#ffffff", subTextColor: "rgba(0, 255, 51, 0.3)", borderColor: "rgba(0, 255, 51, 0.4)", fontFamily: "monospace", decorations: "cross" },
    { name: "ELECTRIC_PLUM", bgGradient: ["#61045f", "#aa076b", "#1a0018"], textColor: "#ffffff", accentColor: "#ff007f", subTextColor: "rgba(255, 255, 255, 0.35)", borderColor: "rgba(255, 0, 127, 0.25)", fontFamily: "sans-serif", decorations: "circle" },
    { name: "VAPOR_DREAM", bgGradient: ["#74ebd5", "#9ecefa", "#acb6e5"], textColor: "#111111", accentColor: "#ff4081", subTextColor: "rgba(17, 17, 17, 0.4)", borderColor: "rgba(17, 17, 17, 0.15)", fontFamily: "sans-serif", decorations: "circle" },
    { name: "ECLIPSE_RED", bgGradient: ["#110000", "#4a0000", "#000000"], textColor: "#ffffff", accentColor: "#ff3333", subTextColor: "rgba(255, 51, 51, 0.3)", borderColor: "rgba(255, 51, 51, 0.2)", fontFamily: "serif", decorations: "cross" },
    { name: "ZEN_MATCHA", bgGradient: ["#a8ff78", "#78ffd6"], textColor: "#1e3d2f", accentColor: "#000000", subTextColor: "rgba(30, 61, 47, 0.5)", borderColor: "rgba(30, 61, 47, 0.2)", fontFamily: "serif", decorations: "minimal" },
    { name: "GOLDEN_DUNES", bgGradient: ["#111a24", "#c29c53", "#1a2a3a"], textColor: "#ffffff", accentColor: "#f3e5ab", subTextColor: "rgba(243, 229, 171, 0.4)", borderColor: "rgba(194, 156, 83, 0.3)", fontFamily: "serif", decorations: "lines" },
    { name: "NEBULA_CORE", bgGradient: ["#4e54c8", "#8f94fb", "#000000"], textColor: "#ffffff", accentColor: "#8f94fb", subTextColor: "rgba(255, 255, 255, 0.4)", borderColor: "rgba(143, 148, 251, 0.3)", fontFamily: "monospace", decorations: "cross" },
    { name: "CORAL_REEF", bgGradient: ["#ff9966", "#ff5e62"], textColor: "#ffffff", accentColor: "#ffffff", subTextColor: "rgba(255, 255, 255, 0.5)", borderColor: "rgba(255, 255, 255, 0.25)", fontFamily: "sans-serif", decorations: "circle" },
    { name: "TOKYO_NOIR", bgGradient: ["#0f2027", "#203a43", "#2c5364"], textColor: "#00ffcc", accentColor: "#ff007f", subTextColor: "rgba(255, 255, 255, 0.4)", borderColor: "rgba(0, 255, 204, 0.2)", fontFamily: "monospace", decorations: "lines" },
    { name: "ICE_BREAKER", bgGradient: ["#e0eafc", "#cfdef3"], textColor: "#2c3e50", accentColor: "#0072ff", subTextColor: "rgba(44, 62, 80, 0.5)", borderColor: "rgba(44, 62, 80, 0.15)", fontFamily: "sans-serif", decorations: "minimal" },
    { name: "AMBER_ALERT", bgGradient: ["#ff4e50", "#f9d423", "#111111"], textColor: "#ffffff", accentColor: "#ff4e50", subTextColor: "rgba(255, 255, 255, 0.35)", borderColor: "rgba(255, 78, 80, 0.25)", fontFamily: "monospace", decorations: "cross" },
    { name: "SOFT_CREAM", bgGradient: ["#f7f5f0", "#eaddca"], textColor: "#333333", accentColor: "#8b5a2b", subTextColor: "rgba(51, 51, 51, 0.4)", borderColor: "rgba(139, 90, 43, 0.2)", fontFamily: "serif", decorations: "minimal" }
  ];

  const styleIndex = Math.floor(Math.random() * stylesPool.length);
  const activeStyle = stylesPool[styleIndex];
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080; 
  canvas.height = 1920;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, activeStyle.bgGradient[0]);
  bgGrad.addColorStop(0.5, activeStyle.bgGradient[1]);
  bgGrad.addColorStop(1, activeStyle.bgGradient[2] || activeStyle.bgGradient[1]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
  for (let i = 0; i < 80000; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    ctx.fillRect(rx, ry, 2, 2);
  }

  if (activeStyle.decorations === "circle") {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 400, 0, Math.PI * 2); ctx.stroke();
  } else if (activeStyle.decorations === "cross") {
    ctx.strokeStyle = activeStyle.accentColor; ctx.lineWidth = 2;
    const offset = 100;
    ctx.beginPath(); ctx.moveTo(offset, offset); ctx.lineTo(offset + 20, offset); ctx.moveTo(offset, offset); ctx.lineTo(offset, offset + 20);
    ctx.moveTo(canvas.width - offset, offset); ctx.lineTo(canvas.width - offset - 20, offset); ctx.moveTo(canvas.width - offset, offset); ctx.lineTo(canvas.width - offset, offset + 20);
    ctx.stroke();
  } else if (activeStyle.decorations === "lines") {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"; ctx.lineWidth = 1;
    for (let l = 200; l < canvas.width; l += 200) {
      ctx.beginPath(); ctx.moveTo(l, 0); ctx.lineTo(l, canvas.height); ctx.stroke();
    }
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.strokeStyle = activeStyle.borderColor;
  ctx.lineWidth = 2;
  const boxX = 100; const boxY = 450; const boxW = canvas.width - 200; const boxH = 950;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = activeStyle.textColor;
  ctx.font = `bold 32px ${activeStyle.fontFamily}`;
  ctx.fillText("▲ ATMOS ENGINE // DISCOVERED", canvas.width / 2, 250);

  ctx.fillStyle = activeStyle.subTextColor;
  ctx.font = `18px monospace`;
  ctx.fillText(`GEN_ID: ST_${Date.now().toString().substring(6)} // THEME: ${activeStyle.name}`, canvas.width / 2, 290);

  ctx.fillStyle = activeStyle.accentColor;
  ctx.font = `bold 120px ${activeStyle.fontFamily}`;
  ctx.fillText("“", canvas.width / 2, 380); 

  ctx.fillStyle = activeStyle.textColor;
  ctx.font = `bold 52px ${activeStyle.fontFamily}`;
  
  const words = userText.split(' ');
  const lines = [];
  let currentLine = '';
  const maxTextWidth = boxW - 140;

  for (let n = 0; n < words.length; n++) {
    let testLine = currentLine + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxTextWidth && n > 0) {
      lines.push(currentLine.trim());
      currentLine = words[n] + ' ';
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim());

  const lineHeight = 75;
  const totalTextHeight = lines.length * lineHeight;
  let startY = (boxY + (boxH / 2)) - (totalTextHeight / 2) + (lineHeight / 2);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], canvas.width / 2, startY + (i * lineHeight));
  }

  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = activeStyle.subTextColor;
  ctx.font = `24px monospace`;
  ctx.fillText(`DATE: ${dateStr}`, canvas.width / 2, boxY + boxH - 120);

  ctx.fillStyle = activeStyle.accentColor;
  ctx.font = `bold 28px ${activeStyle.fontFamily}`;
  ctx.fillText("atoms.free.bg", canvas.width / 2, boxY + boxH - 60);

  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "20px monospace";
  ctx.fillText("SHARE TO STORIES // PERSISTENCE ACTIVE", canvas.width / 2, canvas.height - 180);

  try {
    const imageBase64 = canvas.toDataURL("image/png");
    const output = document.getElementById("terminalOutput") || document.body;

    try {
      let cache = JSON.parse(localStorage.getItem('fortune_cache') || '[]');
      cache.push({ text: userText, date: dateStr, timestamp: Date.now(), type: 'story', image: imageBase64, style: activeStyle.name });
      if (cache.length > 50) cache.shift();
      localStorage.setItem('fortune_cache', JSON.stringify(cache));
    } catch(e) {}

    const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
    if (activeDb) {
      activeDb.ref("fortune_buffer").set({
        text: userText,
        date: dateStr,
        styleMode: styleIndex,
        isStory: true,
        timestamp: Date.now(),
      }).catch(() => {});
    }

    const isModernUI = window.__isModernUI === true;
    const downloadTargetUrl = "https://tinyurl.com/bmnrux6t";

    if (isModernUI) {
      setTimeout(() => {
        output.innerHTML += `
          <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${activeStyle.accentColor}; background: #000; font-family: monospace;">
            <p style="color: #00ff33; margin-bottom: 10px;">[SYSTEM] Вертикалното Стори (1080x1920) е рендирано успешно с тема <span style="color: #fff; background: ${activeStyle.accentColor}; padding: 2px 6px;">${activeStyle.name}</span>:</p>
            <img src="${imageBase64}" style="width: 100%; max-width: 220px; border: 1px solid #333; display: block; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);" alt="Atmos Story Image"/>
            <a href="${downloadTargetUrl}" target="_blank" rel="noopener noreferrer" style="background: #00ff33; color: #000; padding: 10px 18px; border: none; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 10px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
              📥 [СВАЛИ ИЗОБРАЖЕНИЕТО]
            </a>
          </div>
        `;
        window.scrollTo(0, document.body.scrollHeight);
      }, 500);
    } else {
      const fbShareUrl = isMobile ? "https://m.facebook.com/" : "https://www.facebook.com/";
      const xShareUrl = "https://x.com/intent/tweet";
      const igShareUrl = "https://www.instagram.com/";
      const downloadHref = isMobile ? downloadTargetUrl : imageBase64;
      const downloadAttr = isMobile ? "" : `download="atmos_story_${Date.now()}.png"`;
      const targetAttr = isMobile ? 'target="_blank"' : '';

      setTimeout(() => {
        output.innerHTML += `
          <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${activeStyle.accentColor}; background: #000; font-family: monospace;">
            <p style="color: #00ff33; margin-bottom: 10px;">[SYSTEM] Вертикалното Стори (1080x1920) е рендирано успешно с тема <span style="color: #fff; background: ${activeStyle.accentColor}; padding: 2px 6px;">${activeStyle.name}</span>:</p>
            <img src="${imageBase64}" style="width: 100%; max-width: 220px; border: 1px solid #333; display: block; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);" alt="Atmos Story Image"/>
            <a href="${downloadHref}" ${downloadAttr} ${targetAttr} rel="noopener noreferrer" style="background: ${activeStyle.accentColor}; color: #000; padding: 10px 18px; border: none; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">
              [СВАЛИ ИЗОБРАЖЕНИЕТО ЗА СТОРИ]
            </a>
            <p style="color: #555; margin-bottom: 10px;">[СПОДЕЛЯНЕ] Отвори приложението и качи от галерията:</p>
            <div class="share-buttons-group" style="display: flex; flex-wrap: wrap; gap: 10px;">
              <a href="${fbShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #3b5998; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; display: inline-block; border-radius: 4px;">[FACEBOOK]</a>
              <a href="${igShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #e1306c; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; display: inline-block; border-radius: 4px;">[INSTAGRAM]</a>
              <a href="${xShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #111; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; border: 1px solid #fff; display: inline-block; border-radius: 4px;">[X / TWITTER]</a>
            </div>
          </div>
        `;
        window.scrollTo(0, document.body.scrollHeight);
      }, 500);
    }

    return "Генераторът на истории приключи работа.";
  } catch (e) {
    console.error(e);
    return "Грешка при рендиране на Стори модула.";
  }
}

/* ==========================================================
   КРИПТИРАНЕ БЕЗ РАЗДУВАНЕ (XOR 1:1)
========================================================== */

function atmosXorEncode(text, key) {
  if (!text || !key) return text;
  let result = "";

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    let xorValue = charCode ^ keyChar;

    if (xorValue < 32) {
      xorValue += 0xE000;
    }

    result += String.fromCharCode(xorValue);
  }

  return result;
}

function atmosXorDecode(cipherText, key) {
  if (!cipherText || !key) return cipherText;
  let result = "";

  for (let i = 0; i < cipherText.length; i++) {
    let charCode = cipherText.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);

    if (charCode >= 0xE000 && charCode < 0xE020) {
      charCode -= 0xE000;
    }

    const originalCharCode = charCode ^ keyChar;
    result += String.fromCharCode(originalCharCode);
  }

  return result;
}

/* ==========================================================
   CRYPTO SECURITY LAYER (AUTOLOCK & TAB CLOSE)
========================================================== */

window.addEventListener("beforeunload", function () {
  localStorage.removeItem("crypto_key");
});

let inactivityTimer = null;
const INACTIVITY_LIMIT = 5 * 60 * 1000;

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  
  inactivityTimer = setTimeout(function() {
    if (window.cryptoModeActive) {
      localStorage.removeItem("crypto_key");
      window.cryptoModeActive = false;
      document.body.classList.remove("crypto-mode");
      
      const msgElem = document.getElementById("messages");
      if (msgElem) msgElem.innerHTML = "";
      if (typeof reloadChatMessages === "function") reloadChatMessages();
      if (typeof updatePrompt === "function") updatePrompt();
      
      const termOutput = document.getElementById("terminalOutput");
      if (termOutput) {
        termOutput.innerHTML += "<br><span style='color: #ff3333;'>[SECURITY ALERT] Session expired due to 5 minutes of inactivity. Crypto key wiped.</span>";
      }
    }
  }, INACTIVITY_LIMIT);
}

window.addEventListener("mousemove", resetInactivityTimer);
window.addEventListener("keydown", resetInactivityTimer);
window.addEventListener("click", resetInactivityTimer);
window.addEventListener("touchstart", resetInactivityTimer);

resetInactivityTimer();

document.addEventListener("visibilitychange", function () {
  if (document.hidden && window.cryptoModeActive) {
    localStorage.removeItem("crypto_key");
    window.cryptoModeActive = false;
    document.body.classList.remove("crypto-mode");
    const msgElem = document.getElementById("messages");
    if (msgElem) msgElem.innerHTML = "";
    
    if (typeof reloadChatMessages === "function") reloadChatMessages();
    if (typeof updatePrompt === "function") updatePrompt();
    
    console.log("[SECURITY] Screen locked or tab hidden. Session wiped.");
  }
});

/* ==========================================================
   LINK OPENER FOR WEBVIEW
========================================================== */

window.openAtmosLink = function(url, download = false) {
  if (download) {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop() || 'atmos_image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        window.open(url, '_system');
      } catch(e) {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  }
};