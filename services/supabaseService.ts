
/**
 * تم إيقاف الاعتماد على Supabase بناءً على طلب المستخدم.
 * التطبيق يعمل الآن بنظام Live API Fetch من medhome مباشرة.
 */
export const fetchDrugsFromSupabase = async () => [];
export const getSupabaseTotalCount = async () => 0;
export const upsertDrugs = async () => {};
export const getAppSetting = async (key: string) => key === 'tawreed_visible'; // افتراضياً مفعل

/**
 * Fix for: Error in file components/AdminView.tsx on line 37: Expected 0 arguments, but got 2.
 */
export const updateAppSetting = async (key: string, value: any) => {
  console.log(`Setting update requested: ${key} = ${value}`);
};
