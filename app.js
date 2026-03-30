// ============================================
// FIREBASE SETUP
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============================================
// GLOBAL VARIABLES - declared once at top
// ============================================
let currentRoomCode = null;
let currentPlayerIndex = 0;
let timerInterval = null;
let myBudget = 100;
let myPlayersCount = 0;
let isHost = false;
let selectedRoomType = 'private';
let myTeamPlayers = [];
let budgetSpent = 0;
let setupBudget = 50;
let setupTimer = 30;
let setupOrder = 'random';
let setupSquadSize = 16;
let startAuctionBtnInitialized = false;

// ============================================
// FIREBASE CONFIG - Replace with your own!
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyAABN4U5N4mxXwkiIBLRsprpv563mR_wd8",
  authDomain: "ipl-auction-game-eae92.firebaseapp.com",
  projectId: "ipl-auction-game-eae92",
  storageBucket: "ipl-auction-game-eae92.firebasestorage.app",
  messagingSenderId: "525729954460",
  appId: "1:525729954460:web:0fbb3ff950a0deddc20b59"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// IPL PLAYERS DATA
// ============================================
const IPL_PLAYERS = [
  { id: 1,  name: "Virat Kohli",       role: "Batsman",      team: "RCB", basePrice: 2 },
  { id: 2,  name: "Rohit Sharma",      role: "Batsman",      team: "MI",  basePrice: 2 },
  { id: 3,  name: "MS Dhoni",          role: "Wicketkeeper", team: "CSK", basePrice: 2 },
  { id: 4,  name: "Jasprit Bumrah",    role: "Bowler",       team: "MI",  basePrice: 2 },
  { id: 5,  name: "Hardik Pandya",     role: "All-rounder",  team: "MI",  basePrice: 2 },
  { id: 6,  name: "KL Rahul",          role: "Batsman",      team: "LSG", basePrice: 1 },
  { id: 7,  name: "Ravindra Jadeja",   role: "All-rounder",  team: "CSK", basePrice: 1 },
  { id: 8,  name: "Shubman Gill",      role: "Batsman",      team: "GT",  basePrice: 1 },
  { id: 9,  name: "Mohammed Siraj",    role: "Bowler",       team: "RCB", basePrice: 1 },
  { id: 10, name: "Rishabh Pant",      role: "Wicketkeeper", team: "DC",  basePrice: 2 },
  { id: 11, name: "Suryakumar Yadav",  role: "Batsman",      team: "MI",  basePrice: 1 },
  { id: 12, name: "Yuzvendra Chahal",  role: "Bowler",       team: "RR",  basePrice: 1 },
  { id: 13, name: "David Warner",      role: "Batsman",      team: "DC",  basePrice: 1 },
  { id: 14, name: "Andre Russell",     role: "All-rounder",  team: "KKR", basePrice: 1 },
  { id: 15, name: "Pat Cummins",       role: "Bowler",       team: "SRH", basePrice: 1 }
];

// ============================================
// SCREEN SWITCHER
// ============================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(function(screen) {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

