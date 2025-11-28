# CarCrashGenius 🚗💥

**AI-Powered Independent Insurance Analysis & Blockchain Certification**

Live URL: [https://car.zae.life](https://car.zae.life)

## Overview

CarCrashGenius is a sophisticated Progressive Web Application (PWA) designed to democratize vehicle damage assessment. By leveraging advanced Multimodal AI (Google Gemini / Mistral), it allows users to upload accident photos and documents to receive instant, professional-grade damage reports, repair estimates, and vehicle identification.

Furthermore, it integrates Web3 functionality via the **TON Blockchain**, allowing users to generate immutable digital certificates of their damage reports using IPFS and Smart Contracts.

## Key Features

### 🤖 AI Analysis Engine
*   **Multi-Model Support:** Toggle between **Google Gemini 3 Pro** (Deep Reasoning) and **Mistral Large** (Open Weights).
*   **Visual Damage Recognition:** Identifies specific parts (e.g., "Front Bumper"), damage type (e.g., "Dent"), and severity (Low to Critical).
*   **Interactive Visualization:** Draws bounding boxes on images mapped to damage cards.
*   **Vehicle Identification:** Extracts Make, Model, Year, License Plate, and Color from images.

### 💼 Claims Workspace
*   **Evidence Management:** Support for multiple images (JPG/PNG) and documents (PDF/TXT).
*   **EXIF Data Extraction:** Automatically pulls camera metadata (ISO, Shutter, GPS) to validate evidence authenticity.
*   **PDF Export:** Generates professional insurance-ready PDF reports with embedded data.

### ⛓️ Web3 Integration (TON)
*   **Wallet Connect:** Seamless integration with TON Wallets via `TonConnect 2.0`.
*   **Digital Certification:**
    1.  Generates SHA-256 Hash of the report.
    2.  Simulates IPFS Metadata upload.
    3.  Executes on-chain transaction to "Mint" a certificate.

### 🌍 Internationalization
*   Full support for **English** and **Russian** languages.
*   Context-aware AI prompts based on selected language.

## Architecture & Tech Stack

*   **Frontend:** React 18, TypeScript, Tailwind CSS
*   **AI SDKs:** `@google/genai` (Gemini), Custom Fetch Adapter (Mistral)
*   **Blockchain:** `@tonconnect/ui` (Vanilla JS CDN Adapter)
*   **Utilities:** `html2pdf.js` (Export), `lucide-react` (Icons)

## Environment Variables

The application requires the following environment variables to be set in the build environment:

| Variable | Description |
| :--- | :--- |
| `API_KEY` | **Required.** Google Gemini API Key. |

*Note: Mistral API Keys are entered by the user in the UI and stored in browser memory for security.*

## Privacy & Security

*   **Data Processing:** Images are sent directly to the selected AI provider (Google or Mistral) for analysis.
*   **Client-Side Logic:** No intermediate backend server stores your photos.
*   **Mistral Keys:** User-provided keys are never logged or sent to our servers.

## License

MIT License. Built for the Zae Life ecosystem.