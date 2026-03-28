// ============================================
// FIREBASE SETUP
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// FIREBASE CONFIG
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
  { id: 1, name: "Virat Kohli",       role: "Batsman",     team: "RCB", basePrice: 2,  emoji: "🦁" },
  { id: 2, name: "Rohit Sharma",      role: "Batsman",     team: "MI",  basePrice: 2,  emoji: "🐯" },
  { id: 3, name: "MS Dhoni",          role: "Wicketkeeper",team: "CSK", basePrice: 2,  emoji: "🦅" },
  { id: 4, name: "Jasprit Bumrah",    role: "Bowler",      team: "MI",  basePrice: 2,  emoji: "🎯" },
  { id: 5, name: "Hardik Pandya",     role: "All-rounder", team: "MI",  basePrice: 2,  emoji: "⚡" },
  { id: 6, name: "KL Rahul",          role: "Batsman",     team: "LSG", basePrice: 1,  emoji: "👑" },
  { id: 7, name: "Ravindra Jadeja",   role: "All-rounder", team: "CSK", basePrice: 1,  emoji: "🗡️" },
  { id: 8, name: "Shubman Gill",      role: "Batsman",     team: "GT",  basePrice: 1,  emoji: "🌟" },
  { id: 9, name: "Mohammed Siraj",    role: "Bowler",      team: "RCB", basePrice: 1,  emoji: "🔥" },
  { id: 10, name: "Rishabh Pant",     role: "Wicketkeeper",team: "DC",  basePrice: 2,  emoji: "💥" },
  { id: 11, name: "Suryakumar Yadav", role: "Batsman",     team: "MI",  basePrice: 1,  emoji: "☀️" },
  { id: 12, name: "Yuzvendra Chahal", role: "Bowler",      team: "RR",  basePrice: 1,  emoji: "🌀" },
  { id: 13, name: "David Warner",     role: "Batsman",     team: "DC",  basePrice: 1,  emoji: "🦘" },
  { id: 14, name: "Andre Russell",    role: "All-rounder", team: "KKR", basePrice: 1,  emoji: "💪" },
  { id: 15, name: "Pat Cummins",      role: "Bowler",      team: "SRH", basePrice: 1,  emoji: "🏹" }
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
// AUTH STATE LISTENER
// Automatically shows correct screen based on login status
// ============================================
onAuthStateChanged(auth, function(user) {
  if (user) {
    // Check if username exists in Firestore
    var userRef = doc(db, 'users', user.uid);
    getDoc(userRef).then(function(snapshot) {
      if (snapshot.exists() && snapshot.data().username) {
        // Username exists — go to lobby
        var username = snapshot.data().username;
        document.querySelector('#lobby-user strong').textContent = username;
        showScreen('screen-lobby');
      } else {
        // No username yet — ask for one
        showScreen('screen-username');
      }
    });
  } else {
    showScreen('screen-login');
  }
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
      // onAuthStateChanged will handle screen switch
    })
    .catch(function(error) {
      document.getElementById('auth-error').textContent = error.message;
    });
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
      // onAuthStateChanged will handle screen switch
    })
    .catch(function(error) {
      document.getElementById('auth-error').textContent = error.message;
    });
});


// ============================================
// LOGOUT BUTTON
// ============================================
document.getElementById('btn-logout').addEventListener('click', function() {
  signOut(auth)
    .then(function() {
      console.log('Logged out');
      // onAuthStateChanged will handle screen switch
    })
    .catch(function(error) {
      console.error('Logout error:', error);
    });
});


// ============================================
// CREATE ROOM BUTTON
// ============================================
document.getElementById('btn-create-room').addEventListener('click', function() {
  alert('➕ Create Room — coming in next step!');
  
});


