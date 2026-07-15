import { CommunityUser } from '../types';

export const PREMIUM_FEATURES = {
  SHORTAGES: 'نقص الأدوية المتقدم',
  ANALYTICS: 'تحليلات السوق',
  INVOICE_PRO: 'إدارة الفواتير المتقدمة',
  EXCEL_EXPORT: 'تصدير إكسيل',
  AD_FREE: 'بدون إعلانات',
  PRIORITY_SUPPORT: 'دعم عالي الأولوية',
  COMMUNITY_POST: 'نشر غير محدود بالمجتمع',
  COMMUNITY_COMMENT: 'التعليق في المجتمع',
  UNLIMITED_DRUGS: 'عرض كامل قاعدة البيانات'
};

export const hasAccess = (user: CommunityUser | null, featureKey: keyof typeof PREMIUM_FEATURES): boolean => {
  if (!user) return false;
  
  // Admins have access to everything
  if (user.role === 'admin') return true;
  
  // If no premium status, free tier
  if (!user.premiumTier || user.premiumTier === 'free') return false;
  
  // Check temporary premium expiration
  if (user.premiumTier === 'temporary' && user.premiumUntil) {
    const until = new Date(user.premiumUntil);
    if (new Date() > until) return false;
  }
  
  // Check if feature is in unlocked list
  // If unlockedFeatures is empty/null but user is premium, assume all (fallback)
  if (!user.unlockedFeatures || user.unlockedFeatures.length === 0) return true;
  
  return user.unlockedFeatures.includes(PREMIUM_FEATURES[featureKey]);
};

export const getTierLabel = (user: CommunityUser | null): string => {
  if (!user) return 'زائر';
  if (user.role === 'admin') return 'إدارة';
  
  if (user.premiumTier === 'premium') return 'بريميوم ذهبي';
  if (user.premiumTier === 'temporary') {
    if (user.premiumUntil && new Date() > new Date(user.premiumUntil)) return 'باقة مجانية (منتهية)';
    return 'بريميوم مؤقت';
  }
  
  return 'باقة مجانية';
};
