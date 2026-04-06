// ============================================
// FIREBASE SETUP
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============================================
// GLOBAL VARIABLES
// ============================================
let currentRoomCode = null;
let timerInterval = null;
let timerBarInterval = null;
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
let maxPlayers = 2;
let currentTimerDuration = 30;

// ============================================
// FIREBASE CONFIG
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyAABN4U5N4mxXwkiIBLRsprpv563mR_wd8",
  authDomain: "ipl-auction-game-eae92.firebaseapp.com",
  projectId: "ipl-auction-game-eae92",
  storageBucket: "ipl-auction-game-eae92.firebasestorage.app",
  messagingSenderId: "525729954460",
  appId: "1:525729954460:web:0fbb3ff950a0deddc20b59"
};

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
  
  // Dim spotlight on auction screen
  if (screenId === 'screen-auction') {
    document.body.classList.add('auction-active');
  } else {
    document.body.classList.remove('auction-active');
  }
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
    { x: 0, y: 0, swingAmount: 0.15, swingSpeed: 0.008, swingOffset: 0, beamWidth: 0.18, color1: 'rgba(233,69,96,0.25)', color2: 'rgba(233,69,96,0.0)' },
    { x: 1, y: 0, swingAmount: 0.15, swingSpeed: 0.006, swingOffset: Math.PI, beamWidth: 0.18, color1: 'rgba(233,69,96,0.25)', color2: 'rgba(233,69,96,0.0)' }
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
// LOGIN
// ============================================
document.getElementById('btn-login').addEventListener('click', function() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  if (email === '' || password === '') {
    document.getElementById('auth-error').textContent = 'Please fill in all fields.';
    return;
  }
  signInWithEmailAndPassword(auth, email, password)
    .catch(function(error) {
      document.getElementById('auth-error').textContent = error.message;
    });
});

// ============================================
// REGISTER
// ============================================
document.getElementById('btn-register').addEventListener('click', function() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  if (email === '' || password === '') {
    document.getElementById('auth-error').textContent = 'Please fill in all fields.';
    return;
  }
  createUserWithEmailAndPassword(auth, email, password)
    .catch(function(error) {
      document.getElementById('auth-error').textContent = error.message;
    });
});

// ============================================
// LOGOUT
// ============================================
document.getElementById('btn-logout').addEventListener('click', function() {
  signOut(auth).catch(function(error) { console.error(error); });
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
    if (usernameSnap.exists()) { errorEl.textContent = 'Username already taken!'; return; }
    var userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { username: username, email: user.email, uid: user.uid, createdAt: new Date() });
    await setDoc(usernamesRef, { uid: user.uid });
    showScreen('screen-lobby');
    loadDashboard(user);
  } catch (error) {
    errorEl.textContent = 'Error: ' + error.message;
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
    '<div class="event-card"><div class="event-dot event-dot-live"></div><div class="event-info"><div class="event-name">IPL 2026</div><div class="event-meta">Cricket · 74 matches · Mar - Jun 2026</div></div><div style="text-align:right"><div class="event-status event-status-live">LIVE</div><div class="event-rooms">Rooms available</div></div></div>' +
    '<div class="event-card"><div class="event-dot event-dot-soon"></div><div class="event-info"><div class="event-name">T20 World Cup 2026</div><div class="event-meta">Cricket · Jun 2026</div></div><div style="text-align:right"><div class="event-status event-status-soon">COMING SOON</div></div></div>';
}

