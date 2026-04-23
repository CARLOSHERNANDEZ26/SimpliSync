import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "API key is missing from environment variables." }, { status: 500 });
    }

    const body = await req.json();
    const { prompt } = body as { prompt?: string };

    if (!prompt) {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `
      You are an expert HR Manager and Corporate Policy Writer for a company called SimpliV. 
      Draft a professional, clear, and empathetic corporate memo based on the user's instructions.
      Format the output in plain text with clear paragraph breaks. Do not use Markdown formatting like asterisks or hashtags.
    `;

    const finalPrompt = `${systemInstruction}\n\nInstructions:\n${prompt}`;
    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();
    return NextResponse.json({ memo: text }, { status: 200 }); 

  } catch (error: unknown) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate memo. Please try again." }, { status: 500 });
  }
}