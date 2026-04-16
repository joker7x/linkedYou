
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Link as LinkIcon, Share2, TrendingUp, Globe, Smartphone, MousePointer2, 
  Plus, Copy, Check, ExternalLink, Search, Trash2, BarChart3, 
  MessageCircle, Send, Users, MapPin, Bot, RefreshCw
} from 'lucide-react';
import { Drug, PromoLink, PromoVisit } from '../types.ts';
import { createPromoLink, getPromoStats, searchDrugs } from '../services/supabase.ts';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

interface MarketingViewProps {
  currentUser: any;
}

export const MarketingView: React.FC<MarketingViewProps> = ({ currentUser }) => {
  const [links, setLinks] = useState<PromoLink[]>([]);
  const [visits, setVisits] = useState<PromoVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [botUsername, setBotUsername] = useState('i23Bot');
  const [channelLink, setChannelLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    const { links: l, visits: v, error } = await getPromoStats();
    if (error) {
      setErrorMsg(error.message || 'حدث خطأ أثناء جلب البيانات. تأكد من إنشاء الجداول في قاعدة البيانات.');
    }
    setLinks(l || []);
    setVisits(v || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length > 2) {
      const results = await searchDrugs(q);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleCreateLink = async () => {
    if (!selectedDrug) return;
    setIsCreating(true);
    setErrorMsg(null);
    
    // Ensure we have a valid drug_no, fallback to id, or generate a temporary one if both are missing
    const validDrugNo = selectedDrug.drug_no || selectedDrug.id || `temp_${Math.random().toString(36).substring(2, 9)}`;
    
    const { data, error } = await createPromoLink({
      drug_no: String(validDrugNo),
      bot_username: botUsername || 'i23Bot',
      channel_link: channelLink,
      created_by: String(currentUser?.id || 'admin'),
      title: selectedDrug.name_ar || selectedDrug.name_en || 'بدون اسم',
      description: `سعر جديد: ${selectedDrug.price_new || 0} ج.م`
    });
    
    if (data) {
      setLinks([data, ...links]);
      setSelectedDrug(null);
      setSearchQuery('');
      setSearchResults([]);
    } else if (error) {
      setErrorMsg(error.message || 'حدث خطأ أثناء إنشاء الرابط. تأكد من إنشاء الجداول في قاعدة البيانات.');
    }
    setIsCreating(false);
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/?promo=${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatsForLink = (linkId: string) => {
    const linkVisits = visits.filter(v => v.link_id === linkId);
    return {
      total: linkVisits.length,
      countries: [...new Set(linkVisits.map(v => v.country))].filter(Boolean).length,
      platforms: [...new Set(linkVisits.map(v => v.platform))].filter(Boolean).length
    };
  };

  // Aggregate stats for charts
  const platformData = Object.entries(
    visits.reduce((acc: any, v) => {
      const p = v.platform || 'Unknown';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const deviceData = Object.entries(
    visits.reduce((acc: any, v) => {
      const d = v.device || 'Unknown';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-20">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={LinkIcon} label="الروابط النشطة" value={links.length} color="blue" />
        <StatCard icon={Users} label="إجمالي الزيارات" value={visits.length} color="emerald" />
        <StatCard icon={Globe} label="الدول المستهدفة" value={[...new Set(visits.map(v => v.country))].filter(Boolean).length} color="indigo" />
        <StatCard icon={TrendingUp} label="معدل التحويل" value={links.length ? `${((visits.length / links.length) || 0).toFixed(1)}` : '0'} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Link Creation */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <Plus className="text-blue-600" size={24} />
              إنشاء رابط ترويجي
            </h3>

            {errorMsg && (
              <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">ابحث عن الصنف</label>
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="اسم الدواء..."
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 pr-12 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-50 relative">
                    {searchResults.map((drug, idx) => (
                      <button 
                        key={`${drug.drug_no}-${idx}`}
                        onClick={() => {
                          setSelectedDrug(drug);
                          setSearchResults([]);
                          setSearchQuery(drug.name_ar || drug.name_en);
                        }}
                        className="w-full text-right p-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                      >
                        <div className="text-sm font-bold">{drug.name_ar || drug.name_en}</div>
                        <div className="text-[10px] text-slate-400">{drug.company}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedDrug && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <div className="text-xs font-black text-blue-600 mb-1">تم اختيار:</div>
                  <div className="text-sm font-bold">{selectedDrug.name_ar || selectedDrug.name_en}</div>
                  <div className="text-xs text-blue-500 mt-1">السعر: {selectedDrug.price_new} ج.م</div>
                </motion.div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">بوت التوجيه (Username)</label>
                <div className="relative">
                  <Bot className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={botUsername}
                    onChange={(e) => setBotUsername(e.target.value)}
                    placeholder="i23Bot"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 pr-12 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">رابط القناة (اختياري)</label>
                <div className="relative">
                  <Send className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={channelLink}
                    onChange={(e) => setChannelLink(e.target.value)}
                    placeholder="https://t.me/..."
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 pr-12 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button 
                disabled={!selectedDrug || isCreating}
                onClick={handleCreateLink}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isCreating ? <RefreshCw className="animate-spin" size={18} /> : <Share2 size={18} />}
                إنشاء الرابط
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-[300px]">
              <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                <Globe size={16} className="text-indigo-500" />
                توزيع المنصات
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-[300px]">
              <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                <Smartphone size={16} className="text-emerald-500" />
                الأجهزة المستخدمة
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={deviceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Links List */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <TrendingUp className="text-emerald-600" size={24} />
              الروابط النشطة والإحصائيات
            </h3>

            <div className="space-y-4">
              {links.map((link, idx) => {
                const stats = getStatsForLink(link.id);
                return (
                  <div key={`${link.id}-${idx}`} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <LinkIcon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-black">{link.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold">ID: {link.id} • {new Date(link.created_at).toLocaleDateString('ar-EG')}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                            <MousePointer2 size={10} /> {stats.total} زيارة
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                            <Globe size={10} /> {stats.countries} دول
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyLink(link.id)}
                        className={`p-3 rounded-xl transition-all ${copiedId === link.id ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500'}`}
                      >
                        {copiedId === link.id ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                      <button className="p-3 rounded-xl bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-500 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {links.length === 0 && (
                <div className="text-center py-12 text-slate-400">لا توجد روابط نشطة حالياً</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon size={20} />
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
    </div>
  );
};
