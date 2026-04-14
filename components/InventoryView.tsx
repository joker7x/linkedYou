import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Package, TrendingUp, AlertTriangle, Search, Clock, CheckCircle2, TrendingDown, Plus } from 'lucide-react';
import { StockItem, Drug } from '../types.ts';
import { getStock, addStockItem, searchDrugsSupabase, deleteStockItem, getDrugsByIds, logActivity } from '../services/supabase.ts';

interface InventoryViewProps {
  onBack: () => void;
  allDrugs: Drug[];
  shortageDrugIds: string[];
  userId: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onBack, allDrugs, shortageDrugIds, userId }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [localDrugCache, setLocalDrugCache] = useState<Drug[]>([]);

  React.useEffect(() => {
    const loadInventory = async () => {
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
        last_updated: item.updated_at
      }));
      setStockItems(mappedStock);

      // Fetch drug details for all items to get dosage_form and current prices
      const drugIds = Array.from(new Set(mappedStock.map(item => parseInt(item.drug_no)).filter(id => !isNaN(id))));
      if (drugIds.length > 0) {
        const drugDetails = await getDrugsByIds(drugIds);
        setLocalDrugCache(drugDetails);
      }
      setLoading(false);
    };

    loadInventory();
  }, [userId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<StockItem>>({});
  const [drugSearch, setDrugSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const toggleItemSelection = (id: number) => {
    const next = new Set(selectedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItems(next);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id!)));
    }
  };

  const exportData = (format: 'excel' | 'csv' | 'text') => {
    const dataToExport = filteredItems.filter(item => selectedItems.has(item.id!));
    if (dataToExport.length === 0) {
      alert("يرجى اختيار أصناف للتصدير");
      return;
    }

    if (format === 'text') {
      const textContent = dataToExport.map(item =>
        `الصنف: ${item.name_ar} (${item.name_en})\nالكمية: ${item.quantity}\nسعر الشراء: ${item.purchase_price}\nسعر البيع: ${item.selling_price}\nتاريخ الانتهاء: ${item.expiry_date}\n-------------------`
      ).join('\n');
      const blob = new Blob(['\uFEFF', textContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "Inventory.txt");
      link.click();
      return;
    }

    const worksheetData = dataToExport.map(item => ({
      'اسم الصنف (إنجليزي)': item.name_en,
      'اسم الصنف (عربي)': item.name_ar,
      'الكمية': item.quantity,
      'سعر الشراء': item.purchase_price,
      'سعر البيع': item.selling_price,
      'تاريخ الانتهاء': item.expiry_date
    }));

    if (format === 'excel') {
      import('xlsx').then(XLSX => {
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        XLSX.writeFile(workbook, "Inventory.xlsx");
      });
    } else {
      import('xlsx').then(XLSX => {
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Inventory.csv");
        link.click();
      });
    }
  };

  const handleDrugSearch = async (query: string) => {
    setDrugSearch(query);
    if (query.length > 2) {
      const results = await searchDrugsSupabase(query);
      setSearchResults(results.map(d => ({
        drug_no: d.id?.toString() || '',
        name_en: d.name_en,
        name_ar: d.name_ar,
        price_new: d.price_new,
        price_old: d.price_old || null,
        dosage_form: d.dosage_form,
        api_updated_at: d.api_updated_at || null
      })));
    } else {
      setSearchResults([]);
    }
  };

  const selectDrug = (drug: Drug) => {
    const sellingPrice = drug.price_new ? Number(drug.price_new) : 0;
    const discount = newItem.discount_percentage || 0;
    const purchasePrice = sellingPrice * (1 - discount / 100);
    
    setNewItem({
      ...newItem,
      drug_no: drug.drug_no?.toString() || drug.id?.toString() || '',
      name_en: drug.name_en || '',
      name_ar: drug.name_ar || '',
      selling_price: sellingPrice,
      purchase_price: purchasePrice,
      dosage_form: drug.dosage_form
    });
    setDrugSearch(drug.name_en || '');
    setSearchResults([]);
  };

  const updateDiscount = (discount: number) => {
    const sellingPrice = newItem.selling_price || 0;
    const purchasePrice = sellingPrice * (1 - discount / 100);
    setNewItem({
      ...newItem,
      discount_percentage: discount,
      purchase_price: purchasePrice
    });
  };

  const handleAddItem = async () => {
    console.log("Attempting to add item:", newItem);
    
    // Validate required fields
    if (!newItem.drug_no || !newItem.name_en || newItem.purchase_price === undefined || !newItem.quantity || newItem.selling_price === undefined || !newItem.expiry_date) {
      console.error("Missing required fields for adding stock item", newItem);
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const payload = {
      drug_id: parseInt(newItem.drug_no),
      drug_name_en: newItem.name_en,
      drug_name_ar: newItem.name_ar || '',
      purchase_price: Number(newItem.purchase_price),
      selling_price: Number(newItem.selling_price),
      quantity: Number(newItem.quantity),
      expiry_date: newItem.expiry_date
    };

    console.log("Sending payload to Supabase:", payload);

    const addedItem = await addStockItem(payload, userId);
    
    if (addedItem) {
      await logActivity(userId, 'add_stock', 5, String(addedItem.id));
      console.log("Item added successfully:", addedItem);
      setStockItems([...stockItems, { 
        ...newItem as StockItem, 
        id: addedItem.id,
        last_updated: new Date().toISOString().split('T')[0] 
      }]);
      setNewItem({});
      setDrugSearch('');
      setShowAddModal(false);
    } else {
      console.error("Failed to add stock item to Supabase");
      alert("حدث خطأ أثناء إضافة الصنف. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleDeleteItem = async (id: number) => {
    console.log("handleDeleteItem called for ID:", id);
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId === null) return;
    
    console.log("Confirming delete for ID:", deletingId);
    const success = await deleteStockItem(deletingId, userId);
    
    if (success) {
      console.log("Delete successful, updating state");
      setStockItems(prev => prev.filter(item => String(item.id) !== String(deletingId)));
      setDeletingId(null);
    } else {
      console.error("Delete failed for ID:", deletingId);
      setDeletingId(null);
    }
  };


  const processedStock = useMemo(() => {
    const combinedDrugs = [...allDrugs, ...localDrugCache];
    return stockItems.map(item => {
      // Look up by ID since drug_no might be null in the database
      const apiDrug = combinedDrugs.find(d => (d.id?.toString() === item.drug_no) || (d.drug_no === item.drug_no));
      const isShortage = shortageDrugIds.includes(item.drug_no);
      const purchasePrice = Number(item.purchase_price);
      const apiPrice = apiDrug?.price_new ? Number(apiDrug.price_new) : null;
      const priceIncreased = apiPrice !== null && apiPrice > purchasePrice;
      
      return {
        ...item,
        dosage_form: item.dosage_form || apiDrug?.dosage_form,
        currentApiPrice: apiPrice,
        isShortage,
        priceIncreased
      };
    });
  }, [stockItems, allDrugs, localDrugCache, shortageDrugIds]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(processedStock.map(item => item.dosage_form).filter(Boolean)));
    return unique.sort();
  }, [processedStock]);

  const filteredItems = processedStock.filter(item => {
    const matchesSearch = item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.name_ar.includes(searchQuery);
    const matchesCategory = !selectedCategory || item.dosage_form === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-14 px-4 pb-32 min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
      <header className="flex items-center justify-between mb-8 pt-4 px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[20px] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Package size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">مخزون الصيدلية</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">إدارة ذكية للأصناف</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-12 h-12 rounded-[20px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Export Controls */}
      <div className="flex gap-2 px-2 mb-4">
        <button onClick={toggleSelectAll} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300">
          {selectedItems.size === filteredItems.length ? 'إلغاء الكل' : 'تحديد الكل'}
        </button>
        <button onClick={() => exportData('excel')} className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-black">Excel</button>
        <button onClick={() => exportData('csv')} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black">CSV</button>
        <button onClick={() => exportData('text')} className="px-4 py-2 rounded-xl bg-slate-600 text-white text-xs font-black">Text</button>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[32px] p-8 w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl text-center"
          >
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">تأكيد الحذف</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              هل أنت متأكد من حذف هذا الصنف من المخزون؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeletingId(null)} 
                className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-black text-sm shadow-lg shadow-rose-500/30 transition-transform active:scale-95"
              >
                حذف الآن
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 w-full max-w-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">إضافة صنف جديد</h2>
            <div className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ابحث عن اسم الصنف..." 
                  value={drugSearch}
                  onChange={(e) => handleDrugSearch(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold" 
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map((drug, index) => (
                      <button key={`${drug.drug_no}-${index}`} onClick={() => selectDrug(drug)} className="w-full text-right p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-bold">
                        {drug.name_en} - {drug.name_ar}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="سعر البيع" value={newItem.selling_price || ''} readOnly className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold opacity-70 cursor-not-allowed" />
                <input type="number" placeholder="نسبة الخصم %" value={newItem.discount_percentage || ''} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold" onChange={(e) => updateDiscount(Number(e.target.value))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="سعر الشراء" value={newItem.purchase_price?.toFixed(2) || ''} readOnly className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold opacity-70 cursor-not-allowed" />
                <input type="number" placeholder="الكمية" value={newItem.quantity || ''} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold" onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})} />
              </div>
              <input type="date" placeholder="تاريخ الانتهاء" value={newItem.expiry_date || ''} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold" onChange={(e) => setNewItem({...newItem, expiry_date: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm">إلغاء</button>
              <button onClick={handleAddItem} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">إضافة</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative mb-6 px-2">
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث في المخزون..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] py-4 pr-12 pl-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      {/* Categories Filter */}
      <div className="mb-6 px-2 overflow-x-auto flex gap-2 no-scrollbar pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${
            selectedCategory === null 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          الكل
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? null : (cat as string))}
            className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 dark:text-slate-400">جاري تحميل المخزون...</div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div key={item.id || item.drug_no} className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.has(item.id!)}
                    onChange={() => toggleItemSelection(item.id!)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">{item.name_en}</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{item.name_ar}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.id && (
                    <button 
                      onClick={() => handleDeleteItem(item.id!)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <div className="flex flex-col gap-1">
                    {item.priceIncreased && (
                      <div className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <TrendingUp size={12} /> سعر جديد
                      </div>
                    )}
                    {item.isShortage && (
                      <div className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle size={12} /> ناقص
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">سعر الشراء</div>
                  <div className="text-xs font-black text-slate-700 dark:text-slate-300">{item.purchase_price} ج</div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">السعر الحالي</div>
                  <div className={`text-xs font-black ${item.priceIncreased ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                    {item.currentApiPrice || 'غير متاح'} ج
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">الكمية</div>
                  <div className="text-xs font-black text-blue-600 dark:text-blue-400">{item.quantity}</div>
                </div>
              </div>

              {item.dosage_form && (
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(item.dosage_form!);
                    }}
                    className="group px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-[9px] font-black text-slate-400 dark:text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 flex items-center gap-1.5 shadow-sm hover:shadow-blue-500/20"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-500 group-hover:bg-white transition-colors" />
                    {item.dosage_form.toUpperCase()}
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-slate-500 dark:text-slate-400">لا توجد أصناف في المخزون</div>
        )}
      </div>
    </div>
  );
};
