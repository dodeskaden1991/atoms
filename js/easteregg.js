/* ===================================================================
   EASTER EGG COMMANDS CONFIG
=================================================================== */

const easterEggCommands = {
  "/matrix": cmdMatrix,
  "/kick": cmdKick,
  "/ascii": asciiBanner,
  "/fortune": fortuneMessage,
  "/glitch": cmdGlitch,
  "/rainbow": rainbowText,
  "/8ball": eightBall,
  "/roll": rollDice,
  "/coin": flipCoin,
  "/hack": cmdHack,
  "/html": cmdHtml,
};

const forbiddenHtmlPatterns = [
  /on\w+\s*=/i,
  /script/i,
  /javascript:/i,
  /<iframe/i,
  /<embed/i,
  /<object/i,
  /<link/i,
  /<style/i
];

function isDangerousHtml(html) {
  return forbiddenHtmlPatterns.some(r => r.test(html));
}

function sanitizeHtml(text) {
  let safe = text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const allowed = ["b", "i", "u", "code", "mark", "small", "a", "font", "img"];

  allowed.forEach(tag => {
    const open = new RegExp(`&lt;(${tag})(\\s[^&>]*)?&gt;`, "gi");
    const close = new RegExp(`&lt;\\/(${tag})&gt;`, "gi");
    safe = safe.replace(open, "<$1$2>");
    safe = safe.replace(close, "</$1>");
  });

  safe = safe.replace(/<img(.*?)src=["'](.*?)["'](.*?)>/gi, (m, a, src, b) => {
    let cleanSrc = src.trim();
    if (!cleanSrc.toLowerCase().startsWith("http://") && !cleanSrc.toLowerCase().startsWith("https://")) {
      cleanSrc = "https://" + cleanSrc;
    }
    return `<img src="${cleanSrc}" loading="lazy" decoding="async" style="max-width:100px;max-height:100px;display:inline-block;vertical-align:middle;" onload="this.parentNode.scrollTop = this.parentNode.scrollHeight;">`;
  });

  safe = safe.replace(/<a(.*?)href=["'](.*?)["'](.*?)>/gi, (m, a, href, b) => {
    let cleanHref = href.trim();
    if (cleanHref.toLowerCase().includes("javascript:") || cleanHref.toLowerCase().includes("data:")) {
      return `<a href="#">`;
    }
    if (!cleanHref.toLowerCase().startsWith("http://") && !cleanHref.toLowerCase().startsWith("https://")) {
      cleanHref = "https://" + cleanHref;
    }
    return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer">`;
  });

  return safe;
}

/* ===================================================================
   COMMAND ENGINE CHECKS
=================================================================== */

function isEasterEggCommand(cmd) {
  const base = cmd.split(" ")[0];
  return easterEggCommands[base] !== undefined;
}

function runEasterEggCommand(cmd) {
  const base = cmd.split(" ")[0];
  return easterEggCommands[base](cmd);
}

/* ===================================================================
   MATRIX EFFECT
=================================================================== */

function cmdMatrix() {
  sendSystemLine(`${getNickname()} пусна Matrix.`);
  sendGlobalEffect("matrix");
}

/* ===================================================================
   KICK POPUP
=================================================================== */

function cmdKick(cmd) {
  const target = cmd.split(" ")[1];
  if (!target) return sendSystemLine("Usage: /kick <nick>");

  sendSystemLine(`${getNickname()} изрита ${target}.`);
  sendGlobalEffect("kick", target);
}

/* ===================================================================
   ASCII BANNER - BOLD & DETAILED (FIGLET STYLE, 7 ROWS)
=================================================================== */

function asciiBanner(cmd) {
  const text = cmd.substring(7).trim();
  if (!text) return "Usage: /ascii <text>";

  const banner = generateAscii(text);
  sendSystemLine("\n" + banner);
  return "ASCII banner sent.";
}

