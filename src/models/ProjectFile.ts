export interface ProjectFile {
  id: number;
  projectId: number;
  uploadedBy: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
  milestonePercentage: number;
  description?: string | null;
  createdAt: Date;
}