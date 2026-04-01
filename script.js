import { saveSession, updateNav } from './auth.js'

const transcriptDiv = document.getElementById("transcript");
const feedbackDiv = document.getElementById("feedback");

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;

let finalText = "";
let timerInterval = null;
let seconds = 0;
let fillerCount = 0;

const BACKEND_URL = "https://speech-ai-website-1.onrender.com";

window.addEventListener("beforeunload", () => window.speechSynthesis.cancel());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) window.speechSynthesis.cancel();
});

recognition.onresult = function(event) {
  finalText = "";
  for (let i = 0; i < event.results.length; i++) {
    finalText += event.results[i][0].transcript;
  }
  transcriptDiv.innerText = finalText;
};

document.getElementById("startBtn").onclick = () => {
  finalText = "";
  transcriptDiv.innerText = "";
  feedbackDiv.innerText = "";
  document.getElementById("fillerResult").style.display = "none";
  seconds = 0;
  fillerCount = 0;
  updateTimer();
  timerInterval = setInterval(() => { seconds++; updateTimer(); }, 1000);
  recognition.start();
};

document.getElementById("stopBtn").onclick = () => {
  recognition.stop();
  clearInterval(timerInterval);
  fillerCount = showFillerCount(finalText);
  getAIFeedback(finalText);
};

function updateTimer() {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  document.getElementById("timerDisplay").innerText = `⏱ ${m}:${s}`;
}

function showFillerCount(text) {
  const fillers = ["um", "uh", "like", "you know", "basically", "literally", "actually", "so", "right"];
  const lower = text.toLowerCase();
  let total = 0;
  let breakdown = [];
  fillers.forEach(f => {
    const regex = new RegExp(`\\b${f}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      total += matches.length;
      breakdown.push(`"${f}" × ${matches.length}`);
    }
  });
  const box = document.getElementById("fillerResult");
  box.style.display = "block";
  if (total === 0) {
    box.innerHTML = `✅ <strong>No filler words detected!</strong> Great job!`;
    box.style.background = "rgba(34,197,94,0.1)";
    box.style.borderColor = "#22c55e";
    box.style.color = "#15803d";
  } else {
    box.innerHTML = `⚠️ <strong>${total} filler word(s) detected:</strong> ${breakdown.join(", ")}`;
    box.style.background = "rgba(239,68,68,0.08)";
    box.style.borderColor = "#ef4444";
    box.style.color = "#dc2626";
  }
  return total;
}

function speakFeedback(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-IN";
  speech.pitch = 1.1;
  speech.rate = 0.95;
  speech.volume = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

async function getAIFeedback(text) {
  if (!text || text.trim() === "") {
    feedbackDiv.innerText = "No speech detected.";
    return;
  }
  feedbackDiv.innerText = "Analyzing with AI...";
  try {
    const response = await fetch(`${BACKEND_URL}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    feedbackDiv.innerText = data.reply;
    speakFeedback(data.reply);

    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    await saveSession(text, data.reply, `${m}:${s}`, fillerCount);

  } catch (error) {
    feedbackDiv.innerText = "Backend not reachable. Is the server running?";
    console.error(error);
  }
}

// Dark mode
window.toggleDark = function() {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('darkToggle');
  btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  localStorage.setItem('dark', document.body.classList.contains('dark'));
}
if (localStorage.getItem('dark') === 'true') {
  document.body.classList.add('dark');
  const btn = document.getElementById('darkToggle');
  if (btn) btn.textContent = '☀️';
}

// Topic prompts
const topics = [
  "Describe your biggest achievement in 2 minutes.",
  "Talk about a person who inspired you the most.",
  "What would you do if you were president for a day?",
  "Describe your dream job and why you want it.",
  "Talk about a challenge you overcame recently.",
  "What is the most important skill for success?",
  "Describe a place you would love to visit and why.",
  "What does success mean to you?",
  "Talk about a book or movie that changed your perspective.",
  "Why is public speaking important in daily life?",
  "Describe your perfect day from morning to night.",
  "What advice would you give your younger self?",
  "Talk about a hobby you are passionate about.",
  "What is the biggest problem in the world today?",
  "Describe a time you had to make a difficult decision."
];

window.newTopic = function() {
  const t = topics[Math.floor(Math.random() * topics.length)];
  document.getElementById('topicText').textContent = t;
}
if (document.getElementById('topicText')) window.newTopic();

// Particles
const container = document.getElementById('particles');
if (container) {
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDelay = Math.random() * 8 + 's';
    p.style.animationDuration = (6 + Math.random() * 8) + 's';
    p.style.width = p.style.height = (4 + Math.random() * 6) + 'px';
    p.style.opacity = 0.15 + Math.random() * 0.25;
    container.appendChild(p);
  }
}