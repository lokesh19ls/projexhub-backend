export enum ProjectStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Project {
  id: number;
  studentId: number;
  title: string;
  description: string;
  technology: string[];
  budget: number;
  deadline: Date;
  status: ProjectStatus;
  acceptedProposalId?: number;
  progressPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  title: string;
  description: string;
  technology: string[];
  budget: number;
  deadline: string;
}

export interface UpdateProjectDTO {
  title?: string;
  description?: string;
  technology?: string[];
  budget?: number;
  deadline?: string;
  status?: ProjectStatus;
  progressPercentage?: number;
}

export interface ProjectWithDetails extends Project {
  student?: {
    id: number;
    name: string;
    college?: string;
    department?: string;
  };
  acceptedProposal?: {
    id: number;
    developer: {
      id: number;
      name: string;
      rating: number;
    };
    price: number;
    timeline: number;
  };
  proposalsCount?: number;
}