// ============================================
// HELPER - Generate random 6 digit room code
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

  try {
    // Save room to Firestore
    await setDoc(doc(db, 'rooms', roomCode), {
      code: roomCode,
      host: user.email,
      hostId: user.uid,
      status: 'waiting',
      createdAt: new Date(),
      players: {
        [user.uid]: {
          email: user.email,
          joinedAt: new Date()
        }
      }
    });

    // Show the room screen
    document.getElementById('room-code-display').textContent = roomCode;
    showScreen('screen-room');
    currentRoomCode = roomCode;
    isHost = true;

    // Start listening for players
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
    alert('⚠️ Please enter a room code.');
    return;
  }

  try {
    var roomRef = doc(db, 'rooms', code);
    var roomSnap = await getDoc(roomRef);

    // Check if room exists
    if (!roomSnap.exists()) {
      alert('❌ Room not found! Check the code and try again.');
      return;
    }

    // Check if room is still open
    if (roomSnap.data().status !== 'waiting') {
      alert('⚠️ This room has already started!');
      return;
    }

    // Add player to room
    await updateDoc(roomRef, {
      ['players.' + user.uid]: {
        email: user.email,
        joinedAt: new Date()
      }
    });

    // Show room screen
    document.getElementById('room-code-display').textContent = code;
    showScreen('screen-room');
    currentRoomCode = code;

    // Start listening for players
    listenToRoom(code);
    listenToAuction(code);

  } catch (error) {
    alert('Error joining room: ' + error.message);
  }
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

    playerList.innerHTML = '<h3>👥 Players in Room:</h3>';

    // Fetch username for each player
    Object.keys(players).forEach(function(uid) {
      var userRef = doc(db, 'users', uid);
      getDoc(userRef).then(function(userSnap) {
        var displayName = userSnap.exists()
          ? userSnap.data().username
          : players[uid].email;

        var div = document.createElement('div');
        div.className = 'player-item';
        div.textContent = '🏏 ' + displayName;
        playerList.appendChild(div);
      });
    });

    // Show start button only for host
    var currentUser = auth.currentUser;
    if (currentUser && data.hostId === currentUser.uid) {
      document.getElementById('btn-start-auction').style.display = 'block';
    } else {
      document.getElementById('btn-start-auction').style.display = 'none';
    }
  });
}


// ============================================
// START AUCTION BUTTON
// ============================================
document.getElementById('btn-start-auction').addEventListener('click', function() {
  alert('🏏 Auction Starting — coming in next step!');
});

// ============================================
// AUCTION VARIABLES
// ============================================
let currentRoomCode = null;
let currentPlayerIndex = 0;
let timerInterval = null;
let myBudget = 100;
let myPlayersCount = 0;
let isHost = false;

// ============================================
// START AUCTION BUTTON - Host only
// ============================================
document.getElementById('btn-start-auction').addEventListener('click', function() {
  if (!isHost) return;
  showScreen('screen-setup');
});


// ============================================
// LISTEN TO AUCTION - Real time bidding
// ============================================
function listenToAuction(roomCode) {
  var roomRef = doc(db, 'rooms', roomCode);

  onSnapshot(roomRef, function(snapshot) {
    if (!snapshot.exists()) return;
    var data = snapshot.data();

    // If auction just started from lobby
    if (data.status === 'finished') {
      showResults(roomCode);
      return;
    }

    if (data.status === 'auction') {
      document.getElementById('auction-room-code').textContent = roomCode;
      showScreen('screen-auction');
    }

    // Update player card
    var idx = data.currentPlayerIndex || 0;
    var settings = data.settings || {};

    // Use ordered player list if available
    var player;
    if (settings.playerOrder && settings.playerOrder.length > 0) {
      var playerId = settings.playerOrder[idx];
      player = IPL_PLAYERS.find(p => p.id === playerId) || IPL_PLAYERS[idx];
    } else {
      player = IPL_PLAYERS[idx];
    }

    // Apply budget from settings for joining players
    if (settings.budget && myBudget === 100) {
      myBudget = settings.budget;
      document.getElementById('my-budget').textContent = '₹' + myBudget + ' Cr';
    }

    if (player) {
      document.getElementById('player-emoji').textContent = player.emoji;
      document.getElementById('player-name').textContent = player.name;
      document.getElementById('player-role').textContent = '🎭 ' + player.role;
      document.getElementById('player-team').textContent = '🏟️ ' + player.team;
      document.getElementById('base-price').textContent = '₹' + player.basePrice + ' Cr';
    }

    // Update bid info
    var bid = data.currentBid || 0;
    document.getElementById('current-bid-amount').textContent = '₹' + bid + ' Cr';
    // Update my budget and player count in topbar
    var soldPlayers = data.soldPlayers || [];
    var user = auth.currentUser;

    if (user) {
      var myPlayers = soldPlayers.filter(function(p) {
        return p.soldToId === user.uid;
      });

      var spent = myPlayers.reduce(function(total, p) {
        return total + p.soldFor;
      }, 0);

      myBudget = 100 - spent;
      myPlayersCount = myPlayers.length;

      document.getElementById('my-budget').textContent = '₹' + myBudget + ' Cr';
      document.getElementById('my-players-count').textContent = myPlayersCount;
    }
    document.getElementById('current-bidder').textContent =
      data.currentBidderEmail || 'No bids yet';

    // Update sold list
    if (data.soldPlayers) {
      updateSoldList(data.soldPlayers);
    }

    // Show host controls
    if (isHost) {
      document.getElementById('host-controls').style.display = 'flex';
    }

    // Start timer
    startTimer(30);
  });
}


