/* ===========================
   TERMINAL ELEMENTS
=========================== */

const terminalInput = document.getElementById("terminalInput");
const terminalOutput = document.getElementById("terminalOutput");

/* ===========================
   TERMINAL INPUT HANDLER
=========================== */

if (terminalInput) {
  terminalInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      const cmd = terminalInput.value.trim();
      terminalInput.value = ""; // Твоят инпут се чисти тук, затова функцията долу няма да го пипа
      runCommand(cmd);
    }
  });
}

/* ===========================
   TERMINAL COMMAND PROCESSOR
=========================== */

function runCommand(cmd) {
  if (!terminalOutput) return;

  const nick = getNickname();
  const prompt = `${nick}@atmos:~$`;

  // Зареждаме състоянието за подниво директно от localStorage
  let terminalMode = JSON.parse(localStorage.getItem("atmos_mode")) || { isActive: false, type: "", target: "" };

  // Ескейпваме командата за логовете на самия терминал, за да не се изпълнява HTML в него
  const safeCmdLog = cmd.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // 1. СТРИКТНА ПРОВЕРКА ЗА ИЗХОД (.exit) - работи в абсолютно всяко състояние
  if (cmd === ".exit") {
    if (terminalMode.isActive) {
      localStorage.setItem("atmos_mode", JSON.stringify({ isActive: false, type: "", target: "" }));
      terminalOutput.innerHTML += `\n${prompt} ${safeCmdLog}\nExited interactive mode.\n`;
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
      updatePrompt();
      return;
    }
    terminalOutput.innerHTML += `\n${prompt} ${safeCmdLog}\nTerminal is already in standard mode.\n`;
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    return;
  }

  // 2. АКО СМЕ В АКТИВНО ПОДНИВО: Хваща чистия текст и го пренасочва на секундата
  if (terminalMode.isActive) {
    if (cmd.length === 0) return; // Празен Enter - пропускаме

    // Определяме какъв промпт да се отпечата в терминала за лог на съобщението
    let currentPrompt = `${nick}@atmos:~$`;
    if (terminalMode.type === "chat") currentPrompt = `${nick}@atmos[CHAT]:~$`;
    if (terminalMode.type === "su") currentPrompt = `${nick}@atmos[SU:${terminalMode.target}]:~$`;
    if (terminalMode.type === "room") currentPrompt = `${nick}@atmos[ROOM:${terminalMode.target}]:~$`;

    // Логваме какво сме написали
    terminalOutput.innerHTML += `\n${currentPrompt} ${safeCmdLog}\n`;

    // Пращаме към съответната бекенд функция
    if (terminalMode.type === "chat") {
      sendChatMessage(cmd);
    } else if (terminalMode.type === "su") {
      sendPrivateMessage(terminalMode.target, cmd);
    } else if (terminalMode.type === "room") {
      sendRoomMessage(terminalMode.target, cmd);
    }

    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    return;
  }

  // HTML injection safety: ако започва с < → не е команда
  if (cmd.startsWith("<")) {
    terminalOutput.innerHTML += `\n${prompt} ${safeCmdLog}\nUnknown command.\n`;
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    updatePrompt();
    return;
  }

  terminalOutput.innerHTML += `\n${prompt} ${safeCmdLog}\n`;

  let response = "";

  /* ----- EASTER EGGS ----- */
  if (isEasterEggCommand(cmd)) {
    const result = runEasterEggCommand(cmd);
    if (result) {
        terminalOutput.innerHTML += result + "\n";
    }
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    updatePrompt();
    return;
  }

     /* ----- HELP ----- */
  if (cmd === "/help") {
    response =
`Available commands:

CHAT COMMANDS
  /chat &lt;msg&gt;\t\t\tSend a public message
  /su &lt;nick&gt; &lt;msg&gt;\t\tSend a private message
  /nickname &lt;name&gt;\t\tChange your nickname

ROOM COMMANDS
  /room enter &lt;name&gt;\t\tJoin a room
  /room leave &lt;name&gt;\t\tLeave a room
  /room list\t\t\tList joined rooms
  /room &lt;name&gt; &lt;msg&gt;\t\tSend message to a room
  /show all\t\t\tShow all messages (default)
  /show main\t\t\tShow only main + private
  /show private\t\t\tShow only private messages
  /show &lt;room&gt;\t\t\tShow only a specific room + private

NAVIGATION COMMANDS (INTERACTIVE MODE)
  /cd chat\t\t\tEnter interactive public chat
  /cd su &lt;nick&gt;\t\t\tEnter interactive private chat
  /cd room &lt;name&gt;\t\tEnter interactive room chat
  .exit\t\t\t\tExit interactive mode back to shell

NOTIFICATION COMMANDS
  /mute\t\t\t\tMute main + rooms
  /mute main\t\t\tMute only main messages
  /mute rooms\t\t\tMute only room messages
  /unmute\t\t\tUnmute everything

RADIO COMMANDS
  /play &lt;num&gt;\t\t\tPlay radio station
  /pause\t\t\tPause radio
  /volume &lt;0-100&gt;\t\tSet radio volume
  /stations\t\t\tList available stations
  /random\t\t\tPlay random station

TAROT COMMANDS
  /tarot\t\t\tDraw a single tarot card
  /tarot share\t\t\tGenerate single card image
  /tarot read &lt;question&gt;\t3-card reading (Past/Present/Future)
  /tarot read love &lt;q&gt;\t\tLove spread (You/Partner/Relationship)
  /tarot read cross &lt;q&gt;\t\tCrossroads (You/Path A/Path B/Advice)
  /tarot read 5 &lt;q&gt;\t\t5-card deep reading
  /tarot read share\t\tShare the last reading as image

RUNE COMMANDS
  /runes\t\t\tDraw a single rune
  /runes share\t\t\tGenerate single rune image
  /runes read &lt;question&gt;\t3-rune reading (Past/Present/Future)
  /runes read odin &lt;q&gt;\t\tOdin's Cross (5 runes)
  /runes read hammer &lt;q&gt;\t\tThor's Hammer (Situation/Obstacle/Action)
  /runes read cross &lt;q&gt;\t\t4-rune cross (You/Situation/Advice/Result)
  /runes read wheel &lt;q&gt;\t\tRunic Wheel (12 runes in circle)
  /runes read share\t\tShare the last reading as image

OGHAM COMMANDS
  /ogham\t\t\tDraw a single ogham letter
  /ogham share\t\t\tGenerate single ogham image
  /ogham read &lt;question&gt;\t3-tree reading (Past/Present/Future)
  /ogham read druid &lt;q&gt;\t\tDruid's Path (Situation/Obstacle/Action)
  /ogham read grove &lt;q&gt;\t\tSacred Grove (5 trees)
  /ogham read cross &lt;q&gt;\t\tTree Cross (You/Situation/Advice/Result)
  /ogham read share\t\tShare the last reading as image

NUMEROLOGY COMMANDS
  /num me &lt;name&gt; &lt;DD.MM.YYYY&gt;\tSave your profile
  /num you &lt;name&gt; &lt;DD.MM.YYYY&gt;\tSave second profile
  /num\t\t\t\tShow your full analysis
  /num you\t\t\tShow second profile analysis
  /num love\t\t\tLove compatibility
  /num biz\t\t\tBusiness compatibility
  /num friend\t\t\tFriendship compatibility
  /num today\t\t\tPersonal day message
  /num share\t\t\tGenerate result image
  /num clear me|you\t\tDelete profile

CHAKRA COMMANDS
  /chakras\t\t\t\tList all 7 chakras
  /chakras &lt;name&gt;\t\tInfo about a chakra
  /chakras practice [topic]\t\tPractice or list of topics
  /chakras today\t\t\tChakra of the day (planetary)
  /chakras me &lt;name&gt; &lt;date&gt;\tPersonal chakra profile
  /chakras share\t\t\tGenerate result image
  /chakras clear\t\t\tDelete personal profile

MANTRA COMMANDS
  /mantra\t\t\t\tRandom mantra (in main chat)
  /mantra share\t\t\tGenerate image of last mantra
  /mantra &lt;name&gt;\t\tDetails about a mantra
  /mantra practice\t\t\tList all practice themes
  /mantra practice &lt;theme&gt;\tMantra for a specific theme
  /mantra themes\t\t\tSame as /mantra practice

SIGIL COMMANDS
  /sigil &lt;intention&gt;\t\tGenerate personal sigil
  /sigil share\t\t\tRepeat last sigil as image
  /sigil reverse &lt;intention&gt;\tSigil for banishing
  /sigil goetia\t\t\tRandom demon (in main chat)
  /sigil goetia share\t\tRandom demon image
  /sigil goetia &lt;name&gt;\t\tDetails about a demon

LENORMAND COMMANDS
  /lenormand\t\t\tRandom card (in main chat)
  /lenormand share\t\tRandom card as image
  /lenormand &lt;number|name&gt;\tDetails about a card (1-36)
  /lenormand read &lt;question&gt;\t3-card reading with combination
  /lenormand read share\t\tShare last 3-card reading as image
  /lenormand grand [man|woman] &lt;q&gt;\tGrand Tableau (36 cards)
  /lenormand grand share\t\tShare last Grand Tableau as image

PSYCHE COMMANDS
  /psyche &lt;text&gt;\t\tПсихологически анализ на текст
  /psyche share\t\t\tКартинка с последния анализ

TERMINAL COMMANDS
  /theme dark\t\t\tSwitch to dark theme
  /theme light\t\t\tSwitch to light theme
  /swap\t\t\t\tSwap between normal and crypto mod
  /key\t\t\t\tEnter the crypto key for decoding
  /generate text\t\tGenerate unique Story for Instagram/FB
  /clear\t\t\tClear terminal
  /about\t\t\tAbout Atmos
  /help\t\t\t\tShow this help`;
  }

  /* ----- NAVIGATION SYSTEM: /cd ----- */
  else if (cmd.startsWith("/cd")) {
    const parts = cmd.split(/\s+/);

    if (parts.length === 1) {
      response = "Error: Invalid directory format. Usage: /cd [chat | su <nick> | room <name>]";
    } else {
      const targetMode = parts[1].toLowerCase();

      if (targetMode === "chat") {
        if (parts.length === 2) {
          localStorage.setItem("atmos_mode", JSON.stringify({ isActive: true, type: "chat", target: "" }));
          response = "Entered interactive CHAT mode. Type messages freely. Type '.exit' to leave.";
          setTimeout(updatePrompt, 10);
        } else {
          response = "Error: /cd chat does not take extra arguments.";
        }
      } 
      
      else if (targetMode === "su") {
        if (parts.length === 3) {
          const targetUser = parts[2];
          localStorage.setItem("atmos_mode", JSON.stringify({ isActive: true, type: "su", target: targetUser }));
          response = `Entered interactive PRIVATE mode with [${targetUser}]. Type '.exit' to leave.`;
          setTimeout(updatePrompt, 10);
        } else {
          response = "Error: Invalid format. Usage: /cd su <nickname>";
        }
      } 
      
      else if (targetMode === "room") {
        if (parts.length === 3) {
          const roomName = parts[2];
          
          const rooms = getJoinedRooms();
          if (!rooms.includes(roomName)) {
            response = `Error: You cannot enter directory '${roomName}'. You must join the room first via '/room enter ${roomName}'`;
          } else {
            localStorage.setItem("atmos_mode", JSON.stringify({ isActive: true, type: "room", target: roomName }));
            response = `Entered interactive ROOM mode [${roomName}]. Type '.exit' to leave.`;
            setTimeout(updatePrompt, 10);
          }
        } else {
          response = "Error: Invalid format. Usage: /cd room <room_name>";
        }
      } 
      
      else {
        response = `Error: Unknown directory '${parts[1]}'.`;
      }
    }
  }

  /* ----- CHAT MESSAGE ----- */
  else if (cmd.startsWith("/chat ")) {
    const text = cmd.substring(6).trim();
    if (!text) response = "Usage: /chat <message>";
    else {
      sendChatMessage(text);
      response = "Message sent.";
    }
  }

  /* ----- PRIVATE MESSAGE ----- */
  else if (cmd.startsWith("/su ")) {
    const parts = cmd.split(" ");
    if (parts.length < 3) response = "Usage: /su <nickname> <message>";
    else {
      const to = parts[1];
      const text = parts.slice(2).join(" ");
      sendPrivateMessage(to, text);
      response = `Private message sent to ${to}.`;
    }
  }

  /* ----- MUTE / UNMUTE ----- */
  else if (cmd === "/mute") {
    muteMain = true;
    muteRooms = true;
    response = "Muted main and rooms.";
  }

  else if (cmd === "/mute main") {
    muteMain = true;
    response = "Muted main messages.";
  }

  else if (cmd === "/mute rooms") {
    muteRooms = true;
    response = "Muted room messages.";
  }

  else if (cmd === "/unmute") {
    muteMain = false;
    muteRooms = false;
    response = "Unmuted all messages.";
  }

/* ----- NICKNAME ----- */
  else if (cmd.startsWith("/nickname")) {
    const parts = cmd.split(" ");
    if (parts.length < 2) response = "Usage: /nickname <newname>";
    else {
      const newNick = parts.slice(1).join(" ");

      // РЕГЕКС ЗАЩИТА: Позволява само букви (вкл. кирилица), цифри, интервали, тирета и долни черти
      // Ако има какъвто и да е друг символ (като <, >, /, &, $, @), гърми с грешка
      const validNickRegex = /^[a-zA-Z0-9а-яА-ЯёЁ\s_\-]+$/;

      if (!validNickRegex.test(newNick)) {
        response = "Error: Nickname contains invalid characters. Use only letters, numbers, spaces, - or _";
      } else if (newNick.length > 20) { 
        // Бонус предпазител: да не си сложат име от 100 символа, което да разтегли интерфейса
        response = "Error: Nickname is too long. Maximum length is 20 characters.";
      } else {
        setNickname(newNick);
        reloadChatMessages();
        response = `Nickname changed to: ${newNick}`;
      }
    }
  }

  /* ----- THEME ----- */
  else if (cmd.startsWith("/theme")) {
    if (cmd.includes("dark")) {
      setTheme("dark");
      response = "Theme set to dark.";
    } else if (cmd.includes("light")) {
      setTheme("light");
      response = "Theme set to light.";
    } else {
      response = "Usage: /theme dark OR /theme light";
    }
  }

  /* ----- PLAY STATION ----- */
  else if (cmd.startsWith("/play")) {
    const index = parseInt(cmd.split(" ")[1]);
    if (!isNaN(index) && stations[index - 1]) {
      playStation(stations[index - 1].url);
      response = `Playing: ${stations[index - 1].name}`;
    } else response = "Invalid station number.";
  }

  /* ----- PAUSE ----- */
  else if (cmd === "/pause") {
    pauseMusic();
    response = "Music paused.";
  }

  /* ----- VOLUME ----- */
  else if (cmd.startsWith("/volume")) {
    const parts = cmd.split(" ");
    const value = parseInt(parts[1]);
    if (isNaN(value) || value < 0 || value > 100) {
      response = "Error: volume must be between 0 and 100.";
    } else {
      const player = document.getElementById("audioPlayer");
      if (player) player.volume = value / 100;
      response = `Volume set to ${value}%`;
    }
  }

  /* ----- STATIONS ----- */
  else if (cmd === "/stations") {
    response = stations.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
  }

  /* ----- RANDOM ----- */
  else if (cmd === "/random") {
    const index = Math.floor(Math.random() * stations.length);
    playStation(stations[index].url);
    response = `Random station: ${stations[index].name}`;
  }

  /* ----- STORY GENERATOR: /generate ----- */
  else if (cmd.startsWith("/generate")) {
    // Извикваме глобалната функция, която добавихме в main.js
    response = generateStoryMessage(cmd);
  }

    /* ----- RUNES ----- */
  else if (cmd === "/runes" || cmd.startsWith("/runes ")) {
    response = runesMessage(cmd);
  }

    /* ----- OGHAM ----- */
  else if (cmd === "/ogham" || cmd.startsWith("/ogham ")) {
    response = oghamMessage(cmd);
  }

    /* ----- MANTRAS ----- */
  else if (cmd === "/mantra" || cmd.startsWith("/mantra ")) {
    response = mantrasMessage(cmd);
  }

      /* ----- PSYCHE ----- */
  else if (cmd === "/psyche" || cmd.startsWith("/psyche ")) {
    response = psycheMessage(cmd);
  }

      /* ----- LENORMAND ----- */
  else if (cmd === "/lenormand" || cmd.startsWith("/lenormand ")) {
    response = lenormandMessage(cmd);
  }

    /* ----- SIGILS ----- */
  else if (cmd === "/sigil" || cmd.startsWith("/sigil ")) {
    response = sigilsMessage(cmd);
  }
  
    /* ----- CHAKRAS ----- */
  else if (cmd === "/chakras" || cmd.startsWith("/chakras ")) {
    response = chakrasMessage(cmd);
  }

    /* ----- NUMEROLOGY ----- */
  else if (cmd === "/num" || cmd.startsWith("/num ")) {
    response = numerologyMessage(cmd);
  }

  /* ----- CLEAR TERMINAL ----- */
  else if (cmd === "/clear") {
    terminalOutput.innerHTML = "Atmos Terminal v2.0\nType /help for commands.";
    return;
  }

  /* ----- ABOUT ----- */
  else if (cmd === "/about") {
    response =
`Atmos — дигитална свободна зона.
Тук думите тежат повече от алгоритмите.

Свободен чат. Без акаунти. Без следене.
Терминалът е входът към света.`;
  }

  /* ----- SHOW SYSTEM ----- */
  else if (cmd.startsWith("/show")) {
    const parts = cmd.split(" ");
    const mode = parts[1];

    if (!mode) response = "Usage: /show all | main | private | <room>";
    else if (mode === "all") {
      showMode = "all";
      showRoom = null;
      reloadChatMessages();
      response = "Showing all messages.";
    } else if (mode === "main") {
      showMode = "main";
      showRoom = null;
      reloadChatMessages();
      response = "Showing only main + private.";
    } else if (mode === "private") {
      showMode = "private";
      showRoom = null;
      reloadChatMessages();
      response = "Showing only private messages.";
    } else {
      showMode = "room";
      showRoom = mode;
      reloadChatMessages();
      response = `Showing only room: ${mode}`;
    }
  }

  /* ----- ROOM SYSTEM ----- */
  else if (cmd.startsWith("/room")) {
    const parts = cmd.split(" ");
    const action = parts[1];

    const forbiddenRooms = ["enter", "leave", "list", "private", "main"];

    if (!action) response = "Usage: /room <enter|leave|list|roomname> [message]";

    else if (action === "list") {
      const rooms = getJoinedRooms();
      response = rooms.length ? "Rooms: " + rooms.join(", ") : "No joined rooms.";
    }

    else if (action === "enter") {
      const room = parts[2];
      if (!room) response = "Usage: /room enter <name>";
      else if (forbiddenRooms.includes(room.toLowerCase())) {
        response = `Error: Cannot create or enter a room named "${room}". It is a reserved system word.`;
      } else {
        const rooms = getJoinedRooms();
        if (!rooms.includes(room)) rooms.push(room);
        localStorage.setItem("rooms", JSON.stringify(rooms));
        reloadChatMessages();
        response = `Entered room: ${room}`;
      }
    }

    else if (action === "leave") {
      const room = parts[2];
      if (!room) response = "Usage: /room leave <name>";
      else if (room.toLowerCase() === "main") {
        response = "Error: You are not allowed to leave the 'main' room.";
      } else {
        let rooms = getJoinedRooms();
        rooms = rooms.filter(r => r !== room);
        localStorage.setItem("rooms", JSON.stringify(rooms));
        reloadChatMessages();
        response = `Left room: ${room}`;
      }
    }

    else {
      const room = action;
      const text = parts.slice(2).join(" ");
      if (!text) response = "Usage: /room <roomname> <message>";
      else if (forbiddenRooms.includes(room.toLowerCase())) {
        response = `Error: "${room}" is a reserved system word, not a valid room.`;
      } else {
        const rooms = getJoinedRooms();
        if (!rooms.includes(room)) response = `You are not in room: ${room}`;
        else {
          sendRoomMessage(room, text);
          response = `Message sent to room: ${room}`;
        }
      }
    }
  }

  /* ==========================================================
     КОМАНДА: /swap (Коригирана)
  ========================================================== */
  else if (cmd.toLowerCase() === "/swap") {
    if (typeof window.cryptoModeActive === "undefined") window.cryptoModeActive = false;
    
    window.cryptoModeActive = !window.cryptoModeActive;

    if (window.cryptoModeActive) {
      localStorage.removeItem("crypto_key"); 
      document.body.classList.add("crypto-mode"); 
      
      // ВЕДНАГА презареждаме чата, за да изтегли крипто съобщенията (заключени)
      if (typeof reloadChatMessages === "function") reloadChatMessages(); 
      
      response = ">>> SWAPPED TO CRYPTO MODE. TYPE /key <your_key> TO BEGIN.";
    } else {
      localStorage.removeItem("crypto_key"); 
      document.body.classList.remove("crypto-mode"); 
      
      if (typeof reloadChatMessages === "function") reloadChatMessages(); 
      response = ">>> SWAPPED BACK TO NORMAL CHAT MODE.";
    }
    
    if (typeof updatePrompt === "function") updatePrompt();
  }

  /* ==========================================================
     КОМАНДА: /key (Задаване на Ключ - само в Крипто Мод)
  ========================================================== */
  else if (cmd.toLowerCase().startsWith("/key")) {
    // Първо задължителната проверка дали изобщо сме в крипто режим
    if (!window.cryptoModeActive) {
      response = "Error: Command /key is only available in CRYPTO MODE. Type /swap first.";
    } else {
      // Взимаме всичко след "/key "
      const inputKey = cmd.substring(5).trim();
      
      if (!inputKey) {
        response = "Usage: /key <your_secret_key>";
      } else {
        localStorage.setItem("crypto_key", inputKey); // Набиваме ключа
        if (typeof reloadChatMessages === "function") reloadChatMessages(); // Рефреш за декриптиране в реално време
        response = ">>> CRYPTO KEY INJECTED SUCCESSFULLY.";
      }
    }
  }

  /* ----- UNKNOWN COMMAND ----- */
  else {
    response = `Unknown command: ${cmd}`;
  }

  terminalOutput.innerHTML += response + "\n";
  terminalOutput.scrollTop = terminalOutput.scrollHeight;

  updatePrompt();
}