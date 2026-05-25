"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useIdleMonitor = (idleMinutes = 30, warningMinutes = 5) => {
  const { isClockedIn } = useAuth();
  
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false);
  const [countdownMinutes, setCountdownMinutes] = useState(warningMinutes);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  const idleTimeMs = idleMinutes * 60 * 1000;
  const warningTimeMs = warningMinutes * 60 * 1000;

  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Resets the main 30-minute timer whenever they move the mouse/type
  const resetIdleTimer = useCallback(() => {
    if (isIdleWarningOpen || !isClockedIn) return;

    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    idleTimeoutRef.current = setTimeout(() => {
      setIsIdleWarningOpen(true);
      endTimeRef.current = Date.now() + warningTimeMs;
    }, idleTimeMs);
  }, [isIdleWarningOpen, isClockedIn, idleTimeMs, warningTimeMs]);

  // Sets up the physical listeners
  useEffect(() => {
    if (!isClockedIn) return;

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    
    let throttleTimer: NodeJS.Timeout | undefined;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        resetIdleTimer();
        throttleTimer = undefined; // No more 'as any'
      }, 1000); 
    };

    events.forEach(e => window.addEventListener(e, handleActivity));
    resetIdleTimer(); // Start the timer on mount

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (throttleTimer) clearTimeout(throttleTimer); // Extra memory cleanup
    };
  }, [isClockedIn, resetIdleTimer]);

  const handleAutoClockOut = useCallback(async () => {
    // call the existing clockOut function here
    // e.g., await clockOutEmployee(user.uid, "System: Inactivity Timeout");
    setIsIdleWarningOpen(false);
    // Reload or redirect to trigger the "Next Day Resolution" logic
    window.location.reload(); 
  }, []);

  // Manages the 5-minute countdown clock
  useEffect(() => {
    if (isIdleWarningOpen && endTimeRef.current) {
      warningIntervalRef.current = setInterval(() => {
        const remainingMs = endTimeRef.current! - Date.now();
        
        if (remainingMs <= 0) {
          clearInterval(warningIntervalRef.current!);
          setCountdownMinutes(0);
          setCountdownSeconds(0);
          // FIRE AUTO CLOCK OUT HERE
          handleAutoClockOut(); 
        } else {
          setCountdownMinutes(Math.floor(remainingMs / 60000));
          setCountdownSeconds(Math.floor((remainingMs % 60000) / 1000));
        }
      }, 1000);
    }

    return () => {
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
    };
  }, [isIdleWarningOpen, handleAutoClockOut]); // Added to dependency array

  const cancelWarning = () => {
    setIsIdleWarningOpen(false);
    setCountdownMinutes(warningMinutes);
    setCountdownSeconds(0);
    resetIdleTimer();
  };

  return { isIdleWarningOpen, countdownMinutes, countdownSeconds, cancelWarning };
};