// ============================================
// TIMER
// ============================================
function startTimer(seconds) {
  // Clear any existing timer
  if (timerInterval) clearInterval(timerInterval);

  var timeLeft = seconds;
  document.getElementById('timer-display').textContent = timeLeft;

  timerInterval = setInterval(function() {
    timeLeft--;
    document.getElementById('timer-display').textContent = timeLeft;

    // Change color when low
    if (timeLeft <= 10) {
      document.getElementById('timer-display').style.color = '#ff4444';
    } else {
      document.getElementById('timer-display').style.color = '#e94560';
    }

    // Timer finished
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      document.getElementById('timer-display').textContent = '⏰';
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

    // Check budget
    if (newBid > myBudget) {
      alert('⚠️ Not enough budget!');
      return;
    }

    // Get username
    var userRef = doc(db, 'users', user.uid);
    var userSnap = await getDoc(userRef);
    var displayName = userSnap.exists()
      ? userSnap.data().username
      : user.email;

    // Update bid
    await updateDoc(roomRef, {
      currentBid: newBid,
      currentBidder: user.uid,
      currentBidderEmail: displayName
    });

    // Restart timer
    startTimer(30);

  } catch (error) {
    console.error('Bid error:', error);
  }
}

document.getElementById('btn-bid-5').addEventListener('click', function() {
  placeBid(5);
});

document.getElementById('btn-bid-10').addEventListener('click', function() {
  placeBid(10);
});

document.getElementById('btn-bid-20').addEventListener('click', function() {
  placeBid(20);
});


// ============================================
// SOLD BUTTON - Host only
// ============================================
document.getElementById('btn-sold').addEventListener('click', async function() {
  if (!currentRoomCode) return;

  var roomRef = doc(db, 'rooms', currentRoomCode);
  var snapshot = await getDoc(roomRef);
  var data = snapshot.data();

  var idx = data.currentPlayerIndex || 0;
  var player = IPL_PLAYERS[idx];
  var soldPlayers = data.soldPlayers || [];

  // Add to sold list with full details
  soldPlayers.push({
    playerName: player.name,
    playerRole: player.role,
    playerTeam: player.team,
    playerEmoji: player.emoji,
    soldTo: data.currentBidderEmail || 'No bidder',
    soldToId: data.currentBidder || null,
    soldFor: data.currentBid || player.basePrice
  });

  var nextIndex = idx + 1;

  if (nextIndex >= IPL_PLAYERS.length) {
    await updateDoc(roomRef, {
      status: 'finished',
      soldPlayers: soldPlayers
    });
    // Show results
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

  startTimer(30);
});


// ============================================
// UNSOLD BUTTON - Host only
// ============================================
document.getElementById('btn-unsold').addEventListener('click', async function() {
  if (!currentRoomCode) return;

  var roomRef = doc(db, 'rooms', currentRoomCode);
  var snapshot = await getDoc(roomRef);
  var data = snapshot.data();

  var idx = data.currentPlayerIndex || 0;
  var nextIndex = idx + 1;

  if (nextIndex >= IPL_PLAYERS.length) {
    await updateDoc(roomRef, { status: 'finished' });
    // Show results
    showResults(currentRoomCode);
    return;
  }

  // Move to next player without adding to sold list
  await updateDoc(roomRef, {
    currentPlayerIndex: nextIndex,
    currentBid: IPL_PLAYERS[nextIndex].basePrice,
    currentBidder: null,
    currentBidderEmail: 'No bids yet',
    timerStarted: new Date()
  });

  startTimer(30);
});


// ============================================
// UPDATE SOLD LIST UI
// ============================================
function updateSoldList(soldPlayers) {
  var soldList = document.getElementById('sold-list');
  soldList.innerHTML = '';

  soldPlayers.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'sold-item';
    div.innerHTML =
      '<span>🏏 ' + item.playerName + '</span>' +
      '<strong>₹' + item.soldFor + ' Cr → ' + item.soldTo + '</strong>';
    soldList.appendChild(div);
  });
}

