
export type AppView = 'home' | 'settings' | 'admin' | 'invoice' | 'shortages' | 'community' | 'profile' | 'analytics' | 'market_shortages';
export type TabMode = 'all' | 'changed' | 'fav';

export interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description?: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface CommunityUser {
  id: string;
  name: string;
  avatar?: string;
  avatarId?: string;
  isVerified: boolean;
  level: 'bronze' | 'silver' | 'gold' | 'diamond';
  points: number;
  role: 'pharmacist' | 'student' | 'doctor' | 'admin';
  bio?: string;
  title?: string;
  location?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  pharmacyName?: string;
  contactInfo?: string;
}

export interface CommunityPost {
  id: string;
  author: CommunityUser;
  content: string;
  mentionedDrugs: { id: string; name: string }[];
  mentionedActiveIngredients: string[];
  likes: number;
  commentsCount: number;
  createdAt: string;
  isReported?: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId?: string;
  author: CommunityUser;
  content: string;
  createdAt: string;
  reactions?: Record<string, number>;
}

export interface Drug {
  drug_no: string;           
  name_en: string;
  name_ar: string;
  company?: string;
  price_new: number | null;
  price_old: number | null;
  pack_size?: number | null;  
  dosage_form?: string;
  api_updated_at: string | null; 
  fetched_at?: string;           
  id?: string;
}

export interface ExternalDrugItem {
  id: string;
  name: string;
  arabic: string;
  price: string;
  oldprice: string;
  Date_updated: string;
}

export interface AdminStats {
  totalDrugs: number;
  totalChanged: number;
  lastUpdate: string;
  topGainers: Drug[];
  healthScore: number;
  priceRanges: {
    low: number;
    mid: number;
    high: number;
  };
}

export interface AdminConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceTime: string;
  liveSync: boolean;
  strictMode: boolean;
  aiAnalysis?: boolean;
  marketCheck?: boolean;
}

export interface InvoiceItem {
  id: string; 
  drug_no?: string; 
  name: string;
  name_ar?: string;
  unitPrice: number; 
  quantity: number;  
  packPrice: number; 
  packSize: number;  
}

export interface StockItem {
  id?: number;
  drug_no: string;
  name_en: string;
  name_ar: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  expiry_date: string;
  discount_percentage: number;
  last_updated: string;
  dosage_form?: string;
}

/**
 * Added missing interface for simplified drug analysis.
 */
export interface LightDrug {
  drug_no: string;
  name_en: string;
  price_new: number | null;
}

/**
 * Added missing interface for AI-driven market analysis results.
 */
export interface DeepMarketAnalysis {
  sentiment: string;
  trend: string;
  recommendation: string;
}

/**
 * Added missing interface for Tawreed market availability data.
 */
export interface TawreedProduct {
  productId: string;
  productName: string;
  stores: string[];
  totalQty: number;
  avgDiscount: number | null;
  bestSale: number | null;
}

/**
 * Added missing type for background sync process status.
 */
export type SyncStatus = 'idle' | 'running' | 'paused' | 'complete' | 'error';

/**
 * Added missing interface for sync tracking metadata.
 */
export interface SyncMetadata {
  status: SyncStatus;
  lastOffset: number;
  totalFetched: number;
  lastUpdate: string | null;
}

/**
 * Added missing interface for application-wide notifications.
 */
export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'update';
  title: string;
  message: string;
  timestamp: string;
}

export interface PromoLink {
  id: string;
  drug_no: string;
  bot_username: string;
  channel_link?: string;
  created_at: string;
  created_by: string;
  title?: string;
  description?: string;
  price_new?: number | string;
  price_old?: number | string;
}

export interface PromoVisit {
  id: string;
  link_id: string;
  timestamp: string;
  country?: string;
  device?: string;
  platform?: string;
  ip?: string;
  user_agent?: string;
  referrer?: string;
}
