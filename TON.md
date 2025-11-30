# TON Blockchain Integration 💎

CarCrashGenius integrates with The Open Network (TON) to provide a "Digital Certification" feature. This allows users to anchor their damage reports on the blockchain, creating an immutable record of the accident assessment.

## 1. Technology Stack

*   **SDK**: `@tonconnect/ui` (via CDN `2.0.9`)
*   **Network**: Mainnet (Simulated for Demo)
*   **Standards**: TON Connect 2.0

## 2. Wallet Connection

We use the Vanilla JS version of the TON Connect UI to avoid bundler complexity in the browser-based environment.

**Initialization (`services/tonService.ts`):**
1.  We check for `window.TonConnectUI`.
2.  We initialize with a `manifestUrl` hosted on GitHub (required for the wallet to identify the dApp).
3.  We subscribe to `onStatusChange` to sync the React state (`isConnected`, `address`) with the wallet status.

## 3. Certification Workflow

The certification process in `Timeline.tsx` simulates a robust Web3 workflow:

1.  **Hashing (Client-Side)**:
    *   The `CrashAnalysisResult` JSON is stringified.
    *   We use `crypto.subtle.digest('SHA-256', ...)` to generate a cryptographic hash of the report.
    *   This hash ensures that if any byte of the report changes, the certificate is invalid.

2.  **IPFS Upload (Simulated)**:
    *   In a production environment, the JSON metadata would be pinned to IPFS (InterPlanetary File System).
    *   Currently, we simulate this step and generate a mock `Qm...` CID (Content Identifier).

3.  **Transaction (On-Chain)**:
    *   User is prompted to sign a transaction via their wallet (Tonkeeper, etc.).
    *   **Destination**: A burning address or DAO treasury (Simulated).
    *   **Amount**: `0.05 TON` (Micro-payment fee).
    *   **Payload**: The transaction comment would typically contain the IPFS Hash.

## 4. Transaction Logic

```typescript
const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes expiry
    messages: [
        {
            address: "0Q...", // Destination
            amount: "50000000", // 0.05 TON in nanotons
        }
    ]
};
```

## 5. Troubleshooting

*   **"TON Connect SDK failed to load"**: Ensure the CDN link in `index.html` is accessible. We pin version `2.0.9` for stability.
*   **Wallet doesn't open**: Check if the browser allows popups, or if the user is on mobile (Deep Link logic is handled by the SDK).
