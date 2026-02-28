require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY = process.env.GROQ_KEY;

// 🧠 Speech feedback route
app.post("/ai", async (req, res) => {
  const text = req.body.text;
  if (!text || text.trim() === "") return res.json({ reply: "No speech detected." });

  const prompt = `
You are a professional public speaking coach.
Analyze the speech below and reply ONLY in this format:
Strengths:
- ...
Weaknesses:
- ...
Suggestions:
- ...
Speech:
${text}`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: "You are a speech coach." }, { role: "user", content: prompt }],
        temperature: 0.7
      })
    });
    const data = await r.json();
    let reply = "No AI response";
    if (data.choices && data.choices.length > 0) reply = data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({ reply: "Error contacting AI." });
  }
});

// 📋 Diagnostic questions route
app.post("/generate-questions", async (req, res) => {
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{
          role: "user",
          content: `Generate exactly 25 multiple choice questions to test advanced English and public speaking skills.
Include exactly:
- 5 Comprehension questions (based on a short paragraph or context, testing understanding)
- 10 Grammar questions (advanced grammar: subjunctive, passive voice, conditionals, tenses, articles)
- 5 Pronunciation questions (silent letters, syllable stress, homophones, phonetics)
- 5 Vocabulary questions (advanced vocabulary, idioms, formal vs informal usage, word meaning in context)

Difficulty: above intermediate, close to advanced level. Avoid simple or obvious questions.

Return ONLY a valid JSON array, no extra text, no markdown, no backticks, in this format:
[{"category":"Grammar","question":"...","options":["a","b","c","d"],"answer":0}]
The answer field is the index 0-3 of the correct option. Make questions completely different each time.`
        }],
        temperature: 0.9
      })
    });
    const data = await r.json();
    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(clean);
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.json({ error: "Failed to generate questions" });
  }
});

app.get("/", (req, res) => {
  res.send("Speech AI backend running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));