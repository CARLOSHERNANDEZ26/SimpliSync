import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.error("CRITICAL: GOOGLE_GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

interface Message {
  role: "user" | "model" | "function";
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

    const tools = [
      {
        functionDeclarations: [
          {
            name: "search_announcements",
            description: "Search the official SimpliSync company announcements, memos, and policies. Use this tool BEFORE answering any questions about company rules, dress codes, leaves, or policies.",
            parameters: {
              type: "OBJECT",
              properties: {
                query: {
                  type: "STRING",
                  description: "The keyword or topic to search for (e.g., 'dress code', 'late policy', 'holidays').",
                },
              },
              required: ["query"],
            },
          },
        ],
      },
    ];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      // @ts-expect-error - Bypassing strict type checking on tools array for older SDK versions
      tools: tools,
      systemInstruction: `
        You are the SimpliSync HR Assistant for SimpliV Subic.
        
        STRICT RAG GUIDELINES (ANTI-HALLUCINATION):
        - You have a tool called 'search_announcements'. You MUST use this tool if the user asks anything about company policies, rules, memos, or guidelines.
        - NEVER make up or guess a policy. 
        - If the tool returns no matching policies, you MUST reply: "There is no official policy written about that yet. Try asking another question. Thank you for understanding!"
        - Ground your answers strictly in the text returned by the tool.
        
        ATTENDANCE LOGS:
        - You have access to recent logs: ${JSON.stringify(logs)}
        - Shift starts at 8:00 AM. After 8:00 AM is considered "Late".
        
        PERSONA GUIDELINES:
        - Maintain your professional, sarcastic and helpful HR persona.
        - If they say "Hello", respond with "Hello! Kumusta?" 
        - If they are late according to the logs, comment on their punctuality professionally.
        - If they ask about policies, give them the EXACT rule from the database respectfully.
      `,
    });

    const historyMessages = messages.slice(0, -1);
    const validHistory: Message[] = [];
    let foundFirstUser = false;

    for (const msg of historyMessages) {
      if (msg.role === 'user') foundFirstUser = true;
      if (foundFirstUser) validHistory.push(msg);
    }

    const history = validHistory.map((m: Message) => ({
      role: m.role,
      parts: [{ text: m.content }] as Part[],
    }));

    const userPrompt = messages[messages.length - 1].content; 
    const chat = model.startChat({ history });

    let result = await chat.sendMessage(userPrompt); 
    let response = result.response; 

    const functionCalls = response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      
      if (call.name === "search_announcements") {
        const queryArg = (call.args as { query: string }).query.toLowerCase();
        console.log(`[Agentic RAG] AI is searching DB for: ${queryArg}`);

        const snapshot = await getDocs(collection(db, "announcements"));
        
        // 🔥 FIXED: Safely parse Firestore timestamps without throwing .toDate() errors
        const searchResultText = snapshot.docs
          .map(doc => {
            const data = doc.data();
            const date = data.createdAt?.seconds 
              ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() 
              : "Recent";
            
            return `[Policy by ${data.author || "Admin"} on ${date}]: ${data.content || ""}`;
          })
          .join("\n\n") || "NO RELEVANT POLICIES FOUND.";

        result = await chat.sendMessage([{
          functionResponse: {
            name: "search_announcements",
            response: { content: searchResultText }
          }
        }]);
        
        response = result.response;
      }

    }

    return NextResponse.json({ text: response.text() }); 

  } catch (err: unknown) { 
    console.error("Chat Error:", err);
    const error = err as { message?: string; status?: number };
  
    if (error.message?.includes("503") || error.message?.includes("high demand") || error.status === 503) {
      return NextResponse.json({ 
        text: "I'm currently overwhelmed and overloaded, kapagod, try mo ulit mamaya. (Gemini API is likely experiencing high demand or downtime.)" 
      });
    }

    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}