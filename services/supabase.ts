
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, MAIN_TABLE, BOT_USERNAME } from '../constants.ts';
import { Drug, PromoLink, PromoVisit } from '../types.ts';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const createPromoLink = async (link: Omit<PromoLink, 'id' | 'created_at'>) => {
  const id = Math.random().toString(36).substring(2, 10);
  const { data, error } = await supabase.from('promo_links').insert({
    id,
    ...link,
    created_at: new Date().toISOString()
  }).select().single();
  return { data, error };
};

export const getPromoLink = async (id: string) => {
  const { data, error } = await supabase.from('promo_links').select('*').eq('id', id).single();
  return { data, error };
};

export const logPromoVisit = async (visit: Omit<PromoVisit, 'id' | 'timestamp'>) => {
  const { error } = await supabase.from('promo_tracking').insert({
    ...visit,
    timestamp: new Date().toISOString()
  });
  return !error;
};

export const getPromoStats = async () => {
  const { data: links, error: linksError } = await supabase.from('promo_links').select('*');
  const { data: visits, error: visitsError } = await supabase.from('promo_tracking').select('*');
  return { links: links || [], visits: visits || [], error: linksError || visitsError };
};

export const deletePromoLink = async (id: string) => {
  // First delete tracking data to avoid foreign key constraints
  await supabase.from('promo_tracking').delete().eq('link_id', id);
  const { error } = await supabase.from('promo_links').delete().eq('id', id);
  return !error;
};

export const logSession = async (userId: string, duration: number, deviceType: string) => {
  const { error } = await supabase.from('user_sessions').insert({
    user_id: userId,
    duration_seconds: duration,
    device_type: deviceType,
    created_at: new Date().toISOString()
  });
  return !error;
};

export const reportUser = async (targetUserId: string, reportedBy: string, reason: string) => {
  const { error } = await supabase.from('moderation_logs').insert({
    user_id: targetUserId,
    reported_by: reportedBy,
    reason,
    action_taken: 'report'
  });
  return !error;
};

export const banUser = async (targetUserId: string, adminId: string, reason: string) => {
  const { error } = await supabase.from('moderation_logs').insert({
    user_id: targetUserId,
    reported_by: adminId,
    reason,
    action_taken: 'ban'
  });
  return !error;
};

export const logActivity = async (userId: string, type: string, points: number = 0, targetId?: string) => {
  const { error } = await supabase.from('user_activities').insert({
    user_id: userId,
    activity_type: type,
    points_earned: points,
    target_id: targetId
  });
  return !error;
};

export const searchDrugs = async (query: string): Promise<Drug[]> => {
  try {
    const terms = query.trim().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) return [];

    let queryBuilder = supabase.from(MAIN_TABLE).select('*');
    
    terms.forEach(t => {
      const normalizedTerm = t
        .replace(/[أإآا]/g, '_')
        .replace(/[ىي]/g, '_')
        .replace(/[ةه]/g, '_');
      
      queryBuilder = queryBuilder.or(`name_en.ilike.%${normalizedTerm}%,name_ar.ilike.%${normalizedTerm}%`);
    });

    const { data, error } = await queryBuilder.limit(20);
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
};

export const lookupByBarcode = async (barcode: string): Promise<Drug | null> => {
  const { data, error } = await supabase
    .from(MAIN_TABLE)
    .select('*')
    .eq('drug_no', barcode)
    .single();
  
  if (error) return null;
  return data;
};

export const saveInvoice = async (invoiceData: any): Promise<string | null> => {
  const id = `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const { data, error } = await supabase
    .from('app_invoices')
    .insert({
      id,
      content: invoiceData,
      created_at: new Date().toISOString()
    })
    .select();
    
  if (error) return null;
  return data ? data[0]?.id : id;
};

export const createSecureShareLink = async (invoiceId: string): Promise<string | null> => {
  const token = Math.random().toString(36).substring(2, 20);
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

  const { error } = await supabase
    .from('invoice_shares')
    .insert({
      invoice_id: invoiceId,
      token: token,
      expires_at: expiresAt,
      is_used: false
    });

  if (error) return null;
  return `https://t.me/${BOT_USERNAME}?start=inv_${invoiceId}_${token}`;
};

