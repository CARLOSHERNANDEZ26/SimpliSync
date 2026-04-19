import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // 🔥 FIX 1: Make sure this exactly matches the env variable used in your chatbot!
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GOOGLE_GEMINI_API_KEY not found. Using simulated data for testing.");
      await new Promise(res => setTimeout(res, 2000));
      return NextResponse.json({
        fullName: "Jane Doe (Mock Scan)",
        position: "Software Engineer",
        department: "Engineering",
        emergencyContactName: "John Doe",
        emergencyContactRelation: "Spouse",
        emergencyContactPhone: "+1 555-0199",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🔥 FIX 2: Force the model to output strict JSON using generationConfig
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
    Extract the following information from the provided resume.
    
    Expected JSON schema:
    {
      "fullName": "...",
      "personalEmail": "...",
      "birthDate": "YYYY-MM-DD",
      "contactNumber": "...",
      "emergencyContactName": "...",
      "emergencyContactRelation": "...",
      "emergencyContactPhone": "..."
    }

    Rules:
    - If a field is not found, leave it as an empty string "".
    - For birthDate, format it as YYYY-MM-DD. If only year is found or it's missing, leave blank.
    - Emergency contact info might not exist; leave blank if missing.
    `;

    const result = await model.generateContent([
      { text: prompt },
      { 
        inlineData: { 
          data: base64Data, 
          mimeType: "application/pdf" 
        } 
      }
    ]);
    
    const response = await result.response;
    
   0  
    const parsedData = JSON.parse(response.text());

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Resume Scan API Error:", error);
    return NextResponse.json({ error: "Failed to process resume." }, { status: 500 });
  }
}