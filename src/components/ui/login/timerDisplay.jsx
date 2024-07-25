import React from 'react';

const TimerDisplay = ({ time }) => (
  <span>
    Resend OTP in {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
  </span>
);

export default TimerDisplay;
