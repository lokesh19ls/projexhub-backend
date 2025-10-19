export interface Review {
  id: number;
  projectId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface CreateReviewDTO {
  rating: number;
  comment?: string;
}

export interface ReviewWithDetails extends Review {
  reviewer?: {
    id: number;
    name: string;
    profilePhoto?: string;
  };
  reviewee?: {
    id: number;
    name: string;
  };
}

