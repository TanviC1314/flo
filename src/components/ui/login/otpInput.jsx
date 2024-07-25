// Component for OTP input fields

import React, { useEffect, useRef } from 'react';

const OtpInput = ({ otp, handleOtpChange }) => {
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0].focus();
  }, []);

  const handleKeyUp = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputs.current[index - 1].focus();
      }
    } else if (/^\d$/.test(e.key)) {
      if (index < otp.length - 1) {
        inputs.current[index + 1].focus();
      }
    }
  };

  return (
    <div className="flex justify-between space-x-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          id={`otp-${index}`}
          type="text"
          maxLength="1"
          value={digit}
          onChange={(e) => handleOtpChange(e, index)}
          onKeyUp={(e) => handleKeyUp(e, index)}
          className="w-10 h-10 text-center text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-customBlue focus:border-customBlue sm:text-sm"
          aria-label={`Enter OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
