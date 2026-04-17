
import { MEDHOME_API_URL } from '../constants.ts';
import { Drug, ExternalDrugItem, AdminStats } from '../types.ts';
import { syncDrugPrice } from './supabase.ts';

/**
 * دالة تحويل البيانات من الصيغة الخارجية لـ Medhome إلى صيغة Pharma Core
 */
const mapExternalToDrug = (item: ExternalDrugItem): Drug => {
  const pNew = item.price ? parseFloat(item.price) : null;
  const pOld = item.oldprice ? parseFloat(item.oldprice) : null;
  
  let apiDate = null;
  if (item.Date_updated) {
    // معالجة التاريخ بصيغة الميللي ثانية (MS)
    const ms = parseInt(item.Date_updated, 10);
    const correctedMs = ms < 10000000000 ? ms * 1000 : ms;
    apiDate = new Date(correctedMs).toISOString();
  }

  return {
    drug_no: item.id || `drug-${item.name ? item.name.replace(/\s+/g, '-') : 'unknown'}-${Math.random().toString(36).substr(2, 5)}`,
    name_en: item.name || "Unknown Product",
    name_ar: item.arabic || "",
    price_new: pNew,
    price_old: pOld,
    api_updated_at: apiDate,
    fetched_at: new Date().toISOString()
  };
};

/**
 * الوظيفة الرئيسية لجلب دفعات الأدوية من API Medhome
 * @param offset الإزاحة (نقطة البداية للجلب)
 */
export const fetchDrugBatchFromAPI = async (offset: number): Promise<Drug[]> => {
  try {
    const response = await fetch('/api/proxy/medhome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ offset })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Proxy Error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      const drugs = data.map(mapExternalToDrug);
      
      // Update prices in database
      drugs.forEach(drug => {
        if (drug.price_new !== null) {
          syncDrugPrice(drug.drug_no, drug.price_new);
        }
      });
      
      return drugs;
    }
    
    return [];
  } catch (e) {
    console.error("Critical API Fetch Error:", e);
    throw e; // Rethrow to help identify the source
  }
};

/**
 * حساب الإحصائيات العامة بناءً على البيانات المستلمة
 */
export const fetchAdminStats = (drugs: Drug[]): AdminStats => {
  const totalDrugs = drugs.length;
  const totalChanged = drugs.filter(d => 
    d.price_new !== null && 
    d.price_old !== null && 
    d.price_new !== d.price_old
  ).length;
  
  const priceRanges = {
    low: drugs.filter(d => (d.price_new || 0) < 50).length,
    mid: drugs.filter(d => (d.price_new || 0) >= 50 && (d.price_new || 0) <= 200).length,
    high: drugs.filter(d => (d.price_new || 0) > 200).length,
  };

  const topGainers = [...drugs]
    .filter(d => d.price_new !== null && d.price_old !== null && d.price_old > 0)
    .sort((a, b) => {
      const gainA = (Number(a.price_new) - Number(a.price_old)) / Number(a.price_old);
      const gainB = (Number(b.price_new) - Number(b.price_old)) / Number(b.price_old);
      return gainB - gainA;
    })
    .slice(0, 5);

  return {
    totalDrugs,
    totalChanged,
    lastUpdate: new Date().toISOString(),
    topGainers,
    healthScore: 100,
    priceRanges
  };
};
