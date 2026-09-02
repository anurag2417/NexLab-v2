export type UserRole = 'student' | 'admin';

export interface IUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  enrolledCourses?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserPublic extends Omit<IUser, 'email' | '_id'> {
  id: string;
}