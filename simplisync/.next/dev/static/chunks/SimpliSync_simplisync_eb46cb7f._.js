(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/SimpliSync/simplisync/src/components/ProtectedRoute.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProtectedRoute
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$hooks$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/hooks/useAuth.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function ProtectedRoute(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(9);
    if ($[0] !== "728146ea213b5a3b074776b81fc7ea2c8978ebd3c5a6e09525a59615f6f94a41") {
        for(let $i = 0; $i < 9; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "728146ea213b5a3b074776b81fc7ea2c8978ebd3c5a6e09525a59615f6f94a41";
    }
    const { children } = t0;
    const { user, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$hooks$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    let t1;
    let t2;
    if ($[1] !== loading || $[2] !== router || $[3] !== user) {
        t1 = ({
            "ProtectedRoute[useEffect()]": ()=>{
                if (!loading && !user) {
                    router.push("/login");
                }
            }
        })["ProtectedRoute[useEffect()]"];
        t2 = [
            user,
            loading,
            router
        ];
        $[1] = loading;
        $[2] = router;
        $[3] = user;
        $[4] = t1;
        $[5] = t2;
    } else {
        t1 = $[4];
        t2 = $[5];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t1, t2);
    if (loading) {
        let t3;
        if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-500",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col items-center gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "animate-spin h-8 w-8 text-teal-600 dark:text-teal-500 transition-colors",
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    className: "opacity-25",
                                    cx: "12",
                                    cy: "12",
                                    r: "10",
                                    stroke: "currentColor",
                                    strokeWidth: "4"
                                }, void 0, false, {
                                    fileName: "[project]/SimpliSync/simplisync/src/components/ProtectedRoute.tsx",
                                    lineNumber: 47,
                                    columnNumber: 342
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    className: "opacity-75",
                                    fill: "currentColor",
                                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                }, void 0, false, {
                                    fileName: "[project]/SimpliSync/simplisync/src/components/ProtectedRoute.tsx",
                                    lineNumber: 47,
                                    columnNumber: 436
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/SimpliSync/simplisync/src/components/ProtectedRoute.tsx",
                            lineNumber: 47,
                            columnNumber: 186
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm font-medium text-teal-700 dark:text-teal-400 tracking-widest uppercase transition-colors",
                            children: "Checking credentials..."
                        }, void 0, false, {
                            fileName: "[project]/SimpliSync/simplisync/src/components/ProtectedRoute.tsx",
                            lineNumber: 47,
                            columnNumber: 609
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/SimpliSync/simplisync/src/components/ProtectedRoute.tsx",
                    lineNumber: 47,
                    columnNumber: 136
                }, this)
            }, void 0, false, {
                fileName: "[project]/SimpliSync/simplisync/src/components/ProtectedRoute.tsx",
                lineNumber: 47,
                columnNumber: 12
            }, this);
            $[6] = t3;
        } else {
            t3 = $[6];
        }
        return t3;
    }
    if (!user) {
        return null;
    }
    let t3;
    if ($[7] !== children) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: children
        }, void 0, false);
        $[7] = children;
        $[8] = t3;
    } else {
        t3 = $[8];
    }
    return t3;
}
_s(ProtectedRoute, "dy7xWVrvVVXL01ZnDuupSciFaow=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$hooks$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = ProtectedRoute;
var _c;
__turbopack_context__.k.register(_c, "ProtectedRoute");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/SimpliSync/simplisync/src/utils/geo.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALLOWED_RADIUS_METERS",
    ()=>ALLOWED_RADIUS_METERS,
    "OFFICE_LAT",
    ()=>OFFICE_LAT,
    "OFFICE_LNG",
    ()=>OFFICE_LNG,
    "getDistanceFromLatLonInMeters",
    ()=>getDistanceFromLatLonInMeters,
    "isWithinSmartZone",
    ()=>isWithinSmartZone
]);
const OFFICE_LAT = 14.88;
const OFFICE_LNG = 120.28;
const ALLOWED_RADIUS_METERS = 50; // The employee must be within 50 meters
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2)=>{
    const R = 6371e3; // Radius of the Earth in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
};
const deg2rad = (deg)=>{
    return deg * (Math.PI / 180);
};
const isWithinSmartZone = (userLat, userLng)=>{
    const distance = getDistanceFromLatLonInMeters(userLat, userLng, OFFICE_LAT, OFFICE_LNG);
    return distance <= ALLOWED_RADIUS_METERS;
// 1. Call the 'getDistanceFromLatLonInMeters' function using the user's location and the OFFICE location.
// 2. Save the result in a variable called 'distance'.
// 3. Write an 'if' statement: If 'distance' is less than or equal to ALLOWED_RADIUS_METERS, return true.
// 4. Else, return false.
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/SimpliSync/simplisync/src/services/attendance.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clockInEmployee",
    ()=>clockInEmployee
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/lib/firebase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$utils$2f$geo$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/utils/geo.ts [app-client] (ecmascript)");
;
;
;
const clockInEmployee = async (userId, latitude, longitude)=>{
    try {
        const isValidLocation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$utils$2f$geo$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWithinSmartZone"])(latitude, longitude);
        if (!isValidLocation) {
            throw new Error("Out_Of_Smart_Zone.");
        }
        // YOUR MISSION GOES HERE:
        // 1. Define the collection you want to target (Hint: use the 'collection' function)
        // 2. Use 'addDoc' to create a new record.
        // 3. The record must contain: userId, timeIn, lat, lng, and a default status of "Pending".
        // 4. For timeIn, you MUST use the imported 'serverTimestamp()' function.
        // Return true if it succeeds!
        const attendanceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "attendanceLogs");
        const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addDoc"])(attendanceRef, {
            userId,
            timeIn: (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])(),
            lat: latitude,
            lng: longitude,
            status: "Valid"
        });
        console.log("Attendance record created with ID:", docRef.id);
        return true;
    } catch (error) {
        if (error instanceof Error && error.message === "Out_Of_Smart_Zone.") {
            throw new Error("You are outside the allowed area. Please move closer to the office to clock in.");
        }
        console.error("Database Error:", error);
        throw new Error("Failed to clock in. Please try again.");
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ClockInButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$hooks$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/hooks/useAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$services$2f$attendance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/services/attendance.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function ClockInButton() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$hooks$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [statusMsg, setStatusMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleClockIn = ()=>{
        setIsLoading(true);
        setStatusMsg(""); // Reset previous message
        // Simulate slight delay for GPS feeling
        setTimeout(()=>{
            setStatusMsg("Acquiring satellite lock...");
            if (!navigator.geolocation) {
                setStatusMsg("Geolocation is not supported by your browser.");
                setIsLoading(false);
                return;
            }
            navigator.geolocation.getCurrentPosition(async (position)=>{
                const { latitude, longitude } = position.coords;
                try {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$services$2f$attendance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clockInEmployee"])(user?.uid || "", latitude, longitude);
                    setStatusMsg("Ika'y nakapag Clock In na!");
                } catch (error) {
                    if (error instanceof Error && error.message === "Please allow location access to clock in.") {
                        setStatusMsg(error.message);
                    } else if (error instanceof Error && error.message.includes("You are outside the allowed area")) {
                        setStatusMsg(error.message);
                    } else {
                        setStatusMsg(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.");
                    }
                } finally{
                    setIsLoading(false);
                }
            }, ()=>{
                setStatusMsg("Please allow location access to clock in.");
                setIsLoading(false);
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            } // Request higher accuracy if possible
            );
        }, 600);
    };
    const isSuccessMessage = statusMsg?.includes("Ika'y nakapag Clock In na");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center gap-6 mt-6 p-8 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] w-full max-w-sm relative overflow-hidden group hover:border-teal-400/50 dark:hover:border-teal-500/30 transition-all duration-500",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute -top-24 -left-24 w-48 h-48 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-teal-400/30 dark:group-hover:bg-teal-500/20"
            }, void 0, false, {
                fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 flex flex-col items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-xl font-light text-gray-900 dark:text-white tracking-wide transition-colors",
                        children: "Time & Attendance"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500 dark:text-gray-400 transition-colors",
                        children: "Record your shift exactly at your current location."
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleClockIn,
                disabled: isLoading,
                className: `relative z-10 overflow-hidden w-40 h-40 rounded-full flex flex-col items-center justify-center font-bold text-white transition-all duration-300 shadow-lg dark:shadow-xl 
          ${isLoading ? "bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 scale-95 shadow-none dark:shadow-none" : "bg-gradient-to-tr from-teal-500 to-emerald-400 dark:from-teal-600 dark:to-emerald-400 hover:from-teal-400 hover:to-emerald-300 dark:hover:from-teal-500 dark:hover:to-emerald-300 hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(20,184,166,0.3)] dark:shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:shadow-[0_8px_30px_rgba(20,184,166,0.4)] dark:hover:shadow-[0_0_60px_rgba(20,184,166,0.6)]"}`,
                children: isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "animate-spin h-8 w-8 text-teal-600 dark:text-teal-400 mb-2 transition-colors",
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    className: "opacity-25",
                                    cx: "12",
                                    cy: "12",
                                    r: "10",
                                    stroke: "currentColor",
                                    strokeWidth: "4"
                                }, void 0, false, {
                                    fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                                    lineNumber: 69,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    className: "opacity-75",
                                    fill: "currentColor",
                                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                }, void 0, false, {
                                    fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                                    lineNumber: 70,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                            lineNumber: 68,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-sm uppercase tracking-wider text-teal-700 dark:text-teal-400 font-semibold text-center leading-tight transition-colors",
                            children: [
                                "Syncing",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                                    lineNumber: 72,
                                    columnNumber: 162
                                }, this),
                                "Location"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                            lineNumber: 72,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "w-10 h-10 mb-1 opacity-90 drop-shadow-md",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24",
                            xmlns: "http://www.w3.org/2000/svg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: 2,
                                d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            }, void 0, false, {
                                fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                                lineNumber: 75,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                            lineNumber: 74,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-lg uppercase tracking-widest drop-shadow-md",
                            children: "Clock In"
                        }, void 0, false, {
                            fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                            lineNumber: 77,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            }, void 0, false, {
                fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this),
            statusMsg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `relative z-10 p-3 w-full rounded-xl text-center text-sm font-medium animate-fade-in transition-all ${isSuccessMessage ? "bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : isLoading ? "bg-teal-100 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 text-teal-700 dark:text-teal-300 animate-pulse" : "bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400"}`,
                children: statusMsg
            }, void 0, false, {
                fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
                lineNumber: 82,
                columnNumber: 21
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx",
        lineNumber: 55,
        columnNumber: 10
    }, this);
}
_s(ClockInButton, "EYUA3LBwWRu5LQItDeBhzm+5HB4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$hooks$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = ClockInButton;
var _c;
__turbopack_context__.k.register(_c, "ClockInButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$components$2f$ProtectedRoute$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/components/ProtectedRoute.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$hooks$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/hooks/useAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/lib/firebase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/@firebase/auth/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$components$2f$ClockInButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/components/ClockInButton.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function DashboardPage() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(31);
    if ($[0] !== "233fd792f503898ed18b6e17471d68f59111bd8db6fb7763cdbcefcd89f569a8") {
        for(let $i = 0; $i < 31; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "233fd792f503898ed18b6e17471d68f59111bd8db6fb7763cdbcefcd89f569a8";
    }
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$hooks$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    let t0;
    if ($[1] !== router) {
        t0 = ({
            "DashboardPage[handleLogout]": async ()=>{
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signOut"])(__TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]);
                router.push("/login");
            }
        })["DashboardPage[handleLogout]"];
        $[1] = router;
        $[2] = t0;
    } else {
        t0 = $[2];
    }
    const handleLogout = t0;
    let t1;
    let t2;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 39,
            columnNumber: 10
        }, this);
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 40,
            columnNumber: 10
        }, this);
        $[3] = t1;
        $[4] = t2;
    } else {
        t1 = $[3];
        t2 = $[4];
    }
    let t3;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-10 h-10 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                viewBox: "0 0 100 100",
                className: "w-full h-full drop-shadow-md",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M25 65C15 65 10 55 15 45C18 38 25 35 30 35C35 20 55 15 65 25C75 20 85 25 90 35C95 45 90 60 75 60",
                        stroke: "#0f766e",
                        strokeWidth: "6",
                        strokeLinecap: "round",
                        strokeLinejoin: "round"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                        lineNumber: 49,
                        columnNumber: 185
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "42",
                        y: "30",
                        width: "15",
                        height: "40",
                        fill: "#ffffff"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                        lineNumber: 49,
                        columnNumber: 372
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                        points: "42,30 49.5,20 57,30",
                        fill: "#ffffff"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                        lineNumber: 49,
                        columnNumber: 432
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M20 55 C 30 75, 55 75, 65 55 L 75 55 L 60 35 L 55 50",
                        fill: "#14b8a6"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                        lineNumber: 49,
                        columnNumber: 487
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                lineNumber: 49,
                columnNumber: 70
            }, this)
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 49,
            columnNumber: 10
        }, this);
        $[5] = t3;
    } else {
        t3 = $[5];
    }
    let t4;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3",
            children: [
                t3,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-xl font-light tracking-wider hidden sm:block text-gray-900 dark:text-gray-100 transition-colors",
                    children: [
                        "Simpli",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "font-semibold text-teal-600 dark:text-teal-400",
                            children: "Sync"
                        }, void 0, false, {
                            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                            lineNumber: 56,
                            columnNumber: 178
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                    lineNumber: 56,
                    columnNumber: 55
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 56,
            columnNumber: 10
        }, this);
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    let t5;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold transition-colors",
            children: "Logged in as"
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 63,
            columnNumber: 10
        }, this);
        $[7] = t5;
    } else {
        t5 = $[7];
    }
    const t6 = user?.email;
    let t7;
    if ($[8] !== t6) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "hidden md:flex flex-col items-end",
            children: [
                t5,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm text-gray-700 dark:text-gray-200 font-medium transition-colors",
                    children: t6
                }, void 0, false, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                    lineNumber: 71,
                    columnNumber: 65
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 71,
            columnNumber: 10
        }, this);
        $[8] = t6;
        $[9] = t7;
    } else {
        t7 = $[9];
    }
    let t8;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: "Logout"
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 79,
            columnNumber: 10
        }, this);
        $[10] = t8;
    } else {
        t8 = $[10];
    }
    let t9;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-4 h-4 opacity-70",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            }, void 0, false, {
                fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                lineNumber: 86,
                columnNumber: 135
            }, this)
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 86,
            columnNumber: 10
        }, this);
        $[11] = t9;
    } else {
        t9 = $[11];
    }
    let t10;
    if ($[12] !== handleLogout) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: handleLogout,
            className: "px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-white/20 transition-all active:scale-95 flex items-center gap-2",
            children: [
                t8,
                t9
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 93,
            columnNumber: 11
        }, this);
        $[12] = handleLogout;
        $[13] = t10;
    } else {
        t10 = $[13];
    }
    let t11;
    if ($[14] !== t10 || $[15] !== t7) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
            className: "relative z-20 w-full border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 transition-colors duration-500",
            children: [
                t4,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-6",
                    children: [
                        t7,
                        t10
                    ]
                }, void 0, true, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                    lineNumber: 101,
                    columnNumber: 233
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 101,
            columnNumber: 11
        }, this);
        $[14] = t10;
        $[15] = t7;
        $[16] = t11;
    } else {
        t11 = $[16];
    }
    let t12;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {
            className: "sm:hidden"
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 110,
            columnNumber: 11
        }, this);
        $[17] = t12;
    } else {
        t12 = $[17];
    }
    let t13;
    if ($[18] !== user?.email) {
        t13 = user?.email?.split("@")[0];
        $[18] = user?.email;
        $[19] = t13;
    } else {
        t13 = $[19];
    }
    let t14;
    if ($[20] !== t13) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            className: "text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 transition-colors",
            children: [
                "Welcome back, ",
                t12,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-400 dark:from-teal-400 dark:to-emerald-300",
                    children: t13
                }, void 0, false, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                    lineNumber: 125,
                    columnNumber: 145
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 125,
            columnNumber: 11
        }, this);
        $[20] = t13;
        $[21] = t14;
    } else {
        t14 = $[21];
    }
    let t15;
    if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-lg text-gray-500 dark:text-gray-400 transition-colors",
            children: "Your HR Dashboard is ready for your shift."
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 133,
            columnNumber: 11
        }, this);
        $[22] = t15;
    } else {
        t15 = $[22];
    }
    let t16;
    if ($[23] !== t14) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full text-center space-y-4 mb-12 animate-fade-in-up",
            children: [
                t14,
                t15
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 140,
            columnNumber: 11
        }, this);
        $[23] = t14;
        $[24] = t16;
    } else {
        t16 = $[24];
    }
    let t17;
    if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full grid grid-cols-1 place-items-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$components$2f$ClockInButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                lineNumber: 148,
                columnNumber: 71
            }, this)
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 148,
            columnNumber: 11
        }, this);
        $[25] = t17;
    } else {
        t17 = $[25];
    }
    let t18;
    if ($[26] !== t16) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center",
            children: [
                t16,
                t17
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 155,
            columnNumber: 11
        }, this);
        $[26] = t16;
        $[27] = t18;
    } else {
        t18 = $[27];
    }
    let t19;
    if ($[28] !== t11 || $[29] !== t18) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$components$2f$ProtectedRoute$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "min-h-screen w-full bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-sans relative overflow-hidden transition-colors duration-500",
                children: [
                    t1,
                    t2,
                    t11,
                    t18
                ]
            }, void 0, true, {
                fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
                lineNumber: 163,
                columnNumber: 27
            }, this)
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/dashboard/page.tsx",
            lineNumber: 163,
            columnNumber: 11
        }, this);
        $[28] = t11;
        $[29] = t18;
        $[30] = t19;
    } else {
        t19 = $[30];
    }
    return t19;
}
_s(DashboardPage, "DwGEr52mpQfmk+YR1bVbJ/QN+n0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$hooks$2f$useAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = DashboardPage;
var _c;
__turbopack_context__.k.register(_c, "DashboardPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/SimpliSync/simplisync/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/SimpliSync/simplisync/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=SimpliSync_simplisync_eb46cb7f._.js.map