// ============================================
// STADIUM FLOODLIGHT EFFECT
// ============================================
function initSpotlight() {
  var canvas = document.getElementById('spotlight-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  var lights = [
    {
      x: 0, y: 0,
      swingAmount: 0.15, swingSpeed: 0.008, swingOffset: 0,
      beamWidth: 0.18,
      color1: 'rgba(233,69,96,0.25)', color2: 'rgba(233,69,96,0.0)'
    },
    {
      x: 1, y: 0,
      swingAmount: 0.15, swingSpeed: 0.006, swingOffset: Math.PI,
      beamWidth: 0.18,
      color1: 'rgba(233,69,96,0.25)', color2: 'rgba(233,69,96,0.0)'
    }
  ];

  var time = 0;

  function drawFloodlight(light) {
    var originX = light.x * canvas.width;
    var originY = light.y * canvas.height;
    var swing = Math.sin(time * light.swingSpeed + light.swingOffset) * light.swingAmount;
    var centerX = canvas.width * (0.5 + swing);
    var centerY = canvas.height * 0.85;
    var dx = centerX - originX;
    var dy = centerY - originY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var nx = -dy / dist;
    var ny = dx / dist;
    var halfWidth = dist * light.beamWidth;

    var gradient = ctx.createLinearGradient(originX, originY, centerX, centerY);
    gradient.addColorStop(0, light.color1);
    gradient.addColorStop(0.4, 'rgba(233,69,96,0.12)');
    gradient.addColorStop(1, light.color2);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(centerX + nx * halfWidth, centerY + ny * halfWidth);
    ctx.lineTo(centerX - nx * halfWidth, centerY - ny * halfWidth);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    var coreGradient = ctx.createLinearGradient(originX, originY, centerX, centerY);
    coreGradient.addColorStop(0, 'rgba(255,180,180,0.3)');
    coreGradient.addColorStop(0.3, 'rgba(233,69,96,0.08)');
    coreGradient.addColorStop(1, 'rgba(233,69,96,0)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(centerX + nx * halfWidth * 0.3, centerY + ny * halfWidth * 0.3);
    ctx.lineTo(centerX - nx * halfWidth * 0.3, centerY - ny * halfWidth * 0.3);
    ctx.closePath();
    ctx.fillStyle = coreGradient;
    ctx.fill();
    ctx.restore();

    var sourceGlow = ctx.createRadialGradient(originX, originY, 0, originX, originY, 80);
    sourceGlow.addColorStop(0, 'rgba(255,200,200,0.4)');
    sourceGlow.addColorStop(0.3, 'rgba(233,69,96,0.15)');
    sourceGlow.addColorStop(1, 'rgba(233,69,96,0)');

    ctx.save();
    ctx.beginPath();
    ctx.arc(originX, originY, 80, 0, Math.PI * 2);
    ctx.fillStyle = sourceGlow;
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time++;
    lights.forEach(drawFloodlight);
    requestAnimationFrame(animate);
  }

  animate();
}

initSpotlight();

// ============================================
// AUTH STATE LISTENER
// ============================================
onAuthStateChanged(auth, function(user) {
  if (user) {
    var userRef = doc(db, 'users', user.uid);
    getDoc(userRef).then(function(snapshot) {
      if (snapshot.exists() && snapshot.data().username) {
        var username = snapshot.data().username;
        if (document.getElementById('nav-username'))
          document.getElementById('nav-username').textContent = username;
        if (document.getElementById('hero-username'))
          document.getElementById('hero-username').textContent = username;
        showScreen('screen-lobby');
        loadDashboard(user);
      } else {
        showScreen('screen-username');
      }
    });
  } else {
    showScreen('screen-login');
  }
});

// ============================================
// LOGIN BUTTON
// ============================================
document.getElementById('btn-login').addEventListener('click', function() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  if (email === '' || password === '') {
    document.getElementById('auth-error').textContent = 'Please fill in all fields.';
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(function(userCredential) {
      console.log('Logged in:', userCredential.user.email);
    })
    .catch(function(error) {
      document.getElementById('auth-error').textContent = error.message;
    });
});

// ============================================
// REGISTER BUTTON
// ============================================
document.getElementById('btn-register').addEventListener('click', function() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  if (email === '' || password === '') {
    document.getElementById('auth-error').textContent = 'Please fill in all fields.';
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(function(userCredential) {
      console.log('Registered:', userCredential.user.email);
    })
    .catch(function(error) {
      document.getElementById('auth-error').textContent = error.message;
    });
});

// ============================================
// LOGOUT BUTTON
// ============================================
document.getElementById('btn-logout').addEventListener('click', function() {
  signOut(auth).catch(function(error) {
    console.error('Logout error:', error);
  });
});

// ============================================
// SAVE USERNAME
// ============================================
document.getElementById('btn-save-username').addEventListener('click', async function() {
  var user = auth.currentUser;
  if (!user) return;

  var username = document.getElementById('username-input').value.trim();
  var errorEl = document.getElementById('username-error');

  if (username === '') { errorEl.textContent = 'Please enter a username.'; return; }
  if (username.length < 3) { errorEl.textContent = 'Username must be at least 3 characters.'; return; }
  if (username.length > 20) { errorEl.textContent = 'Username must be under 20 characters.'; return; }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) { errorEl.textContent = 'Only letters, numbers and underscores allowed.'; return; }

  try {
    var usernamesRef = doc(db, 'usernames', username.toLowerCase());
    var usernameSnap = await getDoc(usernamesRef);

    if (usernameSnap.exists()) {
      errorEl.textContent = 'Username already taken! Try another.';
      return;
    }

    var userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      username: username,
      email: user.email,
      uid: user.uid,
      createdAt: new Date()
    });

    await setDoc(usernamesRef, { uid: user.uid });
    showScreen('screen-lobby');
    loadDashboard(user);

  } catch (error) {
    errorEl.textContent = 'Error saving username: ' + error.message;
  }
});

// ============================================
// DASHBOARD
// ============================================
function loadDashboard(user) {
  loadUserStats(user);
  loadActiveEvents();
  loadGlobalLeaderboard(user);
}

function loadUserStats(user) {
  var userRef = doc(db, 'users', user.uid);
  getDoc(userRef).then(function(snapshot) {
    if (!snapshot.exists()) return;
    var data = snapshot.data();
    if (document.getElementById('stat-auctions'))
      document.getElementById('stat-auctions').textContent = data.auctionsPlayed || 0;
    if (document.getElementById('stat-points'))
      document.getElementById('stat-points').textContent = data.globalPoints || 0;
    if (document.getElementById('stat-rank'))
      document.getElementById('stat-rank').textContent = data.globalRank ? '#' + data.globalRank : '#--';
  });
}

