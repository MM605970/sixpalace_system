import React from 'react';
import { useApp } from '../context/AppContext';

const AdminPanel: React.FC = () => {
  const { users, distributeSalaries, approveTransaction, rejectTransaction, transactions } = useApp();

  // 过滤出待审批的账单
  const pendingTxs = transactions.filter(t => t.status === 'pending');
  // 过滤出所有嫔妃（不含管理员）
  const memberList = users.filter(u => u.role === 'member');

  return (
    <div className="space-y-6">
      {/* 1. 快捷操作栏 */}
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={distributeSalaries}
          className="bg-[#8b4513] text-white px-6 py-2 rounded shadow hover:bg-[#6d360f] transition font-bold"
        >
          🪙 一键发放本月月俸
        </button>
      </div>

      {/* 2. 嫔妃名册（档案详情） */}
      <div className="bg-white border-2 border-[#8b4513] rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#8b4513] p-3">
          <h3 className="text-[#f5f5f0] font-bold tracking-widest text-center">六宫名册档案</h3>
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
                  <td className="p-3">
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-xs border border-stone-200">
                      {user.rank}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{user.familyRank}</td>
                  {/* 容貌展示：带特定颜色标识 */}
                  <td className="p-3">
                    <span className="text-pink-700 font-medium">
                      ✨ {user.appearance || '未定'}
                    </span>
                  </td>
                  {/* 体质展示：带特定颜色标识 */}
                  <td className="p-3">
                    <span className="text-emerald-700 font-medium">
                      🌿 {user.constitution || '未定'}
                    </span>
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

      {/* 3. 待办审批（支取申请） */}
      {pendingTxs.length > 0 && (
        <div className="bg-white border-2 border-red-800 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-red-800 p-3">
            <h3 className="text-white font-bold tracking-widest text-center">待审批奏折</h3>
          </div>
          <div className="p-4 space-y-3">
            {pendingTxs.map(tx => {
              const applicant = users.find(u => u.id === tx.userId);
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded">
                  <div>
                    <span className="font-bold text-stone-800">{applicant?.name}</span>
                    <span className="mx-2 text-red-700">申请支取 {tx.amount} 两</span>
                    <p className="text-xs text-stone-500 mt-1">事由：{tx.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => approveTransaction(tx.id)}
                      className="bg-emerald-700 text-white px-3 py-1 rounded text-xs hover:bg-emerald-800"
                    >
                      准奏
                    </button>
                    <button 
                      onClick={() => rejectTransaction(tx.id)}
                      className="bg-stone-400 text-white px-3 py-1 rounded text-xs hover:bg-stone-500"
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