function generateAscii(text) {
  const upper = text.toUpperCase();
  let rows = ['', '', '', '', '', '', ''];
  
  for (let char of upper) {
    switch(char) {
      case 'A':
        rows[0] += "   ███   ";
        rows[1] += "  █████  ";
        rows[2] += " ██   ██ ";
        rows[3] += " ███████ ";
        rows[4] += " ██   ██ ";
        rows[5] += " ██   ██ ";
        rows[6] += " ██   ██ ";
        break;
      case 'B':
        rows[0] += "██████  ";
        rows[1] += "██   ██ ";
        rows[2] += "██   ██ ";
        rows[3] += "██████  ";
        rows[4] += "██   ██ ";
        rows[5] += "██   ██ ";
        rows[6] += "██████  ";
        break;
      case 'C':
        rows[0] += " ██████ ";
        rows[1] += "██     ";
        rows[2] += "██     ";
        rows[3] += "██     ";
        rows[4] += "██     ";
        rows[5] += "██     ";
        rows[6] += " ██████ ";
        break;
      case 'D':
        rows[0] += "██████  ";
        rows[1] += "██   ██ ";
        rows[2] += "██   ██ ";
        rows[3] += "██   ██ ";
        rows[4] += "██   ██ ";
        rows[5] += "██   ██ ";
        rows[6] += "██████  ";
        break;
      case 'E':
        rows[0] += "███████";
        rows[1] += "██     ";
        rows[2] += "██     ";
        rows[3] += "█████  ";
        rows[4] += "██     ";
        rows[5] += "██     ";
        rows[6] += "███████";
        break;
      case 'F':
        rows[0] += "███████";
        rows[1] += "██     ";
        rows[2] += "██     ";
        rows[3] += "█████  ";
        rows[4] += "██     ";
        rows[5] += "██     ";
        rows[6] += "██     ";
        break;
      case 'G':
        rows[0] += " ██████ ";
        rows[1] += "██      ";
        rows[2] += "██      ";
        rows[3] += "██  ███ ";
        rows[4] += "██   ██ ";
        rows[5] += "██   ██ ";
        rows[6] += " ██████ ";
        break;
      case 'H':
        rows[0] += "██   ██";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += "███████";
        rows[4] += "██   ██";
        rows[5] += "██   ██";
        rows[6] += "██   ██";
        break;
      case 'I':
        rows[0] += " █████ ";
        rows[1] += "   █   ";
        rows[2] += "   █   ";
        rows[3] += "   █   ";
        rows[4] += "   █   ";
        rows[5] += "   █   ";
        rows[6] += " █████ ";
        break;
      case 'J':
        rows[0] += "    ███";
        rows[1] += "      █";
        rows[2] += "      █";
        rows[3] += "      █";
        rows[4] += "██   █";
        rows[5] += "██   █";
        rows[6] += " █████";
        break;
      case 'K':
        rows[0] += "██   ██";
        rows[1] += "██  ██ ";
        rows[2] += "██ ██  ";
        rows[3] += "█████  ";
        rows[4] += "██ ██  ";
        rows[5] += "██  ██ ";
        rows[6] += "██   ██";
        break;
      case 'L':
        rows[0] += "██     ";
        rows[1] += "██     ";
        rows[2] += "██     ";
        rows[3] += "██     ";
        rows[4] += "██     ";
        rows[5] += "██     ";
        rows[6] += "███████";
        break;
      case 'M':
        rows[0] += "██   ██";
        rows[1] += "███ ███";
        rows[2] += "███████";
        rows[3] += "██ █ ██";
        rows[4] += "██   ██";
        rows[5] += "██   ██";
        rows[6] += "██   ██";
        break;
      case 'N':
        rows[0] += "██   ██";
        rows[1] += "███  ██";
        rows[2] += "████ ██";
        rows[3] += "██ ████";
        rows[4] += "██  ███";
        rows[5] += "██   ██";
        rows[6] += "██   ██";
        break;
      case 'O':
        rows[0] += " ██████ ";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += "██   ██";
        rows[4] += "██   ██";
        rows[5] += "██   ██";
        rows[6] += " ██████ ";
        break;
      case 'P':
        rows[0] += "██████  ";
        rows[1] += "██   ██ ";
        rows[2] += "██   ██ ";
        rows[3] += "██████  ";
        rows[4] += "██      ";
        rows[5] += "██      ";
        rows[6] += "██      ";
        break;
      case 'Q':
        rows[0] += " ██████ ";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += "██   ██";
        rows[4] += "██ █ ██";
        rows[5] += "██  ███";
        rows[6] += " █████ █";
        break;
      case 'R':
        rows[0] += "██████  ";
        rows[1] += "██   ██ ";
        rows[2] += "██   ██ ";
        rows[3] += "██████  ";
        rows[4] += "██   ██ ";
        rows[5] += "██   ██ ";
        rows[6] += "██   ██ ";
        break;
      case 'S':
        rows[0] += " ██████ ";
        rows[1] += "██      ";
        rows[2] += "██      ";
        rows[3] += " ██████ ";
        rows[4] += "      ██";
        rows[5] += "      ██";
        rows[6] += " ██████ ";
        break;
      case 'T':
        rows[0] += "████████";
        rows[1] += "    ██  ";
        rows[2] += "    ██  ";
        rows[3] += "    ██  ";
        rows[4] += "    ██  ";
        rows[5] += "    ██  ";
        rows[6] += "    ██  ";
        break;
      case 'U':
        rows[0] += "██   ██";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += "██   ██";
        rows[4] += "██   ██";
        rows[5] += "██   ██";
        rows[6] += " ██████";
        break;
      case 'V':
        rows[0] += "██   ██";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += " ██ ██ ";
        rows[4] += " ██ ██ ";
        rows[5] += "  ███  ";
        rows[6] += "  ███  ";
        break;
      case 'W':
        rows[0] += "██   ██";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += "██ █ ██";
        rows[4] += "███████";
        rows[5] += "██   ██";
        rows[6] += "██   ██";
        break;
      case 'X':
        rows[0] += "██   ██";
        rows[1] += " ██ ██ ";
        rows[2] += "  ███  ";
        rows[3] += "  ███  ";
        rows[4] += "  ███  ";
        rows[5] += " ██ ██ ";
        rows[6] += "██   ██";
        break;
      case 'Y':
        rows[0] += "██   ██";
        rows[1] += " ██ ██ ";
        rows[2] += "  ███  ";
        rows[3] += "  ███  ";
        rows[4] += "   █   ";
        rows[5] += "   █   ";
        rows[6] += "   █   ";
        break;
      case 'Z':
        rows[0] += "███████";
        rows[1] += "    ██ ";
        rows[2] += "   ██  ";
        rows[3] += "  ██   ";
        rows[4] += " ██    ";
        rows[5] += "██     ";
        rows[6] += "███████";
        break;
      case '0':
        rows[0] += " ██████ ";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += "██   ██";
        rows[4] += "██   ██";
        rows[5] += "██   ██";
        rows[6] += " ██████ ";
        break;
      case '1':
        rows[0] += "   ██   ";
        rows[1] += "  ███   ";
        rows[2] += "    ██  ";
        rows[3] += "    ██  ";
        rows[4] += "    ██  ";
        rows[5] += "    ██  ";
        rows[6] += "  █████ ";
        break;
      case '2':
        rows[0] += " ██████ ";
        rows[1] += "      ██";
        rows[2] += "      ██";
        rows[3] += " ██████ ";
        rows[4] += "██      ";
        rows[5] += "██      ";
        rows[6] += "████████";
        break;
      case '3':
        rows[0] += " ██████ ";
        rows[1] += "      ██";
        rows[2] += "      ██";
        rows[3] += " ██████ ";
        rows[4] += "      ██";
        rows[5] += "      ██";
        rows[6] += " ██████ ";
        break;
      case '4':
        rows[0] += "██   ██";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += "███████";
        rows[4] += "     ██";
        rows[5] += "     ██";
        rows[6] += "     ██";
        break;
      case '5':
        rows[0] += "███████";
        rows[1] += "██      ";
        rows[2] += "██      ";
        rows[3] += "███████ ";
        rows[4] += "      ██";
        rows[5] += "      ██";
        rows[6] += "███████ ";
        break;
      case '6':
        rows[0] += " ██████ ";
        rows[1] += "██      ";
        rows[2] += "██      ";
        rows[3] += "███████ ";
        rows[4] += "██   ██";
        rows[5] += "██   ██";
        rows[6] += " ██████ ";
        break;
      case '7':
        rows[0] += "████████";
        rows[1] += "      ██";
        rows[2] += "     ██ ";
        rows[3] += "    ██  ";
        rows[4] += "   ██   ";
        rows[5] += "  ██    ";
        rows[6] += " ██     ";
        break;
      case '8':
        rows[0] += " ██████ ";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += " ██████ ";
        rows[4] += "██   ██";
        rows[5] += "██   ██";
        rows[6] += " ██████ ";
        break;
      case '9':
        rows[0] += " ██████ ";
        rows[1] += "██   ██";
        rows[2] += "██   ██";
        rows[3] += " ███████";
        rows[4] += "      ██";
        rows[5] += "      ██";
        rows[6] += " ██████ ";
        break;
      case ' ':
        rows[0] += "        ";
        rows[1] += "        ";
        rows[2] += "        ";
        rows[3] += "        ";
        rows[4] += "        ";
        rows[5] += "        ";
        rows[6] += "        ";
        break;
      default:
        rows[0] += "  ???   ";
        rows[1] += "  ???   ";
        rows[2] += "  ???   ";
        rows[3] += "  ???   ";
        rows[4] += "  ???   ";
        rows[5] += "  ???   ";
        rows[6] += "  ???   ";
    }
    rows[0] += " ";
    rows[1] += " ";
    rows[2] += " ";
    rows[3] += " ";
    rows[4] += " ";
    rows[5] += " ";
    rows[6] += " ";
  }
  
  return rows.join('\n');
}

