export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'commercial';
  utilityProvider: string;
  consumerNumber: string;
  sanctionedLoadKw: number;
  homeAreaSqFt: number;
  occupants: number;
  createdAt: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BillBreakdown {
  energyCharges: number;
  fixedCharges: number;
  taxesAndSurcharges: number;
  fuelAdjustmentCharge: number;
  latePaymentFee: number;
}

export interface BillRecord {
  id: string;
  userId: string;
  billNumber: string;
  consumerName: string;
  billingMonth: string; // e.g., "2026-07"
  dueDate: string;
  issueDate: string;
  unitsConsumedKwh: number;
  previousReading: number;
  currentReading: number;
  sanctionedLoadKw: number;
  powerFactor: number;
  tariffCategory: string; // "Residential", "Commercial", "Industrial"
  amountDue: number;
  breakdown: BillBreakdown;
  status: 'paid' | 'pending' | 'overdue';
  fileUrl?: string;
  ocrConfidence: number;
  createdAt: string;
}

export interface OCRResult {
  utilityProvider?: string;
  consumerName: string;
  consumerNumber: string;
  meterNumber?: string;
  billNumber: string;
  billingMonth: string;
  issueDate: string;
  dueDate: string;
  previousReading: number;
  currentReading: number;
  unitsConsumedKwh: number;
  sanctionedLoadKw: number;
  powerFactor: number;
  tariffCategory: string;
  connectionType?: string;
  amountDue: number;
  breakdown: BillBreakdown;
  confidenceScore: number;
  detectedFieldsCount: number;
  rawTextSnippets: string[];
  qualityWarnings?: string[];
}

export interface MLPredictionInput {
  historyUnits: number[]; // e.g., last 3 to 12 months units
  billingMonth: number; // 1 - 12
  homeAreaSqFt: number;
  occupants: number;
  acCount: number;
  acAverageHoursDaily: number;
  hasEvCharger: boolean;
  hasSolarPanels: boolean;
  solarCapacityKw: number;
  hasWaterHeater: boolean;
  heavyHvacUsage: boolean;
  sanctionedLoadKw: number;
  tariffCategory: 'Residential' | 'Commercial' | 'Industrial';
  avgTemperatureC: number;
}

export interface PredictionResult {
  predictedUnitsKwh: number;
  predictedAmount: number;
  confidenceLowerUnits: number;
  confidenceUpperUnits: number;
  confidenceLowerAmount: number;
  confidenceUpperAmount: number;
  monthOverMonthChangePercent: number;
  peakDemandKw: number;
  co2EmissionsKg: number;
  tierBreakdown: {
    tierName: string;
    units: number;
    ratePerUnit: number;
    cost: number;
  }[];
  keyCostDrivers: {
    factor: string;
    impactKwh: number;
    impactAmount: number;
    percentage: number;
  }[];
}

export interface Recommendation {
  id: string;
  title: string;
  category: 'HVAC & Cooling' | 'Solar & Net Metering' | 'Behavioral Shifting' | 'Appliance Upgrade' | 'Tariff Optimization';
  description: string;
  estimatedMonthlySavings: number;
  estimatedKwhSavings: number;
  implementationCost: string;
  paybackMonths: number;
  impactLevel: 'High' | 'Medium' | 'Low';
  status: 'new' | 'in_progress' | 'completed';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
  billContextAttached?: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalBillsProcessed: number;
  totalKwhAnalyzed: number;
  totalSavingsGeneratedAmount: number;
  ocrAccuracyPercent: number;
  modelMaeKwh: number;
  activeUsers24h: number;
  monthlyTrend: { month: string; bills: number; avgUnits: number }[];
  tariffDistribution: { category: string; percentage: number; count: number }[];
  recentActivity: { id: string; user: string; action: string; time: string; status: 'success' | 'warning' | 'info' }[];
}

export interface UserSettings {
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  currencySymbol: string;
  unitType: 'kWh' | 'MWh';
  alertThresholdPercent: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  highBillAlerts: boolean;
  weeklySummary: boolean;
  aiChatModel: string;
}
