// User Types
export type UserRole = 'homeowner' | 'general_contractor' | 'subcontractor' | 'vendor' | 'admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Project Types
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type StageStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface Project {
  id: string;
  name: string;
  address: string;
  homeownerId: string;
  generalContractorId?: string;
  status: ProjectStatus;
  budget: number;
  spent: number;
  progress: number;
  currentStage?: string;
  startDate?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stage {
  id: string;
  projectId: string;
  name: string;
  status: StageStatus;
  order: number;
  estimatedCost: number;
  actualCost?: number;
  estimatedDuration: string;
  startDate?: Date;
  completionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Marketplace Types
export interface Material {
  id: string;
  name: string;
  brand: string;
  price: number;
  unit: string;
  rating: number;
  reviews: number;
  verified: boolean;
  imageUrl?: string;
  vendorId: string;
}

export interface Contractor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  projects: number;
  verified: boolean;
  imageUrl?: string;
  hiringFee: number;
  type: 'general_contractor' | 'subcontractor';
}

// Payment Types
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  projectId: string;
  stageId?: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