function loadActiveEvents() {
  var eventsList = document.getElementById('events-list');
  if (!eventsList) return;

  eventsList.innerHTML =
    '<div class="event-card">' +
      '<div class="event-dot event-dot-live"></div>' +
      '<div class="event-info">' +
        '<div class="event-name">IPL 2026</div>' +
        '<div class="event-meta">Cricket · 74 matches · Mar - Jun 2026</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div class="event-status event-status-live">LIVE</div>' +
        '<div class="event-rooms">Rooms available</div>' +
      '</div>' +
    '</div>' +
    '<div class="event-card">' +
      '<div class="event-dot event-dot-soon"></div>' +
      '<div class="event-info">' +
        '<div class="event-name">T20 World Cup 2026</div>' +
        '<div class="event-meta">Cricket · Jun 2026</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div class="event-status event-status-soon">COMING SOON</div>' +
      '</div>' +
    '</div>';
}

function loadGlobalLeaderboard(user) {
  var lbDiv = document.getElementById('global-leaderboard-preview');
  if (!lbDiv) return;

  lbDiv.innerHTML =
    '<div class="lb-row">' +
      '<span class="lb-rank lb-rank-gold">1</span>' +
      '<div class="lb-avatar">DK</div>' +
      '<span class="lb-name">DraftKing_99</span>' +
      '<span class="lb-pts">3,420 pts</span>' +
    '</div>' +
    '<div class="lb-row">' +
      '<span class="lb-rank lb-rank-silver">2</span>' +
      '<div class="lb-avatar">BM</div>' +
      '<span class="lb-name">BidMaster_X</span>' +
      '<span class="lb-pts">2,980 pts</span>' +
    '</div>' +
    '<div class="lb-row">' +
      '<span class="lb-rank lb-rank-bronze">3</span>' +
      '<div class="lb-avatar">AA</div>' +
      '<span class="lb-name">AuctionAce</span>' +
      '<span class="lb-pts">1,840 pts</span>' +
    '</div>';
}

// ============================================
// ROOM TYPE TOGGLE
// ============================================
document.getElementById('btn-type-private').addEventListener('click', function() {
  selectedRoomType = 'private';
  document.getElementById('btn-type-private').classList.add('active-room-type');
  document.getElementById('btn-type-public').classList.remove('active-room-type');
  document.getElementById('room-type-note').textContent = 'Private rooms are for friends only. Points are not tracked.';
});

document.getElementById('btn-type-public').addEventListener('click', function() {
  selectedRoomType = 'public';
  document.getElementById('btn-type-public').classList.add('active-room-type');
  document.getElementById('btn-type-private').classList.remove('active-room-type');
  document.getElementById('room-type-note').textContent = 'Public rooms are open to all. Points count towards leaderboard.';
});

// ============================================
// HELPER - Generate random 6 char room code
// ============================================
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============================================
// CREATE ROOM BUTTON
// ============================================
document.getElementById('btn-create-room').addEventListener('click', async function() {
  var user = auth.currentUser;
  if (!user) return;

  var roomCode = generateRoomCode();
  currentRoomCode = roomCode;
  isHost = true;
  startAuctionBtnInitialized = false;

  try {
    await setDoc(doc(db, 'rooms', roomCode), {
      code: roomCode,
      host: user.email,
      hostId: user.uid,
      status: 'waiting',
      type: selectedRoomType,
      createdAt: new Date(),
      players: {
        [user.uid]: {
          email: user.email,
          joinedAt: new Date()
        }
      }
    });

    document.getElementById('room-code-display').textContent = roomCode;

    var lockSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    var globeSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
    var indicator = document.getElementById('room-type-indicator');
    if (indicator) {
      indicator.innerHTML = selectedRoomType === 'private'
        ? lockSvg + ' PRIVATE'
        : globeSvg + ' PUBLIC';
    }

    showScreen('screen-room');
    // Show start button immediately for host
    var startBtn = document.getElementById('btn-start-auction');
    if (startBtn) startBtn.style.display = 'flex';
    var guestMsg = document.getElementById('guest-waiting-msg');
    if (guestMsg) guestMsg.style.display = 'none';
    listenToRoom(roomCode);
    listenToAuction(roomCode);

  } catch (error) {
    alert('Error creating room: ' + error.message);
  }
});

// ============================================
// JOIN ROOM BUTTON
// ============================================
document.getElementById('btn-join-room').addEventListener('click', async function() {
  var user = auth.currentUser;
  if (!user) return;

  var code = document.getElementById('join-code').value.toUpperCase().trim();

  if (code === '') {
    alert('Please enter a room code.');
    return;
  }

  try {
    var roomRef = doc(db, 'rooms', code);
    var roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      alert('Room not found! Check the code and try again.');
      return;
    }

    if (roomSnap.data().status !== 'waiting') {
      alert('This room has already started!');
      return;
    }

    await updateDoc(roomRef, {
      ['players.' + user.uid]: {
        email: user.email,
        joinedAt: new Date()
      }
    });

    currentRoomCode = code;
    isHost = false;

    document.getElementById('room-code-display').textContent = code;
    showScreen('screen-room');
    listenToRoom(code);
    listenToAuction(code);

  } catch (error) {
    alert('Error joining room: ' + error.message);
  }
});

