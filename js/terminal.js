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
  /chat <msg>\t\t\tSend a public message
  /su <nick> <msg>\t\t\t\tSend a private message
  /nickname <name>\t\tChange your nickname

ROOM COMMANDS
  /room enter <name>\t\tJoin a room
  /room leave <name>\t\tLeave a room
  /room list\t\tList joined rooms
  /room <name> <msg>\t\t\tSend message to a room
  /show all\t\t\tShow all messages (default)
  /show main\t\tShow only main + private
  /show private\t\tShow only private messages
  /show <room>\t\t\tShow only a specific room + private

NAVIGATION COMMANDS (INTERACTIVE MODE)
  /cd chat\t\t\tEnter interactive public chat
  /cd su <nick>\t\t\tEnter interactive private chat
  /cd room <name>\t\t\tEnter interactive room chat
  .exit\t\t\t\tExit interactive mode back to shell

NOTIFICATION COMMANDS
  /mute\t\t\t\tMute main + rooms
  /mute main\t\tMute only main messages
  /mute rooms\t\tMute only room messages
  /unmute\t\t\tUnmute everything

RADIO COMMANDS
  /play <num>\t\t\tPlay radio station
  /pause\t\t\tPause radio
  /volume <0-100>\tSet radio volume
  /stations\t\t\tList available stations
  /random\t\t\tPlay random station

TERMINAL COMMANDS
  /theme dark\t\tSwitch to dark theme
  /theme light\t\tSwitch to light theme
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
      setNickname(newNick);
      reloadChatMessages();
      response = `Nickname changed to: ${newNick}`;
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

  /* ----- UNKNOWN COMMAND ----- */
  else {
    response = `Unknown command: ${cmd}`;
  }

  terminalOutput.innerHTML += response + "\n";
  terminalOutput.scrollTop = terminalOutput.scrollHeight;

  updatePrompt();
}