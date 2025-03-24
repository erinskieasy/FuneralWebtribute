// Types for frontend components

export interface TributeUser {
  id: number;
  username: string;
  name: string;
}

export interface TributeItem {
  id: number;
  userId: number;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: Date;
  candleCount: number;
  user?: TributeUser;
  hasLitCandle?: boolean;
}

export interface GalleryImage {
  id: number;
  imageUrl: string;
  caption?: string;
  isFeatured: boolean;
  order: number;
}

export interface FuneralProgram {
  id: number;
  date: string;
  time: string;
  location: string;
  address: string;
  streamLink?: string;
  programPdfUrl?: string;
}

export interface SiteSettings {
  backgroundImage: string;
  tributeImage: string;
  footerMessage: string;
  [key: string]: string;
}

export interface UserProfile {
  id: number;
  username: string;
  name: string;
  email?: string;
  isAdmin: boolean;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  name: string;
  email?: string;
}
