// ============================================
// FIREBASE SETUP
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    // User is logged in
    document.querySelector('#lobby-user strong').textContent = user.email;
    showScreen('screen-lobby');
  } else {
    // User is logged out
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
// JOIN ROOM BUTTON
// ============================================
document.getElementById('btn-join-room').addEventListener('click', function() {
  var code = document.getElementById('join-code').value;

  if (code === '') {
    alert('⚠️ Please enter a room code.');
    return;
  }

  alert('🔗 Join Room — coming in next step!');
});
