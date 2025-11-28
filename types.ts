
export type Language = 'en' | 'ru';

export type ModelProvider = 'google' | 'mistral';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  badge?: string;
}

export interface VehicleDetails {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  color: string;
}

export interface DamageItem {
  partName: string;
  damageType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  recommendedAction: string; // e.g., "Replace", "Repair", "Paint"
  boundingBox?: number[]; // [ymin, xmin, ymax, xmax] normalized to 0-1000
}

export interface CrashAnalysisResult {
  title: string;
  summary: string;
  vehiclesInvolved: string[];
  identifiedVehicles?: VehicleDetails[];
  estimatedRepairCostRange: string;
  damagePoints: DamageItem[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  fNumber?: string; // Formatted string e.g. "f/1.8"
  exposureTime?: string; // Formatted string e.g. "1/60"
  iso?: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // base64
  size: number;
  lastModified: number;
  exif?: ExifData;
}

export interface TonWalletState {
    isConnected: boolean;
    address: string | null; // User friendly address
    rawAddress: string | null;
}

// Abstract interface to support both Google SDK Chat and custom Mistral Chat
export interface ChatSession {
  sendMessageStream(message: string): AsyncGenerator<{ text: string }>;
}
