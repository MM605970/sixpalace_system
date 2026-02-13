import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const Login: React.FC = () => {
  const { login, isLoading } = useApp();
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = await login(name, id);
    if (success) {
      setError('');
    } else {
      setError('名牒有误，请查验后再试。');
    }
    setIsLoggingIn(false);
  };

  if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
         <div className="text-[#8b4513] animate-pulse">正在从内务府调取档案...</div>
       </div>
     );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1512530638363-3f193f3c155f?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 bg-[#f5f5f0] border-4 border-double border-[#8b4513] rounded-lg shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block border-y-2 border-[#8b4513] py-2 px-6 mb-2">
            <h1 className="text-3xl font-bold text-[#8b4513] tracking-[0.2em]">内务府</h1>
          </div>
          <p className="text-stone-600 text-sm italic">后宫管理系统 V2.0 (Supabase版)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[#8b4513] font-bold mb-2 tracking-widest">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#e8e4dc] border border-[#a8a29e] rounded p-3 text-stone-800 focus:outline-none focus:border-[#8b4513] focus:ring-1 focus:ring-[#8b4513] transition"
              placeholder="请输入您的名讳"
            />
          </div>
          
          <div>
            <label className="block text-[#8b4513] font-bold mb-2 tracking-widest">腰牌 (ID)</label>
            <input
              type="password"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-[#e8e4dc] border border-[#a8a29e] rounded p-3 text-stone-800 focus:outline-none focus:border-[#8b4513] focus:ring-1 focus:ring-[#8b4513] transition"
              placeholder="请输入六位身份码"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border-l-4 border-red-800 text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#8b4513] hover:bg-[#6d360f] text-[#f5f5f0] font-bold py-3 px-4 rounded border border-[#5c2e0b] shadow-md transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? '核验中...' : '确认'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-stone-500">
          <p>内务府造办处监制</p>
        </div>
      </div>
    </div>
  );
};

export default Login;