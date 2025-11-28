import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { CrashAnalysisResult, UploadedFile, Language } from "../types";

// Helper to initialize Gemini
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const CRASH_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A concise title for the accident case (e.g. 'Frontal Impact on Toyota Camry' or 'Court Doc #123 Analysis')" },
    summary: { type: Type.STRING, description: "A professional summary of the visible damage and accident context derived from photos or documents." },
    vehiclesInvolved: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of identified vehicle makes/models involved",
    },
    estimatedRepairCostRange: { type: Type.STRING, description: "Rough estimated cost range (e.g. '$1500 - $2500' or 'Total Loss')" },
    damagePoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          partName: { type: Type.STRING },
          damageType: { type: Type.STRING, description: "Type of damage (Dent, Scratch, Smash, Misalignment)" },
          severity: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
          description: { type: Type.STRING, description: "Detailed description of the damage" },
          recommendedAction: { type: Type.STRING, description: "Repair vs Replace vs Paint" },
        },
        required: ["partName", "damageType", "severity", "description", "recommendedAction"],
      },
    },
  },
  required: ["title", "summary", "vehiclesInvolved", "estimatedRepairCostRange", "damagePoints"],
};

export const generateCrashReport = async (
  file: UploadedFile | null,
  textInput: string,
  language: Language
): Promise<CrashAnalysisResult> => {
  const ai = getAiClient();
  const langName = language === 'ru' ? 'Russian' : 'English';
  
  const prompt = `
    You are an expert independent insurance adjuster and automotive engineer. 
    Analyze the provided evidence (which may include crash photos, PDF police reports, court documents, or insurance statements).
    
    If an image is provided: Identify the vehicles, specific parts damaged, severity of impact, and recommend repair actions.
    If a document is provided: Extract the accident details, vehicle information, reported damages, and legal/insurance context.
    
    Estimate the repair cost range based on standard US/EU labor rates (unless context suggests otherwise).

    IMPORTANT: Generate the response content (titles, summaries, descriptions) in ${langName}.
    However, you MUST keep the JSON property keys (like 'damagePoints', 'partName', 'severity') exactly as specified in the schema in English.
    The 'severity' value must be one of: "Low", "Medium", "High", "Critical".
  `;

  const parts: any[] = [{ text: prompt }];

  if (file) {
    const base64Data = file.data.split(',')[1];
    parts.push({
      inlineData: {
        mimeType: file.type,
        data: base64Data,
      },
    });
  }

  if (textInput) {
    parts.push({ text: `Additional Incident/Document Context: ${textInput}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: CRASH_SCHEMA,
        systemInstruction: `You are a helpful, professional insurance adjuster. Output all content in ${langName}.`,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");
    
    return JSON.parse(jsonText) as CrashAnalysisResult;
  } catch (error) {
    console.error("Error generating crash report:", error);
    throw error;
  }
};

export const createChatSession = async (
  contextData: CrashAnalysisResult,
  file: UploadedFile | null,
  language: Language
): Promise<Chat> => {
  const ai = getAiClient();
  const langName = language === 'ru' ? 'Russian' : 'English';
  
  // Construct context string from the generated analysis
  const reportContext = `
    CURRENT CRASH REPORT CONTEXT:
    Case: "${contextData.title}"
    Summary: ${contextData.summary}
    Vehicles: ${contextData.vehiclesInvolved.join(', ')}
    Est. Cost: ${contextData.estimatedRepairCostRange}
    Damage Points:
    ${contextData.damagePoints.map((i, idx) => `${idx + 1}. [${i.severity}] ${i.partName} (${i.damageType}) - ${i.description} -> Action: ${i.recommendedAction}`).join('\n')}
  `;

  const systemInstruction = `
    You are a highly intelligent insurance claims expert ("CarCrashGenius Bot").
    You have access to a damage analysis report generated from crash evidence (photos or docs).
    Your goal is to help the user understand the damage, the repair process, potential hidden costs, and insurance claim procedures.
    
    Response Guidelines:
    - Respond strictly in ${langName}.
    - Be objective, professional, and empathetic.
    - If asked about costs, emphasize that these are estimates.
    - If the user clicks on a damage item, they might ask "Explain the damage to...". Assume "this" refers to the last context provided.
    - Warn about safety if the damage looks critical (e.g., suspension, airbags).
  `;

  const history = [];

  // If a file is present, we inject it into the chat history
  if (file) {
    const base64Data = file.data.split(',')[1];
    history.push({
      role: 'user',
      parts: [
        { text: "Here is the source evidence (photo or document)." },
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        }
      ],
    });
    history.push({
      role: 'model',
      parts: [{ text: "I have analyzed the provided evidence. I am ready to discuss the specifics." }],
    });
  }

  history.push({
    role: 'user',
    parts: [{ text: `Here is the generated damage report:\n${reportContext}` }],
  });
  history.push({
    role: 'model',
    parts: [{ text: `Understood. I have the case file for "${contextData.title}". How can I assist with this claim?` }],
  });

  return ai.chats.create({
    model: "gemini-3-pro-preview",
    config: { systemInstruction },
    history: history,
  });
};