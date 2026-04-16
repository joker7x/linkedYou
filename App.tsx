
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package2, ShieldCheck, Zap, LayoutGrid, Info, Award, Lock, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchDrugBatchFromAPI } from './services/api.ts';
import { Drug, TabMode, AppView, AdminConfig } from './types.ts';
import { DrugCard } from './components/DrugCard.tsx';
import { TabFilter } from './components/TabFilter.tsx';
import { BottomNavigation } from './components/Navigation.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { AdminView } from './components/AdminView.tsx';
import { InvoiceBuilder } from './components/InvoiceBuilder.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { CommunityView } from './components/CommunityView.tsx';
import { UserProfileView } from './components/UserProfileView.tsx';
import { StockAnalytics } from './components/StockAnalytics.tsx';
import { ShortagesView } from './components/ShortagesView.tsx';
import { PromoView } from './components/PromoView.tsx';
import { getGlobalConfig, syncTelegramUser, logSession, getUserProfile, checkUserBan, supabase } from './services/supabase.ts';
import { ADMIN_ID } from './constants.ts';

const App: React.FC = () => {
  const MDiv = motion.div as any;
  const [allDrugs, setAllDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [isAccessDenied, setIsAccessDenied] = useState<boolean>(false);
  const [mode, setMode] = useState<TabMode>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [banInfo, setBanInfo] = useState<{ isBanned: boolean; reason?: string; until?: string } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [promoId, setPromoId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promo = params.get('promo');
    if (promo) {
      setPromoId(promo);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  useEffect(() => {
    const startTime = Date.now();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
        if (currentUser?.id) {
          logSession(String(currentUser.id), duration, deviceType).catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  const [isAdmin, setIsAdmin] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    const root = document.getElementById('root');
    if (root) {
      root.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  };
  
  const [config, setConfig] = useState<AdminConfig>({
    aiAnalysis: true, 
    marketCheck: true, 
    maintenanceMode: false,
    maintenanceMessage: "", 
    maintenanceTime: "", 
    liveSync: true,
    strictMode: true
  });

  useEffect(() => {
    const bootstrap = async () => {
      const timer = setTimeout(() => setInitialLoading(false), 500);
      try {
        const tg = (window as any).Telegram?.WebApp;
        const isDev = window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost');
        const hasTgData = !!tg?.initData;

        if (!isDev && !hasTgData) {
          setIsAccessDenied(true);
          setLoading(false);
          setInitialLoading(false);
          return;
        }

        if (tg) {
          tg.ready();
          tg.expand();
          tg.headerColor = '#f8fafc';
          tg.backgroundColor = '#f8fafc';
          const user = tg.initDataUnsafe?.user;
          if (user) {
            const dbUser = await syncTelegramUser(user);
            if (dbUser?.is_admin || user.id === ADMIN_ID) setIsAdmin(true);
            
            // Load profile data to sync avatar and name
            const profile = await getUserProfile(String(user.id));
            // Merge: dbUser (permissions) + profile (avatar/bio)
            const fullUser = { ...dbUser, ...profile };
            setCurrentUser(fullUser);
            setBanInfo(checkUserBan(fullUser));
          } else {
            // Mock user for browser preview
            const mockUser = {
              id: 123456789,
              first_name: 'مستخدم',
              last_name: 'تجريبي',
              username: 'testuser'
            };
            const dbUser = await syncTelegramUser(mockUser);
            const profile = await getUserProfile(String(mockUser.id));
            const fullUser = { ...dbUser, ...profile };
            setCurrentUser(fullUser);
            setBanInfo(checkUserBan(fullUser));
            setIsAdmin(true);
          }
        }

        const [configRes, drugsRes] = await Promise.allSettled([
          getGlobalConfig(),
          fetchDrugBatchFromAPI(0)
        ]);

        if (configRes.status === 'fulfilled' && configRes.value) setConfig({...config, ...configRes.value});
        if (drugsRes.status === 'fulfilled' && drugsRes.value) {
          setAllDrugs(drugsRes.value);
        }
      } catch (e) {
        console.warn("Bootstrap process finished with warnings.");
      } finally {
        setLoading(false);
        clearTimeout(timer);
        setInitialLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Removed useEffect that clears allDrugs on mode change

  const filteredDrugs = React.useMemo(() => {
    let filtered = allDrugs;
    if (mode === 'changed') filtered = filtered.filter(d => d.price_new !== d.price_old);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(d => 
        d.name_en?.toLowerCase().includes(s) || 
        d.name_ar?.includes(s) ||
        d.drug_no?.includes(s)
      );
    }
    
    // Ensure uniqueness by drug_no
    const uniqueMap = new Map();
    for (const drug of filtered) {
        uniqueMap.set(drug.drug_no, drug);
    }
    const result = Array.from(uniqueMap.values());
    
    // Apply items limit if restricted
    const isSuperAdmin = Number(currentUser?.id) === ADMIN_ID;
    if (isAdmin || isSuperAdmin) return result;

    const explicitLimit = currentUser?.device_info?.items_limit;
    if (explicitLimit && !isNaN(Number(explicitLimit))) {
      return result.slice(0, Number(explicitLimit));
    }
    
    return result;
  }, [allDrugs, mode, search, currentUser, isAdmin]);

  const fetchNextBatch = useCallback(async () => {
    if (isFetching || !config.liveSync) return;
    setIsFetching(true);
    try {
      const results = await fetchDrugBatchFromAPI(allDrugs.length);
      if (results.length > 0) {
        setAllDrugs(prev => {
            const newDrugs = [...prev, ...results];
            // Ensure uniqueness by drug_no
            const uniqueMap = new Map();
            for (const drug of newDrugs) {
                uniqueMap.set(drug.drug_no, drug);
            }
            return Array.from(uniqueMap.values());
        });
      }
    } catch (e) {
      console.error("Failed to fetch next batch");
    } finally {
      setIsFetching(false);
    }
  }, [allDrugs.length, isFetching, config.liveSync]);

  // Removed scroll event listener

  useEffect(() => {
    if (!currentUser?.id) return;

    // Real-time listener for permission/ban changes
    const channel = supabase
      .channel(`user-changes-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_users',
          filter: `id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('User permissions updated in real-time:', payload.new);
          const updatedUser = payload.new;
          setCurrentUser((prev: any) => ({
            ...prev,
            ...updatedUser,
            // Ensure device_info is merged if it's an object
            device_info: {
              ...(prev?.device_info || {}),
              ...(updatedUser.device_info || {})
            }
          }));
          
          // Re-check ban status
          setBanInfo(checkUserBan(updatedUser));
          
          // Update admin status if changed
          if (updatedUser.is_admin !== undefined) {
            setIsAdmin(updatedUser.is_admin || Number(currentUser.id) === ADMIN_ID);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isAdmin]);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setSelectedUserId(null);
    scrollToTop();
  };

  const navigateToProfile = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('profile');
    scrollToTop();
  };

  const loadData = useCallback(async () => {
    if (initialLoading || !config.liveSync) return;
    setLoading(true);
    try {
      const results = await fetchDrugBatchFromAPI(0);
      setAllDrugs(results);
    } catch (e) {
      console.error("Data load failed");
    } finally {
      setLoading(false);
    }
  }, [initialLoading, config.liveSync]);

  useEffect(() => {
    if (!initialLoading && currentView === 'home' && allDrugs.length === 0) {
      loadData();
    }
  }, [initialLoading, currentView, loadData, allDrugs.length]);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderView = () => {
    if (banInfo?.isBanned) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center" dir="rtl">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-2xl max-w-md w-full border border-rose-100 dark:border-rose-900/20">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mb-8 mx-auto">
              <Lock size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">تم تقييد حسابك</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-bold">
              {banInfo.reason}. {banInfo.until ? `ينتهي الحظر في: ${banInfo.until}` : 'هذا الحظر دائم نتيجة مخالفة القوانين.'}
            </p>
            <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Pharma Core Security</div>
          </div>
        </div>
      );
    }

    if (config.maintenanceMode && !isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center" dir="rtl">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-2xl max-w-md w-full border border-amber-100 dark:border-amber-900/20">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center mb-8 mx-auto">
              <Info size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">التطبيق في وضع الصيانة</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-bold">
              {config.maintenanceMessage || 'نحن نقوم ببعض التحديثات لتحسين تجربتكم. سنعود قريباً جداً.'}
            </p>
            {config.maintenanceTime && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-8 border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">الوقت المتوقع للعودة</p>
                <p className="text-sm font-black text-blue-600 dark:text-blue-400">{config.maintenanceTime}</p>
              </div>
            )}
            <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Pharma Core Security</div>
          </div>
        </div>
      );
    }

    const restrictedPages = currentUser?.device_info?.restricted_pages || [];
    const isSuperAdmin = Number(currentUser?.id) === ADMIN_ID;
    const isRestricted = !isSuperAdmin && Array.isArray(restrictedPages) && restrictedPages.includes(currentView);
    
    if (isRestricted && !isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center" dir="rtl">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-3xl flex items-center justify-center mb-8 mx-auto">
              <Lock size={40} />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white mb-4">هذه الصفحة مقفولة</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-bold">
              ليس لديك صلاحية للوصول إلى هذا القسم حالياً. يرجى التواصل مع الإدارة لرفع التقييد.
            </p>
            <button 
              onClick={() => setCurrentView('home')}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'admin': return <AdminView onBack={() => setCurrentView('home')} drugsCount={allDrugs.length} config={config} onUpdateConfig={c => setConfig({...config, ...c})} currentUser={currentUser} />;
      case 'settings': return <SettingsView user={currentUser} darkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} onClearFavorites={() => {}} onBack={() => setCurrentView('home')} isAdmin={isAdmin} onOpenAdmin={() => setCurrentView('admin')} onOpenInvoice={() => setCurrentView('invoice')} onOpenAnalytics={() => setCurrentView('analytics')} onOpenShortages={() => setCurrentView('market_shortages')} onOpenProfile={() => setCurrentView('profile')} onUpdateUser={(updates: any) => setCurrentUser((prev: any) => ({...prev, ...updates}))} />;
      case 'invoice': return <InvoiceBuilder onBack={() => setCurrentView('home')} />;
      case 'shortages': return <InventoryView onBack={() => setCurrentView('home')} allDrugs={allDrugs} shortageDrugIds={['1', '5']} userId={currentUser?.id ? String(currentUser.id) : 'guest'} />;
      case 'market_shortages': return <ShortagesView onBack={() => setCurrentView('settings')} />;
      case 'analytics': return <StockAnalytics onBack={() => setCurrentView('settings')} allDrugs={allDrugs} userId={currentUser?.id ? String(currentUser.id) : 'guest'} />;
      case 'community': return <CommunityView onBack={() => setCurrentView('home')} onUserClick={navigateToProfile} userId={currentUser?.id ? String(currentUser.id) : 'guest'} config={config} />;
      case 'profile': 
        const profileUser = selectedUserId 
          ? { id: selectedUserId } 
          : (currentUser || { id: 'guest', name: 'صيدلي', isVerified: true, level: 'gold', points: 1250, role: 'pharmacist' });
        return <UserProfileView 
          user={profileUser} 
          currentUserId={currentUser?.id ? String(currentUser.id) : 'guest'} 
          onBack={() => setCurrentView('community')} 
          onUpdateProfile={(profile: any) => {
            if (!selectedUserId || selectedUserId === String(currentUser?.id)) {
              setCurrentUser((prev: any) => ({ ...prev, ...profile }));
            }
          }}
        />;
      default: 
        // Mock Gamification Data for Header
        const gamification = {
          level: 'gold',
          points: 1250,
          isVerified: true
        };
        
        const getLevelColor = (level: string) => {
          switch(level) {
            case 'diamond': return 'from-cyan-400 to-blue-600';
            case 'gold': return 'from-yellow-400 to-amber-600';
            case 'silver': return 'from-slate-300 to-slate-500';
            case 'bronze': return 'from-orange-400 to-orange-600';
            default: return 'from-slate-400 to-slate-500';
          }
        };

        return (
        <div className="pt-14 px-4 max-w-lg mx-auto w-full pb-32">
          <header className="flex items-center justify-between mb-8 pt-4 px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[20px] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">PHARMA <span className="text-blue-600">CORE</span></h1>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Premium v4.0</p>
              </div>
            </div>
            
            {/* User Gamification Badge */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500">نقاطك</div>
                <div className="text-sm font-black text-blue-600 dark:text-blue-400 leading-none">{gamification.points}</div>
              </div>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getLevelColor(gamification.level)} p-[2px]`}>
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                  <Award size={14} className="text-slate-800 dark:text-slate-200" />
                </div>
              </div>
            </div>
          </header>

          <div className="relative mb-6 group px-2">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ابحث عن دواء، شركة، أو باركود..." 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)} 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] px-8 py-6 pr-16 text-slate-800 dark:text-slate-100 text-lg font-bold outline-none focus:ring-4 ring-blue-500/10 dark:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-right shadow-sm" 
            />
            {config.aiAnalysis && (
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                <Zap size={14} className="fill-indigo-600 dark:fill-indigo-400" />
                <span className="text-[10px] font-black tracking-wider uppercase">AI Search</span>
              </div>
            )}
          </div>

          <div className="mb-10">
            <TabFilter current={mode} onChange={setMode} />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 mb-2">
               <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <LayoutGrid size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">قائمة الأدوية</span>
               </div>
               <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
                  {filteredDrugs.length} صنف متاح
               </div>
            </div>

            <AnimatePresence mode="popLayout">
              {loading && allDrugs.length === 0 ? (
                <div key="loading-state" className="py-24 flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em]">مزامنة البيانات الحية</p>
                </div>
              ) : filteredDrugs.length === 0 ? (
                <MDiv key="no-results-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-24 text-center bg-slate-50 dark:bg-slate-900 rounded-[48px] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
                  <Package2 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-6" />
                  <h3 className="text-lg font-black text-slate-500 dark:text-slate-400 mb-2">لم نجد ما تبحث عنه</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mb-6">حاول البحث باستخدام اسم دقيق، أو قم بتحميل المزيد من الأدوية</p>
                  {isFetching ? (
                    <div className="w-8 h-8 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
                  ) : (
                    <button 
                      onClick={fetchNextBatch}
                      className="px-6 py-3 bg-blue-600 text-white font-black rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                      تحميل المزيد من السيرفر
                    </button>
                  )}
                </MDiv>
              ) : (
                <>
                  {filteredDrugs.map((drug, idx) => (
                    <DrugCard 
                      key={`${drug.drug_no}-${idx}`} 
                      drug={drug} 
                      index={idx} 
                      isFavorite={favorites.has(drug.drug_no)} 
                      onToggleFavorite={handleToggleFavorite} 
                      onOpenInfo={setSelectedDrug} 
                    />
                  ))}
                  {isFetching ? (
                    <div className="py-6 flex justify-center">
                      <div className="w-8 h-8 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="py-6 flex justify-center">
                      <button 
                        onClick={fetchNextBatch}
                        className="px-6 py-3 bg-blue-600 text-white font-black rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
                      >
                        تحميل المزيد
                      </button>
                    </div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      );
    }
  };

  if (isAccessDenied) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-24 h-24 rounded-[32px] bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-8">
          <Lock size={48} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">الدخول محظور</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 max-w-xs leading-relaxed">
          عذراً، هذا التطبيق مخصص للعمل حصرياً داخل منصة تليجرام. يرجى فتح التطبيق من خلال البوت الرسمي.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">لماذا يظهر هذا؟</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              نحن نستخدم نظام التحقق من الهوية الخاص بتليجرام لضمان أمان بياناتك وتوفير تجربة مخصصة لك.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-blue-500/20 dark:selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-300">
      <AnimatePresence>
        {promoId && (
          <PromoView promoId={promoId} onClose={() => setPromoId(null)} />
        )}
      </AnimatePresence>
      <MDiv key={currentView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
        {renderView()}
      </MDiv>
      <BottomNavigation 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        restrictedPages={currentUser?.device_info?.restricted_pages || []}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default App;
