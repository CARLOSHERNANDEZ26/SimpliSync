import { collection, query, where, getDocs } from "firebase/firestore";
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
      const dateString = (data.timeIn.toDate() as Date).toISOString().split('T')[0];
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
    const leaveStart = new Date(data.startDate as string);
    const leaveEnd = new Date(data.endDate as string);
    
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

// DOLE Hourly Rate Calculation
export const calculateHourlyRate = (monthlySalary: number): number => {
  if (!monthlySalary) return 0;
  // Standard Formula: (Monthly / 22 working days) / 8 hours
  return (monthlySalary / 22) / 8;
};

// SimpliV 15-Minute Lateness Ceiling Rule
export const calculateLatePenaltyMinutes = (
  timeIn: Date | null, 
  shiftStartTime: string = "08:00",
  isLateExcused: boolean = false
): number => {
  if (!timeIn || isLateExcused) return 0; // On time, early, or explicitly excused by admin

  const [startHour, startMin] = shiftStartTime.split(":").map(Number);
  const targetTime = new Date(timeIn);
  targetTime.setHours(startHour, startMin, 0, 0);

  const diffMs = timeIn.getTime() - targetTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins <= 0) return 0; // On time or early

  // The SimpliV Step Function: Every 1-15 min block = 30 mins deducted
  const penaltyBlocks = Math.ceil(diffMins / 15);
  return penaltyBlocks * 30;
};

// Early Clock Out Penalty
export const calculateUndertimeMinutes = (timeOut: Date | null, shiftEndTime: string = "17:00"): number => {
  if (!timeOut) return 0;

  const [endHour, endMin] = shiftEndTime.split(":").map(Number);
  const targetTime = new Date(timeOut);
  targetTime.setHours(endHour, endMin, 0, 0);

  const diffMs = targetTime.getTime() - timeOut.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  // If they left early, return the exact minutes lost
  return diffMins > 0 ? diffMins : 0;
};

// Translates penalty minutes into a direct peso deduction
export const calculateTimeDeductionPeso = (penaltyMinutes: number, hourlyRate: number): number => {
  const minuteRate = hourlyRate / 60;
  return penaltyMinutes * minuteRate;
};

// DOLE Overtime Calculation (+25% premium for regular workdays past 6:00 PM)
export interface OvertimeResult {
  otMinutes: number;
  otPay: number;
}

export const calculateOvertimePay = (timeOut: Date | null, hourlyRate: number): OvertimeResult => {
  if (!timeOut) return { otMinutes: 0, otPay: 0 };
  
  // Set the official overtime start threshold to 18:00 (6:00 PM)
  const otStartHour = 18; 
  const targetTime = new Date(timeOut);
  targetTime.setHours(otStartHour, 0, 0, 0);
  
  const diffMs = timeOut.getTime() - targetTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins <= 0) return { otMinutes: 0, otPay: 0 };
  
  const otHourlyRate = hourlyRate * 1.25;
  const otMinuteRate = otHourlyRate / 60;
  
  return {
    otMinutes: diffMins,
    otPay: diffMins * otMinuteRate
  };
};