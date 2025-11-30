import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { CrashAnalysisResult, UploadedFile, Language, AIModel, ChatSession } from "../types";

// --- Google Implementation ---
const getGoogleClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const resolveGoogleModelId = (modelId: string) => {
    switch (modelId) {
        case 'google-flash': return 'gemini-2.5-flash';
        case 'google-pro': return 'gemini-3-pro-preview';
        default: return 'gemini-3-pro-preview';
    }
};

// --- Mistral Implementation ---
class MistralChatSession implements ChatSession {
  private apiKey: string;
  private model: string;
  private history: any[];
  private systemInstruction: string;

  constructor(apiKey: string, model: string, history: any[], systemInstruction: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.history = history;
    this.systemInstruction = systemInstruction;
  }

  async *sendMessageStream(message: string): AsyncGenerator<{ text: string }> {
    this.history.push({ role: "user", content: message });
    const messages = [
        { role: "system", content: this.systemInstruction },
        ...this.history
    ];

    try {
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.apiKey}` },
            body: JSON.stringify({ model: this.model, messages: messages, stream: true })
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error("Invalid Mistral API Key");
            throw new Error("Mistral API Error: " + response.statusText);
        }
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let fullResponseText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6);
                    if (dataStr.trim() === "[DONE]") continue;
                    try {
                        const json = JSON.parse(dataStr);
                        const content = json.choices[0]?.delta?.content || "";
                        if (content) {
                            fullResponseText += content;
                            yield { text: content };
                        }
                    } catch (e) {
                        console.error("Error parsing Mistral stream", e);
                    }
                }
            }
        }
        this.history.push({ role: "assistant", content: fullResponseText });
    } catch (e) {
        console.error("Mistral Stream Error", e);
        throw e;
    }
  }
}

// --- Shared Schema ---
const CRASH_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A professional title for the accident case (e.g. 'Frontal Impact Analysis: 2018 Toyota Camry')" },
    summary: { type: Type.STRING, description: "A professional summary of the visible damage, accident context, and potential hidden damages." },
    vehiclesInvolved: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of identified vehicle makes/models involved (simple strings for tags)",
    },
    identifiedVehicles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          make: { type: Type.STRING },
          model: { type: Type.STRING },
          year: { type: Type.STRING, description: "Estimated year range" },
          licensePlate: { type: Type.STRING, description: "License plate number or 'Unknown'" },
          color: { type: Type.STRING }
        },
        required: ["make", "model", "year", "licensePlate", "color"]
      },
      description: "Detailed list of identified vehicles with specific attributes."
    },
    estimatedRepairCostRange: { type: Type.STRING, description: "Estimated cost range (e.g. '$1500 - $2500' or 'Total Loss')" },
    damagePoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          partName: { type: Type.STRING },
          damageType: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
          description: { type: Type.STRING },
          recommendedAction: { type: Type.STRING },
          boundingBox: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "2D bounding box [ymin, xmin, ymax, xmax] (0-1000 scale) for the FIRST image."
          }
        },
        required: ["partName", "damageType", "severity", "description", "recommendedAction"],
      },
    },
  },
  required: ["title", "summary", "vehiclesInvolved", "estimatedRepairCostRange", "damagePoints"],
};

// --- Helper ---
const sanitizeCrashReport = (data: any): CrashAnalysisResult => {
    return {
        title: data.title || "Untitled Analysis",
        summary: data.summary || "No summary provided.",
        estimatedRepairCostRange: data.estimatedRepairCostRange || "Unknown",
        vehiclesInvolved: Array.isArray(data.vehiclesInvolved) ? data.vehiclesInvolved : [],
        identifiedVehicles: Array.isArray(data.identifiedVehicles) ? data.identifiedVehicles : undefined,
        damagePoints: Array.isArray(data.damagePoints) ? data.damagePoints : []
    };
};

// --- Generators ---
const generateGoogleReport = async (parts: any[], modelId: string, langName: string) => {
    try {
        const ai = getGoogleClient();
        const response = await ai.models.generateContent({
          model: resolveGoogleModelId(modelId),
          contents: { parts },
          config: {
            responseMimeType: "application/json",
            responseSchema: CRASH_SCHEMA,
            systemInstruction: `You are an expert insurance adjuster. Output strictly valid JSON. Language: ${langName}. If images are unclear, make reasonable professional estimates.`,
          },
        });
        const jsonText = response.text;
        if (!jsonText) throw new Error("EMPTY_RESPONSE");
        const parsed = JSON.parse(jsonText);
        return sanitizeCrashReport(parsed);
    } catch (error: any) {
        console.error("Google Service Error:", error);
        const msg = error.message || '';
        if (msg.includes('400')) throw new Error("The provided evidence format is not supported.");
        if (msg.includes('429')) throw new Error("Google API usage limit exceeded.");
        throw error;
    }
};

const generateMistralReport = async (prompt: string, files: UploadedFile[], apiKey: string, langName: string) => {
    const jsonSchemaStr = JSON.stringify(CRASH_SCHEMA);
    let messages: any[] = [
        { role: "system", content: `You are a helpful insurance adjuster. Output valid JSON only matching schema. Language: ${langName}. SCHEMA: ${jsonSchemaStr}` },
        { role: "user", content: [] }
    ];
    let contentArr: any[] = [{ type: "text", text: prompt }];
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
           contentArr.push({ type: "image_url", image_url: { url: file.data } });
        } else {
           contentArr.push({ type: "text", text: `[Document: ${file.name}]` });
        }
    });
    messages[1].content = contentArr;

    try {
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({ 
                model: "pixtral-large-latest", // Use Pixtral Large for best vision capabilities
                messages: messages, 
                response_format: { type: "json_object" },
                temperature: 0.2
            })
        });
        if (!response.ok) throw new Error("Mistral API Error");
        const data = await response.json();
        
        let rawContent = data.choices[0]?.message?.content || "{}";
        
        // Strip markdown code blocks if present (common LLM behavior)
        rawContent = rawContent.replace(/```json\n?|```/g, '').trim();

        const parsed = JSON.parse(rawContent);
        return sanitizeCrashReport(parsed);
    } catch (error) {
        console.error("Mistral Service Error:", error);
        throw error;
    }
};

export const generateCrashReport = async (files: UploadedFile[], textInput: string, language: Language, model: AIModel, mistralApiKey?: string): Promise<CrashAnalysisResult> => {
  const langName = language === 'ru' ? 'Russian' : 'English';
  
  const prompt = `
    Analyze the provided evidence (images/docs). 
    1. VISUAL VEHICLE IDENTIFICATION: Look closely at the images to extract:
       - Make, Model, Year (estimate).
       - License Plate / Registration Number (Perform OCR to read characters if visible).
       - Color.
    2. DAMAGE ANALYSIS: Identify damages with severity and bounding boxes.
    3. COST ESTIMATION: Estimate repair costs.
    
    IMPORTANT: Return valid JSON matching the schema.
    For 'damagePoints', if you see the damage in the FIRST image, strictly provide 'boundingBox' [ymin, xmin, ymax, xmax] (0-1000).
    If bounding box is unsure, omit it.
    
    Language: ${langName}.
    Context: ${textInput}
  `;

  if (model.provider === 'mistral') {
     if (!mistralApiKey) throw new Error("MISTRAL_NOT_CONFIGURED");
     return generateMistralReport(prompt, files, mistralApiKey, langName);
  }

  const parts: any[] = [{ text: prompt }];
  files.forEach(file => {
    parts.push({ inlineData: { mimeType: file.type, data: file.data.split(',')[1] } });
  });

  return generateGoogleReport(parts, model.id, langName);
};

export const createChatSession = async (contextData: CrashAnalysisResult, files: UploadedFile[], language: Language, model: AIModel, mistralApiKey?: string): Promise<ChatSession> => {
  const langName = language === 'ru' ? 'Russian' : 'English';
  const reportContext = `CRASH REPORT: ${contextData.title}. Summary: ${contextData.summary}. Costs: ${contextData.estimatedRepairCostRange}.`;
  const systemInstruction = `You are 'CarCrashGenius Bot', an insurance expert. Use the report context. Respond in ${langName}.`;

  if (model.provider === 'mistral') {
      if (!mistralApiKey) throw new Error("MISTRAL_NOT_CONFIGURED");
      // Use pixtral-large-latest for chat as well to support potential image context in history
      return new MistralChatSession(mistralApiKey, "pixtral-large-latest", [{ role: 'user', content: reportContext }], systemInstruction);
  }

  const ai = getGoogleClient();
  const history = [];
  if (files.length > 0) {
    history.push({ role: 'user', parts: [{ text: "Evidence Files" }, ...files.map(f => ({ inlineData: { mimeType: f.type, data: f.data.split(',')[1] } }))] });
    history.push({ role: 'model', parts: [{ text: "Evidence received." }] });
  }
  history.push({ role: 'user', parts: [{ text: reportContext }] });
  history.push({ role: 'model', parts: [{ text: "Ready." }] });

  const chat = ai.chats.create({ model: resolveGoogleModelId(model.id), config: { systemInstruction }, history });
  return {
      sendMessageStream: async function* (msg: string) {
          const result = await chat.sendMessageStream({ message: msg });
          for await (const chunk of result) yield { text: chunk.text || "" };
      }
  };
};