// ============================================
// MY TEAM TRACKING
// ============================================
let myTeamPlayers = [];
let budgetSpent = 0;


// ============================================
// MY TEAM BUTTON
// ============================================
document.getElementById('btn-myteam').addEventListener('click', function() {
  updateMyTeamScreen();
  showScreen('screen-myteam');
});


// ============================================
// BACK TO AUCTION BUTTON
// ============================================
document.getElementById('btn-back-auction').addEventListener('click', function() {
  showScreen('screen-auction');
});


// ============================================
// UPDATE MY TEAM SCREEN
// ============================================
function updateMyTeamScreen() {
  var user = auth.currentUser;
  if (!user || !currentRoomCode) return;

  var roomRef = doc(db, 'rooms', currentRoomCode);

  getDoc(roomRef).then(function(snapshot) {
    if (!snapshot.exists()) return;
    var data = snapshot.data();
    var soldPlayers = data.soldPlayers || [];

    // Filter only my players
    myTeamPlayers = soldPlayers.filter(function(p) {
      return p.soldToId === user.uid;
    });

    // Calculate budget spent
    budgetSpent = myTeamPlayers.reduce(function(total, p) {
      return total + p.soldFor;
    }, 0);

    var budgetLeft = myBudget - budgetSpent;

    // Update stats
    document.getElementById('stat-budget-left').textContent = '₹' + budgetLeft + ' Cr';
    document.getElementById('stat-budget-spent').textContent = '₹' + budgetSpent + ' Cr';
    document.getElementById('stat-players-bought').textContent = myTeamPlayers.length;

    // Update my players list
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
            '<div class="player-name">' + p.playerEmoji + ' ' + p.playerName + '</div>' +
            '<div class="player-role">' + p.playerRole + ' • ' + p.playerTeam + '</div>' +
          '</div>' +
          '<div class="player-price">₹' + p.soldFor + ' Cr</div>';
        myteamList.appendChild(div);
      });
    }

    // Update all teams list
    updateAllTeams(soldPlayers);
  });
}


// ============================================
// ALL TEAMS SUMMARY
// ============================================
function updateAllTeams(soldPlayers) {
  var allteamsList = document.getElementById('allteams-list');
  allteamsList.innerHTML = '';

  // Group players by buyer
  var teams = {};
  soldPlayers.forEach(function(p) {
    if (!teams[p.soldTo]) {
      teams[p.soldTo] = [];
    }
    teams[p.soldTo].push(p);
  });

  if (Object.keys(teams).length === 0) {
    allteamsList.innerHTML = '<p class="no-players">No players sold yet!</p>';
    return;
  }

  // Show each team
  Object.keys(teams).forEach(function(email) {
    var players = teams[email];
    var totalSpent = players.reduce(function(t, p) { return t + p.soldFor; }, 0);

    var div = document.createElement('div');
    div.className = 'team-item';

    var playerNames = players.map(function(p) {
      return p.playerEmoji + ' ' + p.playerName + ' (₹' + p.soldFor + 'Cr)';
    }).join(', ');

    div.innerHTML =
      '<div class="team-email">👤 ' + email + ' — Spent: ₹' + totalSpent + ' Cr</div>' +
      '<div class="team-players">' + playerNames + '</div>';

    allteamsList.appendChild(div);
  });
}

