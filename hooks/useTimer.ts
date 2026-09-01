"use client";

import { useState, useEffect } from "react";

export function useTimer(endsAt: number | null, isPaused: boolean = false) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  useEffect(() => {
    if (!endsAt || isPaused) {
      return;
    }

    const calculate = () => {
      const diff = endsAt - Date.now();
      if (diff <= 0) {
        setSecondsRemaining(0);
        setIsTimeUp(true);
      } else {
        setSecondsRemaining(Math.ceil(diff / 1000));
        setIsTimeUp(false);
      }
    };

    calculate();
    const interval = setInterval(calculate, 200);

    return () => clearInterval(interval);
  }, [endsAt, isPaused]);

  return { secondsRemaining, isTimeUp };
}