// ============================================
// COPY ROOM CODE BUTTON
// ============================================
document.getElementById('btn-copy-code').addEventListener('click', function() {
  var code = document.getElementById('room-code-display').textContent;
  navigator.clipboard.writeText(code).then(function() {
    var btn = document.getElementById('btn-copy-code');
    btn.textContent = 'COPIED!';
    btn.style.background = 'rgba(40,167,69,0.2)';
    btn.style.color = '#28a745';
    setTimeout(function() {
      var svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
      svg += '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>';
      svg += '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
      svg += '</svg> COPY';
      btn.innerHTML = svg;
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  });
});

// ============================================
// BACK TO LOBBY FROM ROOM
// ============================================
document.getElementById('btn-back-to-lobby').addEventListener('click', function() {
  showScreen('screen-lobby');
});

// ============================================
// LISTEN TO ROOM - Real time players list
// ============================================
function listenToRoom(roomCode) {
  var roomRef = doc(db, 'rooms', roomCode);

  onSnapshot(roomRef, function(snapshot) {
    if (!snapshot.exists()) return;

    var data = snapshot.data();
    var players = data.players || {};
    var playerList = document.getElementById('player-list');
    if (!playerList) return;

    playerList.innerHTML = '';
    var count = Object.keys(players).length;

    var countEl = document.getElementById('room-player-count');
    if (countEl) countEl.textContent = count + ' / No limit';

    Object.keys(players).forEach(function(uid) {
      var userRef = doc(db, 'users', uid);
      getDoc(userRef).then(function(userSnap) {
        var displayName = userSnap.exists()
          ? userSnap.data().username
          : players[uid].email;

        var div = document.createElement('div');
        div.className = 'player-item';
        div.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">' +
          '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
          '<circle cx="12" cy="7" r="4"/></svg> ' + displayName;
        playerList.appendChild(div);
      });
    });

    var currentUser = auth.currentUser;
    var startBtn = document.getElementById('btn-start-auction');
    var guestMsg = document.getElementById('guest-waiting-msg');

    if (currentUser && data.hostId === currentUser.uid) {
      if (startBtn) startBtn.style.display = 'flex';
      if (guestMsg) guestMsg.style.display = 'none';
    } else {
      if (startBtn) startBtn.style.display = 'none';
      if (guestMsg) guestMsg.style.display = 'flex';
    }
  });
}

// ============================================
// SETUP AUCTION BUTTON - single listener
// ============================================
document.getElementById('btn-start-auction').addEventListener('click', async function() {
  if (!isHost) return;
  if (!currentRoomCode) return;

  try {
    var roomSnap = await getDoc(doc(db, 'rooms', currentRoomCode));
    if (roomSnap.exists() && roomSnap.data().settingsReady) {
      startAuctionNow();
      return;
    }
    showScreen('screen-setup');
  } catch(error) {
    alert('Error: ' + error.message);
  }
});

// ============================================
// SETUP SCREEN BUTTONS
// ============================================
function initSetupButtons() {
  document.querySelectorAll('.budget-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.budget-btn').forEach(function(b) { b.classList.remove('active-btn'); });
      btn.classList.add('active-btn');
      setupBudget = parseInt(btn.dataset.value);
      document.getElementById('budget-display').textContent = '₹' + setupBudget + ' Cr';
    });
  });

  document.getElementById('btn-custom-budget').addEventListener('click', function() {
    var val = parseInt(document.getElementById('custom-budget').value);
    if (isNaN(val) || val < 10 || val > 500) {
      alert('Please enter a budget between 10 and 500 Cr');
      return;
    }
    document.querySelectorAll('.budget-btn').forEach(function(b) { b.classList.remove('active-btn'); });
    setupBudget = val;
    document.getElementById('budget-display').textContent = '₹' + setupBudget + ' Cr';
  });

  document.querySelectorAll('.timer-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.timer-btn').forEach(function(b) { b.classList.remove('active-btn'); });
      btn.classList.add('active-btn');
      setupTimer = parseInt(btn.dataset.value);
      document.getElementById('timer-display').textContent = setupTimer + 's';
    });
  });

  document.querySelectorAll('.order-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.order-btn').forEach(function(b) { b.classList.remove('active-btn'); });
      btn.classList.add('active-btn');
      setupOrder = btn.dataset.value;
      var labels = { random: 'Random', byTeam: 'By IPL Team', byRole: 'By Role', byPrice: 'By Price' };
      document.getElementById('order-display').textContent = labels[setupOrder];
    });
  });

  document.querySelectorAll('.squad-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.squad-btn').forEach(function(b) { b.classList.remove('active-btn'); });
      btn.classList.add('active-btn');
      setupSquadSize = parseInt(btn.dataset.value);
      document.getElementById('squad-display').textContent = setupSquadSize + ' Players';
    });
  });
}

