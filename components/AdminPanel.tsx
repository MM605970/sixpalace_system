import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RANKS, FAMILY_RANKS, APPEARANCE_LEVELS, CONSTITUTION_LEVELS, STATUS_COLORS } from '../constants';

const AdminPanel: React.FC = () => {
  const { users, transactions, distributeSalaries, approveTransaction, rejectTransaction, addUser } = useApp();
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'create'>('approvals');
  
  // Registration Form State
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [newRank, setNewRank] = useState(RANKS[9]); // Default lowest
  const [newFamilyRank, setNewFamilyRank] = useState(FAMILY_RANKS[8]);
  const [newAppearance, setNewAppearance] = useState('三等');
  const [newConstitution, setNewConstitution] = useState('五等');
  const [registerMsg, setRegisterMsg] = useState('');

  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  const generateRandomId = () => {
    const id = Math.floor(100000 + Math.random() * 900000).toString();
    setNewId(id);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newId) {
      setRegisterMsg('请填写完整信息');
      return;
    }
    
    // Simple client side check before sending to DB
    if (users.some(u => u.shortId === newId)) {
      setRegisterMsg('该腰牌号已存在');
      return;
    }

    await addUser({
      shortId: newId,
      name: newName,
      role: 'member',
      rank: newRank,
      familyRank: newFamilyRank,
      appearance: newAppearance,
      constitution: newConstitution,
    });

    setRegisterMsg(`已册封 ${newName} (ID: ${newId})`);
    
    setNewName('');
    setNewId('');
    setTimeout(() => setRegisterMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#fcfaf7] p-4 rounded-lg border border-[#d6d3d1] shadow-sm">
        <h2 className="text-xl font-bold text-[#8b4513]">内务总管台</h2>
        <button
          onClick={distributeSalaries}
          className="bg-[#b91c1c] hover:bg-[#991b1b] text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold transition"
        >
          <span>💰</span> 一键发俸
        </button>
      </div>

      <div className="flex space-x-1 bg-[#e7e5e4] p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'approvals' ? 'bg-white text-[#8b4513] shadow' : 'text-stone-600 hover:text-stone-800'}`}
        >
          待批奏折 ({pendingTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'users' ? 'bg-white text-[#8b4513] shadow' : 'text-stone-600 hover:text-stone-800'}`}
        >
          六宫档案 ({users.length - 1})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'create' ? 'bg-white text-[#8b4513] shadow' : 'text-stone-600 hover:text-stone-800'}`}
        >
          册封新主
        </button>
      </div>

      {activeTab === 'approvals' && (
        <div className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f5f5f0] text-stone-600">
              <tr>
                <th className="px-6 py-3">事由</th>
                <th className="px-6 py-3">金额</th>
                <th className="px-6 py-3 text-right">批复</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e5e4]">
              {pendingTransactions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-stone-400">暂无待办事项</td>
                </tr>
              ) : (
                pendingTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-stone-50">
                    <td className="px-6 py-3 text-stone-600">
                      {tx.reason}
                      {/* Need to find user name since ledger only has user_id. In a real app we'd join in query. 
                          For now, look up in users array */}
                      <div className="text-xs text-stone-400 mt-1">
                        申请人: {users.find(u => u.id === tx.userId)?.name || '未知'}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-red-700 font-bold">{tx.amount} 两</td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button
                        onClick={() => approveTransaction(tx.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                      >
                        准奏
                      </button>
                      <button
                        onClick={() => rejectTransaction(tx.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                      >
                        驳回
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f5f5f0] text-stone-600">
              <tr>
                <th className="px-4 py-3">姓名</th>
                <th className="px-4 py-3">位分</th>
                <th className="px-4 py-3">家世</th>
                <th className="px-4 py-3">余额 (估算)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e5e4]">
              {users.filter(u => u.role !== 'admin').map(user => (
                <tr key={user.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-800">{user.name} <span className="text-xs text-stone-400">({user.shortId})</span></td>
                  <td className="px-4 py-3">{user.rank}</td>
                  <td className="px-4 py-3">{user.familyRank}</td>
                  <td className="px-4 py-3 text-amber-700">{user.balance} 两</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#8b4513] mb-6">册封新主</h3>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#8b4513]">姓名</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white border border-[#a8a29e] rounded p-2 focus:ring-[#8b4513] focus:border-[#8b4513]"
                placeholder="输入名讳"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#8b4513]">腰牌 (登录ID)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="flex-1 bg-white border border-[#a8a29e] rounded p-2 focus:ring-[#8b4513] focus:border-[#8b4513]"
                  placeholder="6位数字"
                />
                <button 
                  type="button" 
                  onClick={generateRandomId}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-2 rounded text-xs"
                >
                  随机
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#8b4513]">位分</label>
              <select
                value={newRank}
                onChange={(e) => setNewRank(e.target.value)}
                className="w-full bg-white border border-[#a8a29e] rounded p-2 focus:ring-[#8b4513] focus:border-[#8b4513]"
              >
                {RANKS.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#8b4513]">家世</label>
              <select
                value={newFamilyRank}
                onChange={(e) => setNewFamilyRank(e.target.value)}
                className="w-full bg-white border border-[#a8a29e] rounded p-2 focus:ring-[#8b4513] focus:border-[#8b4513]"
              >
                {FAMILY_RANKS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#8b4513]">容貌</label>
              <select
                value={newAppearance}
                onChange={(e) => setNewAppearance(e.target.value)}
                className="w-full bg-white border border-[#a8a29e] rounded p-2 focus:ring-[#8b4513] focus:border-[#8b4513]"
              >
                {APPEARANCE_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#8b4513]">体质</label>
              <select
                value={newConstitution}
                onChange={(e) => setNewConstitution(e.target.value)}
                className="w-full bg-white border border-[#a8a29e] rounded p-2 focus:ring-[#8b4513] focus:border-[#8b4513]"
              >
                {CONSTITUTION_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                className="w-full bg-[#8b4513] hover:bg-[#6d360f] text-white py-2 px-4 rounded font-bold shadow-md transition"
              >
                确认册封
              </button>
              {registerMsg && (
                <p className={`mt-3 text-center text-sm font-bold ${registerMsg.includes('已册封') ? 'text-green-700' : 'text-red-700'}`}>
                  {registerMsg}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;