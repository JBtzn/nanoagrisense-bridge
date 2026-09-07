import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function SMSLogin({ onLoginSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState(''); // Include country code, e.g., +639xxxxxxxxx
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize invisible reCAPTCHA on component mount
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved, proceed with SMS sending
        }
      });
    }
  }, []);

  // Phase 1: Request SMS Verification Code
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Format check: ensure phone starts with +63 for local PH numbers
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('09')) {
      formattedPhone = '+63' + formattedPhone.substring(1);
    }

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      console.log("📨 SMS OTP sent successfully to " + formattedPhone);
    } catch (err) {
      console.error(err);
      setError("Failed to send SMS. Please double-check the phone number format (+63).");
      // Reset reCAPTCHA if it fails
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Verify OTP Entered by User
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;
      
      // Extract JWT ID Token to send to Railway API
      const token = await user.getIdToken();
      localStorage.setItem('token', token);

      onLoginSuccess(user);
    } catch (err) {
      setError("Incorrect OTP code. Please request a new code or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-green-800">NanoAgriSense</h2>
          <p className="mt-2 text-sm text-gray-600">Farmer Verification Portal</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* This invisible div is required for Firebase reCAPTCHA */}
        <div id="recaptcha-container"></div>

        {!confirmationResult ? (
          // STEP 1: Phone Number Entry
          <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number (PH)</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  +63
                </span>
                <input
                  type="tel"
                  required
                  placeholder="9171234567"
                  className="appearance-none rounded-none rounded-r-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 text-sm font-semibold rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 disabled:opacity-50"
            >
              {loading ? 'Sending SMS...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          // STEP 2: 6-Digit OTP Entry
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Enter 6-Digit Code</label>
              <input
                type="text"
                maxLength="6"
                required
                placeholder="123456"
                className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 tracking-widest text-center font-bold text-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 text-sm font-semibold rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-xs text-green-700 hover:underline"
                onClick={() => setConfirmationResult(null)}
              >
                Change Phone Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}