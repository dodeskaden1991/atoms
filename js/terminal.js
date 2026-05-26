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
      terminalInput.value = "";
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

  // Ескейпваме командата за логовете на самия терминал, за да не се изпълнява HTML в него
  const safeCmdLog = cmd.replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
  /chat <msg>             Send a public message
  /su <nick> <msg>        Send a private message
  /nickname <name>        Change your nickname

ROOM COMMANDS
  /room enter <name>      Join a room
  /room leave <name>      Leave a room
  /room list              List joined rooms
  /room <name> <msg>      Send message to a room
  /show all               Show all messages (default)
  /show main              Show only main + private
  /show private           Show only private messages
  /show <room>            Show only a specific room + private

NOTIFICATION COMMANDS
  /mute                   Mute main + rooms
  /mute main              Mute only main messages
  /mute rooms             Mute only room messages
  /unmute                 Unmute everything

RADIO COMMANDS
  /play <num>             Play radio station
  /pause                  Pause radio
  /volume <0-100>         Set radio volume
  /stations               List available stations
  /random                 Play random station

TERMINAL COMMANDS
  /theme dark             Switch to dark theme
  /theme light            Switch to light theme
  /clear                  Clear terminal
  /about                  About Atmos
  /help                   Show this help`;
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

    // Списък със системни и забранени думи за имена на стаи
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