/* ===========================
   EASTER EGG COMMANDS
=========================== */

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
  "/html": cmdHtml,          // ← Добавено и напълно интегрирано
};

const forbiddenHtmlPatterns = [
  /on\w+\s*=/i,          // Хваща абсолютно всички JavaScript събития (onload, onclick, onerror и т.н.)
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
  // Първо ескейпваме всичко глобално за сигурност
  let safe = text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Списъкът с твоите разрешени тагове
  const allowed = ["b", "i", "u", "code", "mark", "small", "a", "font", "img"];

  allowed.forEach(tag => {
    // Регулярни изрази, които хващат ескейпнатите тагове и техните атрибути
    const open = new RegExp(`&lt;(${tag})(\\s[^&>]*)?&gt;`, "gi");
    const close = new RegExp(`&lt;\/(${tag})&gt;`, "gi");

    // Връщаме обратно САМО чистите и разрешени тагове като истински HTML
    safe = safe.replace(open, "<$1$2>");
    safe = safe.replace(close, "</$1>");
  });

 safe = safe.replace(/<img(.*?)src=["'](.*?)["'](.*?)>/gi, (m, a, src, b) => {
    if (!src.trim().toLowerCase().startsWith("https://")) return "";
    
    // Добавяме loading="lazy" и decoding="async" за светкавичен текст
    return `<img src="${src}" loading="lazy" decoding="async" style="max-width:100px;max-height:100px;display:inline-block;vertical-align:middle;" onload="this.parentNode.scrollTop = this.parentNode.scrollHeight;">`;
  });

  // Допълнителна защита за линкове <a> срещу скрити javascript/data схеми
  safe = safe.replace(/<a(.*?)href=["'](.*?)["'](.*?)>/gi, (m, a, href, b) => {
    if (href.toLowerCase().includes("javascript:") || href.toLowerCase().includes("data:")) {
      return `<a${a}href="#"${b}>`;
    }
    return `<a${a}href="${href}" target="_blank" rel="noopener noreferrer"${b}>`;
  });

  return safe;
}

/* ===========================
   COMMAND CHECK
=========================== */

function isEasterEggCommand(cmd) {
  const base = cmd.split(" ")[0];
  return easterEggCommands[base] !== undefined;
}

/* ===========================
   COMMAND EXECUTION
=========================== */

function runEasterEggCommand(cmd) {
  const base = cmd.split(" ")[0];
  return easterEggCommands[base](cmd);
}

/* ===========================
   MATRIX EFFECT
=========================== */

function cmdMatrix() {
  sendSystemLine(`${getNickname()} пусна Matrix.`);
  sendGlobalEffect("matrix");
}

/* ===========================
   KICK POPUP
=========================== */

function cmdKick(cmd) {
  const target = cmd.split(" ")[1];
  if (!target) return sendSystemLine("Usage: /kick <nick>");

  sendSystemLine(`${getNickname()} изрита ${target}.`);
  sendGlobalEffect("kick", target);
}

/* ===========================
   ASCII BANNER
=========================== */

function asciiBanner(cmd) {
  const text = cmd.substring(7).trim();
  if (!text) return "Usage: /ascii <text>";

  const banner = generateAscii(text);
  sendSystemLine("\n" + banner);
  return "ASCII banner sent.";
}

