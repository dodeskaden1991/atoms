/* ==========================================================
   UI MODERN – ЛОГИКА ЗА МОДЕРНИЯ ИНТЕРФЕЙС
   ========================================================== */

window.__isModernUI = true;

(function() {
  'use strict';

  window.showModal = function(title, placeholder, callback) {
    const modal = document.getElementById('customModal');
    const input = document.getElementById('modalInput');
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalCancel');
    document.getElementById('modalTitle').textContent = title;
    input.placeholder = placeholder || '';
    input.value = '';
    modal.style.display = 'flex';
    input.focus();

    function cleanup() {
      modal.style.display = 'none';
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKeydown);
    }
    function onConfirm() {
      const val = input.value.trim();
      if (val) callback(val);
      cleanup();
    }
    function onCancel() { cleanup(); }
    function onKeydown(e) {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    }
    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKeydown);
  };

  function initModernUI() {
    const messagesEl = document.getElementById('messages');
    const terminalOutput = document.getElementById('terminalOutput');
    const terminalInput = document.getElementById('terminalInput');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const roomList = document.getElementById('roomList');
    const contactList = document.getElementById('contactList');
    const currentChatLabel = document.getElementById('currentChatLabel');
    const themeToggle = document.getElementById('themeToggle');
    const addRoomBtn = document.getElementById('addRoomBtn');
    const addContactBtn = document.getElementById('addContactBtn');
    const switchViewBtn = document.getElementById('switchViewBtn');
    const userNickDiv = document.getElementById('userNick');
    const userNickEdit = document.getElementById('userNickEdit');
    const terminalToggleBtn = document.getElementById('terminalToggleBtn');
    const terminalPopup = document.getElementById('terminalPopup');
    const terminalCloseBtn = document.getElementById('terminalCloseBtn');
    const terminalOverlay = document.getElementById('terminalOverlay');
    const cryptoIndicator = document.getElementById('cryptoIndicator');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const sidebar = document.getElementById('sidebar');

    let currentMode = 'main';
    let currentTarget = null;

    // ========== appendMessage с батчиран филтър ==========
const origAppend = window.appendMessage;
let filterScheduled = false;

function scheduleFilter() {
  if (filterScheduled) return;
  filterScheduled = true;
  requestAnimationFrame(function() {
    filterScheduled = false;
    applyFilter();
  });
}

window.appendMessage = function(text, isPrivate, isRoom) {
  if (text.includes('[SYSTEM]') && /<font\s+color/.test(text)) {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'block';
    wrapper.style.padding = '2px 0';
    wrapper.innerHTML = text;
    messagesEl.appendChild(wrapper);
  } else if (origAppend) {
    origAppend(text, isPrivate, isRoom);
  } else {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'block';
    wrapper.style.padding = '2px 0';
    if (isPrivate) wrapper.className = 'privateMsg';
    else if (isRoom) wrapper.className = 'roomMsg';
    wrapper.textContent = text;
    messagesEl.appendChild(wrapper);
  }

  // ВАЖНО: не пипаме scrollTop тук — origAppend вече го е направил.
  // Филтърът се батчва — веднъж на кадър, не веднъж на съобщение.
  if (currentMode !== 'main') {
    scheduleFilter();
  }
};

    // ========== Стриктно филтриране ==========
    function applyFilter() {
  // Ако сме в main — не пипаме нищо, всичко се вижда по подразбиране.
  if (currentMode === 'main') {
    for (let child of messagesEl.children) {
      child.style.removeProperty('display');
    }
    return;
  }

  const myNick = typeof getNickname === 'function' ? getNickname() : '';
  for (let child of messagesEl.children) {
    const isPrivate = child.classList.contains('privateMsg');
    const isRoom = child.classList.contains('roomMsg');
    const text = child.textContent || '';

    let show = false;
    if (currentMode === 'room') {
      show = isRoom && text.includes('#' + currentTarget);
    } else if (currentMode === 'private') {
      if (isPrivate && currentTarget) {
        const hasTarget = text.includes('<' + currentTarget + '>') || text.includes('@' + currentTarget);
        const hasMe = text.includes('<' + myNick + '>') || text.includes('@' + myNick);
        show = hasTarget && (hasMe || text.includes(currentTarget));
      }
    }
    child.style.setProperty('display', show ? 'block' : 'none', 'important');
  }
}

    function getContacts() {
      try { return JSON.parse(localStorage.getItem('contacts') || '[]'); } catch { return []; }
    }
    function saveContacts(c) { localStorage.setItem('contacts', JSON.stringify(c)); }
    function addContact(name) {
      if (!name) return;
      const c = getContacts();
      if (!c.includes(name)) { c.push(name); saveContacts(c); renderContacts(); }
    }
    function removeContact(name) {
      let c = getContacts().filter(x => x !== name);
      saveContacts(c); 
      renderContacts();
      if (currentMode === 'private' && currentTarget === name) switchToMain();
    }

    function getRooms() { 
      return (typeof getJoinedRooms === 'function') ? getJoinedRooms() : JSON.parse(localStorage.getItem('rooms') || '[]');
    }
    function leaveRoom(name) {
      let r = getRooms().filter(x => x !== name);
      localStorage.setItem('rooms', JSON.stringify(r));
      renderRooms();
      if (currentMode === 'room' && currentTarget === name) switchToMain();
    }

    function renderRooms() {
      const rooms = getRooms();
      roomList.innerHTML = '';
      const mainLi = document.createElement('li');
      mainLi.textContent = '#main';
      mainLi.dataset.room = 'main';
      if (currentMode === 'main') mainLi.classList.add('active');
      mainLi.addEventListener('click', () => switchToMain());
      roomList.appendChild(mainLi);

      rooms.forEach(room => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        const div = document.createElement('div');
        div.textContent = '#' + room;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => switchToRoom(room));

        const leaveBtn = document.createElement('button');
        leaveBtn.textContent = '✕';
        leaveBtn.style.background = 'none';
        leaveBtn.style.border = 'none';
        leaveBtn.style.color = 'var(--text-secondary)';
        leaveBtn.style.cursor = 'pointer';
        leaveBtn.style.fontSize = '14px';
        leaveBtn.style.padding = '2px 6px';
        leaveBtn.title = 'Напусни стаята';
        leaveBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (confirm('Напусни стая ' + room + '?')) leaveRoom(room);
        });

        li.appendChild(div);
        li.appendChild(leaveBtn);
        if (currentMode === 'room' && currentTarget === room) li.classList.add('active');
        roomList.appendChild(li);
      });
    }

    function renderContacts() {
      const contacts = getContacts();
      contactList.innerHTML = '';
      contacts.forEach(name => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        const div = document.createElement('div');
        div.textContent = name;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => switchToPrivate(name));

        const hideBtn = document.createElement('button');
        hideBtn.textContent = '✕';
        hideBtn.style.background = 'none';
        hideBtn.style.border = 'none';
        hideBtn.style.color = 'var(--text-secondary)';
        hideBtn.style.cursor = 'pointer';
        hideBtn.style.fontSize = '14px';
        hideBtn.style.padding = '2px 6px';
        hideBtn.title = 'Премахни от сайдбара';
        hideBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          removeContact(name);
        });

        li.appendChild(div);
        li.appendChild(hideBtn);
        if (currentMode === 'private' && currentTarget === name) li.classList.add('active');
        contactList.appendChild(li);
      });
    }

    function refreshChatState() {
      if (typeof reloadChatMessages === 'function') {
        reloadChatMessages();
      }
      applyFilter();
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function switchToMain() {
      currentMode = 'main';
      currentTarget = null;
      currentChatLabel.textContent = '#main';
      window.showMode = 'all';
      window.showRoom = null;
      renderRooms(); renderContacts(); updateSendBtn();
      refreshChatState();
    }

    function switchToRoom(room) {
      currentMode = 'room';
      currentTarget = room;
      currentChatLabel.textContent = '#' + room;
      window.showMode = 'room';
      window.showRoom = room;
      renderRooms(); renderContacts(); updateSendBtn();
      refreshChatState();
    }

    function switchToPrivate(contact) {
      currentMode = 'private';
      currentTarget = contact;
      currentChatLabel.textContent = '@' + contact;
      window.showMode = 'private';
      window.showRoom = contact;
      renderRooms(); renderContacts(); updateSendBtn();
      refreshChatState();
    }

    function updateSendBtn() {
      if (currentMode === 'main') sendBtn.textContent = '📢 Изпрати';
      else if (currentMode === 'room') sendBtn.textContent = '📢 #' + currentTarget;
      else if (currentMode === 'private') sendBtn.textContent = '✉️ @' + currentTarget;
    }

    function sendMessage() {
      const text = messageInput.value.trim();
      if (!text) return;
      messageInput.value = '';
      if (currentMode === 'main') {
        sendChatMessage(text);
      } else if (currentMode === 'room') {
        sendRoomMessage(currentTarget, text);
      } else if (currentMode === 'private') {
        addContact(currentTarget);
        sendPrivateMessage(currentTarget, text);
      }
    }

    function updateNickDisplay() {
      userNickDiv.textContent = getNickname();
    }
    const origSetNick = window.setNickname;
    if (origSetNick) {
      window.setNickname = function(n) {
        origSetNick(n);
        updateNickDisplay();
      };
    }
    window.addEventListener('storage', function(e) {
      if (e.key === 'nickname') updateNickDisplay();
    });

    userNickEdit.addEventListener('click', function() {
      showModal('Смяна на никнейм', 'Въведете нов ник', function(n) {
        if (n) { setNickname(n); updateNickDisplay(); }
      });
    });

    switchViewBtn.addEventListener('click', function() {
      window.location.href = 'classic.html';
    });

    themeToggle.addEventListener('click', function() {
      const isLight = document.body.classList.contains('light');
      document.body.classList.toggle('light', !isLight);
      localStorage.setItem('theme', isLight ? 'dark' : 'light');
    });

    // ---------- СТРАНИЧНА ЛЕНТА ----------
    let sidebarVisible = false;
    toggleSidebarBtn.textContent = '☰ Меню';
    toggleSidebarBtn.title = 'Покажи/скрий страничната лента';
    
   // Функция за принудително пре-композиране (изчиства "мъртви" зони)
function forceFullRecompose() {
  const layout = document.getElementById('appLayout');
  if (!layout) return;

  const prevDisplay = layout.style.display;
  layout.style.display = 'none';
  void layout.offsetHeight;               // force reflow → WebView унищожава слоевете
  layout.style.display = prevDisplay || '';

  // възстанови скрола на съобщенията
  const msg = document.getElementById('messages');
  if (msg) {
    const st = msg.scrollTop;
    void msg.offsetHeight;
    msg.scrollTop = st;
  }
}

toggleSidebarBtn.addEventListener('click', function() {
  sidebarVisible = !sidebarVisible;

  if (sidebarVisible) {
    sidebar.classList.add('visible');
    sidebar.classList.remove('hidden');

    // ✅ ТУК — изчистване при отваряне
    setTimeout(function() {
      forceFullRecompose();
    }, 280);  // след като 0.25s transition приключи

  } else {
    sidebar.classList.remove('visible');
    sidebar.classList.add('hidden');
  }
});

    if (window.innerWidth > 1024) {
      sidebarVisible = true;
      sidebar.classList.remove('hidden', 'visible');
    } else {
      sidebar.classList.add('hidden');
      sidebar.classList.remove('visible');
    }

    window.addEventListener('resize', function() {
      if (window.innerWidth > 1024) {
        sidebarVisible = true;
        sidebar.classList.remove('hidden', 'visible');
      } else if (!sidebarVisible) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('visible');
      }
    });

    // ---------- ТЕРМИНАЛ ПОП-ЪП ----------
    // Запомни състоянието на sidebar-а преди отваряне на терминала
