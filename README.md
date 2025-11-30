# CarCrashGenius 🚗💥

**AI-Powered Independent Insurance Analysis & Blockchain Certification**

Live URL: [https://car.zae.life](https://car.zae.life)

## Overview

CarCrashGenius is a sophisticated **Progressive Web Application (PWA)** designed to democratize vehicle damage assessment. By leveraging advanced Multimodal AI (Google Gemini / Mistral), it allows users to upload accident photos and documents to receive instant, professional-grade damage reports, repair estimates, and vehicle identification.

Furthermore, it integrates Web3 functionality via the **TON Blockchain**, allowing users to generate immutable digital certificates of their damage reports.

## Documentation

*   [**Gemini AI Integration**](./GEMINI.md): Deep dive into models, schemas, and prompt engineering strategies.
*   [**TON Blockchain**](./TON.md): Wallet connection and certification workflow details.
*   [**Privacy Policy**](./PRIVACY.md): Data handling and privacy information.

## Key Features

### 🤖 AI Analysis Engine
*   **Multi-Model Intelligence:** Toggle between **Google Gemini 3 Pro** (Deep Reasoning) and **Mistral Pixtral Large** (State-of-the-art Vision).
*   **Visual Damage Recognition:** Identifies specific parts (e.g., "Front Bumper"), damage type, and severity (Low to Critical).
*   **Interactive Visualization:** Renders bounding boxes on crash photos mapped to interactive damage cards.
*   **Vehicle Identification:** Optical Character Recognition (OCR) for license plates and visual model/year estimation.

### 💼 Claims Workspace
*   **Evidence Management:** Drag-and-drop support for multiple images and documents (PDF/TXT).
*   **EXIF Data Extraction:** Automatically verifies file authenticity by extracting camera metadata (ISO, Shutter, GPS).
*   **Voice Dictation:** Speech-to-text support for incident context and chat interactions.
*   **PDF Export:** Generates professional, insurance-ready PDF reports.

### 📱 Progressive Web App (PWA)
*   **Installable:** Can be added to the home screen on iOS and Android for a native app experience.
*   **Touch Optimized:** Pull-to-refresh, touch gestures, and responsive layouts for mobile devices.

### ⛓️ Web3 Certification (TON)
*   **Wallet Connect:** Seamless integration with TON Wallets via `TonConnect 2.0`.
*   **Digital Certificate:** Mints a "Proof of Damage" transaction on the blockchain containing the report's cryptographic hash.

## Architecture

The project follows a clean, component-based architecture using React 18.

### Tech Stack
*   **Core:** React 18, TypeScript, Tailwind CSS
*   **AI SDKs:** `@google/genai` (Gemini), Custom Fetch Adapter with Markdown Sanitization (Mistral)
*   **Blockchain:** `@tonconnect/ui` (Vanilla JS Adapter)
*   **Tooling:** `html2pdf.js` (Export), `lucide-react` (Icons)

### Project Structure
```
src/
├── components/
│   ├── timeline/           # Atomic components for the report view
│   │   ├── DamageCard.tsx  # Interactive damage ticket
│   │   ├── InteractiveMap.tsx # Bounding box visualizer
│   │   └── ...
│   ├── Sidebar.tsx         # Navigation & Input
│   ├── ChatInterface.tsx   # AI Assistant
│   └── ...
├── services/
│   ├── geminiService.ts    # AI routing, schemas, and prompt engineering
│   ├── tonService.ts       # Blockchain wallet & transaction logic
│   └── fileProcessing.ts   # Binary EXIF parsing & Base64 conversion
└── contexts/               # Global state (Language, etc.)
```

## Environment Variables

The application requires the following environment variables:

| Variable | Description |
| :--- | :--- |
| `API_KEY` | **Required.** Google Gemini API Key. |

*Note: Mistral API Keys are entered securely by the user in the UI.*

## License

MIT License. Built for the Zae Life ecosystem.
