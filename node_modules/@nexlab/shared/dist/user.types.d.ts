export type UserRole = 'student' | 'admin';
export interface IUser {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    xp: number;
    level: number;
    streak: number;
    badges: string[];
    enrolledCourses?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface IUserPublic {
    id: string;
    name: string;
    role: UserRole;
    xp: number;
    level: number;
    streak: number;
    badges: string[];
}
