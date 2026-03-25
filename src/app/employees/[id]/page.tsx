"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, User, Building2, Calendar, Phone, ShieldAlert, Save, Activity } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface EmployeeProfile {
  id?: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
  joinDate?: string;
  birthDate?: string;
  status?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
}

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<EmployeeProfile>({
    name: "", email: "", position: "", department: "", joinDate: "", birthDate: "", status: "active",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: ""
  });

  const isAdmin = user?.email === "admin@simplisync.local";
  // Users can edit their own profile OR admin can edit anyone
  const canEdit = isAdmin || user?.uid === id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as EmployeeProfile;
          setProfile(data);
          setFormData({
            name: data.name || "",
            email: data.email || "",
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
          router.push("/employees");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id, router]);

  const handleSave = async () => {
    if (!id || typeof id !== "string" || !canEdit) return;
    setIsSaving(true);
    
    try {
      const docRef = doc(db, "users", id);
      await updateDoc(docRef, { ...formData });
      setProfile({ ...formData });
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

  if (isLoading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen pt-[73px] bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12">
          
          <Link href="/employees" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 mb-8 mt-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold uppercase shadow-xl shadow-teal-500/20">
                {profile?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {profile?.name}
                </h1>
                <p className="text-teal-600 dark:text-teal-400 font-medium mt-1">
                  {profile?.position || "Staff"} • {profile?.department || "No Department"}
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({ ...profile } as EmployeeProfile); // Reset
                      }}
                      className="px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors font-medium border border-gray-200 dark:border-white/10"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Main Details */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Work Information */}
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-500" />
                  Work Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                    {isEditing ? (
                      <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                    ) : (
                      <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.name}</div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                    {/* ReadOnly for email typically unless doing Firebase Auth update flow */}
                    <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.email}</div>
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

              {/* Emergency Contact */}
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-rose-500" />
                  Emergency Contact
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Name</label>
                    {isEditing ? (
                      <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} placeholder="e.g. Jane Doe" className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                    ) : (
                      <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.emergencyContactName || "—"}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Relationship</label>
                    {isEditing ? (
                      <input name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} placeholder="e.g. Spouse" className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                    ) : (
                      <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.emergencyContactRelation || "—"}</div>
                    )}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone Number</label>
                    {isEditing ? (
                      <input name="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone} onChange={handleChange} placeholder="+1 234 567 8900" className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                    ) : (
                      <div className="text-gray-900 dark:text-white font-medium py-2.5">{profile?.emergencyContactPhone || "—"}</div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Col: Dates & Status */}
            <div className="space-y-6">
              
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-500" />
                  Important Dates
                </h3>
                
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Join Date</label>
                    {isEditing ? (
                      <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                    ) : (
                      <div className="text-gray-900 dark:text-white font-medium py-2">{profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : "—"}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Birth Date</label>
                    {isEditing ? (
                      <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                    ) : (
                      <div className="text-gray-900 dark:text-white font-medium py-2">{profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString() : "—"}</div>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-500" />
                    Account Status
                  </h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Current Status</label>
                    {isEditing ? (
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive (Offboarded)</option>
                      </select>
                    ) : (
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${profile?.status === 'inactive' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                        {profile?.status === 'inactive' ? 'Inactive' : 'Active'}
                      </div>
                    )}
                    
                    {isEditing && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-start gap-1">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        Changing status to inactive will visually flag the user, but does not auto-disable Firebase Auth.
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </ProtectedRoute>
  );
}
