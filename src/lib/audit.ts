import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const logAdminAction = async (
  adminEmail: string, 
  actionDescription: string, 
  targetEntity: string
): Promise<void> => {
  try {
    await addDoc(collection(db, "auditLogs"), {
      adminEmail,
      action: actionDescription,
      target: targetEntity,
      timestamp: serverTimestamp(),
    });
    console.log(`Audit Logged: ${actionDescription}`);
  } catch (error: unknown) {
    console.error("Critical Error: Failed to write audit log.", error);
  }
};