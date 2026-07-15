
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package2, ShieldCheck, Zap, LayoutGrid, Info, Award, Lock, ExternalLink, Bell, X, CheckCircle2, Clock, Sparkles, TrendingUp, ChevronLeft } from 'lucide-react';
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
import { CoachMark } from './components/CoachMark.tsx';
import { PopUpPreview } from './components/PopUpPreview.tsx';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getGlobalConfig, syncTelegramUser, logSession, getUserProfile, checkUserBan, supabase, getRecentlyChangedDrugs, getBroadcasts } from './services/supabase.ts';
import { ADMIN_ID } from './constants.ts';
import { hasAccess } from './lib/accessControl.ts';

const App: React.FC = () => {
  const MDiv = motion.div as any;
  const [config, setConfig] = useState<AdminConfig>({
    marketCheck: true, 
    maintenanceMode: false,
    maintenanceMessage: "", 
    maintenanceTime: "", 
    liveSync: true,
    strictMode: true
  });
  const [allDrugs, setAllDrugs] = useState<Drug[]>([]);
  const [changedDrugs, setChangedDrugs] = useState<Drug[]>([]);
  const [showCoachMark, setShowCoachMark] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    // Check if user is first time
    const isFirstTime = !localStorage.getItem('coachMarkShown');
    if (isFirstTime) {
      setTimeout(() => setShowCoachMark(true), 1500); 
    }
  }, []);

  useEffect(() => {
    if (config.announcement?.isVisible && !localStorage.getItem(`announcementShown-${config.announcement.title}`)) {
      setTimeout(() => setShowAnnouncement(true), 2500);
    }
  }, [config.announcement]);

  const handleCloseCoachMark = () => {
    setShowCoachMark(false);
    localStorage.setItem('coachMarkShown', 'true');
  };

  const handleCloseAnnouncement = () => {
    setShowAnnouncement(false);
    if (config.announcement?.title) {
        localStorage.setItem(`announcementShown-${config.announcement.title}`, 'true');
    }
  };
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
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isTelegram, setIsTelegram] = useState(false);
  
  useEffect(() => {
    // Load notifications
    getBroadcasts(currentUser?.id ? String(currentUser.id) : undefined).then(notifs => {
      setNotifications(notifs);
      const lastRead = localStorage.getItem('lastReadNotification');
      const unread = notifs.filter(n => !lastRead || new Date(n.timestamp) > new Date(lastRead)).length;
      setUnreadCount(unread);
    });
  }, [currentUser?.id]);

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setUnreadCount(0);
    if (notifications.length > 0) {
      localStorage.setItem('lastReadNotification', notifications[0].timestamp);
    }
  };
  
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
  

  useEffect(() => {
    const bootstrap = async () => {
      const timer = setTimeout(() => setInitialLoading(false), 500);
      try {
        const tg = (window as any).Telegram?.WebApp;
        const isDev = window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost');
        const hasTgData = !!tg?.initData;
        const params = new URLSearchParams(window.location.search);
        const hasPromo = !!params.get('promo');
        
        setIsTelegram(hasTgData);

        if (!isDev && !hasTgData && !hasPromo) {
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

        const [configRes, drugsRes, changedRes] = await Promise.allSettled([
          getGlobalConfig(),
          fetchDrugBatchFromAPI(0),
          getRecentlyChangedDrugs(20)
        ]);

        if (configRes.status === 'fulfilled' && configRes.value) setConfig({...config, ...configRes.value});
        if (drugsRes.status === 'fulfilled' && drugsRes.value) {
          setAllDrugs(drugsRes.value);
        }
        if (changedRes.status === 'fulfilled' && changedRes.value) {
          setChangedDrugs(changedRes.value);
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
    if (mode === 'changed') {
       filtered = filtered.filter(d => d.price_new !== d.price_old);
    } else if (mode === 'all' && !search && changedDrugs.length > 0) {
       // Merge changed drugs at the top if no search query
       const changedNos = new Set(changedDrugs.map(d => d.drug_no));
       const rest = allDrugs.filter(d => !changedNos.has(d.drug_no));
       filtered = [...changedDrugs, ...rest];
    }
    
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

    const hasUnlimited = hasAccess(currentUser, 'UNLIMITED_DRUGS');
    const dbLimit = currentUser?.device_info?.items_limit;
    
    if (!hasUnlimited) {
      // Free users get a default limit of 50, unless explicitly set higher in DB
      const limit = (dbLimit && !isNaN(Number(dbLimit))) ? Number(dbLimit) : 50;
      return result.slice(0, limit);
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
      case 'admin': return <AdminView 
        onBack={() => setCurrentView('home')} 
        drugsCount={allDrugs.length} 
        config={config} 
        onUpdateConfig={c => setConfig({...config, ...c})} 
        currentUser={currentUser} 
        onViewPost={(postId) => {
          setHighlightPostId(postId);
          setCurrentView('community');
        }}
      />;
      case 'settings': return <SettingsView user={currentUser} darkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} onClearFavorites={() => {}} onBack={() => setCurrentView('home')} isAdmin={isAdmin} onOpenAdmin={() => setCurrentView('admin')} onOpenInvoice={() => setCurrentView('invoice')} onOpenAnalytics={() => setCurrentView('analytics')} onOpenShortages={() => setCurrentView('market_shortages')} onOpenInventory={() => setCurrentView('shortages')} onOpenProfile={() => setCurrentView('profile')} onUpdateUser={(updates: any) => setCurrentUser((prev: any) => ({...prev, ...updates}))} />;
      case 'invoice': return <InvoiceBuilder onBack={() => setCurrentView('home')} />;
      case 'shortages': return <InventoryView onBack={() => setCurrentView('settings')} allDrugs={allDrugs} shortageDrugIds={['1', '5']} userId={currentUser?.id ? String(currentUser.id) : 'guest'} />;
      case 'market_shortages': return <ShortagesView onBack={() => setCurrentView('settings')} user={currentUser} />;
      case 'analytics': return <StockAnalytics onBack={() => setCurrentView('settings')} allDrugs={allDrugs} userId={currentUser?.id ? String(currentUser.id) : 'guest'} user={currentUser} />;
      case 'community': return <CommunityView 
        onBack={() => setCurrentView('home')} 
        onUserClick={navigateToProfile} 
        userId={currentUser?.id ? String(currentUser.id) : 'guest'} 
        user={currentUser}
        config={config} 
        highlightPostId={highlightPostId}
        onClearHighlight={() => setHighlightPostId(null)}
      />;
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
        <div className="pt-2 px-4 max-w-lg mx-auto w-full pb-32">
          <header className="sticky top-0 z-50 -mx-4 px-6 py-4 mb-8 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-3.5">
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">
                  <ShieldCheck size={22} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  PHARMA <span className="bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">CORE</span>
                </h1>
                <div className="flex items-center gap-2">
                  {currentUser?.premiumTier && currentUser.premiumTier !== 'free' && (
                    <div className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={8} fill="currentColor" />
                      Premium
                    </div>
                  )}
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none">v4.0.2</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              {/* Notifications Bell */}
              <button 
                onClick={handleOpenNotifications}
                className="group relative w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all shadow-sm active:scale-90"
              >
                <Bell size={18} className="group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[7px] font-black text-white">
                      {unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {/* User Gamification Badge */}
              <button 
                onClick={() => setCurrentView('profile')}
                className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm active:scale-95 transition-all hover:border-blue-200 dark:hover:border-blue-900/50"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">النقاط</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white leading-none">{gamification.points}</div>
                </div>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getLevelColor(gamification.level)} p-[1.5px] shadow-sm`}>
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                    <Award size={14} className="text-slate-800 dark:text-slate-200" />
                  </div>
                </div>
              </button>
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
          </div>

          <div className="mb-10">
            <TabFilter current={mode} onChange={setMode} />
          </div>

          {/* Recently Changed Horizontal Scroll Section */}
          {!search && mode === 'all' && changedDrugs.length > 0 && (
            <div className="mb-10 overflow-hidden">
              <div className="flex items-center justify-between px-2 mb-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Zap size={16} fill="currentColor" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">آخر التحديثات</span>
                </div>
                <button 
                  onClick={() => setMode('changed')}
                  className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline"
                >
                  عرض الكل
                </button>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4 px-2 -mx-2 snap-x">
                {changedDrugs.map((drug, idx) => (
                  <div key={`h-scroll-${drug.drug_no}`} className="snap-start min-w-[280px]">
                    <DrugCard 
                      drug={drug} 
                      index={idx} 
                      isFavorite={favorites.has(drug.drug_no)} 
                      onToggleFavorite={handleToggleFavorite} 
                      onOpenInfo={setSelectedDrug} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 mb-2">
               <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <LayoutGrid size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{mode === 'all' && !search ? 'بقية الأصناف' : 'قائمة الأدوية'}</span>
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
                  {filteredDrugs.map((drug, idx) => {
                    const isRecentlyChanged = mode === 'all' && !search && changedDrugs.some(cd => cd.drug_no === drug.drug_no);
                    
                    // Skip if already shown in the horizontal scroll above
                    if (isRecentlyChanged) return null;

                    return (
                      <DrugCard 
                        key={`${drug.drug_no}-${idx}`}
                        drug={drug} 
                        index={idx} 
                        isFavorite={favorites.has(drug.drug_no)} 
                        onToggleFavorite={handleToggleFavorite} 
                        onOpenInfo={setSelectedDrug} 
                      />
                    );
                  })}
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
        <AnimatePresence>
          {promoId && (
            <PromoView promoId={promoId} onClose={() => setPromoId(null)} isTelegram={isTelegram} />
          )}
        </AnimatePresence>
        
        {!promoId && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-8 mx-auto shadow-xl shadow-blue-500/20">
              <ShieldCheck size={40} strokeWidth={2.5} />
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">PHARMA <span className="text-blue-600">CORE</span></h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 leading-relaxed">
              منصتك المتكاملة لمتابعة أحدث تحديثات أسعار الأدوية، وحالة النواقص في السوق المصري بشكل لحظي ودقيق.
            </p>

            <div className="grid grid-cols-1 gap-4 text-right mb-10">
              {[
                { icon: Zap, title: 'تحديثات أسعار لحظية', desc: 'كن أول من يعرف بتغييرات أسعار الأدوية.' },
                { icon: Package2, title: 'متابعة النواقص', desc: 'ابحث عن الأدوية المتوفرة في السوق.' },
                { icon: LayoutGrid, title: 'تحليلات ذكية', desc: 'تقارير وتحليلات لمساعدتك في اتخاذ القرار.' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a 
              href="https://t.me/PHARMA_CORE_BOT" // استبدلها برابط البوت الفعلي
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              افتح التطبيق عبر تليجرام <ExternalLink size={16} />
            </a>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-blue-500/20 dark:selection:bg-blue-500/30 transition-colors duration-300">
      <CoachMark isVisible={showCoachMark} onClose={handleCloseCoachMark} targetId="nav-community" />
      {showAnnouncement && config.announcement && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
             onClick={handleCloseAnnouncement}>
           <div className="w-full max-w-sm rounded-[32px] overflow-hidden" onClick={e => e.stopPropagation()}>
               <PopUpPreview theme={config.announcement.theme} title={config.announcement.title} message={config.announcement.message} onClose={handleCloseAnnouncement} />
           </div>
        </div>
      )}
      <AnimatePresence>
        {promoId && (
          <PromoView promoId={promoId} onClose={() => setPromoId(null)} isTelegram={isTelegram} />
        )}
      </AnimatePresence>
      {!promoId && (
        <MDiv key={currentView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
          {renderView()}
        </MDiv>
      )}
      {!promoId && (
        <BottomNavigation 
          currentView={currentView} 
          onNavigate={handleNavigate} 
          restrictedPages={currentUser?.device_info?.restricted_pages || []}
          isAdmin={isAdmin}
        />
      )}

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" dir="rtl">
            <MDiv 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <MDiv 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">الإشعارات</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">آخر التنبيهات من النظام</p>
                </div>
                <button onClick={() => setShowNotifications(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <X size={20} />
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto p-4 no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200">
                      <Bell size={32} />
                    </div>
                    <p className="text-sm font-bold text-slate-400">لا توجد إشعارات جديدة حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(notif => {
                      const isPriceAlert = notif.type === 'price_alert';
                      return (
                        <div key={notif.id} className={`p-6 rounded-[28px] border transition-all group ${isPriceAlert ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40 ring-4 ring-amber-500/5' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform ${isPriceAlert ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
                              {isPriceAlert ? <TrendingUp size={18} /> : <Bell size={18} />}
                            </div>
                            <div className="flex-1">
                              <h4 className={`text-sm font-black leading-none ${isPriceAlert ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                {isPriceAlert ? 'تنبيه تغيير سعر' : notif.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Clock size={10} className="text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-400">{formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: ar })}</span>
                              </div>
                            </div>
                            {isPriceAlert && (
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            )}
                          </div>
                          
                          {isPriceAlert ? (
                            <div className="pr-13">
                              <p className="text-[13px] font-bold text-amber-800 dark:text-amber-300 leading-relaxed mb-2">
                                تغير سعر <span className="underline decoration-amber-500/30 underline-offset-4">{notif.name_ar || notif.name_en}</span> في مخزونك.
                              </p>
                              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl border border-amber-200/50 dark:border-amber-900/30 w-fit">
                                <span className="text-[10px] font-black text-slate-400 line-through">{notif.oldPrice} ج</span>
                                <ChevronLeft size={12} className="text-amber-500" />
                                <span className="text-sm font-black text-amber-600 dark:text-amber-400">{notif.newPrice} ج</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed pr-13">{notif.message}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800">
                 <button 
                  onClick={() => setShowNotifications(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg"
                 >
                   تم العرض
                 </button>
              </div>
            </MDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
