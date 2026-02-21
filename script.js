const transcriptDiv = document.getElementById("transcript");
const feedbackDiv = document.getElementById("feedback");

const recognition = new webkitSpeechRecognition();
recognition.continuous = true;

let finalText = "";
let timerInterval = null;
let seconds = 0;

const BACKEND_URL = "https://speech-ai-website-1.onrender.com";

// Stop speech on exit
window.addEventListener("beforeunload", () => window.speechSynthesis.cancel());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) window.speechSynthesis.cancel();
});

// 🎤 Capture speech
recognition.onresult = function(event) {
  finalText = "";
  for (let i = 0; i < event.results.length; i++) {
    finalText += event.results[i][0].transcript;
  }
  transcriptDiv.innerText = finalText;
};

// ▶ Start recording
document.getElementById("startBtn").onclick = () => {
  finalText = "";
  transcriptDiv.innerText = "";
  feedbackDiv.innerText = "";
  document.getElementById("fillerResult").style.display = "none";
  seconds = 0;
  updateTimer();
  timerInterval = setInterval(() => {
    seconds++;
    updateTimer();
  }, 1000);
  recognition.start();
};

// ⏹ Stop recording
document.getElementById("stopBtn").onclick = () => {
  recognition.stop();
  clearInterval(timerInterval);
  showFillerCount(finalText);
  getAIFeedback(finalText);
};

// ⏱ Timer display
function updateTimer() {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  document.getElementById("timerDisplay").innerText = `⏱ ${m}:${s}`;
}

// 🔢 Filler word counter
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
  } else {
    box.innerHTML = `⚠️ <strong>${total} filler word(s) detected:</strong> ${breakdown.join(", ")}`;
    box.style.background = "rgba(239,68,68,0.08)";
    box.style.borderColor = "#ef4444";
  }
}

// 🔊 Speak feedback
function speakFeedback(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-IN";
  speech.pitch = 1.1;
  speech.rate = 0.95;
  speech.volume = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

// 🧠 Send to AI
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
  } catch (error) {
    feedbackDiv.innerText = "Backend not reachable. Is the server running?";
    console.error(error);
  }
}