// ============================================
// SHOW RESULTS SCREEN
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

    // Group players by buyer
    var teams = {};
    soldPlayers.forEach(function(p) {
      if (!p.soldToId) return;
      if (!teams[p.soldToId]) {
        teams[p.soldToId] = {
          email: p.soldTo,
          players: [],
          totalSpent: 0
        };
      }
      teams[p.soldToId].players.push(p);
      teams[p.soldToId].totalSpent += p.soldFor;
    });

    // Sort teams by most players then least spent
    var sortedTeams = Object.values(teams).sort(function(a, b) {
      if (b.players.length !== a.players.length) {
        return b.players.length - a.players.length;
      }
      return a.totalSpent - b.totalSpent;
    });

    // Show winner
    if (sortedTeams.length > 0) {
      var winner = sortedTeams[0];
      document.getElementById('winner-name').textContent = winner.email;
      document.getElementById('winner-stats').textContent =
        winner.players.length + ' players • ₹' + winner.totalSpent + ' Cr spent';
    }

    // Show rankings
    var rankingsDiv = document.getElementById('final-rankings');
    rankingsDiv.innerHTML = '';

    var medals = ['🥇', '🥈', '🥉'];

    sortedTeams.forEach(function(team, index) {
      var div = document.createElement('div');
      div.className = 'ranking-item';
      div.innerHTML =
        '<div class="ranking-position">' + (medals[index] || (index + 1) + '.') + '</div>' +
        '<div class="ranking-info">' +
          '<div class="ranking-email">' + team.email + '</div>' +
          '<div class="ranking-details">' + team.players.length + ' players bought</div>' +
        '</div>' +
        '<div class="ranking-budget">₹' + team.totalSpent + ' Cr</div>';
      rankingsDiv.appendChild(div);
    });

    // Show my final team
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
            '<div class="player-name">' + p.playerEmoji + ' ' + p.playerName + '</div>' +
            '<div class="player-meta">' + p.playerRole + ' • ' + p.playerTeam + '</div>' +
          '</div>' +
          '<div class="player-price">₹' + p.soldFor + ' Cr</div>';
        finalMyteam.appendChild(div);
      });
    }
  });
}


// ============================================
// RESULTS ACTION BUTTONS
// ============================================
document.getElementById('btn-view-season').addEventListener('click', function() {
  alert('🗓️ Season Leaderboard — coming in Step 15!');
});

document.getElementById('btn-share-result').addEventListener('click', function() {
  var user = auth.currentUser;
  if (!user) return;

  // Build share text
  var shareText = '🏏 My IPL Auction Team!\n\n';
  myTeamPlayers.forEach(function(p) {
    shareText += p.playerEmoji + ' ' + p.playerName + ' — ₹' + p.soldFor + ' Cr\n';
  });
  shareText += '\nTotal Spent: ₹' + budgetSpent + ' Cr';
  shareText += '\n\nPlay at: https://YOUR-USERNAME.github.io/ipl-auction-game';

  // Copy to clipboard
  navigator.clipboard.writeText(shareText).then(function() {
    alert('✅ Team copied to clipboard! Share it with your friends!');
  });
});

document.getElementById('btn-new-auction').addEventListener('click', function() {
  if (confirm('⚠️ Start a new auction? This will reset the current room.')) {
    showScreen('screen-lobby');
  }
});

// ============================================
// SAVE USERNAME
// ============================================
document.getElementById('btn-save-username').addEventListener('click', async function() {
  var user = auth.currentUser;
  if (!user) return;

  var username = document.getElementById('username-input').value.trim();
  var errorEl = document.getElementById('username-error');

  // Validation
  if (username === '') {
    errorEl.textContent = 'Please enter a username.';
    return;
  }

  if (username.length < 3) {
    errorEl.textContent = 'Username must be at least 3 characters.';
    return;
  }

  if (username.length > 20) {
    errorEl.textContent = 'Username must be under 20 characters.';
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errorEl.textContent = 'Only letters, numbers and underscores allowed.';
    return;
  }

  try {
    // Check if username is already taken
    var usernamesRef = doc(db, 'usernames', username.toLowerCase());
    var usernameSnap = await getDoc(usernamesRef);

    if (usernameSnap.exists()) {
      errorEl.textContent = '❌ Username already taken! Try another.';
      return;
    }

    // Save username to Firestore
    var userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      username: username,
      email: user.email,
      uid: user.uid,
      createdAt: new Date()
    });

    // Reserve username so nobody else can take it
    await setDoc(usernamesRef, {
      uid: user.uid
    });

    // Go to lobby
    document.querySelector('#lobby-user strong').textContent = username;
    showScreen('screen-lobby');

  } catch (error) {
    errorEl.textContent = 'Error saving username: ' + error.message;
  }
});

// ============================================
// SETUP SCREEN VARIABLES
// ============================================
let setupBudget = 50;
let setupTimer = 30;
let setupOrder = 'random';
let setupSquadSize = 16;


