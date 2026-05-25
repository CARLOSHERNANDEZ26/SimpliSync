"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Calendar, Phone, ShieldAlert, Save, Activity, UploadCloud, Loader2, Key, Lock } from "lucide-react";
import toast from "react-hot-toast";

interface EmployeeProfile {
  id?: string;
  fullName: string;
  email: string;
  personalEmail?: string;
  contactNumber?: string;
  position?: string;
  department?: string;
  joinDate?: string;
  birthDate?: string;
  status?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
}

export default function EmployeeProfileView({ userId }: { userId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<EmployeeProfile>({
    fullName: "", email: "", personalEmail: "", contactNumber: "", position: "", department: "", joinDate: "", birthDate: "", status: "active",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: ""
  });

  const isAdmin = user?.email === "admin@simplisync.local";
  const canEdit = isAdmin || user?.uid === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as EmployeeProfile;
          setProfile(data);
          setFormData({
            fullName: data.fullName || "",
            email: data.email || "",
            personalEmail: data.personalEmail || "",
            contactNumber: data.contactNumber || "",
            position: data.position || "",
            department: data.department || "",
            joinDate: data.joinDate || "",
            birthDate: data.birthDate || "",
            status: data.status || "active",
            emergencyContactName: data.emergencyContactName || "",
            emergencyContactRelation: data.emergencyContactRelation || "",
            emergencyContactPhone: data.emergencyContactPhone || ""
          });
        } else {
          toast.error("Employee not found");
          if (isAdmin) router.push("/employees");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, router, isAdmin]);

 const handleSave = async () => {
    if (!userId || typeof userId !== "string" || !canEdit) return;
    setIsSaving(true);
    
   try {
      const docRef = doc(db, "users", userId);
      
      const updateData = { ...formData };
      delete updateData.status; 
      
      await updateDoc(docRef, updateData);
      setProfile(prev => ({ ...prev, ...updateData }) as EmployeeProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    setIsScanning(true);
    const formDataPayload = new FormData();
    formDataPayload.append("resume", file);

    try {
      const res = await fetch("/api/scan-resume", {
        method: "POST",
        body: formDataPayload,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to scan resume");
      }

      const parsedData = await res.json();
      
      setFormData(prev => ({
        ...prev,
        fullName: parsedData.fullName || prev.fullName,
        personalEmail: parsedData.personalEmail || prev.personalEmail,
        birthDate: parsedData.birthDate || prev.birthDate,
        contactNumber: parsedData.contactNumber || prev.contactNumber,
        emergencyContactName: parsedData.emergencyContactName || prev.emergencyContactName,
        emergencyContactRelation: parsedData.emergencyContactRelation || prev.emergencyContactRelation,
        emergencyContactPhone: parsedData.emergencyContactPhone || prev.emergencyContactPhone,
      }));

      toast.success("Resume scanned successfully! Review fields before saving.");
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error)?.message || "Resume scanning failed. Check API configuration.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 🔥 NEW: API Call to force the password reset
  const handleForcePasswordReset = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      toast.success(`Password successfully changed to: ${newPassword}`);
      setIsResetModalOpen(false);
      setNewPassword("");
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message || "System Error: Could not reset password.");
    } finally {
      setIsResetting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold uppercase shadow-xl shadow-teal-500/20">
            {profile?.fullName?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {profile?.fullName}
            </h1>
            <p className="text-teal-600 dark:text-teal-400 font-medium mt-1">
              {profile?.position || "Staff"} • {profile?.department || "No Department"}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-3">
            {isEditing ? (
              <>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="px-5 py-2.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 justify-center"
                >
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {isScanning ? "Scanning..." : "Auto-fill with Resume"}
                </button>
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleResumeUpload}
                />
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ ...profile } as EmployeeProfile); 
                  }}
                  disabled={isScanning}
                  className="px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors font-medium border border-gray-200 dark:border-white/10"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || isScanning}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl font-medium transition-colors shadow-sm"
              >
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Left Col: Main Details */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-500" />
              Work Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                {isEditing ? (
                  <input name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.fullName}</div>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company Email</label>
                <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.email}</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Personal Email</label>
                {isEditing ? (
                  <input name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} placeholder="johndoe@gmail.com" className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.personalEmail || "—"}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Number</label>
                {isEditing ? (
                  <input name="contactNumber" type="tel" value={formData.contactNumber} onChange={handleChange} placeholder="+1 234 567 8900" className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.contactNumber || "—"}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Title</label>
                {isEditing ? (
                  <input name="position" value={formData.position} onChange={handleChange} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.position || "—"}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</label>
                {isEditing ? (
                  <input name="department" value={formData.department} onChange={handleChange} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.department || "—"}</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-rose-500" />
              Emergency Contact
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Name</label>
                {isEditing ? (
                  <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} placeholder="e.g. Jane Doe" className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.emergencyContactName || <span className="text-red-500">Not Yet Set</span>}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Relationship</label>
                {isEditing ? (
                  <input name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} placeholder="e.g. Spouse" className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.emergencyContactRelation || <span className="text-red-500">Not Yet Set</span>}</div>
                )}
              </div>

              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone Number</label>
                {isEditing ? (
                  <input name="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone} onChange={handleChange} placeholder="+1 234 567 8900" className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.emergencyContactPhone || <span className="text-red-500">Not Yet Set</span>}</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Dates & Status */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-500" />
              Important Dates
            </h3>
            
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Join Date</label>
                <div className="text-gray-900 dark:text-white font-medium py-2">
                  {profile?.joinDate && !isNaN(Date.parse(profile.joinDate)) 
                    ? new Date(profile.joinDate).toLocaleDateString(undefined,
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    ) 
                    : <span className="text-red-500">Not Set</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Birth Date</label>
                {isEditing ? (
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium py-2">
                    {profile?.birthDate && !isNaN(Date.parse(profile.birthDate)) 
                      ? new Date(profile.birthDate).toLocaleDateString(undefined,
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      ) 
                      :<span className="text-red-500">Not Yet Set</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Account Status
            </h3>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Current Status</label>
              
              {/* 🔥 FIX: Rendered status as read-only. We force Admins to use the DOLE-compliant directory offboard tool. */}
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${["inactive", "Resigned", "Terminated", "End of Contract"].includes(profile?.status || "") ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                {profile?.status === 'active' ? 'Active' : profile?.status || 'Active'}
              </div>
              
              {isAdmin && profile?.status === 'active' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-start gap-1.5 leading-relaxed border-t border-gray-100 dark:border-white/10 pt-4">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                  To mark this employee as inactive or offboarded, please use the Separation Tool in the main Employee Directory.
                </p>
              )}
            </div>
          </div>

          {/* 🔥 NEW: Admin Security Override Card */}
          {isAdmin && (
            <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
              <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security Access
              </h3>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mb-5 leading-relaxed">
                As an administrator, you have the authority to forcibly override this user&apos;s password if they have lost access to their account.
              </p>
              
              <button 
                onClick={() => setIsResetModalOpen(true)}
                className="w-full py-2.5 bg-white dark:bg-[#1a1a1a] border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" /> Reset Password
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 🔥 NEW: Password Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
          <form onSubmit={handleForcePasswordReset} className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Force Password Reset</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Enter a temporary password for <strong>{profile?.fullName || 'this user'}</strong>. They should change this immediately upon logging in.
              </p>

              <input 
                type="text" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="e.g. SimpliSync2026"
                required
                minLength={6}
                className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 text-center font-mono font-bold tracking-wide mb-6"
              />

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isResetting || newPassword.length < 6}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-colors shadow-md disabled:opacity-50 flex items-center justify-center"
                >
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Password"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}