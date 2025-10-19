export enum UserRole {
  STUDENT = 'student',
  DEVELOPER = 'developer',
  ADMIN = 'admin'
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  college?: string;
  department?: string;
  yearOfStudy?: number;
  skills?: string[];
  bio?: string;
  profilePhoto?: string;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalRatings: number;
  bankAccount?: string;
  upiId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  college?: string;
  department?: string;
  yearOfStudy?: number;
  skills?: string[];
}

export interface UpdateUserDTO {
  name?: string;
  college?: string;
  department?: string;
  yearOfStudy?: number;
  skills?: string[];
  bio?: string;
  profilePhoto?: string;
  bankAccount?: string;
  upiId?: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  college?: string;
  department?: string;
  yearOfStudy?: number;
  skills?: string[];
  bio?: string;
  profilePhoto?: string;
  isVerified: boolean;
  rating: number;
  totalRatings: number;
}

