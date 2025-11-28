
import { TonWalletState } from "../types";

// Declare TonConnectUI on window interface
declare global {
  interface Window {
    TonConnectUI: any;
  }
}

let tonConnectUI: any = null;
const MANIFEST_URL = 'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json'; // Public demo manifest for testing

export const initTonConnect = async (
  onStatusChange: (wallet: TonWalletState) => void
) => {
  if (!window.TonConnectUI) {
      // If script hasn't loaded yet, wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (window.TonConnectUI && !tonConnectUI) {
    tonConnectUI = new window.TonConnectUI.TonConnectUI({
      manifestUrl: MANIFEST_URL,
      // You can customize the UI here
      // buttonRootId: 'ton-connect-button' 
    });

    // Subscribe to wallet changes
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

export const sendTransaction = async (amountTon: string, comment: string): Promise<boolean> => {
    if (!tonConnectUI || !tonConnectUI.connected) return false;

    // Convert TON to Nanotons (1 TON = 10^9 Nanotons)
    const amountNano = Math.floor(parseFloat(amountTon) * 1000000000).toString();

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec valid
        messages: [
            {
                address: "0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC", // Burn address / Demo destination
                amount: amountNano,
                payload: undefined // Optional: BOC string for comments
            }
        ]
    };

    try {
        const result = await tonConnectUI.sendTransaction(transaction);
        console.log("Transaction result:", result);
        return true;
    } catch (e) {
        console.error("Transaction failed", e);
        return false;
    }
};

// Helper to format raw address to user friendly
// Note: In a real app use tonweb or @ton/core. This is a naive mock display.
function toUserFriendlyAddress(raw: string): string {
    const parts = raw.split(':');
    if (parts.length < 2) return raw;
    const hash = parts[1];
    return `EQ${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`;
}
