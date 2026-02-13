import React from 'react';
import { User } from '../types';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  return (
    <div className="bg-[#fcfaf7] border border-[#d6d3d1] rounded-lg p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" className="fill-[#8b4513]">
          <path d="M50 0 L100 50 L50 100 L0 50 Z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-[#8b4513] mb-6 border-b border-[#e7e5e4] pb-2">
        个人档案
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-dashed border-[#d6d3d1] pb-1">
            <span className="text-stone-500">姓名</span>
            <span className="text-lg font-medium text-stone-800">{user.name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-dashed border-[#d6d3d1] pb-1">
            <span className="text-stone-500">腰牌</span>
            <span className="font-mono text-stone-600">{user.shortId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-dashed border-[#d6d3d1] pb-1">
            <span className="text-stone-500">余额</span>
            <span className="text-xl font-bold text-amber-700">{user.balance} 两</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-dashed border-[#d6d3d1] pb-1">
            <span className="text-stone-500">位分</span>
            <span className="text-stone-800 px-2 py-0.5 bg-[#f5e6d3] rounded text-sm">{user.rank}</span>
          </div>
          <div className="flex justify-between items-center border-b border-dashed border-[#d6d3d1] pb-1">
            <span className="text-stone-500">家世</span>
            <span className="text-stone-800">{user.familyRank}</span>
          </div>
          <div className="flex justify-between items-center border-b border-dashed border-[#d6d3d1] pb-1">
            <span className="text-stone-500">容貌</span>
            <span className="text-stone-800">{user.appearance}</span>
          </div>
          <div className="flex justify-between items-center border-b border-dashed border-[#d6d3d1] pb-1">
            <span className="text-stone-500">体质</span>
            <span className="text-stone-800">{user.constitution}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;