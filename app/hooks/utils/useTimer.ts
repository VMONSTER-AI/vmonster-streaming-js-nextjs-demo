import { useCallback, useEffect, useState } from "react";

// setTimer로 지정한 시간(초)이 경과하면 callback을 실행하는 타이머 훅
const useTimer = ({ callback }: { callback: () => void }) => {
  const [startTime, setStartTime] = useState<number>();
  const [timeAmount, setTimeAmount] = useState<number>();
  const [remainingTime, setRemainingTime] = useState<number>();
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (remainingTime && remainingTime > 0) {
      setIsRunning(true);
      const intervalId = setInterval(() => {
        if (timeAmount && startTime) {
          const currentTime = Date.now();
          const elapsedTime = Math.floor((currentTime - startTime) / 1000);
          const newRemainingTime = Math.max(0, timeAmount - elapsedTime);

          if (remainingTime !== newRemainingTime) {
            setRemainingTime(newRemainingTime);
          }
        }
      }, 100);
      return () => clearInterval(intervalId);
    } else if (remainingTime === 0 && isRunning) {
      console.log("callback");
      callback();
      setIsRunning(false);
    }
  }, [startTime, remainingTime, timeAmount, callback, isRunning]);

  const setTimer = useCallback((time: number) => {
    setStartTime(Date.now());
    setTimeAmount(time);
    setRemainingTime(time);
  }, []);

  return { remainingTime, setTimer };
};
export default useTimer;
