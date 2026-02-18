const transcriptDiv = document.getElementById("transcript");
const feedbackDiv = document.getElementById("feedback");

const recognition = new webkitSpeechRecognition();
recognition.continuous = true;

let finalText = "";

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
  feedbackDiv.innerText = "Listening...";
  recognition.start();
};

// ⏹ Stop recording → send to backend
document.getElementById("stopBtn").onclick = () => {
  recognition.stop();
  getAIFeedback(finalText);
};

// 🔊 Speak feedback
function speakFeedback(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

// 🧠 SEND TEXT TO BACKEND PROXY
async function getAIFeedback(text) {

  if (!text || text.trim() === "") {
    feedbackDiv.innerText = "No speech detected.";
    return;
  }

  feedbackDiv.innerText = "Analyzing with AI...";

  try {

    const response = await fetch("http://localhost:3000/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();

    feedbackDiv.innerText = data.reply;
    speakFeedback(data.reply);

  } catch (error) {
    feedbackDiv.innerText = "Backend not reachable. Is server running?";
    console.error(error);
  }
}
