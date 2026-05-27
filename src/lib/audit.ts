import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ActionType = "SECURITY" | "PAYROLL" | "HR_ACTION" | "ATTENDANCE" | "GENERAL";

export const logSystemAction = async (
  actionType: ActionType,
  details: string,
  adminEmail: string
): Promise<void> => {
  try {
    await addDoc(collection(db, "systemLogs"), {
      actionType,
      details,
      adminEmail,
      timestamp: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error("Silent Audit Log Failure:", error);
  }
};


export const logAdminAction = async (
  adminEmail: string, 
  actionDescription: string, 
  targetEntity: string
): Promise<void> => {
  try {
    // We redirect this to the same "systemLogs" collection so it appears on your new UI!
    await addDoc(collection(db, "systemLogs"), {
      adminEmail,
      actionType: "GENERAL", // Defaults to general for old logs
      details: `${actionDescription} (Target: ${targetEntity})`,
      timestamp: serverTimestamp(),
    });
    console.log(`Audit Logged: ${actionDescription}`);
  } catch (error: unknown) {
    console.error("Critical Error: Failed to write audit log.", error);
  }
};