/* ===================================================================
   ATMOS TERMINAL // COMPLETE FORTUNE ENGINE (DYNAMIC UTILS v10 - SYNCHRONOUS)
=================================================================== */

function fortuneMessage(cmd) {
  // 1. Подсигуряване на базата с късмети от fortunes_data.js
  const fortunes = window.atmosFortunes || ["Късметът е с теб!"];
  const index = Math.floor(Math.random() * fortunes.length);
  const f = fortunes[index];

  if (!cmd) cmd = "/fortune";
  const parts = cmd.trim().split(/\s+/).filter(x => x.length > 0);

  // 2. Стандартна текстова команда: /fortune
  if (parts.length === 1) {
    sendSystemLine(`[FORTUNE] ${f}`);
    return "Fortune delivered.";
  }

  // 3. Графична команда за споделяне: /fortune share
  if (parts.length === 2 && parts[1].toLowerCase() === "share") {
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}.${month}.${year}`;
    const fullTerminalText = `[${dateStr}] Късметът: ${f}`;

    // РОТАЦИЯ НА ХАКЕРСКИ ЛОКАЦИИ (100% СИНХРОННО И ЛОКАЛНО)
    const fakeLocations = [
      "TERMINAL CORE",
      "LOCAL STORAGE",
      "ERROR 404",
      "SYSTEM32 ROOT",
      "127.0.0.1",
      "NULL POINTER",
      "UNKNOWN NODE",
      "PROXY LOOPBACK",
      "DEEP WEB ANON",
      "KERNEL PANIC",
      "ROOT DIRECTORY"
    ];
    const locIndex = Math.floor(Math.random() * fakeLocations.length);
    const dynamicLocation = fakeLocations[locIndex];

    // Детекция за мобилно устройство
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Инициализиране на графичното Canvas ядро
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1080; canvas.height = 1080;

    // Фон (Тъмен, дълбок киберпънк градиент)
    const bgGradient = ctx.createRadialGradient(540, 540, 100, 540, 540, 800);
    bgGradient.addColorStop(0, "#0c1013"); bgGradient.addColorStop(1, "#040507");
    ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Лека фонова текстура (Скан линии)
    ctx.strokeStyle = "rgba(0, 255, 51, 0.015)"; ctx.lineWidth = 1;
    for (let i = 0; i < canvas.height; i += 4) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // ДЖИДЖАНИЯТ СТИЛ: Ярки дебели неонови ъгли
    ctx.strokeStyle = "#00ff33"; ctx.lineWidth = 6; const pad = 35; const len = 50;
    // Горе вляво
    ctx.beginPath(); ctx.moveTo(pad + len, pad); ctx.lineTo(pad, pad); ctx.lineTo(pad, pad + len); ctx.stroke();
    // Горе вдясно
    ctx.beginPath(); ctx.moveTo(canvas.width - pad - len, pad); ctx.lineTo(canvas.width - pad, pad); ctx.lineTo(canvas.width - pad, pad + len); ctx.stroke();
    // Долу вляво
    ctx.beginPath(); ctx.moveTo(pad + len, canvas.height - pad); ctx.lineTo(pad, canvas.height - pad); ctx.lineTo(pad, canvas.height - pad - len); ctx.stroke();
    // Долу вдясно
    ctx.beginPath(); ctx.moveTo(canvas.width - pad - len, canvas.height - pad); ctx.lineTo(canvas.width - pad, canvas.height - pad); ctx.lineTo(canvas.width - pad, canvas.height - pad - len); ctx.stroke();

    // Заглавна линия (Тънка зелена хоризонтална рамка под хедъра)
    ctx.strokeStyle = "rgba(0, 255, 51, 0.15)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(55, 95); ctx.lineTo(canvas.width - 55, 95); ctx.stroke();

    // Текстове в Хедъра (Стил SYSTEM_ACTIVE)
    ctx.fillStyle = "rgba(0, 255, 51, 0.6)"; ctx.font = "bold 24px monospace";
    ctx.fillText("▲ ATMOS TERMINAL // SYSTEM_ACTIVE", 75, 75);
    
    // Малките декоративни хиксове в горния десен ъгъл `× ×`
    ctx.fillStyle = "rgba(0, 255, 51, 0.4)"; ctx.font = "bold 22px monospace";
    ctx.fillText("× ×", canvas.width - 120, 75);

    // СТИЛ НА КЪСМЕТЧЕТО (По-голям, плътен и централно разположен)
    ctx.font = "bold 42px monospace";
    const words = fullTerminalText.split(' '); const lines = []; let currentLine = '';
    for (let n = 0; n < words.length; n++) {
      let testLine = currentLine + words[n] + ' ';
      if (ctx.measureText(testLine).width > (canvas.width - 180) && n > 0) {
        lines.push(currentLine.trim()); currentLine = words[n] + ' ';
      } else { currentLine = testLine; }
    }
    lines.push(currentLine.trim());
    
    const totalHeight = lines.length * 65;
    let startY = (canvas.height / 2) - (totalHeight / 2) + 20;

    // Изчертаване на текста с лек неонов нюанс
    ctx.fillStyle = "#00ff44";
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 90, startY + (i * 65));
    }

    // ФУТЪР: Линия и Статус данни долу
    ctx.strokeStyle = "rgba(0, 255, 51, 0.15)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(55, canvas.height - 115); ctx.lineTo(canvas.width - 55, canvas.height - 115); ctx.stroke();

    // Ляв футер блок (С въртящата се хакерска локация!)
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)"; ctx.font = "18px monospace";
    ctx.fillText(`▶ NODE: ATOMS.FREE.BG // LOCATION: ${dynamicLocation}`, 75, canvas.height - 85);
    ctx.fillText("SECURITY: ENCRYPTED_STATUS_OK", 75, canvas.height - 60);

    // Десен футер блок (Зареждащ зелен правоъгълник от картинката)
    ctx.fillStyle = "rgba(0, 255, 51, 0.15)";
    ctx.fillRect(canvas.width - 230, canvas.height - 88, 150, 20);
    ctx.fillStyle = "#00ff33";
    ctx.fillRect(canvas.width - 230, canvas.height - 88, 100, 20); // Запълнен прогрес

    try {
      const imageBase64 = canvas.toDataURL("image/png");
      const output = document.getElementById("terminalOutput") || document.body;
      
      const fbShareUrl = isMobile ? "https://m.facebook.com/" : "https://www.facebook.com/";
      const xShareUrl = "https://x.com/intent/tweet";
      const igShareUrl = "https://www.instagram.com/";
      
      const downloadHref = isMobile ? "https://tinyurl.com/bmnrux6t" : imageBase64;
      const downloadAttr = isMobile ? "" : `download="atmos_fortune_${dateStr}.png"`;
      const targetAttr = isMobile ? 'target="_blank"' : '';
      
      const uniqueId = Date.now();
      const statusDivId = `db_status_${uniqueId}`;
      const buttonLabel = isMobile ? "[ИЗТЕГЛИ КАРТИЧКАТА ЧРЕЗ БРАУЗЪР]" : "[СВАЛИ ИЗОБРАЖЕНИЕТО (PC)]";

      setTimeout(() => {
        output.innerHTML += `
          <div class="terminal-card-container" style="margin: 20px 0; padding: 15px; border: 1px dashed #00ff33; background: #000; font-family: monospace;">
            <p style="color: #00ff33; margin-bottom: 10px;">[SYSTEM] Картичката е структурирана успешно:</p>
            <img src="${imageBase64}" style="width: 100%; max-width: 350px; border: 1px solid #00ff33; display: block; margin-bottom: 15px;" alt="Atmos Fortune"/>
            
            <a href="${downloadHref}" ${downloadAttr} ${targetAttr} rel="noopener noreferrer" style="background: #00ff33; color: #000; padding: 10px 18px; border: none; font-weight: bold; font-family: monospace; cursor: pointer; display: inline-block; margin-bottom: 15px; text-transform: uppercase; text-decoration: none;">
              ${buttonLabel}
            </a>

            <div id="${statusDivId}" style="color: #888; font-size: 12px; margin-bottom: 10px;">[БЪФЕР] Инициализиране...</div>
            <p style="color: #555; margin-bottom: 10px;">[МРЕЖИ] Публикувай квадрата от твоята галерия:</p>
            <div class="share-buttons-group" style="display: flex; flex-wrap: wrap; gap: 10px;">
              <a href="${fbShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #3b5998; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; display: inline-block;">[FACEBOOK]</a>
              <a href="${igShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #e1306c; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; display: inline-block;">[INSTAGRAM]</a>
              <a href="${xShareUrl}" target="_blank" rel="noopener noreferrer" style="background: #111; color: #fff; padding: 8px 15px; text-decoration: none; font-weight: bold; border: 1px solid #fff; display: inline-block;">[X / TWITTER]</a>
            </div>
          </div>
        `;

        // Бекграунд Firebase синхронизация
        const activeDb = window.db || (typeof firebase !== "undefined" ? firebase.database() : null);
        const statusDiv = document.getElementById(statusDivId);

        if (activeDb) {
          activeDb
            .ref("fortune_buffer")
            .set({
              text: fullTerminalText,
              date: dateStr,
              timestamp: Date.now(),
            })
            .then(() => {
              if (statusDiv) statusDiv.innerHTML = "<span style='color: #00ff33;'>[БЪФЕР] Успешна синхронизация!</span>";
            })
            .catch((err) => {
              console.error("Firebase error:", err);
              if (statusDiv) statusDiv.innerHTML = "<span style='color: #ff6666;'>[ГРЕШКА] Неуспех при синхронизацията</span>";
            });
        } else {
          if (statusDiv) statusDiv.innerHTML = "<span style='color: #ffaa00;'>[ПРЕДУПРЕЖДЕНИЕ] Няма връзка с базата</span>";
        }

        window.scrollTo(0, document.body.scrollHeight);
      }, 500);

      return "Модулът за споделяне е готов.";
    } catch (e) {
      console.error(e);
      return "Грешка в графичното ядро.";
    }
  }
  return "Използвай: /fortune или /fortune share";
}