export const validateShareToken = async (invoiceId: string, token: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('invoice_shares')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('token', token);
    
  if (error || !data || data.length === 0) return false;
  
  const share = data[0];
  return new Date(share.expires_at) > new Date();
};

export const getInvoice = async (id: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from('app_invoices')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  return data;
};

export const getGlobalConfig = async (): Promise<any> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'global_config');
    
  if (error || !data || data.length === 0) return null;
  return data[0].value;
};

export const updateGlobalConfig = async (config: any): Promise<void> => {
  const { data } = await supabase
    .from('app_settings')
    .select('key')
    .eq('key', 'global_config')
    .maybeSingle();
    
  if (data) {
    await supabase
      .from('app_settings')
      .update({ value: config })
      .eq('key', 'global_config');
  } else {
    await supabase
      .from('app_settings')
      .insert({ key: 'global_config', value: config });
  }
};

const mergeAdminSettings = async (user: any) => {
  if (!user) return null;
  const settingsKey = `user_settings_${user.id}`;
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', settingsKey)
    .maybeSingle();

  if (setting && setting.value) {
    return {
      ...user,
      is_admin: setting.value.is_admin ?? user.is_admin,
      device_info: {
        ...user.device_info,
        ...setting.value
      }
    };
  }
  return user;
};

export const syncTelegramUser = async (user: any): Promise<any> => {
  if (!user?.id) return null;
  
  const { data: existingUser } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const userData = {
    id: user.id,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    username: user.username || "",
    last_seen: new Date().toISOString()
  };

  let finalUser;
  if (existingUser) {
    await supabase.from('app_users').update(userData).eq('id', user.id);
    finalUser = { ...existingUser, ...userData };
  } else {
    const { data, error } = await supabase.from('app_users').insert({ ...userData, device_info: { items_limit: 100 } }).select();
    finalUser = error ? null : data[0];
  }

  return await mergeAdminSettings(finalUser);
};

export const getAllUsers = async (): Promise<any[]> => {
  const { data: users, error } = await supabase
    .from('app_users')
    .select('*')
    .order('last_seen', { ascending: false });
    
  if (error || !users) return [];

  const { data: allSettings } = await supabase
    .from('app_settings')
    .select('*')
    .like('key', 'user_settings_%');

  return users.map(user => {
    const setting = allSettings?.find(s => s.key === `user_settings_${user.id}`);
    if (setting && setting.value) {
      return {
        ...user,
        is_admin: setting.value.is_admin ?? user.is_admin,
        device_info: {
          ...user.device_info,
          ...setting.value
        }
      };
    }
    return user;
  });
};

export const updateUserPermissions = async (userId: number, updates: any): Promise<void> => {
  try {
    // 1. Fetch current user
    const { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (fetchError || !user) return;
    
    // 2. Merge updates into device_info
    const deviceInfo = { ...(user.device_info || {}), ...updates };
    const body: any = { device_info: deviceInfo };
    
    // Top-level fields
    if ('is_admin' in updates) body.is_admin = updates.is_admin;
    if ('is_premium' in updates) body.is_premium = updates.is_premium;
    
    // 3. Save to app_users (Primary Source)
    await supabase.from('app_users').update(body).eq('id', userId);

    // 4. Save to app_settings (Backup)
    const settingsKey = `user_settings_${userId}`;
    await supabase.from('app_settings').upsert({ 
      key: settingsKey, 
      value: { ...deviceInfo, is_admin: body.is_admin ?? user.is_admin, updated_at: new Date().toISOString() } 
    }, { onConflict: 'key' });

  } catch (err) {
    console.error("Error in updateUserPermissions:", err);
  }
};

export const checkUserBan = (user: any): { isBanned: boolean; reason?: string; until?: string } => {
  if (!user?.device_info) return { isBanned: false };
  const { ban_status, ban_until } = user.device_info;
  
  if (ban_status === 'permanent') return { isBanned: true, reason: 'حظر كلي ودائم' };
  if (ban_status === 'temporary' && ban_until) {
    const untilDate = new Date(ban_until);
    if (untilDate > new Date()) {
      return { isBanned: true, reason: 'حظر مؤقت', until: untilDate.toLocaleString('ar-EG') };
    }
  }
  
  return { isBanned: false };
};

export const getDrugsByIds = async (ids: number[]): Promise<Drug[]> => {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from(MAIN_TABLE).select('*').in('id', ids);
  return error ? [] : data;
};

export const searchDrugsSupabase = async (query: string): Promise<any[]> => {
  try {
    const terms = query.trim().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) return [];

    let queryBuilder = supabase.from(MAIN_TABLE).select('*');
    
    terms.forEach(t => {
      const normalizedTerm = t
        .replace(/[أإآا]/g, '_')
        .replace(/[ىي]/g, '_')
        .replace(/[ةه]/g, '_');
      
      queryBuilder = queryBuilder.or(`name_en.ilike.%${normalizedTerm}%,name_ar.ilike.%${normalizedTerm}%`);
    });

    const { data, error } = await queryBuilder.limit(10);
    return error ? [] : data;
  } catch (e) { return []; }
};

