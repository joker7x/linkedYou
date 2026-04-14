import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ArrowLeft, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  ChevronRight,
  Filter
} from 'lucide-react';
import { StockItem, Drug } from '../types.ts';
import { getStock, getDrugsByIds } from '../services/supabase.ts';

interface StockAnalyticsProps {
  onBack: () => void;
  allDrugs: Drug[];
  userId: string;
}

export const StockAnalytics: React.FC<StockAnalyticsProps> = ({ onBack, allDrugs, userId }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [localDrugCache, setLocalDrugCache] = useState<Drug[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await getStock(userId);
      const mappedStock = data.map(item => ({
        id: item.id,
        drug_no: item.drug_id.toString(),
        name_en: item.drug_name_en,
        name_ar: item.drug_name_ar,
        purchase_price: item.purchase_price,
        selling_price: item.selling_price,
        quantity: item.quantity,
        expiry_date: item.expiry_date,
        discount_percentage: item.discount_percentage,
        last_updated: item.updated_at,
        dosage_form: item.dosage_form
      }));
      setStockItems(mappedStock);

      const drugIds = Array.from(new Set(mappedStock.map(item => parseInt(item.drug_no)).filter(id => !isNaN(id))));
      if (drugIds.length > 0) {
        const drugDetails = await getDrugsByIds(drugIds);
        setLocalDrugCache(drugDetails);
      }
      setLoading(false);
    };
    loadData();
  }, [userId]);

  const stats = useMemo(() => {
    const combinedDrugs = [...allDrugs, ...localDrugCache];
    let totalPurchaseValue = 0;
    let totalPotentialRevenue = 0;
    let totalItems = 0;
    let priceIncreasesCount = 0;
    let potentialProfitGain = 0;

    const itemsWithAnalysis = stockItems.map(item => {
      const apiDrug = combinedDrugs.find(d => (d.id?.toString() === item.drug_no) || (d.drug_no === item.drug_no));
      const currentPurchasePrice = Number(item.purchase_price);
      const apiPrice = apiDrug?.price_new ? Number(apiDrug.price_new) : Number(item.selling_price);
      
      const itemPurchaseTotal = currentPurchasePrice * item.quantity;
      const itemRevenueTotal = apiPrice * item.quantity;
      
      totalPurchaseValue += itemPurchaseTotal;
      totalPotentialRevenue += itemRevenueTotal;
      totalItems += item.quantity;

      const priceDiff = apiPrice - Number(item.selling_price);
      if (priceDiff > 0) {
        priceIncreasesCount++;
        potentialProfitGain += (priceDiff * item.quantity);
      }

      return {
        ...item,
        apiPrice,
        priceDiff,
        profitMargin: ((apiPrice - currentPurchasePrice) / apiPrice) * 100
      };
    });

    const totalProfit = totalPotentialRevenue - totalPurchaseValue;
    const avgMargin = totalPotentialRevenue > 0 ? (totalProfit / totalPotentialRevenue) * 100 : 0;

    return {
      totalPurchaseValue,
      totalPotentialRevenue,
      totalProfit,
      avgMargin,
      totalItems,
      priceIncreasesCount,
      potentialProfitGain,
      itemsWithAnalysis
    };
  }, [stockItems, allDrugs, localDrugCache]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-black text-slate-400 animate-pulse">جاري تحليل بيانات المخزون...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md px-4 py-4 border-bottom border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">إحصائيات المخزون</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تحليل مالي شامل</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mb-4">
              <Package size={20} />
            </div>
            <div className="text-[10px] font-black text-slate-400 mb-1">إجمالي القطع</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{stats.totalItems}</div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 mb-4">
              <TrendingUp size={20} />
            </div>
            <div className="text-[10px] font-black text-slate-400 mb-1">متوسط الربح</div>
            <div className="text-xl font-black text-emerald-600">{stats.avgMargin.toFixed(1)}%</div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="bg-slate-900 dark:bg-blue-600 rounded-[40px] p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-xs font-bold opacity-60 mb-1 uppercase tracking-widest">إجمالي قيمة المخزون</div>
                <div className="text-3xl font-black">{stats.totalPotentialRevenue.toLocaleString()} <span className="text-sm font-normal opacity-60">ج.م</span></div>
              </div>
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-6">
              <div>
                <div className="text-[10px] font-bold opacity-60 mb-1">رأس المال المستثمر</div>
                <div className="text-lg font-black">{stats.totalPurchaseValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold opacity-60 mb-1">صافي الربح المتوقع</div>
                <div className="text-lg font-black text-emerald-400">+{stats.totalProfit.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Alerts Section */}
        {stats.priceIncreasesCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[32px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                <AlertCircle size={16} />
              </div>
              <h3 className="font-black text-amber-900 dark:text-amber-400 text-sm">تنبيهات تغير الأسعار</h3>
            </div>
            <p className="text-xs font-bold text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
              هناك <span className="font-black text-amber-600">{stats.priceIncreasesCount} أصناف</span> زاد سعرها في السوق. 
              ربحك الإضافي المتوقع عند البيع بالسعر الجديد هو <span className="font-black text-amber-600">{stats.potentialProfitGain.toLocaleString()} ج.م</span>.
            </p>
          </div>
        )}

        {/* Top Margin Items */}
        <div>
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">الأصناف الأكثر ربحية</h3>
            <div className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">توب 5</div>
          </div>
          
          <div className="space-y-3">
            {stats.itemsWithAnalysis
              .sort((a, b) => b.profitMargin - a.profitMargin)
              .slice(0, 5)
              .map((item, idx) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group transition-all hover:border-blue-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs">
                      0{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">{item.name_en}</div>
                      <div className="text-[10px] font-bold text-slate-400">{item.dosage_form || 'صنف'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-600">{item.profitMargin.toFixed(1)}%</div>
                    <div className="text-[9px] font-bold text-slate-400">هامش ربح</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Detailed Price Changes Table (Mobile Optimized) */}
        <div>
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">تغيرات الأسعار التفصيلية</h3>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden">
            {stats.itemsWithAnalysis.map((item, idx) => (
              <div key={item.id} className={`p-5 ${idx !== stats.itemsWithAnalysis.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="max-w-[70%]">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">{item.name_en}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">{item.name_ar}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1 ${item.priceDiff > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {item.priceDiff > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {item.priceDiff > 0 ? `+${item.priceDiff} ج` : 'ثابت'}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
                    <div className="text-[8px] font-bold text-slate-400 mb-0.5">سعر الشراء</div>
                    <div className="text-[10px] font-black text-slate-700 dark:text-slate-300">{item.purchase_price}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
                    <div className="text-[8px] font-bold text-slate-400 mb-0.5">سعر الاستوك</div>
                    <div className="text-[10px] font-black text-slate-700 dark:text-slate-300">{item.selling_price}</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl text-center border border-blue-100 dark:border-blue-900/30">
                    <div className="text-[8px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">السعر الحالي</div>
                    <div className="text-[10px] font-black text-blue-600 dark:text-blue-400">{item.apiPrice}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
