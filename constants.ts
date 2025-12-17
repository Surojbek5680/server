import { Product, Requisition, RequestStatus, User, UserRole } from "./types";

export const BLOOD_GROUPS = ['O(I)', 'A(II)', 'B(III)', 'AB(IV)'];

export const PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    name: 'СЗП', 
    unit: 'litr', 
    variants: ['0.200', '0.250'] 
  },
  { 
    id: 'p2', 
    name: 'Ermassa', 
    unit: 'litr', 
    variants: ['0.199', '0.263'] 
  },
  { 
    id: 'p3', 
    name: 'Ermassa (2A)', 
    unit: 'litr', 
    variants: ['0.199L', '0.263L'] 
  },
  { 
    id: 'p4', 
    name: 'Ermassa (2B - Yuvilgan qon)', 
    unit: 'litr', 
    variants: ['0.199', '0.263'] 
  },
  { 
    id: 'p5', 
    name: 'Tromba', 
    unit: 'litr', 
    variants: ['0.140', '0.400'] 
  },
  { 
    id: 'p6', 
    name: 'Krio', 
    unit: 'Doza',
    variants: [] // No specific volume variants mentioned for Krio
  }
];

export const MOCK_USERS: User[] = [
  { id: 'admin1', username: 'Surojbek5680', password: '1195680Surojbek', name: 'Bosh Administrator', role: UserRole.ADMIN },
];

// Initial mock requests to populate charts
export const INITIAL_REQUESTS: Requisition[] = [];