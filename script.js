import { supabase, getUser } from './auth.js'

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let timerInterval;
let seconds = 0;

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const timerDisplay = document.getElementById('timerDisplay');
const recordStatus = document.getElementById('recordStatus');
const transcriptDiv = document.getElementById('transcript');
const feedbackDiv = document.getElementById('feedback');
const fillerResult = document.getElementById('fillerResult');

// Start recording
startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await processAudio(audioBlob);
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    isRecording = true;
    startTimer();
    
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';
    recordStatus.textContent = '🔴 Recording...';
    recordStatus.style.color = '#ef4444';
    
  } catch (error) {
    console.error('Error accessing microphone:', error);
    recordStatus.textContent = '❌ Microphone access denied';
    alert('Please allow microphone access to record your speech.');
  }
});

// Stop recording
stopBtn.addEventListener('click', () => {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    stopTimer();
    
    stopBtn.style.display = 'none';
    startBtn.style.display = 'inline-flex';
    recordStatus.textContent = '⏳ Analyzing...';
    recordStatus.style.color = '#f59e0b';
  }
});

// Timer functions
function startTimer() {
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerDisplay.textContent = `⏱ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// Process audio with AI
async function processAudio(audioBlob) {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      alert('Please login to save your practice sessions');
      return;
    }

    // Convert audio to text (using Web Speech API for demo)
    const transcript = await convertAudioToText(audioBlob);
    transcriptDiv.textContent = transcript || 'No speech detected';

    // Analyze for filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'so'];
    const words = transcript.toLowerCase().split(/\s+/);
    let fillerCount = 0;
    const detectedFillers = [];
    
    words.forEach(word => {
      if (fillerWords.includes(word)) {
        fillerCount++;
        detectedFillers.push(word);
      }
    });

    // Generate AI feedback
    let feedback = '';
    if (fillerCount > 10) {
      feedback = `⚠️ You used ${fillerCount} filler words (${detectedFillers.slice(0, 5).join(', ')}...). Try to pause instead of using fillers. Practice speaking slowly and deliberately.`;
    } else if (fillerCount > 5) {
      feedback = `📊 You used ${fillerCount} filler words. Focus on reducing "um" and "uh" by taking deep breaths and pausing.`;
    } else if (fillerCount > 0) {
      feedback = `🎯 Great job! Only ${fillerCount} filler words detected. Your speech is clear and confident!`;
    } else {
      feedback = `🌟 Excellent! No filler words detected. You speak very clearly and confidently!`;
    }

    // Add duration feedback
    const duration = seconds;
    if (duration < 30) {
      feedback += ` Try to speak for at least 1 minute to get better feedback.`;
    } else if (duration > 180) {
      feedback += ` Great length! You spoke for ${Math.floor(duration/60)} minutes.`;
    }

    feedbackDiv.textContent = feedback;

    // Show filler words
    if (fillerCount > 0) {
      fillerResult.style.display = 'block';
      fillerResult.innerHTML = `⚠️ Detected filler words: ${detectedFillers.join(', ')} (${fillerCount} total)`;
      fillerResult.style.background = 'rgba(239,68,68,0.1)';
      fillerResult.style.borderColor = '#ef4444';
      fillerResult.style.color = '#dc2626';
    } else {
      fillerResult.style.display = 'block';
      fillerResult.innerHTML = '✅ No filler words detected! Great job!';
      fillerResult.style.background = 'rgba(34,197,94,0.1)';
      fillerResult.style.borderColor = '#22c55e';
      fillerResult.style.color = '#16a34a';
    }

    // Save to database
    await saveSession(user.id, transcript, feedback, fillerCount, duration);
    
    recordStatus.textContent = '✅ Analysis complete!';
    setTimeout(() => {
      recordStatus.textContent = 'Ready to record';
      recordStatus.style.color = 'var(--text-muted)';
    }, 2000);

  } catch (error) {
    console.error('Error processing audio:', error);
    recordStatus.textContent = '❌ Error analyzing speech';
    feedbackDiv.textContent = 'Error processing your speech. Please try again.';
  }
}

// Convert audio to text using Web Speech API
function convertAudioToText(audioBlob) {
  return new Promise((resolve) => {
    // For demo purposes, return a sample transcript
    // In production, you would use a speech-to-text API
    const sampleTranscripts = [
      "Hello everyone, today I want to talk about the importance of public speaking. It's a skill that can change your life.",
      "Public speaking is an essential skill in today's world. Whether you're in business or education, being able to speak confidently matters.",
      "I believe that everyone can become a great speaker with practice. The key is to start small and build confidence over time.",
      "When I first started speaking publicly, I was nervous. But with practice, I learned to control my nerves and speak with confidence.",
      "The most important thing is to know your audience and speak from the heart. Authenticity resonates with people."
    ];
    
    setTimeout(() => {
      resolve(sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)]);
    }, 2000);
  });
}

// Save session to Supabase
async function saveSession(userId, transcript, feedback, fillerCount, duration) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          user_id: userId,
          transcript: transcript,
          feedback: feedback,
          filler_count: fillerCount,
          duration: formatDuration(duration),
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error saving session:', error);
    } else {
      console.log('Session saved successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Format duration
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Load random topic on page load
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
  "Why is public speaking important in daily life?"
];

window.newTopic = function() {
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  document.getElementById('topicText').textContent = randomTopic;
};

// Initialize topic on page load
if (document.getElementById('topicText')) {
  window.newTopic();
}