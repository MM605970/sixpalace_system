export type UserRole = 'admin' | 'member';

// Keep Enums for UI Dropdowns, but DB uses strings
export enum RankEnum {
  R1 = '正一品', R2 = '正二品', R3 = '正三品', R4 = '正四品',
  R5 = '正五品', R6 = '正六品', R7 = '正七品', R8 = '正八品',
  R9 = '正九品', NONE = '未入品',
}

export enum FamilyRankEnum {
  F1 = '家世一品', F2 = '家世二品', F3 = '家世三品', F4 = '家世四品',
  F5 = '家世五品', F6 = '家世六品', F7 = '家世七品', F8 = '家世八品', 
  OTHER = '其他',
}

export interface User {
  id: string; // UUID from Supabase
  shortId: string; // 6-digit login ID
  name: string;
  role: UserRole;
  rank: string;
  familyRank: string;
  appearance: string;
  constitution: string;
  balance: number; // Calculated on frontend from ledger
}

export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: number; // BigInt in SQL
  userId: string; // UUID
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reason: string;
  createdAt: string;
}

export interface Item {
  id: number;
  ownerId: string; // UUID
  name: string;
  effectType: 'appearance' | 'constitution' | 'none';
  effectValue: number;
  isUsed: boolean;
  fromUser: string;
}

// Helper for View
export interface SalaryViewRow {
  id: string; // user uuid
  username: string;
  rank: string;
  base_salary: number;
  family_bonus: number;
  total_stipend: number;
}