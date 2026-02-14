import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STATUS_COLORS } from '../constants';

const Ledger: React.FC = () => {
  const { currentUser, users, transactions, requestExpense, transferSilver, isLoading } = useApp();
  
  // --- 支出申请状态 ---
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  
  // --- 姐妹赠银状态 ---
  const [giftTargetId, setGiftTargetId] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [giftReason, setGiftReason] = useState('');
  
  const [msg, setMsg] = useState('');

  // 过滤出除自己以外的其他嫔妃 (Member)
  const otherConcubines = users.filter(u => u.role === 'member' && u.id !== currentUser?.id);

  // 按时间倒序排列交易记录
  const myTransactions = transactions
    .filter(t => t.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 处理支出申请
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc || isLoading) return;
    
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setMsg('请输入有效金额');
      return;
    }
    
    await requestExpense(val, desc);
    setAmount('');
    setDesc('');
    setMsg('申请已提交内务府');
    setTimeout(() => setMsg(''), 3000);
  };

  // 处理姐妹赠银
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftTargetId || !giftAmount || isLoading) return;

    const val = parseFloat(giftAmount);
    if (isNaN(val) || val <= 0) {
      setMsg('赠予数额不符，请核验');
      return;
    }

    const result = await transferSilver(giftTargetId, val, giftReason || '姐妹情深');
    
    if (result.success) {
      setGiftAmount('');
      setGiftReason('');
      setGiftTargetId('');
    }
    setMsg(result.message);
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {msg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#8b4513] text-[#f5f5f0] text-xs rounded shadow-lg animate-fade-in">
          {msg}
        </div>
      )}

      {/* 顶部操作区 - 栅格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 申请支出表单 */}
        <div className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg p-5 shadow-sm">
          <h3 className="text-md font-bold text-[#8b4513] mb-4 flex items-center gap-2">
            📜 申请支出
          </h3>
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1 font-bold">事由</label>
              <input
                type="text"
                disabled={isLoading}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="w-full bg-white border border-[#a8a29e] rounded p-2 text-sm outline-none focus:border-[#8b4513]"
                placeholder="如：购置脂粉"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1 font-bold">金额 (两)</label>
              <input
                type="number"
                disabled={isLoading}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-white border border-[#a8a29e] rounded p-2 text-sm outline-none focus:border-[#8b4513]"
                placeholder="0.00"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded text-sm font-bold transition-all shadow-md ${
                isLoading 
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                : 'bg-[#8b4513] hover:bg-[#6d360f] text-white'
              }`}
            >
              {isLoading ? '请稍候...' : '提交申请'}
            </button>
          </form>
        </div>

        {/* 姐妹赠银表单 */}
        <div className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg p-5 shadow-sm border-l-4 border-l-amber-600">
          <h3 className="text-md font-bold text-amber-800 mb-4 flex items-center gap-2">
            💝 姐妹赠银
          </h3>
          <form onSubmit={handleTransfer} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1 font-bold">收件人</label>
              <select
                disabled={isLoading}
                value={giftTargetId}
                onChange={e => setGiftTargetId(e.target.value)}
                className="w-full bg-white border border-[#a8a29e] rounded p-2 text-sm outline-none focus:border-amber-600"
              >
                <option value="">-- 请选择受赠姐妹 --</option>
                {otherConcubines.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.rank})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  disabled={isLoading}
                  placeholder="数额"
                  value={giftAmount}
                  onChange={e => setGiftAmount(e.target.value)}
                  className="w-full bg-white border border-[#a8a29e] rounded p-2 text-sm outline-none focus:border-amber-600"
                />
              </div>
              <div className="flex-[2]">
                <input
                  type="text"
                  disabled={isLoading}
                  placeholder="赠言 (如: 添些首饰)"
                  value={giftReason}
                  onChange={e => setGiftReason(e.target.value)}
                  className="w-full bg-white border border-[#a8a29e] rounded p-2 text-sm outline-none focus:border-amber-600"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded text-sm font-bold transition-all shadow-md ${
                isLoading 
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                : 'bg-amber-700 hover:bg-amber-800 text-white'
              }`}
            >
              {isLoading ? '正在备礼...' : '赠予赏银'}
            </button>
          </form>
        </div>
      </div>

      {/* 收支明细列表 */}
      <div className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e7e5e4] bg-[#f5f5f0]">
          <h3 className="text-lg font-bold text-[#8b4513] tracking-widest">账目流水明细</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#fcfaf2] text-stone-500 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">时间</th>
                <th className="px-6 py-3">类型</th>
                <th className="px-6 py-3">事由</th>
                <th className="px-6 py-3">状态</th>
                <th className="px-6 py-3 text-right">金额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e5e4]">
              {myTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">
                    宫中尚无收支记载
                  </td>
                </tr>
              ) : (
                myTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white transition-colors">
                    <td className="px-6 py-3 text-stone-500 whitespace-nowrap text-xs">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.type === 'credit' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {tx.type === 'credit' ? '入账' : '支出'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-stone-800 font-medium">{tx.reason}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[tx.status] || ''}`}>
                        {tx.status === 'approved' ? '已核' : tx.status === 'pending' ? '待批' : '驳回'}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-mono font-bold ${tx.type === 'credit' ? 'text-green-700' : 'text-red-700'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount.toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ledger;
