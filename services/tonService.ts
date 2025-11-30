
import { TonWalletState } from "../types";

// Declare TonConnectUI on window interface
declare global {
  interface Window {
    TonConnectUI: any;
  }
}

let tonConnectUI: any = null;
const MANIFEST_URL = 'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json'; 

const waitForScript = async () => {
    if (typeof window === 'undefined') return false;

    let attempts = 0;
    // Increased wait time to 10 seconds (100 * 100ms) to account for slow networks/CDNs
    while ((!window.TonConnectUI || !window.TonConnectUI.TonConnectUI) && attempts < 100) { 
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    return !!(window.TonConnectUI && window.TonConnectUI.TonConnectUI);
};

const formatWalletState = (wallet: any): TonWalletState => {
    if (!wallet || !wallet.account) {
        return { isConnected: false, address: null, rawAddress: null };
    }
    return {
       isConnected: true,
       address: toUserFriendlyAddress(wallet.account.address),
       rawAddress: wallet.account.address
   };
};

export const initTonConnect = async (
  onStatusChange: (wallet: TonWalletState) => void
) => {
  // Wait for the script to load
  const isLoaded = await waitForScript();
  if (!isLoaded) {
      console.warn("TON Connect SDK failed to load. Wallet features will be unavailable.");
      return;
  }

  if (!tonConnectUI) {
    try {
        // Safe access to window object
        const TC = window.TonConnectUI.TonConnectUI;
        tonConnectUI = new TC({
            manifestUrl: MANIFEST_URL,
        });

        // Check initial state
        if (tonConnectUI.wallet) {
            onStatusChange(formatWalletState(tonConnectUI.wallet));
        }

        // Subscribe to changes
        tonConnectUI.onStatusChange((wallet: any) => {
            onStatusChange(formatWalletState(wallet));
        });
    } catch (e) {
        console.error("Failed to initialize TonConnectUI", e);
    }
  } else {
      // If already initialized, trigger callback with current state
      if (tonConnectUI.wallet) {
          onStatusChange(formatWalletState(tonConnectUI.wallet));
      }
  }
};

export const connectWallet = async () => {
  if (!tonConnectUI) {
      // Try to wait one more time in case it's mid-load
      const loaded = await waitForScript();
      if (!loaded || !tonConnectUI) {
         console.warn("TonConnectUI not initialized");
         // Try one last-ditch init if script loaded but init failed previously
         if (loaded && window.TonConnectUI) {
            try {
                tonConnectUI = new window.TonConnectUI.TonConnectUI({ manifestUrl: MANIFEST_URL });
                await tonConnectUI.openModal();
            } catch(e) { console.error(e); }
         }
         return;
      }
  }
  
  try {
    if (tonConnectUI.connected) {
        console.log("Already connected");
        return;
    }
    await tonConnectUI.openModal();
  } catch (e) {
    console.error("TON Connect Error", e);
  }
};

export const disconnectWallet = async () => {
    if (tonConnectUI && tonConnectUI.connected) {
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
    // Using a valid generic foundation address for simulation/demo purposes
    const destinationAddress = "0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC";

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
            {
                address: destinationAddress,
                amount: amountNano,
                // Note: Actual comment encoding to BOC requires @ton/core. 
                // We send a transfer without comment payload for this demo environment.
            }
        ]
    };

    try {
        const result = await tonConnectUI.sendTransaction(transaction);
        // Returns { boc: string } on success
        return result.boc || "simulated_success_hash_" + Date.now();
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
    // This is a mock conversion for display. Real conversion requires checksum calc.
    return `EQ${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`;
}
