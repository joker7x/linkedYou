
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Info, AlertTriangle, CheckCircle, Zap, Trash2 } from 'lucide-react';
import { AppNotification } from '../types.ts';

interface NotificationsModalProps {
  notifications: AppNotification[];
  onClose: () => void;
  onClear: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ notifications, onClose, onClear }) => {
  // Use any to bypass TypeScript errors for motion props
  const MDiv = motion.div as any;
  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'success': return <CheckCircle size={18} className="text-emerald-500" />;
      case 'update': return <Zap size={18} className="text-blue-500" />;
      default: return <Info size={18} className="text-slate-400" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20, scale: 0.95 },
    show: { opacity: 1, x: 0, scale: 1 }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md p-6" dir="rtl">
      <MDiv 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[80vh] overflow-hidden"
      >
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white">التنبيهات</h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Notification Center</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {notifications.length > 0 ? (
            <MDiv 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {notifications.map((notif) => (
                <MDiv 
                  key={notif.id}
                  variants={itemVariants}
                  className="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getIcon(notif.type)}</div>
                    <div className="flex-1">
                      <h4 className="text-[15px] font-black text-slate-800 dark:text-white mb-1">{notif.title}</h4>
                      <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                      <div className="mt-3 text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase">
                        {new Date(notif.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </MDiv>
              ))}
            </MDiv>
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 dark:text-slate-700">
                <Bell size={32} />
              </div>
              <p className="font-bold text-slate-400 dark:text-zinc-600">لا توجد تنبيهات جديدة</p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-6 pt-2">
            <button 
              onClick={onClear}
              className="w-full py-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Trash2 size={18} /> مسح كافة التنبيهات
            </button>
          </div>
        )}
      </MDiv>
    </div>
  );
};
