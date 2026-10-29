export type Category = 'general' | 'vip' | 'speaker';
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'attendee' | 'organizer';
  category: Category;
  company: string;
  title: string;
  interests: string;
  preferences: string;
  reference: string;
}
export interface Speaker {
  id: number;
  name: string;
  title: string;
  company: string;
  bio: string;
  initials: string;
  color: string;
}
export interface Session {
  id: number;
  slug: string;
  title: string;
  description: string;
  outcomes: string;
  track: string;
  tags: string;
  start: string;
  end: string;
  room: string;
  format: string;
  level: string;
  capacity: number;
  access: string;
  speaker: string;
  speakerId: number;
  speakerTitle: string;
  initials: string;
  color: string;
  confirmed: number;
  waiting: number;
  state: 'reserved' | 'waitlisted' | null;
  position: number | null;
}
