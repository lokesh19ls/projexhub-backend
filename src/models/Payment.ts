export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentType {
  ADVANCE = 'advance',
  FULL = 'full',
  MILESTONE = 'milestone'
}

export interface Payment {
  id: number;
  projectId: number;
  studentId: number;
  developerId: number;
  amount: number;
  commissionAmount: number;
  netAmount: number;
  paymentMethod: string;
  paymentType: PaymentType;
  milestonePercentage: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentDTO {
  projectId: number;
  paymentMethod: string;
  paymentType: PaymentType;
  milestonePercentage?: number;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

