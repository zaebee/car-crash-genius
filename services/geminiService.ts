import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { CrashAnalysisResult, UploadedFile, Language, AIModel, ChatSession } from "../types";

// --- Google Implementation ---
const getGoogleClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
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
    // Add user message to history
    this.history.push({ role: "user", content: message });

    // Prepare messages for Mistral (System + History)
    const messages = [
        { role: "system", content: this.systemInstruction },
        ...this.history
    ];

    try {
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                stream: true
            })
        });

        if (!response.ok) throw new Error("Mistral API Error: " + response.statusText);
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
        // Add model response to history for context
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

// --- Google Generator ---
const generateGoogleReport = async (parts: any[], modelId: string, langName: string) => {
    const ai = getGoogleClient();
    const response = await ai.models.generateContent({
      model: resolveGoogleModelId(modelId),
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: CRASH_SCHEMA,
        systemInstruction: `You are a helpful, professional insurance adjuster. Output all content in ${langName}.`,
      },
    });
    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");
    return JSON.parse(jsonText);
};

// --- Mistral Generator ---
const generateMistralReport = async (prompt: string, file: UploadedFile | null, apiKey: string, langName: string) => {
    // Mistral Image support is limited in "Large" via API standard, usually requires URL.
    // For this implementation, if file is image/base64, we might need a model that supports vision (Pixtral) or just text.
    // Assuming Mistral Large for text/docs logic. If image is provided, we might fail or need Pixtral.
    // Let's use text-only logic or assume Pixtral 12B if available, or just instruct user.
    // Note: Standard Mistral Large is text-only. Pixtral is vision.
    // We will attempt to send image url if base64 supported, otherwise text only.
    
    let messages: any[] = [
        { role: "system", content: `You are a helpful insurance adjuster. Output valid JSON only matching the requested schema. Language: ${langName}.` },
        { role: "user", content: [] }
    ];
    
    // Construct content array
    let contentArr: any[] = [{ type: "text", text: prompt }];

    if (file && file.type.startsWith('image/')) {
       contentArr.push({
           type: "image_url",
           image_url: { url: file.data } // data:image/... base64
       });
    } else if (file && file.type === 'application/pdf') {
       // Mistral doesn't natively parse PDF base64 in chat message standard yet without OCR tool.
       // We'll just pass text if we had it, but here we only have base64.
       // Fallback: Inform model about the file existence.
       contentArr.push({ type: "text", text: "[Attached PDF Document Data - Mocked as text extraction not available in browser-side Mistral call]" });
    }

    messages[1].content = contentArr;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "pixtral-12b-2409", // Use Pixtral for Vision support if available, or mistral-large-latest
            messages: messages,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Mistral API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
};

export const generateCrashReport = async (
  file: UploadedFile | null,
  textInput: string,
  language: Language,
  model: AIModel,
  mistralApiKey?: string
): Promise<CrashAnalysisResult> => {
  
  const langName = language === 'ru' ? 'Russian' : 'English';
  const prompt = `
    You are an expert independent insurance adjuster and automotive engineer. 
    Analyze the provided evidence.
    Estimate repair costs and identify damages.
    IMPORTANT: Output strictly valid JSON matching this structure:
    {
      "title": "string",
      "summary": "string",
      "vehiclesInvolved": ["string"],
      "estimatedRepairCostRange": "string",
      "damagePoints": [{"partName": "string", "damageType": "string", "severity": "Low|Medium|High|Critical", "description": "string", "recommendedAction": "string"}]
    }
    Use ${langName} for values.
    Additional Context: ${textInput}
  `;

  if (model.provider === 'mistral') {
     if (!mistralApiKey) throw new Error("MISTRAL_NOT_CONFIGURED");
     return generateMistralReport(prompt, file, mistralApiKey, langName);
  }

  // Google Logic
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
  return generateGoogleReport(parts, model.id, langName);
};


export const createChatSession = async (
  contextData: CrashAnalysisResult,
  file: UploadedFile | null,
  language: Language,
  model: AIModel,
  mistralApiKey?: string
): Promise<ChatSession> => {
  
  const langName = language === 'ru' ? 'Russian' : 'English';
  
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
    You have access to a damage analysis report generated from crash evidence.
    Respond strictly in ${langName}. Be objective and professional.
  `;

  // --- Mistral Session ---
  if (model.provider === 'mistral') {
      if (!mistralApiKey) throw new Error("MISTRAL_NOT_CONFIGURED");
      
      const history = [];
      // Initial context message
      history.push({ role: 'user', content: `Here is the analysis report:\n${reportContext}` });
      history.push({ role: 'assistant', content: `Understood. I have the case file for "${contextData.title}". Ready.` });

      return new MistralChatSession(mistralApiKey, "mistral-large-latest", history, systemInstruction);
  }

  // --- Google Session ---
  const ai = getGoogleClient();
  const apiModelName = resolveGoogleModelId(model.id);
  
  const history = [];
  if (file) {
    const base64Data = file.data.split(',')[1];
    history.push({
      role: 'user',
      parts: [{ text: "Here is the source evidence." }, { inlineData: { mimeType: file.type, data: base64Data } }],
    });
    history.push({
      role: 'model',
      parts: [{ text: "I have analyzed the provided evidence." }],
    });
  }
  history.push({
    role: 'user',
    parts: [{ text: `Here is the generated damage report:\n${reportContext}` }],
  });
  history.push({
    role: 'model',
    parts: [{ text: `Understood. I have the case file for "${contextData.title}". How can I assist?` }],
  });

  const chat = ai.chats.create({
    model: apiModelName,
    config: { systemInstruction },
    history: history,
  });

  // Adapter for Google Chat to match generic ChatSession interface
  return {
      sendMessageStream: async function* (msg: string) {
          const result = await chat.sendMessageStream({ message: msg });
          for await (const chunk of result) {
              yield { text: chunk.text || "" };
          }
      }
  };
};