import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Printer, ChevronRight, Scan, X, ArrowLeft, ArrowRight, Minus } from 'lucide-react';
import { Drug, InvoiceItem } from '../types.ts';
import { searchDrugs } from '../services/supabase.ts';

interface InvoiceBuilderProps {
  onBack: () => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onBack }) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [pharmacyName, setPharmacyName] = useState('صيدلية Pharma Core');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const results = await searchDrugs(q);
      setSearchResults(results);
    } catch (e) {} finally { setIsSearching(false); }
  }, []);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => { handleSearch(searchQuery); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearch]);

  const addItem = (drug: Drug) => {
    const packPrice = Number(drug.price_new || 0);
    const packSize = Number(drug.pack_size || 1);
    const unitPrice = packPrice / packSize;
    const id = `db-${drug.drug_no}-${Date.now()}`;
    const newItem: InvoiceItem = {
      id, drug_no: drug.drug_no, name: drug.name_en, name_ar: drug.name_ar,
      unitPrice, quantity: 1, packPrice, packSize
    };
    setItems([...items, newItem]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-14 pb-24 px-4 rtl" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[20px] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <Printer size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">إنشاء فاتورة</h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">حاسبة الأسعار</p>
            </div>
          </div>
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="mb-6 bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <input type="text" value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} className="w-full bg-transparent font-black text-lg text-slate-800 dark:text-white outline-none text-right" />
        </div>

        <div className="mb-8 relative">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="ابحث عن دواء..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] py-5 pr-14 pl-6 text-[16px] font-bold shadow-sm outline-none text-right text-slate-900 dark:text-white" />
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-[110] left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                {searchResults.map(drug => (
                  <button key={drug.drug_no} onClick={() => addItem(drug)} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-right">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-[15px] font-black text-slate-900 dark:text-white truncate">{drug.name_en}</div>
                      <div className="text-[12px] font-bold text-slate-400 truncate">{drug.name_ar}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500"><Plus size={20} /></div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="flex-1">
                <div className="font-black text-slate-900 dark:text-white">{item.name}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{item.unitPrice.toFixed(2)} EGP</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"><Minus size={16} /></button>
                <span className="font-black text-lg text-slate-900 dark:text-white">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Plus size={16} /></button>
                <button onClick={() => removeItem(item.id)} className="text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="py-12 text-center text-slate-400 dark:text-slate-600 font-bold">لا توجد أصناف</div>}
        </div>

        <div className="fixed bottom-6 left-6 right-6 bg-slate-900 dark:bg-blue-600 rounded-[32px] p-6 text-white flex items-center justify-between shadow-2xl">
          <div className="text-2xl font-black">{totalAmount.toFixed(2)} EGP</div>
          <button onClick={() => window.print()} className="bg-blue-600 dark:bg-slate-900 px-6 py-3 rounded-2xl font-black flex items-center gap-2">
            <Printer size={18} /> طباعة
          </button>
        </div>
      </div>
    </div>
  );
};
