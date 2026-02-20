const transcriptDiv = document.getElementById("transcript");
const feedbackDiv = document.getElementById("feedback");

window.addEventListener("beforeunload", () => {
  window.speechSynthesis.cancel();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) window.speechSynthesis.cancel();
});
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;

let finalText = "";

const BACKEND_URL = "https://speech-ai-website-1.onrender.com";

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
  feedbackDiv.innerText = "Listening...";
  recognition.start();
};

document.getElementById("stopBtn").onclick = () => {
  recognition.stop();
  getAIFeedback(finalText);
};

function speakFeedback(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-IN";        // accent
  speech.pitch = 1.1;           // voice pitch (0 to 2)
  speech.rate = 0.95;           // speaking speed (0.5 to 2)
  speech.volume = 1;            // volume (0 to 1)
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
      headers: {
        "Content-Type": "application/json"
      },
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