import { useState, useEffect } from 'react';

const useTimer = (initialTime) => {
  const [time, setTime] = useState(initialTime);
  const [canResendOtp, setCanResendOtp] = useState(false);

  useEffect(() => {
    let timer;
    if (time > 0) {
      timer = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    } else {
      setCanResendOtp(true);
    }
    return () => clearInterval(timer);
  }, [time]);

  const resetTimer = () => {
    setTime(initialTime);
    setCanResendOtp(false);
  };

  return { time, canResendOtp, resetTimer };
};

export default useTimer;