export const getStock = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('pharmacy_stock')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error("Error fetching stock:", error);
    return [];
  }
  return data || [];
};

export const deleteStockItem = async (id: number, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('pharmacy_stock')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
};

export const addStockItem = async (item: any, userId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('pharmacy_stock')
    .insert({ ...item, user_id: userId })
    .select();
  return error ? null : (Array.isArray(data) ? data[0] : data);
};

export const getPosts = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .not('content', 'ilike', '__COMMENT__%')
    .not('content', 'ilike', '__LIKE__%')
    .not('content', 'ilike', '__PROFILE__%')
    .not('content', 'ilike', '__TRUST__%')
    .not('content', 'ilike', '__ADMIN_TRUST__%')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
  return data || [];
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const addPost = async (post: any, userId: string): Promise<any> => {
  const id = generateUUID();
  const created_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('posts')
    .insert({ 
      id,
      ...post, 
      user_id: userId,
      created_at
    })
    .select();
  
  if (error) {
    console.error("Error adding post:", error);
    return null;
  }
  return data ? (Array.isArray(data) ? data[0] : data) : { id, ...post, user_id: userId, created_at };
};

export const adminDeletePost = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);
  return !error;
};

export const adminDeleteComment = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);
  return !error;
};

export const getAllPostsAdmin = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  return error ? [] : data;
};

export const deletePost = async (id: string, userId: string | number): Promise<boolean> => {
  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('user_id', String(userId))
    .select();
  return !error && data && data.length > 0;
};

export const deleteComment = async (id: string, userId: string | number): Promise<boolean> => {
  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('user_id', String(userId))
    .select();
  return !error && data && data.length > 0;
};

export const addComment = async (postId: string, content: string, userId: string | number, parentId?: string): Promise<any> => {
  const id = generateUUID();
  const created_at = new Date().toISOString();
  // Format: __COMMENT__postId__parentId__reactionsJson__content
  const reactions = JSON.stringify({});
  const prefixedContent = `__COMMENT__${postId}__${parentId || 'root'}__${reactions}__${content}`;
  
  const { error } = await supabase
    .from('posts')
    .insert({
      id,
      user_id: String(userId),
      content: prefixedContent,
      created_at
    });
  
  if (error) {
    console.error("Error adding comment to posts table:", error);
    return null;
  }
  
  return { 
    id, 
    post_id: postId, 
    parent_id: parentId,
    user_id: String(userId), 
    content: content, 
    reactions: {},
    created_at 
  };
};

export const getComments = async (postId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .ilike('content', `__COMMENT__${postId}__%`)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error("Error fetching comments from posts table:", error);
    return [];
  }
  
  return (data || []).map(item => {
    const prefix = `__COMMENT__${postId}__`;
    const contentWithParentAndReactions = item.content.replace(prefix, '');
    
    // Split: parentId__reactionsJson__content
    const parts = contentWithParentAndReactions.split('__');
    let parentId = parts[0];
    let reactions = {};
    let content = "";

    try {
      if (parentId.startsWith('{') && parentId.endsWith('}')) {
        // Handle corrupted data where parentId was overwritten by reactions
        reactions = JSON.parse(parentId);
        parentId = 'root';
        if (parts.length >= 2 && parts[1] === '{}') {
          content = parts.slice(2).join('__');
        } else {
          content = parts.slice(1).join('__');
        }
      } else if (parts.length >= 3) {
        reactions = JSON.parse(parts[1]);
        content = parts.slice(2).join('__');
      } else {
        // Fallback for old format: parentId__content
        content = parts.slice(1).join('__');
      }
    } catch (e) {
      // If JSON.parse fails, assume it's an old format or invalid data
      reactions = {};
      content = parts.slice(1).join('__');
    }
    
    return {
      id: item.id,
      post_id: postId,
      parent_id: parentId === 'root' ? undefined : parentId,
      user_id: item.user_id,
      content: content,
      reactions: reactions,
      created_at: item.created_at
    };
  });
};

