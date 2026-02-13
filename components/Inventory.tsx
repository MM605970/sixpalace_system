import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const Inventory: React.FC = () => {
  const { currentUser, items, useItem, giftItem } = useApp();
  const [giftTarget, setGiftTarget] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<string>('');

  // items are already filtered by owner in AppContext (conceptually) or we filter here?
  // Actually AppContext returns all items (or we can change that). 
  // Let's filter here to be safe and match `ownerId`.
  const myItems = items.filter(i => i.ownerId === currentUser?.id);

  const handleUse = async (itemId: number) => {
    await useItem(itemId);
    setFeedback('物品已使用。');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleGift = async (itemId: number) => {
    const targetName = giftTarget[itemId];
    if (!targetName) return;

    const result = await giftItem(itemId, targetName);
    setFeedback(result.message);
    if (result.success) {
      setGiftTarget(prev => {
         const copy = {...prev};
         delete copy[itemId];
         return copy;
      });
    }
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div className="space-y-6">
       {feedback && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded shadow animate-fade-in">
            {feedback}
          </div>
        )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myItems.length === 0 ? (
          <div className="col-span-full text-center py-12 text-stone-400 bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg">
            珍宝阁空空如也...
          </div>
        ) : (
          myItems.map(item => (
            <div key={item.id} className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg p-5 shadow-sm flex flex-col justify-between hover:border-[#8b4513] transition-colors group">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-[#8b4513]">{item.name}</h4>
                  <span className="text-[10px] uppercase tracking-wider bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">消耗品</span>
                </div>
                {item.fromUser && (
                   <p className="text-xs text-stone-400 italic mb-2">来自: {item.fromUser}</p>
                )}
                <p className="text-sm text-stone-600 mb-4 h-10">
                    {item.effectType === 'appearance' && '可改善容貌。'}
                    {item.effectType === 'constitution' && '可增强体质。'}
                    {item.effectType === 'none' && '普通器物。'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-dashed border-[#d6d3d1]">
                <button
                   onClick={() => handleUse(item.id)}
                   className="w-full py-1.5 text-sm rounded border bg-[#f5e6d3] text-[#8b4513] border-[#d6c0a0] hover:bg-[#eaddc5]"
                >
                  使用
                </button>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="受赠人姓名"
                    className="flex-1 text-xs px-2 py-1.5 border border-[#a8a29e] rounded bg-white"
                    value={giftTarget[item.id] || ''}
                    onChange={(e) => setGiftTarget(prev => ({...prev, [item.id]: e.target.value}))}
                  />
                  <button
                    onClick={() => handleGift(item.id)}
                    className="bg-stone-600 hover:bg-stone-700 text-white px-3 py-1.5 rounded text-xs"
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