let sidebarWasVisibleBeforeTerminal = false;

function openTerminal() {
  // Затвори sidebar-а, ако е отворен
  sidebarWasVisibleBeforeTerminal = sidebarVisible;
  if (sidebarVisible) {
    sidebarVisible = false;
    sidebar.classList.remove('visible');
    sidebar.classList.add('hidden');
  }

  terminalPopup.style.display = 'flex';
  //setTimeout(() => terminalInput.focus(), 100);
}

function closeTerminal() {
  terminalPopup.style.display = 'none';

  // Върни sidebar-а, ако е бил отворен
  if (sidebarWasVisibleBeforeTerminal) {
    sidebarVisible = true;
    sidebar.classList.add('visible');
    sidebar.classList.remove('hidden');

    // Форсирай repaint, за да е чисто връщането
    if (typeof forceAtmosRepaint === 'function') {
      setTimeout(forceAtmosRepaint, 50);
    }
  }

  // ✅ НОВО: принудителен popup-refresh след затваряне на терминала
  if (typeof window.atmosScheduleFix === 'function') {
    window.atmosScheduleFix(450);
  }
}
    terminalToggleBtn.addEventListener('click', openTerminal);
    terminalCloseBtn.addEventListener('click', closeTerminal);
    terminalOverlay.addEventListener('click', function(e) {
      if (e.target === this) closeTerminal();
    });

    terminalInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const cmd = terminalInput.value.trim();
        terminalInput.value = '';
        if (cmd && typeof runCommand === 'function') {
          runCommand(cmd);
        }
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
      }
    });

    addRoomBtn.addEventListener('click', function() {
      showModal('Добавяне на стая', 'Име на стаята', function(r) {
        if (r) {
          if (typeof runCommand === 'function') {
            runCommand('/room enter ' + r);
          }
          setTimeout(function() {
            renderRooms();
            switchToRoom(r);
          }, 300);
        }
      });
    });

    addContactBtn.addEventListener('click', function() {
      showModal('Добавяне на контакт', 'Ник на контакта', function(n) {
        if (n) {
          addContact(n);
          setTimeout(function() {
            renderContacts();
            switchToPrivate(n);
          }, 300);
        }
      });
    });

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendMessage();
    });

    // ==========================================================
    // ДИНАМИЧНИ КОНТАКТИ – САМО ЗА РЕАЛНИ НОВИ ВХОДЯЩИ ЛС
    // ==========================================================
    if (window.db) {
      let isHistoryLoaded = false;

      window.db.ref('atmos_chat').limitToLast(1).once('value', function(snapshot) {
        let lastSeenKey = null;
        snapshot.forEach(child => { lastSeenKey = child.key; });

        setTimeout(() => { isHistoryLoaded = true; }, 1000);

        let liveQuery = window.db.ref('atmos_chat').orderByKey();
        if (lastSeenKey) {
          liveQuery = liveQuery.startAfter(lastSeenKey);
        }

        liveQuery.on('child_added', function(snap) {
          if (!isHistoryLoaded) return;

          const msg = snap.val();
          if (msg && msg.private === true) {
            const my = typeof getNickname === 'function' ? getNickname() : '';
            if (msg.to === my && msg.name !== my) {
              addContact(msg.name);
            }
          }
        });
      });
    }

    function updateCryptoUI() {
      if (window.cryptoModeActive) {
        document.body.classList.add('crypto-mode');
        cryptoIndicator.style.display = 'inline';
      } else {
        document.body.classList.remove('crypto-mode');
        cryptoIndicator.style.display = 'none';
      }
    }
    updateCryptoUI();

    const classObserver = new MutationObserver(function() {
      const isCrypto = document.body.classList.contains('crypto-mode');
      cryptoIndicator.style.display = isCrypto ? 'inline' : 'none';
    });
    classObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('visibilitychange', function() {
      if (document.hidden && window.cryptoModeActive) {
        localStorage.removeItem('crypto_key');
        window.cryptoModeActive = false;
        document.body.classList.remove('crypto-mode');
        cryptoIndicator.style.display = 'none';
        if (typeof reloadChatMessages === 'function') reloadChatMessages();
        if (typeof updatePrompt === 'function') updatePrompt();
      }
    });

    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const clock = document.getElementById('clockDisplay');
      if (clock) clock.textContent = `${h}:${m}:${s}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');

    updateNickDisplay();
    renderRooms();
    renderContacts();
    switchToMain();

    setTimeout(function() {
      const ld = document.getElementById('loadingOverlay');
      if (ld) ld.style.display = 'none';
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModernUI);
  } else {
    initModernUI();
  }

})();

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
    default:
      // Fallback за неизвестни ефекти
      console.log("[EFFECT] Unknown effect:", name, payload);
  }
}