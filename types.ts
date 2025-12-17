
export enum UserRole {
  ADMIN = 'admin',
  ORG = 'org'
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  username: string;
  password?: string; // In a real app, never store plain text
  name: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  variants?: string[]; // Array of allowed sizes/volumes (e.g. ['0.200', '0.250'])
}

export interface Requisition {
  id: string;
  orgId: string;
  orgName: string;
  productId: string;
  productName: string;
  quantity: number; // Count (e.g., 5 bags)
  unit: string;
  variant?: string; // Selected specific volume (e.g., '0.200')
  bloodGroup?: string; // New field for Blood Group (e.g., 'A(II)')
  patientName?: string; // New field for Patient Name
  date: string; // ISO string
  status: RequestStatus;
  comment?: string;
}

export interface AnalysisResult {
  summary: string;
  recommendation: string;
}

export interface StockTransaction {
  id: string;
  orgId: string; // 'admin' for central warehouse, or specific org ID for local warehouse
  productId: string;
  productName: string;
  variant?: string; // If applicable
  quantity: number;
  type: 'IN' | 'OUT'; // IN = Kirim, OUT = Chiqim
  date: string;
  comment?: string;
  relatedRequestId?: string; // To link with a requisition
}

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
}
