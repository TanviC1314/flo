// Component for the login form

import React from 'react';
import EmailInput from './emailInput';
import OtpInput from './otpInput';
import Button from './button';

const LoginForm = ({ otpSent, identifier, setIdentifier, handleSubmit, handleVerifyOtp, handleChangeIdentifier, handleOtpChange, otp, error, canResendOtp, time, isSendingOtp }) => (
  <form className="mt-8 space-y-6" onSubmit={otpSent ? handleVerifyOtp : handleSubmit}>
    <EmailInput
      identifier={identifier}
      setIdentifier={setIdentifier}
      otpSent={otpSent}
      handleChangeIdentifier={handleChangeIdentifier}
      canResendOtp={canResendOtp}
      handleResendOtp={handleSubmit}
      time={time}
    />
    {error && <div className="text-red-500">{error}</div>}
    {!otpSent ? (
      <Button onClick={handleSubmit} isSendingOtp={isSendingOtp}>
        Send OTP
      </Button>
    ) : (
      <>
        <OtpInput otp={otp} handleOtpChange={handleOtpChange} />
        <Button onClick={handleVerifyOtp} isSendingOtp={false}>
          Verify OTP
        </Button>
      </>
    )}
  </form>
);

export default LoginForm;
