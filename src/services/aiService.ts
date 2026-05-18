import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getAIResponse(prompt: string, imageBase64?: string) {
  try {
    if (imageBase64) {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt || "Is photo ko analyze karein aur asaan Roman Urdu mein samjhayen." },
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg"
              }
            }
          ]
        },
        config: {
          systemInstruction: SYSTEM_PROMPT
        }
      });
      return response.text || "Main mafi chahta hoon, lekin main iska jawab nahi de saka.";
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT
        }
      });
      return response.text || "Main mafi chahta hoon, lekin main iska jawab nahi de saka.";
    }
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Improved error handling for user feedback
    if (error?.message?.includes("API key")) {
      throw new Error("API Key ka masla hai. Baraye meharbani settings check karein.");
    } else if (error?.message?.includes("User location is not supported")) {
      throw new Error("Aapki location is model ke liye filhal supported nahi hai.");
    } else if (error?.message?.includes("safety")) {
      throw new Error("Mafi chahta hoon, ye suwal safety policies ke khilaf ho sakta hai.");
    } else {
      throw new Error("Nizaam mein kuch masla aa gaya hai. Baraye meharbani dobara koshish karein.");
    }
  }
}