initSetupButtons();

// ============================================
// BACK TO ROOM FROM SETUP
// ============================================
document.getElementById('btn-back-lobby').addEventListener('click', function() {
  if (currentRoomCode) {
    showScreen('screen-room');
  } else {
    showScreen('screen-lobby');
  }
});

// ============================================
// SAVE SETTINGS BUTTON
// ============================================
document.getElementById('btn-confirm-start').addEventListener('click', async function() {
  if (!currentRoomCode) return;

  try {
    var orderedPlayers = getOrderedPlayers(setupOrder);

    await updateDoc(doc(db, 'rooms', currentRoomCode), {
      settings: {
        budget: setupBudget,
        timer: setupTimer,
        order: setupOrder,
        squadSize: setupSquadSize,
        playerOrder: orderedPlayers.map(function(p) { return p.id; })
      },
      settingsReady: true
    });

    showScreen('screen-room');
    showSettingsSavedBadge();

  } catch (error) {
    alert('Error saving settings: ' + error.message);
  }
});

// ============================================
// SETTINGS SAVED BADGE
// ============================================
function showSettingsSavedBadge() {
  var existing = document.getElementById('settings-saved-badge');
  if (existing) existing.remove();
  var existingEdit = document.getElementById('btn-edit-settings');
  if (existingEdit) existingEdit.remove();

  var startBtn = document.getElementById('btn-start-auction');
  if (!startBtn) return;

  var badge = document.createElement('div');
  badge.id = 'settings-saved-badge';
  badge.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(40,167,69,0.1);border:1px solid rgba(40,167,69,0.3);border-radius:10px;color:#28a745;font-family:var(--font-display);font-size:0.78rem;letter-spacing:1px;margin-bottom:10px;justify-content:center;';
  badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> SETTINGS SAVED';

  var editBtn = document.createElement('button');
  editBtn.id = 'btn-edit-settings';
  editBtn.style.cssText = 'width:100%;padding:12px;background:transparent;border:1px solid rgba(233,69,96,0.3);border-radius:12px;color:#e94560;font-family:var(--font-display);font-size:0.9rem;letter-spacing:2px;cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px;';
  editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> EDIT SETTINGS';

  startBtn.parentNode.insertBefore(badge, startBtn);
  startBtn.parentNode.insertBefore(editBtn, startBtn);

  startBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> START AUCTION';
  startBtn.style.background = 'linear-gradient(135deg, #e94560, #c0392b)';

  editBtn.addEventListener('click', function() {
    badge.remove();
    editBtn.remove();
    startBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> SETUP AUCTION';
    startBtn.style.background = '';
    showScreen('screen-setup');
  });
}

// ============================================
// ORDER PLAYERS
// ============================================
function getOrderedPlayers(order) {
  var players = IPL_PLAYERS.slice();

  if (order === 'random') {
    for (var i = players.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = players[i];
      players[i] = players[j];
      players[j] = temp;
    }
  } else if (order === 'byTeam') {
    players.sort(function(a, b) { return a.team.localeCompare(b.team); });
  } else if (order === 'byRole') {
    var roleOrder = { 'Batsman': 1, 'Wicketkeeper': 2, 'All-rounder': 3, 'Bowler': 4 };
    players.sort(function(a, b) { return (roleOrder[a.role] || 5) - (roleOrder[b.role] || 5); });
  } else if (order === 'byPrice') {
    players.sort(function(a, b) { return b.basePrice - a.basePrice; });
  }

  return players;
}

// ============================================
// START AUCTION NOW
// ============================================
async function startAuctionNow() {
  if (!currentRoomCode) return;
  try {
    var roomSnap = await getDoc(doc(db, 'rooms', currentRoomCode));
    var data = roomSnap.data();
    var settings = data.settings || {};
    var orderedPlayers = settings.playerOrder
      ? settings.playerOrder.map(function(id) {
          return IPL_PLAYERS.find(function(p) { return p.id === id; });
        }).filter(Boolean)
      : IPL_PLAYERS;

    await updateDoc(doc(db, 'rooms', currentRoomCode), {
      status: 'auction',
      currentPlayerIndex: 0,
      currentBid: orderedPlayers[0].basePrice,
      currentBidder: null,
      currentBidderEmail: 'No bids yet',
      timerStarted: new Date()
    });

    myBudget = settings.budget || 100;
    document.getElementById('my-budget').textContent = '₹' + myBudget + ' Cr';
    document.getElementById('auction-room-code').textContent = currentRoomCode;
    showScreen('screen-auction');
    listenToAuction(currentRoomCode);

  } catch (error) {
    alert('Error starting auction: ' + error.message);
  }
}

