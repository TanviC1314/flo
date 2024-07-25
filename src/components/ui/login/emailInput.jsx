// Component for the email input field

import React from 'react';

const EmailInput = ({ identifier, setIdentifier, otpSent, handleChangeIdentifier, canResendOtp, handleResendOtp, time }) => (
  <div className="rounded-md shadow-sm">
    <div className="flex flex-col items-start">
      <input
        id="identifier"
        name="identifier"
        type="text"
        autoComplete="identifier"
        required
        aria-label="Email"
        aria-required="true"
        className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-customBlue focus:border-customBlue focus:z-10 sm:text-sm"
        placeholder="Enter email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        disabled={otpSent}
      />
      {otpSent && (
        <div className="flex justify-between w-full mt-1 text-xs text-customBlue">
          <button
            type="button"
            onClick={handleChangeIdentifier}
            className="hover:underline"
          >
            Change
          </button>
          {canResendOtp ? (
            <button
              type="button"
              onClick={handleResendOtp}
              className="hover:underline"
            >
              Resend OTP
            </button>
          ) : (
            <span>Resend OTP in {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</span>
          )}
        </div>
      )}
    </div>
  </div>
);

export default EmailInput;
