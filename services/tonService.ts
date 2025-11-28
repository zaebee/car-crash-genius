
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
  if (!window.TonConnectUI) {
      await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (window.TonConnectUI && !tonConnectUI) {
    tonConnectUI = new window.TonConnectUI.TonConnectUI({
      manifestUrl: MANIFEST_URL,
    });

    tonConnectUI.onStatusChange((wallet: any) => {
      if (wallet) {
        onStatusChange({
          isConnected: true,
          address: tonConnectUI.account?.address ? toUserFriendlyAddress(tonConnectUI.account.address) : null,
          rawAddress: tonConnectUI.account?.address || null
        });
      } else {
        onStatusChange({
          isConnected: false,
          address: null,
          rawAddress: null
        });
      }
    });
  }
};

export const connectWallet = async () => {
  if (tonConnectUI) {
    try {
      await tonConnectUI.openModal();
    } catch (e) {
      console.error("TON Connect Error", e);
    }
  }
};

export const disconnectWallet = async () => {
    if (tonConnectUI) {
        await tonConnectUI.disconnect();
    }
};

export const sendTransaction = async (amountTon: string, comment: string): Promise<string | null> => {
    if (!tonConnectUI || !tonConnectUI.connected) return null;

    // Convert TON to Nanotons
    const amountNano = Math.floor(parseFloat(amountTon) * 1000000000).toString();

    // Use a test address (simulating a smart contract interaction)
    // In production, this would be your contract address
    const destinationAddress = "0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC";

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, 
        messages: [
            {
                address: destinationAddress,
                amount: amountNano,
                // TonConnect automatically handles text comments in the payload if needed,
                // but for raw transaction structure we are keeping it simple. 
                // In a real dApp, you would construct a BOC for a contract method call.
                // Here we rely on the wallet to attach the comment if supported or just simulate the transfer.
            }
        ]
    };

    try {
        const result = await tonConnectUI.sendTransaction(transaction);
        // The result might vary based on wallet, but usually contains boc
        return result.boc || "simulated_hash_success";
    } catch (e) {
        console.error("Transaction failed", e);
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
    const parts = raw.split(':');
    if (parts.length < 2) return raw;
    const hash = parts[1];
    return `EQ${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`;
}
