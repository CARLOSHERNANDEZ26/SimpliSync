(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/SimpliSync/simplisync/src/services/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loginEmployee",
    ()=>loginEmployee
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/lib/firebase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/@firebase/auth/dist/esm/index.js [app-client] (ecmascript)");
;
;
const loginEmployee = async (email, password)=>{
    try {
        const userCredential = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signInWithEmailAndPassword"])(__TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], email, password);
        return userCredential.user; // Return the user object on successful login
    } catch (error) {
        const firebaseError = error;
        console.error("Internal auth error:", firebaseError.code);
        throw new Error("Invalido");
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/SimpliSync/simplisync/src/app/login/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$services$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/src/services/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/SimpliSync/simplisync/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function LoginPage() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(33);
    if ($[0] !== "d1358e6e0b47297792d73681436274c256fb9fa0cae59d9e7bb1dfedb3087f14") {
        for(let $i = 0; $i < 33; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "d1358e6e0b47297792d73681436274c256fb9fa0cae59d9e7bb1dfedb3087f14";
    }
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [errorMsg, setErrorMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    let t0;
    if ($[1] !== email || $[2] !== password || $[3] !== router) {
        t0 = ({
            "LoginPage[handleLogin]": async (e)=>{
                e.preventDefault();
                setErrorMsg("");
                setIsLoading(true);
                ;
                try {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$src$2f$services$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["loginEmployee"])(email, password);
                    router.push("/dashboard");
                } catch (t1) {
                    const error = t1;
                    const authError = error;
                    setErrorMsg(authError.message);
                    setIsLoading(false);
                }
            }
        })["LoginPage[handleLogin]"];
        $[1] = email;
        $[2] = password;
        $[3] = router;
        $[4] = t0;
    } else {
        t0 = $[4];
    }
    const handleLogin = t0;
    let t1;
    let t2;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/30 dark:bg-teal-600/20 rounded-full blur-[120px] pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 50,
            columnNumber: 10
        }, this);
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 51,
            columnNumber: 10
        }, this);
        $[5] = t1;
        $[6] = t2;
    } else {
        t1 = $[5];
        t2 = $[6];
    }
    let t3;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative w-24 h-24 mb-4 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                viewBox: "0 0 100 100",
                className: "w-full h-full drop-shadow-lg",
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
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 199
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "35",
                        y: "45",
                        width: "10",
                        height: "25",
                        fill: "#9ca3af"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 386
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                        points: "35,45 40,38 45,45",
                        fill: "#9ca3af"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 446
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "55",
                        y: "40",
                        width: "12",
                        height: "30",
                        fill: "#9ca3af"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 499
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                        points: "55,40 61,30 67,40",
                        fill: "#9ca3af"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 559
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "42",
                        y: "30",
                        width: "15",
                        height: "40",
                        fill: "#ffffff"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 612
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                        points: "42,30 49.5,20 57,30",
                        fill: "#ffffff"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 672
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "42",
                        y: "55",
                        width: "15",
                        height: "15",
                        fill: "#0f766e"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 727
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M20 55 C 30 75, 55 75, 65 55 L 75 55 L 60 35 L 55 50",
                        fill: "#14b8a6"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 787
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                lineNumber: 60,
                columnNumber: 84
            }, this)
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 60,
            columnNumber: 10
        }, this);
        $[7] = t3;
    } else {
        t3 = $[7];
    }
    let t4;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center justify-center mb-10",
            children: [
                t3,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-3xl font-light tracking-widest text-gray-900 dark:text-white mt-2 transition-colors",
                    children: [
                        "Simpli",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "font-semibold text-teal-600 dark:text-teal-400",
                            children: "Sync"
                        }, void 0, false, {
                            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                            lineNumber: 67,
                            columnNumber: 190
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                    lineNumber: 67,
                    columnNumber: 79
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-600 dark:text-gray-400 text-sm mt-2 tracking-wide transition-colors",
                    children: "Enterprise Synchronization"
                }, void 0, false, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                    lineNumber: 67,
                    columnNumber: 271
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 67,
            columnNumber: 10
        }, this);
        $[8] = t4;
    } else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== errorMsg) {
        t5 = errorMsg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-500 text-sm font-medium text-center animate-pulse transition-colors",
            children: errorMsg
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 74,
            columnNumber: 22
        }, this);
        $[9] = errorMsg;
        $[10] = t5;
    } else {
        t5 = $[10];
    }
    let t6;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1 transition-colors",
            children: "Email Address"
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 82,
            columnNumber: 10
        }, this);
        $[11] = t6;
    } else {
        t6 = $[11];
    }
    let t7;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = ({
            "LoginPage[<input>.onChange]": (e_0)=>setEmail(e_0.target.value)
        })["LoginPage[<input>.onChange]"];
        $[12] = t7;
    } else {
        t7 = $[12];
    }
    let t8;
    if ($[13] !== email) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col gap-1.5",
            children: [
                t6,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative group",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "email",
                        placeholder: "admin@simplisync.local",
                        value: email,
                        onChange: t7,
                        className: "w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-300 shadow-sm dark:shadow-none",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 98,
                        columnNumber: 85
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                    lineNumber: 98,
                    columnNumber: 53
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 98,
            columnNumber: 10
        }, this);
        $[13] = email;
        $[14] = t8;
    } else {
        t8 = $[14];
    }
    let t9;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-between items-center ml-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    className: "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors",
                    children: "Password"
                }, void 0, false, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                    lineNumber: 106,
                    columnNumber: 66
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "text-xs text-teal-600 dark:text-teal-500 hover:text-teal-700 dark:hover:text-teal-400 transition-colors",
                    children: "Forgot?"
                }, void 0, false, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                    lineNumber: 106,
                    columnNumber: 199
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 106,
            columnNumber: 10
        }, this);
        $[15] = t9;
    } else {
        t9 = $[15];
    }
    let t10;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = ({
            "LoginPage[<input>.onChange]": (e_1)=>setPassword(e_1.target.value)
        })["LoginPage[<input>.onChange]"];
        $[16] = t10;
    } else {
        t10 = $[16];
    }
    let t11;
    if ($[17] !== password) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col gap-1.5",
            children: [
                t9,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative group",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "password",
                        placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                        value: password,
                        onChange: t10,
                        className: "w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-300 shadow-sm dark:shadow-none",
                        required: true
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 122,
                        columnNumber: 86
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                    lineNumber: 122,
                    columnNumber: 54
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 122,
            columnNumber: 11
        }, this);
        $[17] = password;
        $[18] = t11;
    } else {
        t11 = $[18];
    }
    let t12;
    if ($[19] !== isLoading) {
        t12 = isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "animate-spin h-5 w-5 text-white",
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
                    fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                    lineNumber: 130,
                    columnNumber: 139
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    className: "opacity-75",
                    fill: "currentColor",
                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                }, void 0, false, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                    lineNumber: 130,
                    columnNumber: 233
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 130,
            columnNumber: 23
        }, this) : "Sign In";
        $[19] = isLoading;
        $[20] = t12;
    } else {
        t12 = $[20];
    }
    let t13;
    if ($[21] !== isLoading || $[22] !== t12) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "submit",
            disabled: isLoading,
            className: "mt-4 w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-semibold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(20,184,166,0.39)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.23)] dark:shadow-[0_0_20px_rgba(20,184,166,0.3)] dark:hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none",
            children: t12
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 138,
            columnNumber: 11
        }, this);
        $[21] = isLoading;
        $[22] = t12;
        $[23] = t13;
    } else {
        t13 = $[23];
    }
    let t14;
    if ($[24] !== handleLogin || $[25] !== t11 || $[26] !== t13 || $[27] !== t8) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
            onSubmit: handleLogin,
            className: "flex flex-col gap-6",
            children: [
                t8,
                t11,
                t13
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 147,
            columnNumber: 11
        }, this);
        $[24] = handleLogin;
        $[25] = t11;
        $[26] = t13;
        $[27] = t8;
        $[28] = t14;
    } else {
        t14 = $[28];
    }
    let t15;
    if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mt-8 text-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-500 dark:text-gray-500 transition-colors",
                children: [
                    "Secure login provided by ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-700 dark:text-gray-400 font-medium",
                        children: "SimpliSync Auth"
                    }, void 0, false, {
                        fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                        lineNumber: 158,
                        columnNumber: 144
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                lineNumber: 158,
                columnNumber: 45
            }, this)
        }, void 0, false, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 158,
            columnNumber: 11
        }, this);
        $[29] = t15;
    } else {
        t15 = $[29];
    }
    let t16;
    if ($[30] !== t14 || $[31] !== t5) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "min-h-screen w-full bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-500",
            children: [
                t1,
                t2,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative z-10 w-full max-w-md p-8 sm:p-10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-500",
                    children: [
                        t4,
                        t5,
                        t14,
                        t15
                    ]
                }, void 0, true, {
                    fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
                    lineNumber: 165,
                    columnNumber: 186
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/SimpliSync/simplisync/src/app/login/page.tsx",
            lineNumber: 165,
            columnNumber: 11
        }, this);
        $[30] = t14;
        $[31] = t5;
        $[32] = t16;
    } else {
        t16 = $[32];
    }
    return t16;
}
_s(LoginPage, "UVhsnzgpt7qy9ATwd2C92r5f53A=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$SimpliSync$2f$simplisync$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = LoginPage;
var _c;
__turbopack_context__.k.register(_c, "LoginPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/SimpliSync/simplisync/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/SimpliSync/simplisync/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=SimpliSync_simplisync_0cfee4fb._.js.map