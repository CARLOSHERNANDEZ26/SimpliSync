import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface DeductionSuggestion {
  expectedDays: number;
  daysPresent: number;
  paidLeaveDays: number;
  unpaidAbsences: number;
  suggestedDeduction: number;
}

export const getSuggestedDeduction = async (
  userId: string,
  baseSalary: number,
  year: number,
  month: number,
  expectedDaysInMonth: number = 22 
): Promise<DeductionSuggestion> => {
  if (!baseSalary || baseSalary <= 0) {
    return { expectedDays: expectedDaysInMonth, daysPresent: 0, paidLeaveDays: 0, unpaidAbsences: 0, suggestedDeduction: 0 };
  }

  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const attendanceQuery = query(
    collection(db, "attendanceLogs"),
    where("userId", "==", userId),
    where("timeIn", ">=", startOfMonth),
    where("timeIn", "<=", endOfMonth)
  );
  
  const attendanceSnap = await getDocs(attendanceQuery);
  
  const uniqueDaysPresent = new Set<string>(); 
  attendanceSnap.forEach(doc => {
    const data = doc.data();
    if (data.timeIn) {
      const dateString = data.timeIn.toDate().toISOString().split('T')[0];
      uniqueDaysPresent.add(dateString);
    }
  });
  const daysPresent = uniqueDaysPresent.size;

  const leaveQuery = query(
    collection(db, "leaveRequests"),
    where("userId", "==", userId),
    where("status", "==", "approved")
  );
  
  const leaveSnap = await getDocs(leaveQuery);
  let paidLeaveDays = 0;

  leaveSnap.forEach(doc => {
    const data = doc.data();
    const leaveStart = new Date(data.startDate);
    const leaveEnd = new Date(data.endDate);
    
    if (leaveStart <= endOfMonth && leaveEnd >= startOfMonth) {
      const diffTime = Math.abs(leaveEnd.getTime() - leaveStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      paidLeaveDays += diffDays;
    }
  });


  let unpaidAbsences = expectedDaysInMonth - (daysPresent + paidLeaveDays);
  
  if (unpaidAbsences < 0) unpaidAbsences = 0; 
  

  if (unpaidAbsences > expectedDaysInMonth) unpaidAbsences = expectedDaysInMonth;

  const dailyRate = baseSalary / expectedDaysInMonth;
  const suggestedDeduction = unpaidAbsences * dailyRate;

  return {
    expectedDays: expectedDaysInMonth,
    daysPresent,
    paidLeaveDays,
    unpaidAbsences,
    suggestedDeduction
  };
};