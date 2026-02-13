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


  const useItem = async (itemId: number | string) => {
    if (!currentUser) return;
  
    // 1. 获取当前道具（使用 String 强制转换确保 ID 匹配成功）
    const item = items.find(i => String(i.id) === String(itemId));
    
    if (!item) {
      console.error("找不到道具 ID:", itemId);
      return;
    }
  
    // 等级序列（务必确保与数据库中存的字符完全一致，不带多余空格）
    const commonSequence = ['十等', '九等', '八等', '七等', '六等', '五等', '四等', '三等', '二等', '一等', '特等'];
    const familySequence = [
      '从九品', '正九品', '从八品', '正八品', '从七品', '正七品', 
      '从六品', '正六品', '从五品', '正五品', '从四品', '正四品', 
      '从三品', '正三品', '从二品', '正二品', '从一品', '正一品', '国公/公侯'
    ];
  
    try {
      setIsLoading(true);
  
      // 第一步：在 inventory 表中标记道具已使用
      const { error: itemError } = await supabase
        .from('inventory')
        .update({ is_used: true }) 
        .eq('id', item.id);
  
      if (itemError) throw itemError;
  
      // 第二步：改写 profiles 档案表
      if (item.effectType && item.effectType !== 'none') {
        const fieldMapping: Record<string, string> = {
          'appearance': 'appearance',
          'constitution': 'constitution',
          'family_rank': 'family_rank' // 确保这里对应数据库里的字段名
        };
        
        const dbField = fieldMapping[item.effectType];
  
        if (dbField) {
          // 关键：直接从数据库拉取最准确的当前数值，不依赖缓存
          const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
  
          if (fetchError || !profile) throw new Error("无法读取档案");
  
          // 使用 .trim() 自动过滤数据库中可能存在的空格
          const currentVal = profile[dbField] ? profile[dbField].trim() : null;
          
          let sequence = dbField === 'family_rank' ? familySequence : commonSequence;
          let defaultStart = dbField === 'family_rank' ? '从九品' : '十等';
  
          // 查找当前等级在序列中的位置
          const currentIndex = sequence.indexOf(currentVal || defaultStart);
          let newVal = currentVal || defaultStart;
  
          if (currentIndex !== -1 && currentIndex < sequence.length - 1) {
            // 向上晋升一级
            newVal = sequence[currentIndex + 1];
          } else if (currentIndex === sequence.length - 1) {
            alert(`内务府报：您的${item.effectType}已至化境，无需提升。`);
            await fetchData();
            return;
          }
  
          // 执行改写 profiles 表的操作
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ [dbField]: newVal })
            .eq('id', currentUser.id);
  
          if (updateError) throw updateError;
          
          alert(`✨ 功效显著！您的${item.effectType}已由【${currentVal || '无'}】提升至【${newVal}】。`);
        }
      }
  
      // 第三步：强制重新拉取数据，更新前端显示
      await fetchData();
  
    } catch (err: any) {
      console.error("操作异常:", err);
      alert("内务府忙碌：" + (err.message || "未知错误"));
    } finally {
      setIsLoading(false);
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