// ============================================
// LISTEN TO AUCTION
// ============================================
function listenToAuction(roomCode) {
  var roomRef = doc(db, 'rooms', roomCode);

  onSnapshot(roomRef, function(snapshot) {
    if (!snapshot.exists()) return;
    var data = snapshot.data();

    if (data.status === 'finished') {
      showResults(roomCode);
      return;
    }

    if (data.status === 'auction') {
      document.getElementById('auction-room-code').textContent = roomCode;
      showScreen('screen-auction');
    } else {
      return;
    }

    var idx = data.currentPlayerIndex || 0;
    var settings = data.settings || {};
    var player;

    if (settings.playerOrder && settings.playerOrder.length > 0) {
      var playerId = settings.playerOrder[idx];
      player = IPL_PLAYERS.find(function(p) { return p.id === playerId; }) || IPL_PLAYERS[idx];
    } else {
      player = IPL_PLAYERS[idx];
    }

    if (settings.budget && myBudget === 100) {
      myBudget = settings.budget;
      document.getElementById('my-budget').textContent = '₹' + myBudget + ' Cr';
    }

    if (player) {
      var roleClass = '';
      if (player.role === 'Batsman') roleClass = 'role-batsman';
      else if (player.role === 'Bowler') roleClass = 'role-bowler';
      else if (player.role === 'All-rounder') roleClass = 'role-allrounder';
      else if (player.role === 'Wicketkeeper') roleClass = 'role-wicketkeeper';

      document.getElementById('player-name').textContent = player.name;
      document.getElementById('player-role').textContent = player.role;
      document.getElementById('player-role').className = 'role-badge ' + roleClass;
      document.getElementById('player-team').textContent = player.team;
      document.getElementById('base-price').innerHTML = 'BASE PRICE: <strong>₹' + player.basePrice + ' Cr</strong>';
    }

    var bid = data.currentBid || 0;
    document.getElementById('current-bid-amount').textContent = '₹' + bid + ' Cr';
    document.getElementById('current-bidder').textContent = data.currentBidderEmail || 'No bids yet';

    var soldPlayers = data.soldPlayers || [];
    var user = auth.currentUser;
    if (user) {
      var myPlayers = soldPlayers.filter(function(p) { return p.soldToId === user.uid; });
      var spent = myPlayers.reduce(function(total, p) { return total + p.soldFor; }, 0);
      myBudget = (settings.budget || 100) - spent;
      myPlayersCount = myPlayers.length;
      document.getElementById('my-budget').textContent = '₹' + myBudget + ' Cr';
      document.getElementById('my-players-count').textContent = myPlayersCount;
    }

    if (data.soldPlayers) updateSoldList(data.soldPlayers);
    if (isHost) document.getElementById('host-controls').style.display = 'flex';

    var timerDuration = (settings.timer) ? settings.timer : 30;
    startTimer(timerDuration);
  });
}

// ============================================
// TIMER
// ============================================
function startTimer(seconds) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  var timeLeft = seconds;
  var display = document.getElementById('timer-display');
  if (!display) return;

  display.textContent = timeLeft;
  display.style.color = 'var(--red-primary)';
  display.style.transform = 'scale(1)';

  timerInterval = setInterval(function() {
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      display.textContent = '0';
      return;
    }

    display.textContent = timeLeft;

    if (timeLeft <= 5) {
      display.style.color = '#ff0000';
      display.style.transform = 'scale(1.1)';
    } else if (timeLeft <= 10) {
      display.style.color = '#ff4444';
      display.style.transform = 'scale(1.05)';
    } else {
      display.style.color = 'var(--red-primary)';
      display.style.transform = 'scale(1)';
    }
  }, 1000);
}

// ============================================
// BID BUTTONS
// ============================================
async function placeBid(amount) {
  var user = auth.currentUser;
  if (!user || !currentRoomCode) return;

  var roomRef = doc(db, 'rooms', currentRoomCode);

  try {
    var snapshot = await getDoc(roomRef);
    if (!snapshot.exists()) return;
    var data = snapshot.data();

    var currentBid = data.currentBid || 0;
    var newBid = currentBid + amount;

    if (newBid > myBudget) {
      alert('Not enough budget!');
      return;
    }

    var userRef = doc(db, 'users', user.uid);
    var userSnap = await getDoc(userRef);
    var displayName = userSnap.exists() ? userSnap.data().username : user.email;

    await updateDoc(roomRef, {
      currentBid: newBid,
      currentBidder: user.uid,
      currentBidderEmail: displayName
    });

    startTimer(30);

  } catch (error) {
    console.error('Bid error:', error);
  }
}