// ============================================
// SETUP BUTTON HANDLERS
// ============================================
function initSetupButtons() {

  // Budget buttons
  document.querySelectorAll('.budget-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('active-btn'));
      btn.classList.add('active-btn');
      setupBudget = parseInt(btn.dataset.value);
      document.getElementById('budget-display').textContent = '₹' + setupBudget + ' Cr';
    });
  });

  // Custom budget
  document.getElementById('btn-custom-budget').addEventListener('click', function() {
    var val = parseInt(document.getElementById('custom-budget').value);
    if (isNaN(val) || val < 10 || val > 500) {
      alert('⚠️ Please enter a budget between ₹10 Cr and ₹500 Cr');
      return;
    }
    document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('active-btn'));
    setupBudget = val;
    document.getElementById('budget-display').textContent = '₹' + setupBudget + ' Cr';
  });

  // Timer buttons
  document.querySelectorAll('.timer-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active-btn'));
      btn.classList.add('active-btn');
      setupTimer = parseInt(btn.dataset.value);
      document.getElementById('timer-display').textContent = setupTimer + 's';
    });
  });

  // Order buttons
  document.querySelectorAll('.order-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.order-btn').forEach(b => b.classList.remove('active-btn'));
      btn.classList.add('active-btn');
      setupOrder = btn.dataset.value;
      var labels = {
        random: 'Random',
        byTeam: 'By IPL Team',
        byRole: 'By Role',
        byPrice: 'By Price'
      };
      document.getElementById('order-display').textContent = labels[setupOrder];
    });
  });

  // Squad size buttons
  document.querySelectorAll('.squad-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.squad-btn').forEach(b => b.classList.remove('active-btn'));
      btn.classList.add('active-btn');
      setupSquadSize = parseInt(btn.dataset.value);
      document.getElementById('squad-display').textContent = setupSquadSize + ' Players';
    });
  });
}

// Initialize setup buttons
initSetupButtons();


// ============================================
// START AUCTION BUTTON - Opens setup screen
// ============================================
// Find your existing btn-start-auction listener
// and REPLACE it with this:
document.getElementById('btn-start-auction').removeEventListener('click', null);
document.getElementById('btn-start-auction').addEventListener('click', function() {
  if (!isHost) return;
  showScreen('screen-setup');
});


// ============================================
// BACK TO LOBBY BUTTON
// ============================================
document.getElementById('btn-back-lobby').addEventListener('click', function() {
  showScreen('screen-room');
});


// ============================================
// CONFIRM START AUCTION BUTTON
// ============================================
document.getElementById('btn-confirm-start').addEventListener('click', async function() {
  if (!currentRoomCode) return;

  try {
    // Sort players based on host choice
    var orderedPlayers = getOrderedPlayers(setupOrder);

    await updateDoc(doc(db, 'rooms', currentRoomCode), {
      status: 'auction',
      currentPlayerIndex: 0,
      currentBid: orderedPlayers[0].basePrice,
      currentBidder: null,
      currentBidderEmail: 'No bids yet',
      timerStarted: new Date(),
      // Save settings
      settings: {
        budget: setupBudget,
        timer: setupTimer,
        order: setupOrder,
        squadSize: setupSquadSize,
        playerOrder: orderedPlayers.map(p => p.id)
      }
    });

    // Set my budget
    myBudget = setupBudget;
    document.getElementById('my-budget').textContent = '₹' + myBudget + ' Cr';

    // Show auction screen
    document.getElementById('auction-room-code').textContent = currentRoomCode;
    showScreen('screen-auction');
    listenToAuction(currentRoomCode);

  } catch (error) {
    alert('Error starting auction: ' + error.message);
  }
});


// ============================================
// ORDER PLAYERS BASED ON HOST CHOICE
// ============================================
function getOrderedPlayers(order) {
  var players = [...IPL_PLAYERS];

  if (order === 'random') {
    // Fisher-Yates shuffle
    for (var i = players.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = players[i];
      players[i] = players[j];
      players[j] = temp;
    }
  } else if (order === 'byTeam') {
    players.sort(function(a, b) {
      return a.team.localeCompare(b.team);
    });
  } else if (order === 'byRole') {
    var roleOrder = {
      'Batsman': 1,
      'Wicketkeeper': 2,
      'All-rounder': 3,
      'Bowler': 4
    };
    players.sort(function(a, b) {
      return (roleOrder[a.role] || 5) - (roleOrder[b.role] || 5);
    });
  } else if (order === 'byPrice') {
    players.sort(function(a, b) {
      return b.basePrice - a.basePrice;
    });
  }

  return players;
}
