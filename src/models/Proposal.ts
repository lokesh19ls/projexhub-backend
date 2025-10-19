export enum ProposalStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

export interface Proposal {
  id: number;
  projectId: number;
  developerId: number;
  price: number;
  timeline: number;
  technology?: string[];
  message?: string;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProposalDTO {
  price: number;
  timeline: number;
  technology?: string[];
  message?: string;
}

export interface ProposalWithDetails extends Proposal {
  developer?: {
    id: number;
    name: string;
    rating: number;
    totalRatings: number;
    skills?: string[];
  };
  project?: {
    id: number;
    title: string;
    budget: number;
    deadline: Date;
  };
}

