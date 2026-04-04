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

Tone & Pronunciation:
- ...

Vocabulary & Grammar:
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
        messages: [
          {
            role: "system",
            content: "You are a JSON generator. Output ONLY a valid JSON array. No explanation, no markdown, no backticks, no extra text whatsoever. Just the raw JSON array starting with [ and ending with ]."
          },
          {
            role: "user",
            content: `Generate exactly 25 multiple choice questions for English and public speaking skills.
Include: 5 Comprehension, 10 Grammar, 5 Pronunciation, 5 Vocabulary questions.
Difficulty: above intermediate level.
Format - output ONLY this JSON array, nothing else:
[{"category":"Grammar","question":"...","options":["a","b","c","d"],"answer":0}]
answer is index 0-3 of correct option.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const data = await r.json();

    if (!data.choices || !data.choices[0]) {
      console.error("No choices:", JSON.stringify(data));
      return res.json({ error: "AI did not respond" });
    }

    const text = data.choices[0].message.content.trim();
    console.log("AI response preview:", text.substring(0, 100));

    // Extract JSON array robustly
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');

    if (start === -1 || end === -1) {
      console.error("No JSON array found in:", text.substring(0, 200));
      return res.json({ error: "Could not find JSON array" });
    }

    const jsonStr = text.substring(start, end + 1);
    const questions = JSON.parse(jsonStr);

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.json({ error: "Empty questions array" });
    }

    console.log(`Generated ${questions.length} questions successfully`);
    res.json({ questions });

  } catch (err) {
    console.error("Generate questions error:", err);
    res.json({ error: "Failed to generate questions" });
  }
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