/* ===================================================================
   GLITCH EFFECT
=================================================================== */

function cmdGlitch() {
  sendSystemLine(`${getNickname()} предизвика glitch.`);
  sendGlobalEffect("glitch");
}

/* ===================================================================
   RAINBOW TEXT
=================================================================== */

function rainbowText(cmd) {
  let text = cmd.substring(8).trim();
  if (!text) return "Usage: /rainbow <text>";

  text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const colors = ["red", "orange", "yellow", "green", "cyan", "blue", "purple"];
  let out = "";

  for (let i = 0; i < text.length; i++) {
    const c = colors[i % colors.length];
    out += `<span style="color:${c}">${text[i]}</span>`;
  }

  sendSystemLine(out);
  return "Rainbow text sent.";
}

/* ===================================================================
   8BALL
=================================================================== */

function eightBall(cmd) {
  const question = cmd.substring(6).trim() || "Без въпрос";

  const answers = [
    "Със сигурност.",
    "Определено е така.",
    "Без съмнение.",
    "Да, абсолютно.",
    "Можеш да разчиташ на това.",
    "Както го виждам, да.",
    "Най-вероятно.",
    "Изглежда добре.",
    "Да.",
    "Знаците сочат към да.",
    "Опитай пак.",
    "Попитай отново по-късно.",
    "По-добре да не ти казвам сега.",
    "Не мога да предвидя сега.",
    "Концентрирай се и попитай пак.",
    "Не разчитай на това.",
    "Моят отговор е не.",
    "Моите източници казват не.",
    "Изглежда зле.",
    "Много малко вероятно."
  ];

  const answer = answers[Math.floor(Math.random() * answers.length)];

  sendSystemLine(`[8BALL]\nВъпрос: "${question}"\nОтговор: ${answer}`);
  return "8ball answered.";
}

