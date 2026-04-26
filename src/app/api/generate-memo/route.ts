import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("API KEY ERROR: Could not find GOOGLE_GEMINI_API_KEY in .env.local");
      return NextResponse.json(
        { error: "API key is missing from environment variables." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const memo = result.response.text();

    return NextResponse.json({ memo }, { status: 200 });
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}