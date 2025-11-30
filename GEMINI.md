# Google Gemini AI Integration 🧠

CarCrashGenius leverages the power of Google's Multimodal Generative AI to analyze complex visual data. This document outlines the implementation details, prompt strategies, and data schemas used within the `services/geminiService.ts`.

## 1. SDK Configuration

We use the official Google GenAI SDK for TypeScript:

```bash
npm install @google/genai
```

**Initialization:**
The client is initialized using the `API_KEY` environment variable. Note that we do not use the deprecated `GoogleGenerativeAI` class, but the newer `GoogleGenAI` standard.

```typescript
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

## 2. Models Used

| Model ID | Code Name | Use Case |
| :--- | :--- | :--- |
| **Gemini 3 Pro** | `gemini-3-pro-preview` | **Default.** Complex reasoning, high-fidelity OCR (License plates), and detailed damage assessment. |
| **Gemini 2.5 Flash** | `gemini-2.5-flash` | Low latency, high throughput. Used for rapid triage or when speed is prioritized over depth. |

## 3. Structured Output (JSON Schema)

To ensure the app can programmatically render the UI (Timeline, Cards, Maps), we force the AI to return a strict JSON structure.

### The `CRASH_SCHEMA`
Defined in `services/geminiService.ts`:

*   **`vehiclesInvolved`**: Simple array of strings for tags.
*   **`identifiedVehicles`**: Structured object array containing:
    *   `make`, `model`, `year`
    *   `color`
    *   `licensePlate` (extracted via OCR)
*   **`damagePoints`**: The core analysis array.
    *   `severity`: Enum (`Low`, `Medium`, `High`, `Critical`) - drives UI colors.
    *   `boundingBox`: `[ymin, xmin, ymax, xmax]` (0-1000 scale) - drives the Interactive Map.
*   **`estimatedRepairCostRange`**: String text (e.g., "$5,000 - $7,000").

## 4. Prompt Engineering Strategy

The prompt is designed to perform three distinct cognitive tasks in a single pass:

1.  **Visual Vehicle Identification**: "Look closely at the images to extract Make, Model, Year... Perform OCR to read characters if visible."
2.  **Damage Analysis**: "Identify damages with severity and bounding boxes."
3.  **Cost Estimation**: "Estimate repair costs."

**Bounding Box Logic:**
We specifically ask for bounding boxes normalized to a `0-1000` scale. This is standard for Gemini vision tasks and allows us to easily map coordinates to the CSS `top/left/width/height` percentages in the `InteractiveMap` component.

```typescript
// Prompt excerpt
"For 'damagePoints', if you see the damage in the FIRST image, strictly provide 'boundingBox' [ymin, xmin, ymax, xmax] (0-1000)."
```

## 5. Mistral AI Adapter

The project also supports Mistral AI via a custom fetch adapter. Since Mistral does not natively support the Google SDK's schema definition objects, we:
1.  **Stringify** the `CRASH_SCHEMA` object.
2.  Inject it into the System Prompt: `Output valid JSON matching this SCHEMA: ...`.
3.  Use a regex cleaner to strip Markdown code blocks (` ```json ... ``` `) from the response before parsing.

## 6. Error Handling

*   **400 Errors**: Usually indicates unsupported image formats or corrupted data.
*   **429 Errors**: Quota exceeded. The UI handles this by showing a user-friendly error.
*   **JSON Parsing**: We wrap the parsing logic in a sanitizer (`sanitizeCrashReport`) that ensures arrays exist even if the model hallucinates a null value.
