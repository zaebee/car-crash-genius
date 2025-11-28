export type Language = 'en' | 'ru';

export interface DamageItem {
  partName: string;
  damageType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  recommendedAction: string; // e.g., "Replace", "Repair", "Paint"
}

export interface CrashAnalysisResult {
  title: string;
  summary: string;
  vehiclesInvolved: string[];
  estimatedRepairCostRange: string;
  damagePoints: DamageItem[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // base64
}