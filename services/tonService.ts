
import { TonWalletState } from "../types";

// Declare TonConnectUI on window interface
declare global {
  interface Window {
    TonConnectUI: any;
  }
}

let tonConnectUI: any = null;
const MANIFEST_URL = 'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json'; 

export const initTonConnect = async (
  onStatusChange: (wallet: TonWalletState) => void
) => {
  // Wait for the script to load if it hasn't already
  let attempts = 0;
  while (!window.TonConnectUI && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
  }

  if (window.TonConnectUI && !tonConnectUI) {
    try {
        tonConnectUI = new window.TonConnectUI.TonConnectUI({
            manifestUrl: MANIFEST_URL,
        });

        tonConnectUI.onStatusChange((wallet: any) => {
            if (wallet) {
                const rawAddress = wallet.account.address;
                onStatusChange({
                    isConnected: true,
                    address: toUserFriendlyAddress(rawAddress),
                    rawAddress: rawAddress
                });
            } else {
                onStatusChange({
                    isConnected: false,
                    address: null,
                    rawAddress: null
                });
            }
        });
    } catch (e) {
        console.error("Failed to initialize TonConnectUI", e);
    }
  }
};

export const connectWallet = async () => {
  if (tonConnectUI) {
    try {
      await tonConnectUI.openModal();
    } catch (e) {
      console.error("TON Connect Error", e);
    }
  } else {
      console.warn("TonConnectUI not initialized");
  }
};

export const disconnectWallet = async () => {
    if (tonConnectUI) {
        await tonConnectUI.disconnect();
    }
};

export const sendTransaction = async (amountTon: string, comment: string): Promise<string | null> => {
    if (!tonConnectUI || !tonConnectUI.connected) {
        console.error("Wallet not connected");
        return null;
    }

    // Convert TON to Nanotons (1 TON = 1,000,000,000 nanotons)
    const amountNano = Math.floor(parseFloat(amountTon) * 1000000000).toString();

    // Destination address (Smart Contract or Treasury)
    // Using a valid generic foundation address for simulation/demo purposes if no specific contract
    const destinationAddress = "0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC";

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
            {
                address: destinationAddress,
                amount: amountNano,
                // Note: To send a text comment on TON, the body needs to be a Cell containing 
                // the comment opcode (0) and the text. Without @ton/core library in this environment,
                // we send a basic transfer. The 'comment' arg is preserved for logic extension.
            }
        ]
    };

    try {
        const result = await tonConnectUI.sendTransaction(transaction);
        // Returns { boc: string } on success
        return result.boc || "simulated_success_hash";
    } catch (e) {
        console.error("Transaction failed or rejected", e);
        return null;
    }
};

export const generateReportHash = async (data: any): Promise<string> => {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

function toUserFriendlyAddress(raw: string): string {
    if (!raw) return "";
    const parts = raw.split(':');
    if (parts.length < 2) return raw.substring(0, 6) + '...' + raw.substring(raw.length - 4);
    const hash = parts[1];
    return `EQ${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`;
}
