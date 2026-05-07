/* ===========================
   TERMINAL ELEMENTS
=========================== */

const terminalInput = document.getElementById("terminalInput");
const terminalOutput = document.getElementById("terminalOutput");

/* ===========================
   TERMINAL INPUT HANDLER
=========================== */

terminalInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const cmd = terminalInput.value.trim();
    terminalInput.value = "";
    runCommand(cmd);
  }
});

/* ===========================
   TERMINAL COMMAND PROCESSOR
=========================== */

function runCommand(cmd) {
  const nick = getNickname();
  const prompt = `${nick}@atmos:~$`;

  // echo command
  terminalOutput.innerHTML += `\n${prompt} ${cmd}\n`;

  let response = "";

  /* ----- HELP ----- */
  if (cmd === "/help") {
    response =
`Available commands:
  /help                 Show this help
  /chat <msg>           Send a chat message
  /su <nickname> <msg>  Send private message
  /nickname <name>      Change your nickname
  /theme dark           Switch to dark theme
  /theme light          Switch to light theme
  /play <num>           Play radio station
  /pause                Pause music
  /stations             List available stations
  /random               Play random station
  /clear                Clear terminal
  /about                About Atmos
  /volume <0-100>       Set radio volume`;
  }

  /* ----- CHAT MESSAGE ----- */
  else if (cmd.startsWith("/chat ")) {
    const text = cmd.substring(6).trim();

    if (text.length === 0) {
      response = "Usage: /chat <message>";
    } else {
      sendChatMessage(text);
      response = "Message sent.";
    }
  }

  /* ----- PRIVATE MESSAGE ----- */
  else if (cmd.startsWith("/su ")) {
    const parts = cmd.split(" ");

    if (parts.length < 3) {
      response = "Usage: /su <nickname> <message>";
    } else {
      const to = parts[1];
      const text = parts.slice(2).join(" ");

      sendPrivateMessage(to, text);
      response = `Private message sent to ${to}.`;
    }
  }
    /* ----- MUTE NOTIFICATIONS ----- */
  else if (cmd === "/mute") {
    notificationsMuted = true;
    response = "Notifications muted.";
  }

  /* ----- UNMUTE NOTIFICATIONS ----- */
  else if (cmd === "/unmute") {
    notificationsMuted = false;
    response = "Notifications unmuted.";
  }

  /* ----- NICKNAME ----- */
  else if (cmd.startsWith("/nickname")) {
    const parts = cmd.split(" ");
    if (parts.length < 2) {
      response = "Usage: /nickname <newname>";
    } else {
      const newNick = parts.slice(1).join(" ");
      setNickname(newNick);
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
    } else {
      response = "Invalid station number.";
    }
  }

  /* ----- PAUSE ----- */
  else if (cmd === "/pause") {
    pauseMusic();
    response = "Music paused.";
  }
  /* ----- VOLUME ----- */
  else if (cmd.startsWith("/volume")) {
    const parts = cmd.split(" ");
    if (parts.length < 2) {
      response = "Usage: /volume <0-100>";
    } else {
      const value = parseInt(parts[1]);
      if (isNaN(value) || value < 0 || value > 100) {
        response = "Error: volume must be between 0 and 100.";
      } else {
        const audio = document.getElementById("audioPlayer");
        audio.volume = value / 100;
        response = `Volume set to ${value}%`;
      }
    }
  }
  /* ----- STATIONS ----- */
  else if (cmd === "/stations") {
    response = stations
      .map((s, i) => `${i + 1}. ${s.name}`)
      .join("\n");
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

  /* ----- UNKNOWN COMMAND ----- */
  else {
    response = `Unknown command: ${cmd}`;
  }

  /* ----- PRINT RESPONSE ----- */
  terminalOutput.innerHTML += response + "\n";
  terminalOutput.scrollTop = terminalOutput.scrollHeight;

  // update prompt after nickname change
  updatePrompt();
}
