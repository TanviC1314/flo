import React from 'react';
import LoginForm from './loginForm';
import useAuth from './hooks/useAuth';

const LoginPage = ({ setIsAuthenticated, setEmail }) => {
  const {
    identifier,
    setIdentifier,
    otp,
    otpSent,
    error,
    isSendingOtp,
    time,
    canResendOtp,
    handleSubmit,
    handleVerifyOtp,
    handleOtpChange,
    handleChangeIdentifier,
  } = useAuth(120, setIsAuthenticated);

  return (
    <div className="flex items-center justify-center min-h-screen bg-customBlue px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center w-full max-w-md">
        <h1 className="mb-6 text-5xl sm:text-5xl lg:text-7xl font-extrabold text-white">FLOBRIDGE</h1>
        <div className="w-full p-6 sm:p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold text-center">Verify</h2>
          <LoginForm
            otpSent={otpSent}
            identifier={identifier}
            setIdentifier={setIdentifier}
            handleSubmit={handleSubmit}
            handleVerifyOtp={(e) => handleVerifyOtp(e).then(() => setEmail(identifier))}
            handleChangeIdentifier={handleChangeIdentifier}
            handleOtpChange={handleOtpChange}
            otp={otp}
            error={error}
            canResendOtp={canResendOtp}
            time={time}
            isSendingOtp={isSendingOtp}
          />
          {otpSent && (
            <div className="mt-4 text-center text-green-500">
              OTP sent to {identifier}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