document.getElementById('btn-bid-5').addEventListener('click', function() { placeBid(5); });
document.getElementById('btn-bid-10').addEventListener('click', function() { placeBid(10); });
document.getElementById('btn-bid-20').addEventListener('click', function() { placeBid(20); });

// ============================================
// SOLD BUTTON
// ============================================
document.getElementById('btn-sold').addEventListener('click', async function() {
  if (!currentRoomCode) return;

  var roomRef = doc(db, 'rooms', currentRoomCode);
  var snapshot = await getDoc(roomRef);
  var data = snapshot.data();
  var settings = data.settings || {};

  var idx = data.currentPlayerIndex || 0;
  var player = IPL_PLAYERS[idx];
  var soldPlayers = data.soldPlayers || [];

  soldPlayers.push({
    playerName: player.name,
    playerRole: player.role,
    playerTeam: player.team,
    soldTo: data.currentBidderEmail || 'No bidder',
    soldToId: data.currentBidder || null,
    soldFor: data.currentBid || player.basePrice
  });

  var nextIndex = idx + 1;

  if (nextIndex >= IPL_PLAYERS.length) {
    await updateDoc(roomRef, { status: 'finished', soldPlayers: soldPlayers });
    showResults(currentRoomCode);
    return;
  }

  await updateDoc(roomRef, {
    currentPlayerIndex: nextIndex,
    currentBid: IPL_PLAYERS[nextIndex].basePrice,
    currentBidder: null,
    currentBidderEmail: 'No bids yet',
    soldPlayers: soldPlayers,
    timerStarted: new Date()
  });

  startTimer(settings.timer || 30);
});

// ============================================
// UNSOLD BUTTON
// ============================================
document.getElementById('btn-unsold').addEventListener('click', async function() {
  if (!currentRoomCode) return;

  var roomRef = doc(db, 'rooms', currentRoomCode);
  var snapshot = await getDoc(roomRef);
  var data = snapshot.data();
  var settings = data.settings || {};

  var idx = data.currentPlayerIndex || 0;
  var nextIndex = idx + 1;

  if (nextIndex >= IPL_PLAYERS.length) {
    await updateDoc(roomRef, { status: 'finished' });
    showResults(currentRoomCode);
    return;
  }

  await updateDoc(roomRef, {
    currentPlayerIndex: nextIndex,
    currentBid: IPL_PLAYERS[nextIndex].basePrice,
    currentBidder: null,
    currentBidderEmail: 'No bids yet',
    timerStarted: new Date()
  });

  startTimer(settings.timer || 30);
});

// ============================================
// UPDATE SOLD LIST UI
// ============================================
function updateSoldList(soldPlayers) {
  var soldList = document.getElementById('sold-list');
  if (!soldList) return;
  soldList.innerHTML = '';

  soldPlayers.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'sold-item';
    div.innerHTML =
      '<span>' + item.playerName + '</span>' +
      '<strong>₹' + item.soldFor + ' Cr - ' + item.soldTo + '</strong>';
    soldList.appendChild(div);
  });
}

// ============================================
// MY TEAM BUTTON
// ============================================
document.getElementById('btn-myteam').addEventListener('click', function() {
  updateMyTeamScreen();
  showScreen('screen-myteam');
});

document.getElementById('btn-back-auction').addEventListener('click', function() {
  showScreen('screen-auction');
});

function updateMyTeamScreen() {
  var user = auth.currentUser;
  if (!user || !currentRoomCode) return;

  var roomRef = doc(db, 'rooms', currentRoomCode);
  getDoc(roomRef).then(function(snapshot) {
    if (!snapshot.exists()) return;
    var data = snapshot.data();
    var soldPlayers = data.soldPlayers || [];

    myTeamPlayers = soldPlayers.filter(function(p) { return p.soldToId === user.uid; });
    budgetSpent = myTeamPlayers.reduce(function(total, p) { return total + p.soldFor; }, 0);
    var budgetLeft = myBudget - budgetSpent;

    document.getElementById('stat-budget-left').textContent = '₹' + budgetLeft + ' Cr';
    document.getElementById('stat-budget-spent').textContent = '₹' + budgetSpent + ' Cr';
    document.getElementById('stat-players-bought').textContent = myTeamPlayers.length;

    var myteamList = document.getElementById('myteam-list');
    myteamList.innerHTML = '';

    if (myTeamPlayers.length === 0) {
      myteamList.innerHTML = '<p class="no-players">No players yet. Start bidding!</p>';
    } else {
      myTeamPlayers.forEach(function(p) {
        var div = document.createElement('div');
        div.className = 'myteam-player-item';
        div.innerHTML =
          '<div>' +
            '<div class="player-name">' + p.playerName + '</div>' +
            '<div class="player-role">' + p.playerRole + ' - ' + p.playerTeam + '</div>' +
          '</div>' +
          '<div class="player-price">₹' + p.soldFor + ' Cr</div>';
        myteamList.appendChild(div);
      });
    }

    updateAllTeams(soldPlayers);
  });
}

