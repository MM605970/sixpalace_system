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
  updateUser: (user: Partial<User> & { id: string }) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'balance'>) => Promise<void>;
  distributeSalaries: () => Promise<void>;
  approveTransaction: (txId: number) => Promise<void>;
  rejectTransaction: (txId: number) => Promise<void>;
  // 新增：管理员赏赐物品
  grantItem: (userId: string, itemName: string, effectType: string, effectValue: number) => Promise<void>;
  // Member Actions
  requestExpense: (amount: number, reason: string) => Promise<void>;
  useItem: (itemId: number) => Promise<void>;
  giftItem: (itemId: number, recipientName: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state for currentUser
  const currentUser = users.find(u => u.id === currentUserId) || null;

  // --- Data Fetching ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Transactions (Ledger)
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

      // 2. Fetch Profiles
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

      // 3. Fetch Inventory (Unused items)
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

  // --- Auth ---
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

  // --- Admin Actions ---

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
    if (!error) {
      await fetchData();
    } else {
      console.error(error);
      alert('册封失败：' + error.message);
    }
  };

  const updateUser = async (updatedUser: Partial<User> & { id: string }) => {
    const updates: any = {};
    if (updatedUser.name) updates.username = updatedUser.name;
    if (updatedUser.rank) updates.rank = updatedUser.rank;
    if (updatedUser.familyRank) updates.family_rank = updatedUser.familyRank;
    if (updatedUser.appearance) updates.appearance = updatedUser.appearance;
    if (updatedUser.constitution) updates.constitution = updatedUser.constitution;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', updatedUser.id);

    if (!error) await fetchData();
  };

  const distributeSalaries = async () => {
    try {
      const { data: salaryRows, error: viewError } = await supabase
        .from('concubine_salary_view')
        .select('*');
      
      if (viewError) throw viewError;

      const viewRows = salaryRows as SalaryViewRow[];
      const ledgerEntries = viewRows.map(row => ({
        user_id: row.id,
        amount: row.total_stipend,
        type: 'credit',
        reason: `月俸发放 (${row.rank} + ${row.base_salary} + 家世加成 ${row.family_bonus})`,
        status: 'approved'
      }));

      const { error: insertError } = await supabase
        .from('stipend_ledger')
        .insert(ledgerEntries);

      if (insertError) throw insertError;
      await fetchData();
    } catch (e) {
      console.error("发放失败", e);
      alert("发放失败，请检查控制台");
    }
  };

  const approveTransaction = async (txId: number) => {
    const { error } = await supabase
      .from('stipend_ledger')
      .update({ status: 'approved' })
      .eq('id', txId);
    if (!error) await fetchData();
  };

  const rejectTransaction = async (txId: number) => {
    const { error } = await supabase
      .from('stipend_ledger')
      .update({ status: 'rejected' })
      .eq('id', txId);
    if (!error) await fetchData();
  };

  // --- 新增：管理员赏赐物品逻辑 ---
  const grantItem = async (userId: string, itemName: string, effectType: string, effectValue: number) => {
    const { error } = await supabase
      .from('inventory')
      .insert([{
        owner_id: userId,
        item_name: itemName,
        effect_type: effectType,
        effect_value: effectValue,
        is_used: false,
        from_user: currentUser?.name || '内务府'
      }]);

    if (!error) {
      await fetchData(); // 重新加载数据以更新界面
    } else {
      console.error('赏赐失败:', error);
      alert('赏赐失败：' + error.message);
    }
  };

  // --- Member Actions ---

  const requestExpense = async (amount: number, reason: string) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('stipend_ledger')
      .insert([{
        user_id: currentUser.id,
        amount: amount,
        type: 'debit',
        reason: reason,
        status: 'pending'
      }]);
    if (!error) await fetchData();
  };

  const useItem = async (itemId: number) => {
    if (!currentUser) return;
    
    // 1. 找到该道具详情
    const item = items.find(i => i.id === itemId);
    if (!item) return;
  
    try {
      // 2. 将道具标记为已使用
      const { error: itemError } = await supabase
        .from('inventory')
        .update({ is_used: true })
        .eq('id', itemId);
  
      if (itemError) throw itemError;
  
      // 3. 处理属性变更逻辑
      // 如果属性是文本等级（如“三等”），直接增加数值比较复杂。
      // 这里我们采用最直接的方案：如果道具带有数值，就更新对应的字段
      if (item.effectType && item.effectType !== 'none') {
        
        // 获取当前用户的属性值
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
  
        if (profile) {
          let updateData: any = {};
          const fieldName = item.effectType === 'family_rank' ? 'family_rank' : item.effectType;
          
          // 逻辑 A：如果你的字段是纯数字，直接相加
          // 逻辑 B：如果是“三等”这种字符串，我们这里演示将其直接替换或拼接（建议你后续将数据库字段改为数字）
          // 目前为了“有反应”，我们假设你填入的是想要变更后的新等级字符串，或者简单的数值加减
          
          // 示例：简单数值替换逻辑
          const currentValue = profile[fieldName] || 0;
          // 如果是数字则累加，如果是字符串则提示（或者你可以在此处写复杂的等级转换逻辑）
          const newValue = typeof currentValue === 'number' ? currentValue + item.effectValue : item.effectValue;
  
          updateData[fieldName] = newValue;
  
          const { error: profileError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', currentUser.id);
  
          if (profileError) throw profileError;
          alert(`使用成功！你的${fieldName}已更新。`);
        }
      }
  
      // 4. 刷新全局数据，让界面立刻看到数值变化
      await fetchData();
  
    } catch (err) {
      console.error("使用道具失败:", err);
      alert("内务府处理失败，请稍后再试。");
    }
  };

  const giftItem = async (itemId: number, recipientName: string) => {
    if (!currentUser) return { success: false, message: '未登录' };

    const { data: targetUser, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', recipientName)
      .single();

    if (findError || !targetUser) return { success: false, message: '查无此人' };
    if (targetUser.id === currentUser.id) return { success: false, message: '不可赠予自己' };

    const { error } = await supabase
      .from('inventory')
      .update({ 
        owner_id: targetUser.id,
        from_user: currentUser.name 
      })
      .eq('id', itemId);

    if (error) return { success: false, message: '赠送失败' };

    await fetchData();
    return { success: true, message: `已赠予 ${recipientName}` };
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      transactions,
      items,
      isLoading,
      login,
      logout,
      updateUser,
      addUser,
      distributeSalaries,
      approveTransaction,
      rejectTransaction,
      grantItem, // 导出新增方法
      requestExpense,
      useItem,
      giftItem
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
