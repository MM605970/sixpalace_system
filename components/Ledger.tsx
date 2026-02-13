import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STATUS_COLORS } from '../constants';

const Ledger: React.FC = () => {
  const { currentUser, transactions, requestExpense } = useApp();
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState('');

  // Filter transactions for current user
  const myTransactions = transactions
    .filter(t => t.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc) return;
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

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <div className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#8b4513] mb-4">申请支出</h3>
        <form onSubmit={handleRequest} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs text-stone-500 mb-1">事由</label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full bg-white border border-[#a8a29e] rounded p-2 text-sm focus:ring-[#8b4513] focus:border-[#8b4513]"
              placeholder="如：购置脂粉"
            />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-xs text-stone-500 mb-1">金额 (两)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-white border border-[#a8a29e] rounded p-2 text-sm focus:ring-[#8b4513] focus:border-[#8b4513]"
              placeholder="0.00"
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-[#8b4513] hover:bg-[#6d360f] text-white px-6 py-2 rounded shadow text-sm font-bold transition"
          >
            确认
          </button>
        </form>
        {msg && <p className="mt-2 text-amber-700 text-sm animate-pulse">{msg}</p>}
      </div>

      {/* List */}
      <div className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e7e5e4]">
          <h3 className="text-lg font-bold text-[#8b4513]">收支明细</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f5f5f0] text-stone-600 font-medium">
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
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-400">暂无记录</td>
                </tr>
              ) : (
                myTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-stone-50">
                    <td className="px-6 py-3 text-stone-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${tx.type === 'credit' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'}`}>
                        {tx.type === 'credit' ? '入账' : '支出'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-stone-800">{tx.reason}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[tx.status] || ''}`}>
                        {tx.status === 'approved' ? '已核' : tx.status === 'pending' ? '待批' : '驳回'}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-medium ${tx.type === 'credit' ? 'text-green-700' : 'text-red-700'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount} 两
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