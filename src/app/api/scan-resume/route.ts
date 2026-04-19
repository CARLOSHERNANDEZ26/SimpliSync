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

    // Use Gemini API directly with Native PDF Parsing!
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Using simulated data for testing.");
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Extract the following information from the provided resume and return it strictly as a JSON object. Do not include markdown formatting or backticks around the JSON.
    
    Expected JSON format:
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
    let jsonString = response.text().trim();
    
    // Clean up potential markdown code block artifacts
    if (jsonString.startsWith("\`\`\`json")) {
        jsonString = jsonString.replace(/^\`\`\`json/, "");
        jsonString = jsonString.replace(/\`\`\`$/, "");
    } else if (jsonString.startsWith("\`\`\`")) {
        jsonString = jsonString.replace(/^\`\`\`/, "");
        jsonString = jsonString.replace(/\`\`\`$/, "");
    }
    
    const parsedData = JSON.parse(jsonString);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Resume Scan API Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process resume." }, { status: 500 });
  }
}
