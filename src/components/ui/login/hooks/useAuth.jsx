import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTimer from './useTimer';

const useAuth = (initialTime, setIsAuthenticated) => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const { time, canResendOtp, resetTimer } = useTimer(initialTime);
  const navigate = useNavigate();

  const isEmail = (input) => /\S+@\S+\.\S+/.test(input);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEmail(identifier)) {
      setIsSendingOtp(true);
      try {
        // Check if the email is present in the database
        const checkResponse = await fetch('http://localhost:5000/api/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier }),
        });

        const checkResult = await checkResponse.json();

        if (checkResult.exists) {
          // Email exists, proceed to send OTP
          const response = await fetch('http://localhost:5000/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: identifier }),
          });

          if (response.ok) {
            setOtpSent(true);
            setError('');
            resetTimer();
          } else {
            throw new Error('Failed to send OTP. Please try again.');
          }
        } else {
          setError('Email not found. Please register first.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSendingOtp(false);
      }
    } else {
      setError('Please enter a valid email');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    try {
      const response = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp: otpString }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error verifying OTP');
      }

      const result = await response.json();
      if (result.success) {
        setIsAuthenticated(true);
        navigate('/OrderPage', { state: { email: identifier } });
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (/^\d$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
    }
  };

  const handleChangeIdentifier = () => {
    setOtpSent(false);
    setIdentifier('');
    setOtp(Array(6).fill(''));
    setError('');
  };

  return {
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
  };
};

export default useAuth;
