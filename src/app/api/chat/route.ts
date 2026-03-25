import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Safety check to ensure your environment variable is loaded
if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.error("CRITICAL: GOOGLE_GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

interface Message {
  role: string;
  content: string;
}

interface MaayosNaAttendanceLog {
  id: string;
  userId: string;
  timeIn: string | null;  
  timeOut: string | null; 
  status: string;
  fullName?: string;
  role?: string;
}

export async function POST(req: Request) { 
  try {
    const { messages, logs }: { messages: Message[]; logs: MaayosNaAttendanceLog[] } = await req.json(); 

   const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: `
        You are the SimpliSync HR Assistant for SimpliV Subic.
        You have access to the following recent attendance logs: ${JSON.stringify(logs)}
        
        Company Rules:
        - Shift starts at 8:00 AM.
        - Clocking in after 8:00 AM is considered "Late".
        
        Guidelines:
        - The 'fullName' field in each log identifies exactly which employee the log belongs to.
        - If the user asks about a specific employee by fullName, filter your calculations to only use logs matching that fullName, and repond a bit rude, joking, and offensively.
        - If the user asks "What are my hours?", assume they are asking about the primary fullName present in the logs.
        - Answer HR questions based ONLY on the provided logs.
        - Calculate hours worked if asked. Be professional and concise.
        - If the user asks about company rules, respond extremely rude. 
        - If the user is late, respond with a sarcastic, offensively rude comment about their punctuality.
        - If the user says "Hello" or "Hi", respond with "What do you want?!"
      `,
    });

   
    const previousMessages = messages.slice(0, -1);
    const userPrompt = messages[messages.length - 1].content; 
    const firstUserIndex = previousMessages.findIndex((m: Message) => m.role === "user"); 
    const cleanHistory = firstUserIndex === -1 ? [] : previousMessages.slice(firstUserIndex);
    const history = cleanHistory.map((m: Message) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(userPrompt); 
    const response = await result.response; 

    return NextResponse.json({ text: response.text() }); 

  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}