import { RankEnum, FamilyRankEnum } from './types';

// Used for Dropdowns in Admin UI
export const RANKS = Object.values(RankEnum);
export const FAMILY_RANKS = Object.values(FamilyRankEnum);

export const APPEARANCE_LEVELS = ['特等', '一等', '二等', '三等', '四等', '五等', '六等', '七等', '八等'];
export const CONSTITUTION_LEVELS = ['特等', '一等', '二等', '三等', '四等', '五等', '六等', '七等', '八等'];

// Colors for tags
export const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};
