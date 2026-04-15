import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Camera, ArrowRight, Minus, FileText } from 'lucide-react';
import { Drug, InvoiceItem } from '../types.ts';
import { searchDrugs } from '../services/supabase.ts';
import { toPng } from 'html-to-image';

interface InvoicePreviewProps {
  items: InvoiceItem[];
  totalAmount: number;
  pharmacyName: string;
  previewRef: React.RefObject<HTMLDivElement>;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ items, totalAmount, pharmacyName, previewRef }) => (
  <div ref={previewRef} className="p-8 bg-white text-slate-900 w-[400px] min-h-[500px] shadow-lg border border-slate-200 flex flex-col" dir="rtl">
    <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
      <h2 className="text-2xl font-black uppercase tracking-wider">{pharmacyName}</h2>
      <p className="text-sm text-slate-600 mt-1">فاتورة مبيعات</p>
      <p className="text-xs text-slate-500 mt-1">{new Date().toLocaleString('ar-EG')}</p>
    </div>
    
    <div className="flex-grow">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-300">
            <th className="text-right py-2">الصنف</th>
            <th className="text-center py-2">الكمية</th>
            <th className="text-center py-2">السعر</th>
            <th className="text-left py-2">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-3 text-right font-medium">{item.name_ar || item.name}</td>
              <td className="py-3 text-center">{item.quantity}</td>
              <td className="py-3 text-center">{Number(item.unitPrice).toFixed(2)}</td>
              <td className="py-3 text-left font-bold">{(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-8 pt-4 border-t-2 border-slate-900">
      <div className="flex justify-between items-center text-xl font-black">
        <span>الإجمالي:</span>
        <span>{totalAmount.toFixed(2)} EGP</span>
      </div>
    </div>

    <div className="mt-12 flex justify-between items-end">
      <div className="text-xs text-slate-500">
        <p>شكراً لثقتكم</p>
      </div>
      <div className="w-24 h-24 border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400 text-center p-2">
        مكان الختم
      </div>
    </div>
  </div>
);

interface InvoiceBuilderProps {
  onBack: () => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onBack }) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [pharmacyName, setPharmacyName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    const results = await searchDrugs(q);
    const uniqueResults = Array.from(new Map(results.map(d => [d.drug_no, d])).values());
    setSearchResults(uniqueResults);
  }, []);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => { handleSearch(searchQuery); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearch]);

  const addItem = (drug: Drug, unitType: 'pack' | 'strip') => {
    const price = drug.price_new || 0;
    const packSize = drug.pack_size || 1;
    const unitPrice = unitType === 'pack' ? price : (price / packSize);
    
    const id = `item-${drug.drug_no}-${unitType}-${Date.now()}`;
    const newItem: InvoiceItem = {
      id, 
      drug_no: drug.drug_no, 
      name: `${drug.name_en} (${unitType === 'pack' ? 'Pack' : 'Strip'})`, 
      name_ar: `${drug.name_ar} (${unitType === 'pack' ? 'علبة' : 'شريط'})`,
      unitPrice: unitPrice, 
      quantity: 1, 
      packPrice: price, 
      packSize: packSize
    };
    setItems([...items, newItem]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);

  const downloadImage = async () => {
    if (previewRef.current) {
      const dataUrl = await toPng(previewRef.current, {
        skipFonts: true,
        filter: (node) => {
          // Exclude Google Fonts stylesheets
          if (node.tagName === 'LINK' && (node as HTMLLinkElement).href?.includes('fonts.googleapis.com')) {
            return false;
          }
          // Exclude style tags that might contain @import for fonts
          if (node.tagName === 'STYLE' && node.textContent?.includes('@import')) {
            return false;
          }
          return true;
        }
      });
      const link = document.createElement('a');
      link.download = `invoice_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-14 pb-32 px-4 rtl" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex-1">
            <input 
                type="text" 
                placeholder="اسم الصيدلية (اختياري)" 
                value={pharmacyName} 
                onChange={(e) => setPharmacyName(e.target.value)} 
                className="text-2xl font-black text-slate-900 dark:text-white tracking-tight bg-transparent border-b-2 border-dashed border-slate-300 w-full outline-none placeholder:text-slate-300"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">إنشاء فاتورة</p>
          </div>
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="ابحث في المخزون..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] py-5 pr-14 pl-6 text-[16px] font-bold shadow-sm outline-none text-right text-slate-900 dark:text-white" />
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-[110] left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                {searchResults.map(drug => (
                  <div key={drug.drug_no} className="p-4 border-b border-slate-100 dark:border-slate-800 text-right">
                    <div className="text-[15px] font-black text-slate-900 dark:text-white truncate">{drug.name_ar}</div>
                    <div className="text-[12px] font-bold text-slate-400 truncate mb-2">{drug.name_en}</div>
                    <div className="flex gap-2">
                        <button onClick={() => addItem(drug, 'pack')} className="flex-1 bg-blue-600 text-white text-xs font-black py-2 rounded-lg">علبة</button>
                        <button onClick={() => addItem(drug, 'strip')} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black py-2 rounded-lg">شريط</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-24">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="flex-1">
                <div className="font-black text-slate-900 dark:text-white">{item.name_ar || item.name}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{Number(item.unitPrice).toFixed(2)} EGP</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"><Minus size={16} /></button>
                <span className="font-black text-lg text-slate-900 dark:text-white">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Plus size={16} /></button>
                <button onClick={() => removeItem(item.id)} className="text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="py-12 text-center text-slate-400 dark:text-slate-600 font-bold">لا توجد أصناف في الفاتورة</div>}
        </div>

        <div className="fixed bottom-20 left-4 right-4 bg-slate-900 dark:bg-blue-600 rounded-[24px] p-4 text-white flex items-center justify-between shadow-2xl z-40">
          <div className="text-xl font-black">{totalAmount.toFixed(2)} EGP</div>
          <button onClick={downloadImage} className="bg-blue-600 dark:bg-slate-900 px-4 py-2 rounded-xl font-black flex items-center gap-2 text-sm">
            <Camera size={16} /> تحميل صورة
          </button>
        </div>
        
        {/* Hidden preview for image generation */}
        <div className="absolute -left-[9999px] top-0">
          <InvoicePreview items={items} totalAmount={totalAmount} pharmacyName={pharmacyName} previewRef={previewRef} />
        </div>
      </div>
    </div>
  );
};
