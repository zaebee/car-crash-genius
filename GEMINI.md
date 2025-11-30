# Google Gemini & Mistral AI Integration 🧠

CarCrashGenius leverages the power of Multimodal Generative AI to analyze complex visual data. This document outlines the implementation details, prompt strategies, and data schemas used within `services/geminiService.ts`.

## 1. SDK & Configuration

We use a hybrid approach to support multiple providers:

1.  **Google Gemini:** Uses the official `@google/genai` SDK.
    *   Auth: `API_KEY` environment variable.
2.  **Mistral AI:** Uses a custom `fetch` adapter.
    *   Auth: User-provided API Key (stored in browser memory).

## 2. Models Used

| Model ID | Provider | Code Name | Use Case |
| :--- | :--- | :--- | :--- |
| **Gemini 3 Pro** | Google | `gemini-3-pro-preview` | **Default.** Best for complex reasoning, high-fidelity OCR, and detailed text summaries. |
| **Gemini 2.5 Flash** | Google | `gemini-2.5-flash` | Low latency, high throughput. Good for quick estimates. |
| **Pixtral Large** | Mistral | `pixtral-large-latest` | **State-of-the-art Vision.** Excellent at detecting small visual details and avoiding refusal on sensitive crash images. |

## 3. Structured Output (JSON Schema)

The application relies on a strict JSON schema (`CRASH_SCHEMA`) to programmatically render the UI.

### Core Schema Fields:
*   **`vehiclesInvolved`**: Tags for vehicle types.
*   **`identifiedVehicles`**: Structured object array containing:
    *   `make`, `model`, `year` (Visual estimation)
    *   `licensePlate` (OCR extraction)
*   **`damagePoints`**: The core analysis array.
    *   `severity`: Enum (`Low`, `Medium`, `High`, `Critical`) - drives UI colors.
    *   `boundingBox`: `[ymin, xmin, ymax, xmax]` (0-1000 scale). This normalized scale is critical for the `InteractiveMap` component to render overlays correctly across different image aspect ratios.
*   **`estimatedRepairCostRange`**: String text (e.g., "$5,000 - $7,000").

## 4. Prompt Engineering Strategy

The prompt is engineered to perform a multi-step cognitive process in a single inference pass:

1.  **Visual OCR & ID**: "Look closely at the images to extract Make, Model, Year... Perform OCR to read characters if visible."
2.  **Damage Analysis**: "Identify damages with severity and bounding boxes."
3.  **JSON Enforcement**: "Strictly provide 'boundingBox' [ymin, xmin, ymax, xmax] (0-1000) for the FIRST image."

## 5. Mistral AI Adapter & Sanitization

Mistral models (Pixtral) often wrap JSON responses in Markdown code blocks (e.g., ` ```json ... ``` `), which causes standard `JSON.parse` to fail.

To handle this, our service layer includes a **Sanitization Step**:

```typescript
// services/geminiService.ts
let rawContent = data.choices[0]?.message?.content || "{}";
// Regex to strip Markdown code blocks
rawContent = rawContent.replace(/```json\n?|```/g, '').trim();
const parsed = JSON.parse(rawContent);
```

This ensures stability regardless of the model's "chatty" formatting preferences.

## 6. Error Handling

*   **Sanitization (`sanitizeCrashReport`)**: ensures that arrays (like `damagePoints`) are never undefined, preventing React render crashes.
*   **400 Errors**: Mapped to "Unsupported format" user messages.
*   **429 Errors**: Mapped to "Usage limit exceeded" user messages.