export const updateCommentReactions = async (commentId: string, reactions: Record<string, number>): Promise<boolean> => {
  // Fetch current post to get full content
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('content')
    .eq('id', commentId)
    .single();

  if (fetchError || !post) return false;

  const contentParts = post.content.split('__');
  
  // Format is: "" + "COMMENT" + postId + parentId + reactionsJson + content
  // So contentParts[0] = ""
  // contentParts[1] = "COMMENT"
  // contentParts[2] = postId
  // contentParts[3] = parentId
  // contentParts[4] = reactionsJson
  // contentParts[5...] = content
  
  if (contentParts.length >= 5) {
    contentParts[4] = JSON.stringify(reactions);
  } else {
    return false; // Invalid format
  }
  
  const newContent = contentParts.join('__');

  const { error } = await supabase
    .from('posts')
    .update({ content: newContent })
    .eq('id', commentId);
    
  return !error;
};

export const addLike = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const id = generateUUID();
    const created_at = new Date().toISOString();
    const { error } = await supabase
      .from('posts')
      .insert({ 
        id,
        user_id: userId,
        content: `__LIKE__${postId}`,
        created_at
      });
    
    if (error) {
      console.error("addLike error details:", JSON.stringify(error));
      return false;
    }
    return true;
  } catch (e) {
    console.error("addLike exception:", e);
    return false;
  }
};

export const removeLike = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('user_id', userId)
      .eq('content', `__LIKE__${postId}`);
    
    if (error) {
      console.error("removeLike error details:", JSON.stringify(error));
      return false;
    }
    return true;
  } catch (e) {
    console.error("removeLike exception:", e);
    return false;
  }
};

export const getLikesCount = async (postId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('content', `__LIKE__${postId}`);
  return error ? 0 : count || 0;
};

export const getCommentsCount = async (postId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .ilike('content', `__COMMENT__${postId}__%`);
  return error ? 0 : count || 0;
};

export const getIsLiked = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId)
      .eq('content', `__LIKE__${postId}`)
      .maybeSingle();
    return !!data && !error;
  } catch (e) {
    return false;
  }
};

export const getUserProfile = async (userId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('posts')
    .select('content')
    .eq('user_id', userId)
    .ilike('content', '__PROFILE__%')
    .maybeSingle();
    
  if (error || !data) return null;
  try {
    return JSON.parse(data.content.replace('__PROFILE__', ''));
  } catch (e) {
    return null;
  }
};

export const getUserProfiles = async (userIds: string[]): Promise<Record<string, any>> => {
  if (!userIds || userIds.length === 0) return {};
  
  // Remove duplicates
  const uniqueIds = [...new Set(userIds)];
  
  const { data, error } = await supabase
    .from('posts')
    .select('user_id, content')
    .in('user_id', uniqueIds)
    .ilike('content', '__PROFILE__%');
    
  if (error || !data) return {};
  
  const profiles: Record<string, any> = {};
  data.forEach(item => {
    try {
      profiles[item.user_id] = JSON.parse(item.content.replace('__PROFILE__', ''));
    } catch (e) {
      // ignore
    }
  });
  return profiles;
};

export const updateUserProfile = async (userId: string, profile: any): Promise<boolean> => {
  const content = `__PROFILE__${JSON.stringify(profile)}`;
  
  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('user_id', userId)
    .ilike('content', '__PROFILE__%')
    .maybeSingle();
    
  if (existing) {
    const { error } = await supabase
      .from('posts')
      .update({ content })
      .eq('id', existing.id);
    return !error;
  } else {
    const id = generateUUID();
    const { error } = await supabase
      .from('posts')
      .insert({
        id,
        user_id: userId,
        content,
        created_at: new Date().toISOString()
      });
    return !error;
  }
};

// --- Trust System Removed ---
