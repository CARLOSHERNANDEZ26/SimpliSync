"use client";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Search, Users as UsersIcon, ChevronRight, ShieldAlert, Building2, Calendar, Phone, UserPlus } from "lucide-react";
import Link from "next/link";
import AddEmployeeModal from "@/components/AddEmployeeModal";

interface Employee {
  id: string;
  name: string;
  fullName: string;
  email: string;
  position?: string;
  department?: string;
  joinDate?: string;
  status?: string;
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const isAdmin = user?.email === "admin@simplisync.local";

  useEffect(() => {
    if (!user?.uid) return;
    
    // Only fetching employees
    const usersQuery = query(collection(db, "users"), where("role", "==", "employee"));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee));
      setEmployees(emps);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];
const filteredEmployees = employees.filter(emp => {

    const employeeName = emp.fullName || emp.name || ""; 

    const matchesSearch = employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.position || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = departmentFilter === "All" || emp.department === departmentFilter;
    
    return matchesSearch && matchesDept;
  });

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <UsersIcon className="w-10 h-10 text-teal-500" />
                Employee Directory
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                View and manage your organization&apos;s team members.
              </p>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => setShowAddEmployee(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 active:scale-95 shrink-0"
              >
                <UserPlus className="w-5 h-5" />
                Add New Employee
              </button>
            )}
          </div>

          {!isAdmin && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex items-start gap-3 mb-8">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-amber-800 dark:text-amber-200 font-medium">Restricted Access</h3>
                <p className="text-amber-700/80 dark:text-amber-300/80 text-sm mt-1">You are viewing the public directory. Only administrators can view full background details and edit profiles.</p>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 mb-8 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name, email, or role..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            
            <div className="sm:w-64 shrink-0">
              <select 
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-gray-900 dark:text-white appearance-none"
              >
                {departments.map((dept, i) => (
                  <option key={i} value={dept as string}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => (
                <div key={employee.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl shadow-gray-200/20 dark:shadow-none hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold uppercase shadow-lg shadow-teal-500/30">
                      {(employee.fullName || employee.name || "U").charAt(0)}
                    </div>
                    {employee.status === "inactive" ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                        Inactive
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{employee.fullName || employee.name || "Unknown Employee"}</h3>
                  <p className="text-teal-600 dark:text-teal-400 font-medium text-sm mb-4">{employee.position || "Staff"}</p>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Building2 className="w-4 h-4" />
                      {employee.department || "No Department"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      Joined {employee.joinDate && !isNaN(Date.parse(employee.joinDate)) 
                        ? new Date(employee.joinDate).toLocaleDateString() 
                        : "N/A"}
                    </div>
                  </div>

                  {/* BUG FIX: Employees can now view their OWN profile, or Admins can view all */}
                  {(isAdmin || user?.uid === employee.id) && (
                    <Link 
                      href={`/employees/${employee.id}`}
                      className="mt-6 w-full py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-95 group-hover:border-teal-500/30"
                    >
                      View Full Profile
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 rounded-3xl">
                <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No employees found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>

        </div>

        {showAddEmployee && (
          <AddEmployeeModal onClose={() => setShowAddEmployee(false)} />
        )}
      </main>
    </ProtectedRoute>
  );
}