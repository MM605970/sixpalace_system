import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Profile from './components/Profile';
import Ledger from './components/Ledger';
import Inventory from './components/Inventory';
import AdminPanel from './components/AdminPanel';
// 导入新增的赏赐组件
import { AdminGrantItem } from './components/AdminGrantItem';

const MainLayout: React.FC = () => {
  const { currentUser, logout } = useApp();
  const [activeTab, setActiveTab] = useState<string>('profile');

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    // 管理员特有逻辑
    if (currentUser.role === 'admin') {
      if (activeTab === 'admin') {
        return (
          <div className="space-y-8">
            {/* 原有的总管面板：处理名册、发俸、审批 */}
            <AdminPanel />
            <hr className="border-[#d6d3d1]" />
            {/* 新增的赏赐面板：颁布物品 */}
            <AdminGrantItem />
          </div>
        );
      }
      if (activeTab === 'profile') return <Profile user={currentUser} />;
      if (activeTab === 'ledger') return <Ledger />;
    }

    // 普通成员逻辑
    switch (activeTab) {
      case 'profile': return <Profile user={currentUser} />;
      case 'ledger': return <Ledger />;
      case 'inventory': return <Inventory />;
      case 'admin': return <AdminPanel />; // 以防万一的兜底
      default: return <Profile user={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col font-serif">
      {/* Top Bar */}
      <header className="bg-[#8b4513] text-[#f5f5f0] shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⛩️</span>
            <h1 className="font-bold tracking-widest text-lg text-[#f5f5f0]">内务府</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
             <span className="opacity-80">{currentUser.name}</span>
             <button onClick={logout} className="hover:text-white text-stone-300 transition">
               退下
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 pb-20">
         {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#fffdfa] border-t border-[#d6d3d1] pb-safe">
        <div className="max-w-4xl mx-auto flex justify-around items-center h-16 text-xs font-medium text-stone-500">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'profile' ? 'text-[#8b4513]' : 'hover:text-stone-700'}`}
          >
            <span className="text-xl">🪪</span>
            <span>档案</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'ledger' ? 'text-[#8b4513]' : 'hover:text-stone-700'}`}
          >
            <span className="text-xl">📜</span>
            <span>账本</span>
          </button>

          {/* 只有嫔妃能看到珍宝阁 */}
          {currentUser.role === 'member' && (
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'inventory' ? 'text-[#8b4513]' : 'hover:text-stone-700'}`}
            >
              <span className="text-xl">🎁</span>
              <span>珍宝阁</span>
            </button>
          )}

          {/* 只有管理员能看到总管面板 */}
          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'admin' ? 'text-[#8b4513]' : 'hover:text-stone-700'}`}
            >
              <span className="text-xl">⚖️</span>
              <span>总管</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
