import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "./src/constants";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
  });

  // AI Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, imageBase64, personaInstruction } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error("Missing GEMINI_API_KEY");
        return res.status(500).json({ 
          error: "API Key ka masla hai. Baraye meharbani settings check karein." 
        });
      }

      const combinedInstruction = `${SYSTEM_PROMPT}\n\nPersona Role: ${personaInstruction || 'Aap ek helpful assistant hain.'}`;

      let result;
      if (imageBase64) {
        result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{
            role: "user",
            parts: [
              { text: prompt || "Is photo ko analyze karein aur asaan Roman Urdu mein samjhayen." },
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: "image/jpeg"
                }
              }
            ]
          }],
          config: {
            systemInstruction: combinedInstruction
          }
        });
      } else {
        result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{
            role: "user",
            parts: [{ text: prompt }]
          }],
          config: {
            systemInstruction: combinedInstruction
          }
        });
      }

      if (!result?.text) {
        console.warn("Gemini returned empty text or was blocked.", result);
        return res.status(200).json({ 
          text: "Mafi chahta hoon, main is baat ka jawab nahi de sakta (Safety Block or Internal Error)." 
        });
      }

      res.json({ text: result.text });

    } catch (error: any) {
      console.error("Gemini Error:", error);
      let message = "Nizaam mein kuch masla aa gaya hai. Baraye meharbani dobara koshish karein.";
      
      if (error?.message?.includes("API key")) {
        message = "API Key ka masla hai. Baraye meharbani settings check karein.";
      } else if (error?.message?.includes("User location is not supported")) {
        message = "Aapki location is model ke liye filhal supported nahi hai.";
      } else if (error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
        message = "AI ki limits khatam ho gayi hain (Limit Exceeded). Aap 'Advanced Setup' use karein ya thori der ruk kar koshish karein. Baraye meharbani kuch dair baad dobara koshish karein.";
      } else if (error?.message?.includes("safety")) {
        message = "Mafi chahta hoon, ye suwal safety policies ke khilaf ho sakta hai.";
      } else if (error?.message?.includes("fetch")) {
        message = "AI server se rabta nahi ho pa raha (Fetch error). Internet ya API limit check karein.";
      }

      res.status(500).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
