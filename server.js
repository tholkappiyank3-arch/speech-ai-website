require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_KEY = process.env.GROQ_KEY;

app.post("/ai", async (req, res) => {

  const text = req.body.text;

  if (!text || text.trim() === "") {
    return res.json({ reply: "No speech detected." });
  }

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
${text}
`;

  try {

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a speech coach." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await r.json();

    let reply = "No AI response";
    if (data.choices && data.choices.length > 0) {
      reply = data.choices[0].message.content;
    }

    res.json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({ reply: "Error contacting AI." });
  }
});

app.get("/", (req, res) => {
  res.send("Speech AI backend running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));