function generateAscii(text) {
  const font = {
    "A": ["    ___   ", "   / _ \\  ", "  / /_\\ \\ ", "  |  _  | ", "  | | | | ", "  \\_| |_/ "],
    "B": [" ______  ", " | ___ \\ ", " | |_/ / ", " | ___ \\ ", " | |_/ / ", " \\____/  "],
    "C": ["  _____  ", " /  __ \\ ", " | /  \\/ ", " | |     ", " | \\__/\\ ", "  \\____/ "],
    "D": [" ______  ", " |  _  \\ ", " | | | | ", " | | | | ", " | |/ /  ", " |___/   "],
    "E": [" ______  ", " |  ___| ", " | |_    ", " |  _|   ", " | |     ", " \\_|     "],
    "F": [" ______  ", " |  ___| ", " | |_    ", " |  _|   ", " | |     ", " \\_|     "],
    "G": ["  _____  ", " /  __ \\ ", " | |  \\/ ", " | | __  ", " | |_\\ \\ ", "  \\____/ "],
    "H": [" _   _   ", " | | | | ", " | |_| | ", " |  _  | ", " | | | | ", " \\_| |_/ "],
    "I": [" _____ ", " |_   _|", "   | |  ", "   | |  ", "  _| |_ ", "  \\___/ "],
    "J": ["      ___ ", "     |_  |", "       | |", "       | |", "   /\\__/ /", "   \\____/ "],
    "K": [" _   __ ", " | | / /", " | |/ / ", " |   \\ ", " | |\\  \\", " \\_| \\_/ "],
    "L": [" _      ", " | |     ", " | |     ", " | |     ", " | |____ ", " \\_____/ "],
    "M": [" __  __ ", " |  \\/  |", " | .  . |", " | |\\/| |", " | |  | |", " \\_|  |_/ "],
    "N": [" _   _  ", " | \\ | | ", " |  \\| | ", " | . ` | ", " | |\\  | ", " \\_| \\_/ "],
    "O": ["  _____  ", " /  _  \\ ", " | | | | ", " | | | | ", " | |_| | ", " \\_____/ "],
    "P": [" ______  ", " | ___ \\ ", " | |_/ / ", " |  __/  ", " | |     ", " \\_|     "],
    "Q": ["  _____  ", " /  _  \\ ", " | | | | ", " | | | | ", " | |/ /  ", " \\___/\\_\\"],
    "R": [" ______  ", " | ___ \\ ", " | |_/ / ", " |    /  ", " | |\\ \\  ", " \\_| \\_| "],
    "S": ["  _____ ", " /  ___|", " \\ `--. ", "  `--. \\", " /\\__/ /", " \\____/ "],
    "T": [" _____ ", " |_   _|", "   | |  ", "   | |  ", "   | |  ", "   \\_/  "],
    "U": [" _   _  ", " | | | | ", " | | | | ", " | | | | ", " | |_| | ", "  \\___/  "],
    "V": [" _   _ ", " | | | |", " | | | |", " | | | |", " \\ \\_/ /", "  \\___/ "],
    "W": [" _    _ ", " | |  | |", " | |  | |", " | |/\\| |", " \\  /\\  /", "  \\/  \\/ "],
    "X": [" __   __ ", " \\ \\ / / ", "  \\ V /  ", "  /   \\  ", " / /^\\ \\ ", " \\/   \\/ "],
    "Y": [" _   _ ", " | | | |", " | |_| |", " \\___  |", "     | |", "     \\_/ "],
    "Z": [" ______ ", " |___  /", "    / / ", "   / /  ", " ./ /___", " \\_____/ "],
    "0": ["  _____  ", " /  _  \\ ", " | | | | ", " | | | | ", " | |_| | ", " \\_____/ "],
    "1": ["  __ ", " /_ |", "  | |", "  | |", "  | |", "  |_|"],
    "2": ["  _____ ", " |___  |", "    / / ", "   / /  ", "  / /__ ", " |_____|"],
    "3": ["  _____ ", " |___  |", "    _| |", "    |_  <", "  ___| |", " |____/ "],
    "4": [" _  _   ", " | || |  ", " | || |_ ", " |__   _|", "     | |  ", "     |_|  "],
    "5": ["  _____ ", " |  ___|", " |___ \\ ", "      \\ \\", " /\\__/ /", " \\____/ "],
    "6": ["  _____ ", " /  ___|", " | |___ ", " |  _  \\", " | |_| |", " \\_____/ "],
    "7": [" ______ ", " |___  /", "    / / ", "   / /  ", "  / /   ", " /_/    "],
    "8": ["  _____ ", " /  _  \\", " \\ |_| /", " /  _  \\", " | |_| |", " \\_____/ "],
    "9": ["  _____ ", " /  _  \\", " | |_| |", " \\____ |", "  ___| |", " |_____/ "],
    " ": ["   ","   ","   ","   ","   ","   "]
  };

  const upper = text.toUpperCase();
  let out = "";

  for (let row = 0; row < 6; row++) {
    for (let char of upper) {
      out += (font[char] ? font[char][row] : " ??? ") + " ";
    }
    out += "\n";
  }

  return out;
}

/* ===========================
   FORTUNE
=========================== */

function fortuneMessage() {
  const fortunes = [
    "Щастието идва при подготвените.",
    "Понякога мълчанието е най‑силният отговор.",
    "Усмихни се — някой те наблюдава.",
    "Днес е добър ден за ново начало.",
    "Съдбата обича смелите."
  ];

  const f = fortunes[Math.floor(Math.random() * fortunes.length)];
  sendSystemLine(`[FORTUNE] ${f}`);
  return "Fortune delivered.";
}

/* ===========================
   GLITCH EFFECT
=========================== */

function cmdGlitch() {
  sendSystemLine(`${getNickname()} предизвика glitch.`);
  sendGlobalEffect("glitch");
}

/* ===========================
   RAINBOW TEXT (Safe implementation)
=========================== */

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

/* ===========================
   8BALL
=========================== */

function eightBall(cmd) {
  const question = cmd.substring(6).trim() || "Без въпрос";

  const answers = [
    "Да.",
    "Не.",
    "Може би.",
    "Със сигурност.",
    "Не питай това пак."
  ];

  const answer = answers[Math.floor(Math.random() * answers.length)];

  sendSystemLine(`[8BALL]\nВъпрос: "${question}"\nОтговор: ${answer}`);
  return "8ball answered.";
}

/* ===========================
   ROLL DICE
=========================== */

function rollDice() {
  const n = Math.floor(Math.random() * 6) + 1;
  sendSystemLine(`${getNickname()} хвърли зара → ${n}`);
  return "Dice rolled.";
}

/* ===========================
   COIN FLIP
=========================== */

function flipCoin() {
  const result = Math.random() < 0.5 ? "Ези" : "Тура";
  sendSystemLine(`${getNickname()} хвърли монета → ${result}`);
  return "Coin flipped.";
}

/* ===========================
   HACK POPUP
=========================== */

function cmdHack(cmd) {
  const target = cmd.split(" ")[1];
  if (!target) return sendSystemLine("Usage: /hack <nick>");

  sendSystemLine(`${getNickname()} хакна ${target}.`);
  sendGlobalEffect("hack", target);
}

/* ===========================
   HTML INJECTION COMMAND
=========================== */

function cmdHtml(cmd) {
  const raw = cmd.substring(5).trim();
  if (!raw) return "Usage: /html <html code>";

  // 1) Бърза филтрация за тежки XSS атаки и опасни тагове
  if (isDangerousHtml(raw)) {
    sendSystemLine("Добър опит.");
    return "HTML blocked.";
  }

  // 2) Пречистване на кода и превръщане на разрешените тагове в реални HTML обекти
  const safe = sanitizeHtml(raw);

  // Промяната е ТУК - използваме обратни кавички `` за изпълнение на функцията
  sendSystemLine(`&lt;${getNickname()}&gt; HTML inject: ${safe}`);

  // Връщаме чист текст към терминала, за да не се инжектира или променя нищо в него
  return "HTML inject payload parsed and sent.";
}