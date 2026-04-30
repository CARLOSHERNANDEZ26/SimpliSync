import { Timestamp } from "firebase/firestore";

export interface HolidayData {
  id?: string; 
  name: string; 
  emoji: string; 
  description: string; 
  type: "regular" | "special"; 
  date: Timestamp; 
}