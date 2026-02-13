import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const AdminPanel: React.FC = () => {
  const { 
    users, 
    distributeSalaries, 
    grantSilver, 
    approveTransaction, 
    rejectTransaction, 
    transactions 
  } = useApp();

  // --- 状态管理 ---
  // 1. 月俸备注：默认为当前年月日
  const defaultDate = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日`;
  const [salaryRemark, setSalaryRemark] = useState(`${defaultDate}发放月俸`);
  
  // 2. 单独赏赐银两的状态
  const [rewardTargetId, setRewardTargetId] = useState('');
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [rewardReason, setRewardReason] = useState('');

  // --- 数据过滤 ---
  const pendingTxs = transactions.filter(t => t.status === 'pending');
  const memberList = users.filter(u => u.role === 'member');

  // --- 操作逻辑 ---
  const handleDistributeSalaries = async () => {
    if (!window.confirm(`确定要以备注“${salaryRemark}”发放全宫月俸吗？`)) return;
    await distributeSalaries(salaryRemark);
    alert("月俸已悉数发放。");
  };

  const handleIndividualReward = async () => {
    if (!rewardTargetId || rewardAmount <= 0 || !rewardReason) {
      alert("请选定对象、数额及赏赐事由。");
      return;
    }
    
    const finalRemark = `${defaultDate} 因【${rewardReason}】赏赐银两`;
    await grantSilver(rewardTargetId, rewardAmount, finalRemark);
    
    alert("赏赐圣旨已下达。");
    // 重置表单
    setRewardAmount(0);
    setRewardReason('');
  };

  return (
    <div className="space-y-8">
      {/* 1. 财务调度中心 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 月俸发放箱 */}
        <div className="bg-white border-2 border-[#8b4513] rounded-lg p-5 shadow-sm">
          <h3 className="text-[#8b4513] font-bold mb-4 flex items-center gap-2">
            📅 月俸统筹
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">发放备注 (年/月/日)</label>
              <input 
                type="text" 
                value={salaryRemark}
                onChange={(e) => setSalaryRemark(e.target.value)}
                className="w-full border border-[#d6d3d1] p-2 rounded bg-[#fcfaf2] text-sm"
              />
            </div>
            <button 
              onClick={handleDistributeSalaries}
              className="w-full bg-[#8b4513] text-white py-2 rounded shadow hover:bg-[#6d360f] transition font-bold text-sm"
            >
              🪙 一键发放全宫月俸
            </button>
          </div>
        </div>

        {/* 额外赏赐箱 */}
        <div className="bg-white border-2 border-emerald-800 rounded-lg p-5 shadow-sm">
          <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
            💰 额外赏银
          </h3>
          <div className="space-y-3">
            <select 
              value={rewardTargetId}
              onChange={(e) => setRewardTargetId(e.target.value)}
              className="w-full border border-[#d6d3d1] p-2 rounded bg-[#fcfaf2] text-sm"
            >
              <option value="">-- 选择受赏对象 --</option>
              {memberList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="数额"
                value={rewardAmount || ''}
                onChange={(e) => setRewardAmount(Number(e.target.value))}
                className="w-24 border border-[#d6d3d1] p-2 rounded bg-[#fcfaf2] text-sm"
              />
              <input 
                type="text" 
                placeholder="赏赐事由（如：护驾有功）"
                value={rewardReason}
                onChange={(e) => setRewardReason(e.target.value)}
                className="flex-1 border border-[#d6d3d1] p-2 rounded bg-[#fcfaf2] text-sm"
              />
            </div>
            <button 
              onClick={handleIndividualReward}
              className="w-full bg-emerald-800 text-white py-2 rounded shadow hover:bg-emerald-900 transition font-bold text-sm"
            >
              📜 颁布赏银圣旨
            </button>
          </div>
        </div>
      </div>

      {/* 2. 嫔妃名册（档案详情） */}
      <div className="bg-white border-2 border-[#8b4513] rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#8b4513] p-3 text-center">
          <h3 className="text-[#f5f5f0] font-bold tracking-[0.3em]">六宫名册档案</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fcfaf2] border-b border-[#d6d3d1] text-[#8b4513] text-sm">
                <th className="p-3">姓名</th>
                <th className="p-3">身份码 (ID)</th> 
                <th className="p-3">位分</th>
                <th className="p-3">家世</th>
                <th className="p-3">容貌</th> 
                <th className="p-3">体质</th> 
                <th className="p-3 text-right">余额</th>
              </tr>
            </thead>
            <tbody className="text-stone-700 text-sm">
              {memberList.map(user => (
                <tr key={user.id} className="border-b border-stone-100 hover:bg-[#fcfaf2] transition">
                  <td className="p-3 font-bold">{user.name}</td>
                  <td className="p-3 font-mono text-xs text-stone-500">{user.shortId}</td> 
                  <td className="p-3">
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-xs border border-stone-200">
                      {user.rank}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{user.familyRank}</td>
                  <td className="p-3">
                    <span className="text-pink-700 font-medium">✨ {user.appearance || '未定'}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-emerald-700 font-medium">🌿 {user.constitution || '未定'}</span>
                  </td>
                  <td className="p-3 text-right font-mono text-[#8b4513] font-bold">
                    {user.balance.toFixed(1)} 两
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 待办审批 */}
      {pendingTxs.length > 0 && (
        <div className="bg-white border-2 border-red-800 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-red-800 p-3 text-center">
            <h3 className="text-white font-bold tracking-widest">待审批奏折</h3>
          </div>
          <div className="p-4 space-y-3">
            {pendingTxs.map(tx => {
              const applicant = users.find(u => u.id === tx.userId);
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded">
                  <div>
                    <span className="font-bold text-stone-800">{applicant?.name}</span>
                    <span className="mx-2 text-red-700">申请支取 {tx.amount} 两</span>
                    <p className="text-xs text-stone-500 mt-1 italic">事由：{tx.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => approveTransaction(tx.id)}
                      className="bg-emerald-700 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-emerald-800"
                    >
                      准奏
                    </button>
                    <button 
                      onClick={() => rejectTransaction(tx.id)}
                      className="bg-stone-400 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-stone-500"
                    >
                      驳回
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
