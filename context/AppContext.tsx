import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  User, Transaction, Item, SalaryViewRow, UserRole 
} from '../types';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  transactions: Transaction[];
  items: Item[];
  isLoading: boolean;
  login: (name: string, shortId: string) => Promise<boolean>;
  logout: () => void;
  // Admin Actions
  updateUserFull: (userId: string, updates: { 
    rank?: string; 
    familyRank?: string; 
    appearance?: string; 
    constitution?: string; 
    balance?: number; 
  }) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'balance'>) => Promise<void>;
  distributeSalaries: (remark: string) => Promise<void>;
  approveTransaction: (txId: number) => Promise<void>;
  rejectTransaction: (txId: number) => Promise<void>;
  grantItem: (userId: string, itemName: string, effectType: string, effectValue: number) => Promise<void>;
  grantSilver: (userId: string, amount: number, remark: string) => Promise<void>;
  // Member Actions
  requestExpense: (amount: number, reason: string) => Promise<void>;
  transferSilver: (recipientId: string, amount: number, reason: string) => Promise<{ success: boolean; message: string }>; // 新增：姐妹赠银
  useItem: (itemId: number | string) => Promise<void>;
  giftItem: (itemId: number, recipientName: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = users.find(u => u.id === currentUserId) || null;

  // --- 数据获取 ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: txData, error: txError } = await supabase
        .from('stipend_ledger')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (txError) throw txError;

      const mappedTx: Transaction[] = (txData || []).map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        amount: t.amount,
        type: t.type,
        status: t.status,
        reason: t.reason,
        createdAt: t.created_at
      }));
      setTransactions(mappedTx);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      const mappedUsers: User[] = (profilesData || []).map((u: any) => {
        const userTxs = mappedTx.filter(t => t.userId === u.id && t.status === 'approved');
        const credit = userTxs.filter(t => t.type === 'credit').reduce((acc, curr) => acc + curr.amount, 0);
        const debit = userTxs.filter(t => t.type === 'debit').reduce((acc, curr) => acc + curr.amount, 0);
        
        return {
          id: u.id,
          shortId: u.short_id,
          name: u.username,
          role: u.role as UserRole,
          rank: u.rank,
          familyRank: u.family_rank,
          appearance: u.appearance,
          constitution: u.constitution,
          balance: credit - debit
        };
      });
      setUsers(mappedUsers);

      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory')
        .select('*')
        .eq('is_used', false);
        
      if (itemsError) throw itemsError;

      const mappedItems: Item[] = (itemsData || []).map((i: any) => ({
        id: i.id,
        ownerId: i.owner_id,
        name: i.item_name,
        effectType: i.effect_type || 'none',
        effectValue: i.effect_value,
        isUsed: i.is_used,
        fromUser: i.from_user
      }));
      setItems(mappedItems);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const savedId = localStorage.getItem('harem_user_uuid');
    if (savedId) setCurrentUserId(savedId);
  }, []);

  // --- 鉴权 ---
  const login = async (name: string, shortId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', name)
      .eq('short_id', shortId)
      .single();

    if (data && !error) {
      setCurrentUserId(data.id);
      localStorage.setItem('harem_user_uuid', data.id);
      await fetchData();
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUserId(null);
    localStorage.removeItem('harem_user_uuid');
  };

  // --- 管理员操作 (Admin) ---

  const updateUserFull = async (userId: string, updates: any) => {
    try {
      setIsLoading(true);
      // 1. 更新 Profile 基础字段
      const pUpdates: any = {};
      if (updates.rank !== undefined) pUpdates.rank = updates.rank;
      if (updates.familyRank !== undefined) pUpdates.family_rank = updates.familyRank;
      if (updates.appearance !== undefined) pUpdates.appearance = updates.appearance;
      if (updates.constitution !== undefined) pUpdates.constitution = updates.constitution;

      if (Object.keys(pUpdates).length > 0) {
        await supabase.from('profiles').update(pUpdates).eq('id', userId);
      }

      // 2. 更新余额 (通过补差价写入账本)
      if (updates.balance !== undefined) {
        const user = users.find(u => u.id === userId);
        const diff = updates.balance - (user?.balance || 0);
        if (diff !== 0) {
          await supabase.from('stipend_ledger').insert([{
            user_id: userId,
            amount: Math.abs(diff),
            type: diff > 0 ? 'credit' : 'debit',
            reason: '内务府总管手动调账',
            status: 'approved'
          }]);
        }
      }
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  const addUser = async (user: Omit<User, 'id' | 'balance'>) => {
    const dbProfile = {
      username: user.name,
      short_id: user.shortId,
      role: user.role,
      rank: user.rank,
      family_rank: user.familyRank,
      appearance: user.appearance,
      constitution: user.constitution
    };
    const { error } = await supabase.from('profiles').insert([dbProfile]);
    if (!error) await fetchData();
    else alert('册封失败：' + error.message);
  };

  const distributeSalaries = async (remark: string) => {
    try {
      setIsLoading(true);
      const { data: salaryRows } = await supabase.from('concubine_salary_view').select('*');
      const ledgerEntries = (salaryRows as SalaryViewRow[]).map(row => ({
        user_id: row.id,
        amount: row.total_stipend,
        type: 'credit',
        reason: remark,
        status: 'approved'
      }));
      await supabase.from('stipend_ledger').insert(ledgerEntries);
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  const grantSilver = async (userId: string, amount: number, remark: string) => {
    try {
      setIsLoading(true);
      await supabase.from('stipend_ledger').insert([{
        user_id: userId,
        amount: amount,
        type: 'credit',
        reason: remark,
        status: 'approved'
      }]);
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  const approveTransaction = async (txId: number) => {
    await supabase.from('stipend_ledger').update({ status: 'approved' }).eq('id', txId);
    await fetchData();
  };

  const rejectTransaction = async (txId: number) => {
    await supabase.from('stipend_ledger').update({ status: 'rejected' }).eq('id', txId);
    await fetchData();
  };

  const grantItem = async (userId: string, itemName: string, effectType: string, effectValue: number) => {
    await supabase.from('inventory').insert([{
      owner_id: userId,
      item_name: itemName,
      effect_type: effectType,
      effect_value: effectValue,
      is_used: false,
      from_user: currentUser?.name || '内务府'
    }]);
    await fetchData();
  };

  // --- 成员操作 (Member) ---

  const requestExpense = async (amount: number, reason: string) => {
    if (!currentUser) return;
    await supabase.from('stipend_ledger').insert([{
      user_id: currentUser.id,
      amount: amount,
      type: 'debit',
      reason: reason,
      status: 'pending'
    }]);
    await fetchData();
  };

  // 新增：姐妹赠银逻辑
  const transferSilver = async (recipientId: string, amount: number, reason: string) => {
    if (!currentUser) return { success: false, message: '身份未验。' };
    if (currentUser.balance < amount) return { success: false, message: '余额不足，无法赠予。' };
    
    try {
      setIsLoading(true);
      const targetUser = users.find(u => u.id === recipientId);
      
      const { error } = await supabase.from('stipend_ledger').insert([
        {
          user_id: currentUser.id,
          amount: amount,
          type: 'debit',
          reason: `赠予姐妹 ${targetUser?.name}：${reason}`,
          status: 'approved'
        },
        {
          user_id: recipientId,
          amount: amount,
          type: 'credit',
          reason: `收到来自 ${currentUser.name} 的赏银：${reason}`,
          status: 'approved'
        }
      ]);

      if (error) throw error;
      await fetchData();
      return { success: true, message: '赠礼已送出。' };
    } catch (err) {
      return { success: false, message: '内务府忙碌，赠送失败。' };
    } finally {
      setIsLoading(false);
    }
  };

  const useItem = async (itemId: number | string) => {
    if (!currentUser || isLoading) return;
    const item = items.find(i => String(i.id) === String(itemId));
    if (!item) return;
  
    const commonSequence = ['十等', '九等', '八等', '七等', '六等', '五等', '四等', '三等', '二等', '一等', '特等'];
    const familySequence = ['从九品', '正九品', '从八品', '正八品', '从七品', '正七品', '从六品', '正六品', '从五品', '正五品', '从四品', '正四品', '从三品', '正三品', '从二品', '正二品', '从一品', '正一品', '国公/公侯'];
  
    try {
      setIsLoading(true);
      // 原子化更新 inventory 状态
      const { data, error: itemError } = await supabase.from('inventory').update({ is_used: true }).eq('id', item.id).eq('is_used', false).select();
      if (itemError || !data || data.length === 0) return;

      if (item.effectType && item.effectType !== 'none') {
        const fieldMapping: any = { 'appearance': 'appearance', 'constitution': 'constitution', 'family_rank': 'family_rank' };
        const dbField = fieldMapping[item.effectType];

        if (dbField) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
          if (profile) {
            const currentVal = profile[dbField]?.trim();
            let seq = dbField === 'family_rank' ? familySequence : commonSequence;
            let start = dbField === 'family_rank' ? '从九品' : '十等';
            const idx = seq.indexOf(currentVal || start);

            if (idx !== -1 && idx < seq.length - 1) {
              const newVal = seq[idx + 1];
              await supabase.from('profiles').update({ [dbField]: newVal }).eq('id', currentUser.id);
              alert(`✨ 功效显著！您的${item.effectType}已提升至【${newVal}】。`);
            }
          }
        }
      }
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  const giftItem = async (itemId: number, recipientName: string) => {
    if (!currentUser) return { success: false, message: '未登录' };
    const { data: target } = await supabase.from('profiles').select('id').eq('username', recipientName).single();
    if (!target) return { success: false, message: '查无此人' };

    await supabase.from('inventory').update({ owner_id: target.id, from_user: currentUser.name }).eq('id', itemId);
    await fetchData();
    return { success: true, message: `已赠予 ${recipientName}` };
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, transactions, items, isLoading, login, logout,
      updateUserFull, addUser, distributeSalaries, approveTransaction, rejectTransaction,
      grantItem, grantSilver, requestExpense, transferSilver, useItem, giftItem
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
