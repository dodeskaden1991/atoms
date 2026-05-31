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

  // Четем поднивото от localStorage
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
   INIT
========================================================== */

function initAtmos() {
  applySavedTheme();
  updatePrompt();
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
/* ===================================================================
   ATMOS TERMINAL // GLOBAL STORY GENERATOR ENGINE (v1.2 - ALIGNED)
=================================================================== */

function generateStoryMessage(cmd) {
  if (!cmd) cmd = "/generate";
  const parts = cmd.trim().split(/\s+/);
  
  // Вземаме целия текст след командата
  const textStartIndex = cmd.indexOf(parts[1]);
  let userText = textStartIndex !== -1 ? cmd.substring(textStartIndex).trim() : "";

  // Ако няма подаден текст, слагаме красив placeholder
  if (!userText || userText.toLowerCase() === "text") {
    userText = "Създавай неща, които те карат да забравиш за телефона си.";
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}.${month}.${year}`;

  // 1. ДИНАМИЧНА РОТАЦИЯ НА СТИЛОВЕ (16 СТИЛА - СИНХРОНИЗИРАНИ С DOWNLOAD.HTML)
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

  // Детекцията за мобилно устройство
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 2. Инициализиране на Стори Canvas (Формат 1080x1920 за Story)
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080; 
  canvas.height = 1920;

  // Изчертаване на линеен градиент за фона
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, activeStyle.bgGradient[0]);
  bgGrad.addColorStop(0.5, activeStyle.bgGradient[1]);
  if (activeStyle.bgGradient[2]) {
    bgGrad.addColorStop(1, activeStyle.bgGradient[2]);
  } else {
    bgGrad.addColorStop(1, activeStyle.bgGradient[1]);
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Добавяне на фина noise/grain текстура
  ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
  for (let i = 0; i < 80000; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // 3. ДЕКОРАТИВНИ ЕЛЕМЕНТИ
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

  // Естетическа централна рамка (Стъклен ефект зад контента)
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.strokeStyle = activeStyle.borderColor;
  ctx.lineWidth = 2;
  const boxX = 100; const boxY = 450; const boxW = canvas.width - 200; const boxH = 950;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Глобална конфигурация за подравняване на текстовете
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 4. ТЕКСТОВЕ: ХЕДЪР
  ctx.fillStyle = activeStyle.textColor;
  ctx.font = `bold 32px ${activeStyle.fontFamily}`;
  ctx.fillText("▲ ATMOS ENGINE // DISCOVERED", canvas.width / 2, 250);

  ctx.fillStyle = activeStyle.subTextColor;
  ctx.font = `18px monospace`;
  ctx.fillText(`GEN_ID: ST_${Date.now().toString().substring(6)} // THEME: ${activeStyle.name}`, canvas.width / 2, 290);

  // Кавички
  ctx.fillStyle = activeStyle.accentColor;
  ctx.font = `bold 120px ${activeStyle.fontFamily}`;
  ctx.fillText("“", canvas.width / 2, 380); 

  // 5. ДИНАМИЧНО ПРЕНАСЯНЕ НА ПОТРЕБИТЕЛСКИЯ ТЕКСТ (ГЕОМЕТРИЧНО ЦЕНТРИРАН)
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
  
  // Математически точен център на кутията спрямо middle подравняване
  let startY = (boxY + (boxH / 2)) - (totalTextHeight / 2) + (lineHeight / 2);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], canvas.width / 2, startY + (i * lineHeight));
  }

  // Временно превключваме за футъра, където текстовете нямат нужда от middle подравняване
  ctx.textBaseline = "alphabetic";

  // 6. ФУТЪР НА КАРТАТА
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
    
    const fbShareUrl = isMobile ? "https://m.facebook.com/" : "https://www.facebook.com/";
    const xShareUrl = "https://x.com/intent/tweet";
    const igShareUrl = "https://www.instagram.com/";
    
    const downloadHref = isMobile ? "https://tinyurl.com/bmnrux6t" : imageBase64;
    const downloadAttr = isMobile ? "" : `download="atmos_story_${Date.now()}.png"`;
    const targetAttr = isMobile ? 'target="_blank"' : '';
    
    const uniqueId = Date.now();
    const statusDivId = `story_status_${uniqueId}`;
    const buttonLabel = isMobile ? "[ИЗТЕГЛИ СТОРИТО ЧРЕЗ БРАУЗЪР]" : "[СВАЛИ ИЗОБРАЖЕНИЕТО ЗА СТОРИ (PC)]";

    setTimeout(() => {
      output.innerHTML += `
        <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed ${activeStyle.accentColor}; background: #000; font-family: monospace;">
          <p style="color: #00ff33; margin-bottom: 10px;">[SYSTEM] Вертикалното Стори (1080x1920) е рендирано успешно с тема <span style="color: #fff; background: ${activeStyle.accentColor}; padding: 2px 6px;">${activeStyle.name}</span>:</p>
          
          <img src="${imageBase64}" style="width: 100%; max-width: 220px; border: 1px solid #333; display: block; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);" alt="Atmos Story Image"/>
          
          <a href="${downloadHref}" ${downloadAttr} ${targetAttr} rel="noopener noreferrer" style="background: ${activeStyle.accentColor}; color: #000; padding: 10px 18px; border: none; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none;">
            ${buttonLabel}
          </a>

          <div id="${statusDivId}" style="color: #888; font-size: 12px; margin-bottom: 10px;">[БЪФЕР] Синхронизиране на инжектирания текст...</div>
          <p style="color: #555; margin-bottom: 10px;">[СПОДЕЛЯНЕ] Отвори приложението и качи от галерията:</p>
          <div class="share-buttons-group" style="display: flex; flex-wrap: wrap; gap: 10px;">
            <a href="${fbShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #3b5998; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; display: inline-block;">[FACEBOOK]</a>
            <a href="${igShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #e1306c; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; display: inline-block;">[INSTAGRAM]</a>
            <a href="${xShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #111; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; border: 1px solid #fff; display: inline-block;">[X / TWITTER]</a>
          </div>
        </div>
      `;

      const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
      const statusDiv = document.getElementById(statusDivId);

      if (activeDb) {
        activeDb
          .ref("fortune_buffer")
          .set({
            text: userText,
            date: dateStr,
            styleMode: styleIndex,
            isStory: true,
            timestamp: Date.now(),
          })
          .then(() => {
            if (statusDiv) statusDiv.innerHTML = "<span style='color: #00ff33;'>[БЪФЕР] Успешна облачна синхронизация на стила!</span>";
          })
          .catch((err) => {
            console.error("Firebase error:", err);
            if (statusDiv) statusDiv.innerHTML = "<span style='color: #ff6666;'>[ГРЕШКА] Критичен отказ на облачния хост</span>";
          });
      } else {
        if (statusDiv) statusDiv.innerHTML = "<span style='color: #ffaa00;'>[ПРЕДУПРЕЖДЕНИЕ] Локален режим - Липсва база данни</span>";
      }

      window.scrollTo(0, document.body.scrollHeight);
    }, 500);

    return "Генераторът на истории приключи работа.";
  } catch (e) {
    console.error(e);
    return "Грешка при рендиране на Стори модула.";
  }
}