function loadGlobalLeaderboard(user) {
  var lbDiv = document.getElementById('global-leaderboard-preview');
  if (!lbDiv) return;
  lbDiv.innerHTML =
    '<div class="lb-row"><span class="lb-rank lb-rank-gold">1</span><div class="lb-avatar">DK</div><span class="lb-name">DraftKing_99</span><span class="lb-pts">3,420 pts</span></div>' +
    '<div class="lb-row"><span class="lb-rank lb-rank-silver">2</span><div class="lb-avatar">BM</div><span class="lb-name">BidMaster_X</span><span class="lb-pts">2,980 pts</span></div>' +
    '<div class="lb-row"><span class="lb-rank lb-rank-bronze">3</span><div class="lb-avatar">AA</div><span class="lb-name">AuctionAce</span><span class="lb-pts">1,840 pts</span></div>';
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
// GENERATE ROOM CODE
// ============================================
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============================================
// CREATE ROOM
// ============================================
document.getElementById('btn-create-room').addEventListener('click', async function() {
  var user = auth.currentUser;
  if (!user) return;
  var roomCode = generateRoomCode();
  currentRoomCode = roomCode;
  isHost = true;
  try {
    await setDoc(doc(db, 'rooms', roomCode), {
      code: roomCode,
      host: user.email,
      hostId: user.uid,
      status: 'waiting',
      type: selectedRoomType,
      maxPlayers: maxPlayers,
      createdAt: new Date(),
      players: { [user.uid]: { email: user.email, joinedAt: new Date() } }
    });
    document.getElementById('room-code-display').textContent = roomCode;
    var lockSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    var globeSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
    var indicator = document.getElementById('room-type-indicator');
    if (indicator) indicator.innerHTML = selectedRoomType === 'private' ? lockSvg + ' PRIVATE' : globeSvg + ' PUBLIC';
    var startBtn = document.getElementById('btn-start-auction');
    if (startBtn) startBtn.style.display = 'flex';
    var guestMsg = document.getElementById('guest-waiting-msg');
    if (guestMsg) guestMsg.style.display = 'none';
    showScreen('screen-room');
    listenToRoom(roomCode);
    listenToAuction(roomCode);
  } catch (error) {
    alert('Error creating room: ' + error.message);
  }
});

// ============================================
// JOIN ROOM
// ============================================
document.getElementById('btn-join-room').addEventListener('click', async function() {
  var user = auth.currentUser;
  if (!user) return;
  var code = document.getElementById('join-code').value.toUpperCase().trim();
  if (code === '') { alert('Please enter a room code.'); return; }
  try {
    var roomRef = doc(db, 'rooms', code);
    var roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) { alert('Room not found!'); return; }
    if (roomSnap.data().status !== 'waiting') { alert('This room has already started!'); return; }
    var roomData = roomSnap.data();
    var currentPlayers = Object.keys(roomData.players || {}).length;
    var maxAllowed = roomData.maxPlayers || 10;
    if (currentPlayers >= maxAllowed) { alert('This room is full! (' + maxAllowed + '/' + maxAllowed + ' players)'); return; }
    await updateDoc(roomRef, { ['players.' + user.uid]: { email: user.email, joinedAt: new Date() } });
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
// COPY ROOM CODE
// ============================================
document.getElementById('btn-copy-code').addEventListener('click', function() {
  var code = document.getElementById('room-code-display').textContent;
  navigator.clipboard.writeText(code).then(function() {
    var btn = document.getElementById('btn-copy-code');
    btn.textContent = 'COPIED!';
    btn.style.background = 'rgba(40,167,69,0.2)';
    btn.style.color = '#28a745';
    setTimeout(function() {
      var svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> COPY';
      btn.innerHTML = svg;
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  });
});

// ============================================
// LEAVE ROOM
// ============================================
document.getElementById('btn-leave-room').addEventListener('click', async function() {
  var user = auth.currentUser;
  if (!user || !currentRoomCode) { showScreen('screen-lobby'); return; }
  if (!confirm('Are you sure you want to leave the room?')) return;
  try {
    var roomRef = doc(db, 'rooms', currentRoomCode);
    var roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) { showScreen('screen-lobby'); return; }
    var data = roomSnap.data();
    var players = data.players || {};
    delete players[user.uid];
    await updateDoc(roomRef, { players: players });
    currentRoomCode = null;
    isHost = false;
    showScreen('screen-lobby');
  } catch (error) {
    showScreen('screen-lobby');
  }
});

// ============================================
// LISTEN TO ROOM
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
    var maxAllowed = data.maxPlayers || 10;
    if (countEl) countEl.textContent = count + ' / ' + maxAllowed;
    Object.keys(players).forEach(function(uid) {
      var userRef = doc(db, 'users', uid);
      getDoc(userRef).then(function(userSnap) {
        var displayName = userSnap.exists() ? userSnap.data().username : players[uid].email;
        var div = document.createElement('div');
        div.className = 'player-item';
        div.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' + displayName;
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
// SETUP AUCTION BUTTON
// ============================================
document.getElementById('btn-start-auction').addEventListener('click', async function() {
  if (!isHost || !currentRoomCode) return;
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
    if (isNaN(val) || val < 10 || val > 500) { alert('Enter a budget between 10 and 500 Cr'); return; }
    document.querySelectorAll('.budget-btn').forEach(function(b) { b.classList.remove('active-btn'); });
    setupBudget = val;
    document.getElementById('budget-display').textContent = '₹' + setupBudget + ' Cr';
  });
  document.querySelectorAll('.timer-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.timer-btn').forEach(function(b) { b.classList.remove('active-btn'); });
      btn.classList.add('active-btn');
      setupTimer = parseInt(btn.dataset.value);
      document.getElementById('timer-display-setup').textContent = setupTimer + 's';
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
  document.querySelectorAll('.max-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.max-btn').forEach(function(b) { b.classList.remove('active-btn'); });
      btn.classList.add('active-btn');
      maxPlayers = parseInt(btn.dataset.value);
      var display = document.getElementById('maxplayers-display');
      if (display) display.textContent = maxPlayers + ' Players';
    });
  });
}
initSetupButtons();

// ============================================
// BACK TO ROOM FROM SETUP
// ============================================
document.getElementById('btn-back-lobby').addEventListener('click', function() {
  if (currentRoomCode) showScreen('screen-room');
  else showScreen('screen-lobby');
});

// ============================================
// SAVE SETTINGS
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
        maxPlayers: maxPlayers,
        playerOrder: orderedPlayers.map(function(p) { return p.id; })
      },
      maxPlayers: maxPlayers,
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
      var temp = players[i]; players[i] = players[j]; players[j] = temp;
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
    var soldList = document.getElementById('sold-list');
    if (soldList) soldList.innerHTML = '';
    
    var roomSnap = await getDoc(doc(db, 'rooms', currentRoomCode));
    var data = roomSnap.data();
    var settings = data.settings || {};
    var orderedPlayers = settings.playerOrder
      ? settings.playerOrder.map(function(id) { return IPL_PLAYERS.find(function(p) { return p.id === id; }); }).filter(Boolean)
      : IPL_PLAYERS;
    var now = new Date();
    await updateDoc(doc(db, 'rooms', currentRoomCode), {
      status: 'auction',
      currentPlayerIndex: 0,
      currentBid: orderedPlayers[0].basePrice,
      currentBidder: null,
      currentBidderEmail: 'No bids yet',
      timerStartedAt: now.getTime(),
      timerDuration: settings.timer || 30,
      lastResult: null,
      lastResultPlayer: null,
      lastResultBuyer: null,
      lastResultAmount: null,
      soldPlayers: []
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
// AUTO SOLD/UNSOLD — Timer based
// ============================================
async function handleTimerEnd() {
  if (!currentRoomCode || !isHost) return;
  try {
    var roomRef = doc(db, 'rooms', currentRoomCode);
    var roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    var data = roomSnap.data();
    if (data.status !== 'auction') return;
    var settings = data.settings || {};
    var idx = data.currentPlayerIndex || 0;
    var soldPlayers = data.soldPlayers || [];
    var orderedPlayers = settings.playerOrder
      ? settings.playerOrder.map(function(id) { return IPL_PLAYERS.find(function(p) { return p.id === id; }); }).filter(Boolean)
      : IPL_PLAYERS;
    var player = orderedPlayers[idx];
    if (!player) return;

    var updatePayload = {};

    if (data.currentBidder) {
      // SOLD
      soldPlayers.push({
        playerName: player.name,
        playerRole: player.role,
        playerTeam: player.team,
        soldTo: data.currentBidderEmail,
        soldToId: data.currentBidder,
        soldFor: data.currentBid || player.basePrice
      });
      // Write result to Firestore so ALL users see the animation
      updatePayload.lastResult = 'sold';
      updatePayload.lastResultPlayer = player.name;
      updatePayload.lastResultBuyer = data.currentBidderEmail;
      updatePayload.lastResultAmount = data.currentBid || player.basePrice;
    } else {
      // UNSOLD
      updatePayload.lastResult = 'unsold';
      updatePayload.lastResultPlayer = player.name;
      updatePayload.lastResultBuyer = null;
      updatePayload.lastResultAmount = null;
    }

    var nextIndex = idx + 1;
    if (nextIndex >= orderedPlayers.length) {
      updatePayload.status = 'finished';
      updatePayload.soldPlayers = soldPlayers;
      await updateDoc(roomRef, updatePayload);
      setTimeout(function() { showResults(currentRoomCode); }, 2500);
      return;
    }

    var now = new Date();
    updatePayload.currentPlayerIndex = nextIndex;
    updatePayload.currentBid = orderedPlayers[nextIndex].basePrice;
    updatePayload.currentBidder = null;
    updatePayload.currentBidderEmail = 'No bids yet';
    updatePayload.soldPlayers = soldPlayers;
    updatePayload.timerStartedAt = now.getTime() + 2500; // delay so animation plays first
    updatePayload.timerDuration = settings.timer || 30;

    await updateDoc(roomRef, updatePayload);
  } catch (error) {
    console.error('Timer end error:', error);
  }
}

// ============================================
// SOLD/UNSOLD ANIMATIONS
// ============================================
function showSoldAnimation(playerName, buyerName, amount) {
  // Remove any existing overlay first
  var existing = document.getElementById('result-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'result-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn 0.3s ease;';
  overlay.innerHTML =
    '<div style="font-family:var(--font-d);font-size:5rem;font-weight:700;color:#28a745;letter-spacing:4px;margin-bottom:16px;">SOLD!</div>' +
    '<div style="font-family:var(--font-d);font-size:2rem;color:#fff;margin-bottom:8px;">' + playerName + '</div>' +
    '<div style="font-size:1.2rem;color:#e94560;font-family:var(--font-d);">₹' + amount + ' Cr → ' + buyerName + '</div>';
  document.body.appendChild(overlay);
  setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 2400);
}

function showUnsoldAnimation(playerName) {
  var existing = document.getElementById('result-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'result-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn 0.3s ease;';
  overlay.innerHTML =
    '<div style="font-family:var(--font-d);font-size:5rem;font-weight:700;color:#dc3545;letter-spacing:4px;margin-bottom:16px;">UNSOLD</div>' +
    '<div style="font-family:var(--font-d);font-size:2rem;color:#fff;">' + playerName + '</div>';
  document.body.appendChild(overlay);
  setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 2400);
}

// ============================================
// LISTEN TO AUCTION
// ============================================
var lastPlayerIndex = -1;
// BUG 2 FIX: track lastBidder to reset timer on new bid
var lastBidder = null;
// BUG 3 FIX: track lastResult to avoid showing animation multiple times
var lastResultKey = null;

function listenToAuction(roomCode) {
  var roomRef = doc(db, 'rooms', roomCode);
  onSnapshot(roomRef, function(snapshot) {
    if (!snapshot.exists()) return;
    var data = snapshot.data();

    if (data.status === 'finished') { showResults(roomCode); return; }
    if (data.status !== 'auction') return;

    document.getElementById('auction-room-code').textContent = roomCode;
    showScreen('screen-auction');

    var idx = data.currentPlayerIndex || 0;
    var settings = data.settings || {};
    var orderedPlayers = settings.playerOrder
      ? settings.playerOrder.map(function(id) { return IPL_PLAYERS.find(function(p) { return p.id === id; }); }).filter(Boolean)
      : IPL_PLAYERS;

    var player = orderedPlayers[idx];

    // Apply budget from settings
    if (settings.budget) {
      var soldPlayers = data.soldPlayers || [];
      var user = auth.currentUser;
      if (user) {
        var myPlayers = soldPlayers.filter(function(p) { return p.soldToId === user.uid; });
        var spent = myPlayers.reduce(function(total, p) { return total + p.soldFor; }, 0);
        myBudget = settings.budget - spent;
        myPlayersCount = myPlayers.length;
        document.getElementById('my-budget').textContent = '₹' + myBudget + ' Cr';
        document.getElementById('my-players-count').textContent = myPlayersCount;
        updateBudgetBar(myBudget, settings.budget);
      }
    }

    if (player) {
      var roleClass = '';
      if (player.role === 'Batsman') roleClass = 'role-batsman';
      else if (player.role === 'Bowler') roleClass = 'role-bowler';
      else if (player.role === 'All-rounder') roleClass = 'role-allrounder';
      else if (player.role === 'Wicketkeeper') roleClass = 'role-wicketkeeper';

      document.getElementById('player-name').textContent = player.name;
      var roleEl = document.getElementById('player-role');
      if (roleEl) { roleEl.textContent = player.role; roleEl.className = 'role-badge ' + roleClass; }
      document.getElementById('player-team').textContent = player.team;
      var basePriceEl = document.getElementById('base-price');
      if (basePriceEl) basePriceEl.innerHTML = '₹' + player.basePrice + ' Cr';
    }
    // Update player counter
    var counterEl = document.getElementById('current-player-num');
    var totalEl = document.getElementById('total-player-num');
    if (counterEl) counterEl.textContent = idx + 1;
    if (totalEl) totalEl.textContent = orderedPlayers.length;

    // Update bid display
    var bid = data.currentBid || 0;
    document.getElementById('current-bid-amount').textContent = '₹' + bid + ' Cr';
    document.getElementById('current-bidder').textContent = data.currentBidderEmail || 'No bids yet';

    // Update sold list
    if (data.soldPlayers) updateSoldList(data.soldPlayers);

    // Update players info panel
    updatePlayersInfoPanel(data);

    // ---- BUG 3 FIX: Show SOLD/UNSOLD animation for ALL users ----
    // Use idx + lastResult as a unique key to prevent re-showing
    var resultKey = (data.lastResult || '') + '_' + idx + '_' + (data.lastResultPlayer || '');
    if (data.lastResult && resultKey !== lastResultKey) {
      lastResultKey = resultKey;
      if (data.lastResult === 'sold') {
        showSoldAnimation(data.lastResultPlayer, data.lastResultBuyer, data.lastResultAmount);
      } else if (data.lastResult === 'unsold') {
        showUnsoldAnimation(data.lastResultPlayer);
      }
    }

    // ---- Timer logic ----
    var timerDuration = settings.timer || 30;
    currentTimerDuration = timerDuration;

    var playerChanged = idx !== lastPlayerIndex;
    // BUG 2 FIX: also reset timer when bidder changes
    var bidderChanged = data.currentBidder !== lastBidder;

    if (playerChanged || bidderChanged) {
      lastPlayerIndex = idx;
      lastBidder = data.currentBidder;
      var timerStartedAt = data.timerStartedAt || Date.now();
      var elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      var remaining = Math.max(0, timerDuration - elapsed);
      startTimer(remaining, timerDuration);
    }
  });
}

// ============================================
// UPDATE PLAYERS INFO PANEL
// ============================================
function updatePlayersInfoPanel(data) {
  var panel = document.getElementById('players-info-panel');
  if (!panel) return;
  var players = data.players || {};
  var soldPlayers = data.soldPlayers || [];
  var settings = data.settings || {};
  var maxBudget = settings.budget || 100;
  var uids = Object.keys(players);
  var results = {};
  var loaded = 0;
  if (uids.length === 0) { panel.innerHTML = ''; return; }
  uids.forEach(function(uid) {
    var userRef = doc(db, 'users', uid);
    getDoc(userRef).then(function(userSnap) {
      var username = userSnap.exists() ? userSnap.data().username : 'Player';
      var myPlayers = soldPlayers.filter(function(p) { return p.soldToId === uid; });
      var spent = myPlayers.reduce(function(t, p) { return t + p.soldFor; }, 0);
      var remaining = maxBudget - spent;
      var pct = Math.max(0, (remaining / maxBudget) * 100);
      var isCurrentUser = auth.currentUser && auth.currentUser.uid === uid;
      results[uid] = { username: username, remaining: remaining, count: myPlayers.length, pct: pct, isCurrentUser: isCurrentUser, myPlayers: myPlayers };
      loaded++;
      if (loaded === uids.length) {
        panel.innerHTML = '';
        uids.forEach(function(u) {
          var r = results[u];
          if (!r) return;

          var boughtPlayersHTML = '';
          if (r.myPlayers.length === 0) {
            boughtPlayersHTML = '<div class="auc-dp-empty">No players bought yet.</div>';
          } else {
            r.myPlayers.forEach(function(p) {
              boughtPlayersHTML += '<div class="auc-dp-item"><span>' + p.playerName + '</span> <span class="auc-dp-price">₹' + p.soldFor + ' Cr</span></div>';
            });
          }
          var div = document.createElement('div');
          div.className = 'auc-player-row' + (r.isCurrentUser ? ' auc-player-row-you' : '');
          
          // Here is the new HTML that actually includes the clickable header, the arrow icon, and the dropdown content!
          div.innerHTML =
            '<div class="auc-player-row-header" onclick="this.parentElement.classList.toggle(\'open\')">' +
              '<div style="flex:1;">' +
                '<div class="auc-player-row-name">' + (r.isCurrentUser ? 'YOU' : r.username) + '</div>' +
                '<div class="auc-player-row-stats">' +
                  '<span class="auc-player-row-budget">₹' + r.remaining + ' Cr</span>' +
                  '<span class="auc-player-row-count">' + r.count + ' players</span>' +
                '</div>' +
                '<div class="auc-player-row-bar-track">' +
                  '<div class="auc-player-row-bar-fill" style="width:' + r.pct + '%;background:' + (r.isCurrentUser ? '#e94560' : '#606080') + '"></div>' +
                '</div>' +
              '</div>' +
              '<div class="auc-dp-icon">' + 
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                  '<polyline points="6 9 12 15 18 9"></polyline>' +
                '</svg>' +
              '</div>' +
            '</div>' +
            '<div class="auc-dp-content">' + boughtPlayersHTML + '</div>';            
          panel.appendChild(div);
        });
      }
    });
  });
}

// ============================================
// TIMER WITH BAR
// ============================================
function startTimer(seconds, totalSeconds) {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (timerBarInterval) { clearInterval(timerBarInterval); timerBarInterval = null; }

  var timeLeft = seconds;
  var total = totalSeconds || seconds;
  var timerEl = document.getElementById('timer-display');
  var timerBarFill = document.getElementById('auc-timer-bar-fill');
  var timerBarAmount = document.getElementById('auc-timer-bar-val');


  function updateTimerUI() {
    if (timerEl) {
      timerEl.textContent = timeLeft;
      if (timeLeft <= 5) { timerEl.style.color = '#ff0000'; }
      else if (timeLeft <= 10) { timerEl.style.color = '#ff4444'; }
      else { timerEl.style.color = 'var(--red)'; }
    }
    if (timerBarFill) {
      var pct = Math.max(0, (timeLeft / total) * 100);
      timerBarFill.style.width = pct + '%';
      if (pct <= 30) timerBarFill.style.background = '#dc3545';
      else if (pct <= 60) timerBarFill.style.background = '#ffc107';
      else timerBarFill.style.background = 'linear-gradient(135deg,#e94560,#c0392b)';
    }
    if (timerBarAmount) timerBarAmount.textContent = timeLeft + 's';
  }

  updateTimerUI();

  timerInterval = setInterval(function() {
    timeLeft--;
    if (timeLeft < 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (timerEl) timerEl.textContent = '0';
      if (timerBarFill) timerBarFill.style.width = '0%';
      // Auto sold/unsold — only host triggers
      if (isHost) handleTimerEnd();
      return;
    }
    updateTimerUI();
  }, 1000);
}

// ============================================
// UPDATE BUDGET BAR
// ============================================
function updateBudgetBar(remaining, total) {
  var fill = document.getElementById('auc-budget-fill');
  var amount = document.getElementById('auc-budget-val');
  if (!fill || !amount) return;
  var pct = Math.max(0, (remaining / total) * 100);
  fill.style.width = pct + '%';
  amount.textContent = '₹' + remaining + ' Cr';
  if (pct < 30) fill.style.background = '#dc3545';
  else if (pct < 60) fill.style.background = '#ffc107';
  else fill.style.background = 'linear-gradient(135deg,#e94560,#c0392b)';
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
    if (newBid > myBudget) { alert('Not enough budget!'); return; }
    var userRef = doc(db, 'users', user.uid);
    var userSnap = await getDoc(userRef);
    var displayName = userSnap.exists() ? userSnap.data().username : user.email;
    var now = new Date();
    await updateDoc(roomRef, {
      currentBid: newBid,
      currentBidder: user.uid,
      currentBidderEmail: displayName,
      timerStartedAt: now.getTime(),  // BUG 2 FIX: reset timer on bid
    });
  } catch (error) {
    console.error('Bid error:', error);
  }
}

document.getElementById('btn-bid-5').addEventListener('click', function() { placeBid(5); });
document.getElementById('btn-bid-10').addEventListener('click', function() { placeBid(10); });
document.getElementById('btn-bid-20').addEventListener('click', function() { placeBid(20); });

// ============================================
// UPDATE SOLD LIST (ticker)
// ============================================
function updateSoldList(soldPlayers) {
  var soldList = document.getElementById('sold-list');
  if (!soldList) return;
  soldList.innerHTML = '';
  var reversedPlayers = soldPlayers.slice().reverse().slice(0,8);
  reversedPlayers.forEach(function(item, index) {
    var div = document.createElement('div');
    div.className = 'sold-item';
    div.innerHTML = item.playerName + ' <span class="sold-price">₹' + item.soldFor + ' Cr - ' + item.soldTo + '</span>';
    soldList.appendChild(div);
    if (index < reversedPlayers.length - 1) {
      var sep = document.createElement('div');
      sep.className = 'sold-sep';
      sep.textContent = '·';
      soldList.appendChild(sep);
    }
  });
}

// ============================================
// MY SQUAD BUTTON
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
        div.innerHTML = '<div><div class="player-name">' + p.playerName + '</div><div class="player-role">' + p.playerRole + ' - ' + p.playerTeam + '</div></div><div class="player-price">₹' + p.soldFor + ' Cr</div>';
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
  if (Object.keys(teams).length === 0) { allteamsList.innerHTML = '<p class="no-players">No players sold yet!</p>'; return; }
  Object.keys(teams).forEach(function(name) {
    var players = teams[name];
    var totalSpent = players.reduce(function(t, p) { return t + p.soldFor; }, 0);
    var div = document.createElement('div');
    div.className = 'team-item';
    div.innerHTML = '<div class="team-email">' + name + ' - Spent: ₹' + totalSpent + ' Cr</div><div class="team-players">' + players.map(function(p) { return p.playerName + ' (₹' + p.soldFor + 'Cr)'; }).join(', ') + '</div>';
    allteamsList.appendChild(div);
  });
}

// ============================================
// RESULTS
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
      if (!teams[p.soldToId]) teams[p.soldToId] = { email: p.soldTo, players: [], totalSpent: 0 };
      teams[p.soldToId].players.push(p);
      teams[p.soldToId].totalSpent += p.soldFor;
    });
    var sortedTeams = Object.values(teams).sort(function(a, b) {
      if (b.players.length !== a.players.length) return b.players.length - a.players.length;
      return a.totalSpent - b.totalSpent;
    });
    if (sortedTeams.length > 0) {
      document.getElementById('winner-name').textContent = sortedTeams[0].email;
      document.getElementById('winner-stats').textContent = sortedTeams[0].players.length + ' players - ₹' + sortedTeams[0].totalSpent + ' Cr spent';
    }
    var rankingsDiv = document.getElementById('final-rankings');
    rankingsDiv.innerHTML = '';
    var medals = ['1st', '2nd', '3rd'];
    sortedTeams.forEach(function(team, index) {
      var div = document.createElement('div');
      div.className = 'ranking-item';
      div.innerHTML = '<div class="ranking-position">' + (medals[index] || (index + 1) + 'th') + '</div><div class="ranking-info"><div class="ranking-email">' + team.email + '</div><div class="ranking-details">' + team.players.length + ' players bought</div></div><div class="ranking-budget">₹' + team.totalSpent + ' Cr</div>';
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
        div.innerHTML = '<div class="player-details"><div class="player-name">' + p.playerName + '</div><div class="player-meta">' + p.playerRole + ' - ' + p.playerTeam + '</div></div><div class="player-price">₹' + p.soldFor + ' Cr</div>';
        finalMyteam.appendChild(div);
      });
    }
  });
}

document.getElementById('btn-view-season').addEventListener('click', function() { alert('Season Leaderboard coming soon!'); });
document.getElementById('btn-share-result').addEventListener('click', function() {
  var shareText = 'My AuctionX Team!\n\n';
  myTeamPlayers.forEach(function(p) { shareText += p.playerName + ' - ₹' + p.soldFor + ' Cr\n'; });
  shareText += '\nTotal Spent: ₹' + budgetSpent + ' Cr\nPlay at: https://YOUR-USERNAME.github.io/ipl-auction-game';
  navigator.clipboard.writeText(shareText).then(function() { alert('Team copied to clipboard!'); });
});
document.getElementById('btn-new-auction').addEventListener('click', function() {
  if (confirm('Start a new auction?')) showScreen('screen-lobby');
});


// hello
