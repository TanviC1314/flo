import React, { useState, useEffect } from 'react';

const Button = ({ onClick, isSendingOtp, children }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isSendingOtp) {
      const interval = setInterval(() => {
        setDots(prevDots => (prevDots.length < 3 ? prevDots + '.' : ''));
      }, 500);

      return () => clearInterval(interval);
    } else {
      setDots(''); // Reset dots when not sending OTP
    }
  }, [isSendingOtp]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-customBlue border border-transparent rounded-md group hover:bg-customBlue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-customBlue"
      disabled={isSendingOtp}
    >
      {isSendingOtp ? `Sending${dots}` : children}
    </button>
  );
};

export default Button;
