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
  feedbackDiv.innerText = "";
  recognition.start();
};

// ⏹ Stop recording + analyze speech
document.getElementById("stopBtn").onclick = () => {
  recognition.stop();
  analyzeSpeech(finalText);
};


// 🔊 TEXT TO SPEECH FUNCTION (FREE BUILT-IN VOICE)
function speakFeedback(text) {
  window.speechSynthesis.cancel(); // stop previous speech
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  speech.rate = 1;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
}


// 🧠 Speech Analysis Function
function analyzeSpeech(text) {

  let suggestions = [];
  let words = text.toLowerCase().split(" ").filter(w => w.trim() !== "");
  let wordCount = words.length;

  // LENGTH CHECK
  if(wordCount < 10){
    suggestions.push("Your speech is too short. Try adding more points or examples.");
  }
  else if(wordCount > 120){
    suggestions.push("Your speech is long. Try breaking it into smaller sentences.");
  }

  // FILLER WORD CHECK
  const fillers = ["um","uh","like","actually","basically","you know"];
  let fillerCount = 0;

  fillers.forEach(f => {
    if(text.toLowerCase().includes(f)){
      fillerCount++;
    }
  });

  if(fillerCount > 0){
    suggestions.push("Avoid filler words like um, actually, or you know.");
  }

  // OPENING CHECK
  if(!text.toLowerCase().includes("today") &&
     !text.toLowerCase().includes("hello") &&
     !text.toLowerCase().includes("good")){
    suggestions.push("Start with a greeting or introduce your topic clearly.");
  }

  // STRUCTURE CHECK
  if(!text.includes(".")){
    suggestions.push("Pause between sentences for clarity.");
  }

  // VARIETY CHECK
  let uniqueWords = new Set(words);
  if(uniqueWords.size < wordCount * 0.5){
    suggestions.push("Try using more varied vocabulary to sound confident.");
  }

  // POSITIVE FEEDBACK
  if(wordCount > 20 && fillerCount === 0){
    suggestions.push("Good job. Your speech sounds clear and structured.");
  }

  // FINAL OUTPUT
  let resultText = "";

  if(suggestions.length === 0){
    resultText = "Good speech. Try adding stronger examples and a conclusion.";
  } else {
    resultText = suggestions.join(". ");
  }

  feedbackDiv.innerText = resultText;

  // 🔊 SPEAK THE FEEDBACK
  speakFeedback(resultText);
}