/* ===================================================================
   ROLL DICE
=================================================================== */

function rollDice() {
  const n = Math.floor(Math.random() * 6) + 1;
  sendSystemLine(`${getNickname()} хвърли зара → ${n}`);
  return "Dice rolled.";
}

/* ===================================================================
   COIN FLIP
=================================================================== */

function flipCoin() {
  const result = Math.random() < 0.5 ? "Ези" : "Тура";
  sendSystemLine(`${getNickname()} хвърли монета → ${result}`);
  return "Coin flipped.";
}

/* ===================================================================
   HACK POPUP
=================================================================== */

function cmdHack(cmd) {
  const target = cmd.split(" ")[1];
  if (!target) return sendSystemLine("Usage: /hack <nick>");

  sendSystemLine(`${getNickname()} хакна ${target}.`);
  sendGlobalEffect("hack", target);
}

/* ===================================================================
   HTML INJECTION COMMAND
=================================================================== */

function cmdHtml(cmd) {
  const raw = cmd.substring(5).trim();
  if (!raw) return "Usage: /html <html code>";

  if (isDangerousHtml(raw)) {
    sendSystemLine("Добър опит.");
    return "HTML blocked.";
  }

  const safe = sanitizeHtml(raw);
  sendSystemLine(`&lt;${getNickname()}&gt; HTML inject: ${safe}`);
  return "HTML inject payload parsed and sent.";
}