function updateAllTeams(soldPlayers) {
  var allteamsList = document.getElementById('allteams-list');
  allteamsList.innerHTML = '';

  var teams = {};
  soldPlayers.forEach(function(p) {
    if (!teams[p.soldTo]) teams[p.soldTo] = [];
    teams[p.soldTo].push(p);
  });

  if (Object.keys(teams).length === 0) {
    allteamsList.innerHTML = '<p class="no-players">No players sold yet!</p>';
    return;
  }

  Object.keys(teams).forEach(function(name) {
    var players = teams[name];
    var totalSpent = players.reduce(function(t, p) { return t + p.soldFor; }, 0);
    var div = document.createElement('div');
    div.className = 'team-item';
    div.innerHTML =
      '<div class="team-email">' + name + ' - Spent: ₹' + totalSpent + ' Cr</div>' +
      '<div class="team-players">' + players.map(function(p) { return p.playerName + ' (₹' + p.soldFor + 'Cr)'; }).join(', ') + '</div>';
    allteamsList.appendChild(div);
  });
}

// ============================================
// RESULTS SCREEN
// ============================================
function showResults(roomCode) {
  var user = auth.currentUser;
  if (!user) return;

  document.getElementById('results-room-code').textContent = 'Room: ' + roomCode;
  showScreen('screen-results');

  var roomRef = doc(db, 'rooms', roomCode);
  getDoc(roomRef).then(function(snapshot) {
    if (!snapshot.exists()) return;
    var data = snapshot.data();
    var soldPlayers = data.soldPlayers || [];

    var teams = {};
    soldPlayers.forEach(function(p) {
      if (!p.soldToId) return;
      if (!teams[p.soldToId]) {
        teams[p.soldToId] = { email: p.soldTo, players: [], totalSpent: 0 };
      }
      teams[p.soldToId].players.push(p);
      teams[p.soldToId].totalSpent += p.soldFor;
    });

    var sortedTeams = Object.values(teams).sort(function(a, b) {
      if (b.players.length !== a.players.length) return b.players.length - a.players.length;
      return a.totalSpent - b.totalSpent;
    });

    if (sortedTeams.length > 0) {
      var winner = sortedTeams[0];
      document.getElementById('winner-name').textContent = winner.email;
      document.getElementById('winner-stats').textContent = winner.players.length + ' players - ₹' + winner.totalSpent + ' Cr spent';
    }

    var rankingsDiv = document.getElementById('final-rankings');
    rankingsDiv.innerHTML = '';
    var medals = ['1st', '2nd', '3rd'];

    sortedTeams.forEach(function(team, index) {
      var div = document.createElement('div');
      div.className = 'ranking-item';
      div.innerHTML =
        '<div class="ranking-position">' + (medals[index] || (index + 1) + 'th') + '</div>' +
        '<div class="ranking-info">' +
          '<div class="ranking-email">' + team.email + '</div>' +
          '<div class="ranking-details">' + team.players.length + ' players bought</div>' +
        '</div>' +
        '<div class="ranking-budget">₹' + team.totalSpent + ' Cr</div>';
      rankingsDiv.appendChild(div);
    });

    var myTeam = teams[user.uid];
    var finalMyteam = document.getElementById('final-myteam');
    finalMyteam.innerHTML = '';

    if (!myTeam || myTeam.players.length === 0) {
      finalMyteam.innerHTML = '<p class="no-players">You did not buy any players!</p>';
    } else {
      myTeam.players.forEach(function(p) {
        var div = document.createElement('div');
        div.className = 'final-player-item';
        div.innerHTML =
          '<div class="player-details">' +
            '<div class="player-name">' + p.playerName + '</div>' +
            '<div class="player-meta">' + p.playerRole + ' - ' + p.playerTeam + '</div>' +
          '</div>' +
          '<div class="player-price">₹' + p.soldFor + ' Cr</div>';
        finalMyteam.appendChild(div);
      });
    }
  });
}

document.getElementById('btn-view-season').addEventListener('click', function() {
  alert('Season Leaderboard coming soon!');
});

document.getElementById('btn-share-result').addEventListener('click', function() {
  var shareText = 'My AuctionX Team!\n\n';
  myTeamPlayers.forEach(function(p) {
    shareText += p.playerName + ' - ₹' + p.soldFor + ' Cr\n';
  });
  shareText += '\nTotal Spent: ₹' + budgetSpent + ' Cr';
  shareText += '\n\nPlay at: https://YOUR-USERNAME.github.io/ipl-auction-game';
  navigator.clipboard.writeText(shareText).then(function() {
    alert('Team copied to clipboard!');
  });
});

document.getElementById('btn-new-auction').addEventListener('click', function() {
  if (confirm('Start a new auction? This will reset the current room.')) {
    showScreen('screen-lobby');
  }
});
