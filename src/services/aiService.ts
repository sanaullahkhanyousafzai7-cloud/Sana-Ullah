
export async function getAIResponse(prompt: string, imageBase64?: string, personaInstruction?: string) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, imageBase64, personaInstruction }),
    });

    if (!response.ok) {
      let errorMessage = "Nizaam mein kuch masla aa gaya hai.";
      try {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } catch (e) {
        errorMessage = `Server Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.text || "Main mafi chahta hoon, lekin main iska jawab nahi de saka.";
  } catch (error: any) {
    console.error("AI Error:", error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error("Server se rabta nahi ho raha. Internet check karein ya page refresh karein.");
    }
    throw error;
  }
}
