import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AdminGrantItem: React.FC = () => {
  const { users, grantItem } = useApp();
  
  // 状态管理
  const [targetId, setTargetId] = useState('');
  const [itemName, setItemName] = useState('');
  const [effectType, setEffectType] = useState('appearance');
  const [effectValue, setEffectValue] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 过滤出所有嫔妃（排除管理员自己）
  const memberList = users.filter(u => u.role === 'member');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !itemName) {
      alert("请选定赏赐对象并填写物品名称。");
      return;
    }

    setIsSubmitting(true);
    try {
      await grantItem(targetId, itemName, effectType, effectValue);
      alert(`赏赐成功：已将 ${itemName} 赐予该嫔妃。`);
      // 重置表单
      setItemName('');
      setEffectValue(1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-2 border-[#8b4513] rounded-lg shadow-md overflow-hidden">
      <div className="bg-[#8b4513] p-3">
        <h3 className="text-[#f5f5f0] font-bold tracking-widest text-center">颁布赏赐</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* 1. 选择对象 */}
        <div>
          <label className="block text-sm font-bold text-[#8b4513] mb-1">赏赐对象</label>
          <select 
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-[#fcfaf2] border border-[#d6d3d1] rounded p-2 text-stone-800 outline-none focus:border-[#8b4513]"
          >
            <option value="">-- 请选择嫔妃 --</option>
            {memberList.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.rank})
              </option>
            ))}
          </select>
        </div>

        {/* 2. 物品名称 */}
        <div>
          <label className="block text-sm font-bold text-[#8b4513] mb-1">宝物名称</label>
          <input 
            type="text" 
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="如：珍珠项链、玉容膏"
            className="w-full bg-[#fcfaf2] border border-[#d6d3d1] rounded p-2 text-stone-800 outline-none focus:border-[#8b4513]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">

          {/* 3. 属性类型 */}
          <div>
            <label className="block text-sm font-bold text-[#8b4513] mb-1">提升属性</label>
            <select 
              value={effectType}
              onChange={(e) => setEffectType(e.target.value)}
              className="w-full bg-[#fcfaf2] border border-[#d6d3d1] rounded p-2 text-stone-800 outline-none focus:border-[#8b4513]"
            >
              <option value="appearance">容貌</option>
              <option value="constitution">体质</option>
              <option value="family_rank">家世</option> {/* 新增家世选项 */}
              <option value="none">其他</option>
            </select>
          </div>

          {/* 4. 加成数值 */}
          <div>
            <label className="block text-sm font-bold text-[#8b4513] mb-1">加成点数</label>
            <input 
              type="number" 
              value={effectValue}
              onChange={(e) => setEffectValue(parseInt(e.target.value))}
              className="w-full bg-[#fcfaf2] border border-[#d6d3d1] rounded p-2 text-stone-800 outline-none focus:border-[#8b4513]"
            />
          </div>
        </div>

        {/* 提交按钮 */}
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 bg-[#8b4513] text-[#f5f5f0] font-bold py-3 rounded-md border-b-4 border-[#5c2e0b] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
        >
          {isSubmitting ? '正在宣旨...' : '准 奏'}
        </button>
      </form>
    </div>
  );
};
