import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const Inventory: React.FC = () => {
  const { currentUser, items, useItem, giftItem, isLoading: globalLoading } = useApp();
  const [giftTarget, setGiftTarget] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<string>('');
  // 新增：本地处理状态，用于锁定当前操作的物品 ID
  const [processingId, setProcessingId] = useState<number | null>(null);

  // 过滤出属于当前用户的未消耗物品
  const myItems = items.filter(i => i.ownerId === currentUser?.id);

  const handleUse = async (itemId: number) => {
    // 如果正在处理或全局加载中，拒绝操作
    if (processingId !== null || globalLoading) return;

    setProcessingId(itemId); // 锁定当前物品
    try {
      await useItem(itemId);
      setFeedback('内务府报：宝物已服用，数值已晋升。');
    } catch (error) {
      setFeedback('操作失败，请查验网络。');
    } finally {
      setProcessingId(null); // 解锁
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const handleGift = async (itemId: number) => {
    if (processingId !== null || globalLoading) return;

    const targetName = giftTarget[itemId];
    if (!targetName) {
      setFeedback('请填写受赠人名讳。');
      return;
    }

    setProcessingId(itemId); // 锁定
    try {
      const result = await giftItem(itemId, targetName);
      setFeedback(result.message);
      if (result.success) {
        setGiftTarget(prev => {
          const copy = { ...prev };
          delete copy[itemId];
          return copy;
        });
      }
    } catch (error) {
      setFeedback('赠送失败。');
    } finally {
      setProcessingId(null); // 解锁
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 反馈提示框 */}
      {feedback && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 bg-[#8b4513] text-[#f5f5f0] text-sm rounded-full shadow-2xl border-2 border-[#f5f5f0] animate-bounce">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myItems.length === 0 ? (
          <div className="col-span-full text-center py-20 text-stone-400 bg-[#fcfaf7] border-2 border-dashed border-[#d6d3d1] rounded-lg">
            <span className="text-4xl block mb-4">🏮</span>
            珍宝阁空空如也，暂无赏赐...
          </div>
        ) : (
          myItems.map(item => (
            <div 
              key={item.id} 
              className={`bg-[#fcfaf7] border-2 ${processingId === item.id ? 'border-[#8b4513] opacity-70' : 'border-[#d6d3d1]'} rounded-lg p-5 shadow-sm flex flex-col justify-between hover:border-[#8b4513] transition-all group relative overflow-hidden`}
            >
              {/* 装饰性底纹 */}
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                {item.effectType === 'appearance' ? '✨' : item.effectType === 'constitution' ? '🌿' : '🧧'}
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-[#8b4513] tracking-tighter">{item.name}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#8b4513] text-[#f5f5f0] px-2 py-0.5 rounded-full">
                    {item.effectType === 'family_rank' ? '圣旨' : '珍宝'}
                  </span>
                </div>
                
                {item.fromUser && (
                  <p className="text-[10px] text-stone-400 italic mb-2">赐予人: {item.fromUser}</p>
                )}

                <div className="text-sm text-stone-600 mb-6 min-h-[40px] leading-relaxed">
                  {item.effectType === 'appearance' && '此物温润如玉，点击使用可晋升【容貌】等级。'}
                  {item.effectType === 'constitution' && '此物滋补强身，点击使用可晋升【体质】等级。'}
                  {item.effectType === 'family_rank' && '此乃祖上荣光，点击使用可晋升【家世】品级。'}
                  {item.effectType === 'none' && '寻常赏赐物品，暂无特殊功效。'}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-dashed border-[#d6d3d1] relative z-10">
                <button
                  disabled={processingId !== null || globalLoading}
                  onClick={() => handleUse(item.id)}
                  className={`w-full py-2 text-sm font-bold rounded border transition-all ${
                    processingId === item.id 
                    ? 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed' 
                    : 'bg-[#f5e6d3] text-[#8b4513] border-[#d6c0a0] hover:bg-[#8b4513] hover:text-white'
                  }`}
                >
                  {processingId === item.id ? '正在宣旨...' : '立 即 使 用'}
                </button>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={processingId !== null}
                    placeholder="赠予何人？"
                    className="flex-1 text-xs px-2 py-2 border border-[#a8a29e] rounded bg-white focus:ring-1 focus:ring-[#8b4513] outline-none"
                    value={giftTarget[item.id] || ''}
                    onChange={(e) => setGiftTarget(prev => ({...prev, [item.id]: e.target.value}))}
                  />
                  <button
                    disabled={processingId !== null || globalLoading}
                    onClick={() => handleGift(item.id)}
                    className="bg-stone-600 hover:bg-stone-800 text-white px-4 py-2 rounded text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    赠送
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Inventory;
