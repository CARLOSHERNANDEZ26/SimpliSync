import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL ERROR: GOOGLE_GEMINI_API_KEY is not defined in .env.local");
      return NextResponse.json(
        { error: "Server configuration error: Missing API Key. Check terminal." },
        { status: 500 }
      );
    }

    // Initialize Gemini safely now that we know the key exists
    const genAI = new GoogleGenerativeAI(apiKey);

    const { messages, logs } = await req.json();
    let policyContext = "No active company policies found.";
    
    try {
      const q = query(collection(db, "announcements"), limit(20));
      const querySnapshot = await getDocs(q);
      
      const policies = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          title: data.title || "Untitled Policy",
          category: data.category || "General",
          content: data.content || ""
        };
      });

      if (policies.length > 0) {
        const groupedPolicies = policies.reduce((acc, policy) => {
          if (!acc[policy.category]) acc[policy.category] = [];
          acc[policy.category].push(`- **${policy.title}**: ${policy.content}`);
          return acc;
        }, {} as Record<string, string[]>);

        policyContext = Object.entries(groupedPolicies)
          .map(([category, items]) => `[Category: ${category}]\n${items.join('\n')}`)
          .join('\n\n');
      }
    } catch (error) {
      console.error("Error fetching policies for context:", error);
    }

    const systemPrompt = `You are the SimpliSync HR Assistant. You are a helpful, professional, and slightly conversational AI for a company in the Philippines (Subic City).

Here is the employee's recent attendance data (only reference this if they ask about their hours, lates, or shifts):
${JSON.stringify(logs, null, 2)}

Here is the official categorized Company Handbook and Active Policies (Base your answers strictly on this):
${policyContext}

RULES:
1. Always base your policy answers on the "Company Handbook" provided above.
2. If the user asks about a specific category (e.g., "overtime" or "payroll"), focus your answer on the corresponding category in the handbook.
3. If you don't know the answer or the policy isn't listed, honestly state: "I cannot find a specific policy regarding that in my current database. Please consult HR directly."
4. Be concise, friendly, and format your answers clearly (use bullet points if needed).
5. Never invent or hallucinate company rules.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const latestUserMessage = messages[messages.length - 1].content;
    
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: latestUserMessage }] }
      ]
    });

    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });
    
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request." },
      { status: 500 }
    );
  }
}