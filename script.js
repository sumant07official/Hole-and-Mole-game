const holes = document.querySelectorAll(".hole");
const scoreBoard = document.querySelector(".score");
const moles = document.querySelectorAll(".mole");
const startBtn = document.querySelector(".start-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const levels = document.querySelector(".levels");
const timerInput = document.querySelector(".timer");

let lastHole;
let timeUp = false;
let score = 0;
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let lastGameScore = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateSoundButton();
});

// Menu Functions
function startNewGame() {
  lastGameScore = 0;
  showGamePage();
}

function continueGame() {
  showGamePage();
}

function showGamePage() {
  document.getElementById('menuPage').style.display = 'none';
  document.getElementById('gamePage').style.display = 'block';
  document.getElementById('scoresModal').classList.remove('show');
}

function backToMenu() {
  if (timeUp === false) {
    if (confirm('Game in progress. Are you sure you want to go back to menu?')) {
      endGame();
      document.getElementById('gamePage').style.display = 'none';
      document.getElementById('menuPage').style.display = 'flex';
      saveHighScore(score);
    }
  } else {
    saveHighScore(score);
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('menuPage').style.display = 'flex';
  }
}

function showHighScores() {
  const scores = getHighScores();
  const scoresList = document.getElementById('scoresList');
  
  if (scores.length === 0) {
    scoresList.innerHTML = '<p>No scores yet. Play a game to get started!</p>';
  } else {
    scoresList.innerHTML = scores.map((score, index) => {
      return `
        <div class="score-item">
          <span class="score-rank">#${index + 1}</span>
          <span>${score} points</span>
        </div>
      `;
    }).join('');
  }
  
  document.getElementById('scoresModal').classList.add('show');
}

function closeHighScores() {
  document.getElementById('scoresModal').classList.remove('show');
}

function toggleSounds() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('soundEnabled', soundEnabled);
  updateSoundButton();
  playSound();
}

function updateSoundButton() {
  const soundBtn = document.getElementById('soundBtn');
  soundBtn.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
}

function playSound() {
  if (soundEnabled) {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }
}

function exitGame() {
  if (confirm('Are you sure you want to exit the game?')) {
    if (typeof window.electronAPI !== 'undefined') {
      // Close Electron app
      window.close();
    } else {
      // Close web browser
      window.close();
    }
  }
}

// High Scores Functions
function saveHighScore(points) {
  if (points <= 0) return;
  
  let scores = getHighScores();
  scores.push(points);
  scores.sort((a, b) => b - a);
  scores = scores.slice(0, 10); // Keep only top 10
  
  localStorage.setItem('highScores', JSON.stringify(scores));
}

function getHighScores() {
  const scores = localStorage.getItem('highScores');
  return scores ? JSON.parse(scores) : [];
}

// Game Functions
function getDifficultyLevel() {
  const selectedLevel = document.querySelector('input[name="level"]:checked');
  return selectedLevel ? selectedLevel.id : null;
}

function getValidTime(time) {
  const parsedTime = Number(time);
  return parsedTime >= 5 && parsedTime <= 1000 ? parsedTime : 15;
}

function getRandomTime(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function getRandomHole(holes) {
  const randomIndex = Math.floor(Math.random() * holes.length);
  const selectedHole = holes[randomIndex];

  if (selectedHole === lastHole) {
    return getRandomHole(holes);
  }

  lastHole = selectedHole;
  return selectedHole;
}

function makeMoleAppear(showDuration, hideDuration) {
  const randomDuration = getRandomTime(showDuration, hideDuration);
  const hole = getRandomHole(holes);

  hole.classList.add("up");
  setTimeout(() => {
    hole.classList.remove("up");
    if (!timeUp) {
      makeMoleAppear(showDuration, hideDuration);
    }
  }, randomDuration);
}

function startGame() {
  const difficulty = getDifficultyLevel();
  let showDuration, hideDuration;

  switch (difficulty) {
    case "easy":
      showDuration = 500;
      hideDuration = 1500;
      break;
    case "medium":
      showDuration = 200;
      hideDuration = 1000;
      break;
    case "hard":
      showDuration = 100;
      hideDuration = 800;
      break;
    default:
      showDuration = 500;
      hideDuration = 1500;
  }

  scoreBoard.textContent = 0;
  score = 0;
  timeUp = false;
  cancelBtn.style.display = "block";
  startBtn.style.display = "none";
  levels.style.visibility = "hidden";

  timerInput.value = getValidTime(timerInput.value);

  const countdownInterval = setInterval(() => {
    timerInput.value--;
    if (timerInput.value <= 0) {
      clearInterval(countdownInterval);
      timerInput.value = 0;
      endGame();
    }
  }, 1000);

  makeMoleAppear(showDuration, hideDuration);
}

function endGame() {
  timeUp = true;
  timerInput.value = 0;
  startBtn.style.display = "block";
  cancelBtn.style.display = "none";
  levels.style.visibility = "visible";
  saveHighScore(score);
}

function handleMoleHit(e) {
  if (!e.isTrusted) return; // Prevent fake clicks
  score++;
  this.parentNode.classList.remove("up");
  scoreBoard.textContent = score;
  playSound();
}

moles.forEach((mole) => mole.addEventListener("click", handleMoleHit));
