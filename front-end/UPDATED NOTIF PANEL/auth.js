import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// TODO: Replace with your actual Firebase Web Config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBP_EuXqM5sKocTR5y1q-fUkOSer2s8N6A",
  authDomain: "nanoagrisense-38592.firebaseapp.com",
  projectId: "nanoagrisense-38592",
  storageBucket: "nanoagrisense-38592.firebasestorage.app",
  messagingSenderId: "962914436686",
  appId: "1:962914436686:web:5d0a91d3b53e5f1c33a51f",
  measurementId: "G-9GCKR2CJFE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage();

const currentPage = window.location.pathname.split('/').pop();

// 1. Auth State Listener (The Bouncer)
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (currentPage === 'login.html' || currentPage === '') {
      window.location.href = 'index.html';
    }
  } else {
    if (currentPage !== 'login.html') {
      window.location.href = 'login.html';
    }
  }
});

let confirmationResult = null;

// Only run auth logic if we are actually on the login page
if (currentPage === 'login.html' || currentPage === '') {
  
  // Initialize Invisible reCAPTCHA
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    'size': 'invisible'
  });

  const phoneAuthForm = document.getElementById('phoneAuthForm');
  const phoneGroup = document.getElementById('phoneGroup');
  const codeGroup = document.getElementById('codeGroup');
  const authBtn = document.getElementById('authBtn');
  const errorMsg = document.getElementById('errorMessage');
  const instructionText = document.getElementById('instructionText');

  phoneAuthForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';

    // STEP 1: Sending the Code
    if (!confirmationResult) {
      const phoneNumber = document.getElementById('phoneNumber').value.trim();
      
      try {
        authBtn.textContent = 'Verifying...';
        authBtn.disabled = true;

        const appVerifier = window.recaptchaVerifier;
        // This pretends to send an SMS if the number is in your Test Numbers list
        confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        
        // Switch UI to ask for the code
        phoneGroup.style.display = 'none';
        codeGroup.style.display = 'flex';
        instructionText.textContent = 'Enter the static test code assigned to this number.';
        authBtn.textContent = 'Login';
        authBtn.disabled = false;
        
      } catch (error) {
        console.error("SMS Error:", error);
        errorMsg.textContent = 'Failed to verify phone number. Ensure it includes the country code (e.g., +63).';
        errorMsg.style.display = 'block';
        authBtn.textContent = 'Send Code';
        authBtn.disabled = false;
        // Reset recaptcha so they can try again
        window.recaptchaVerifier.render().then((widgetId) => {
          grecaptcha.reset(widgetId);
        });
      }
    } 
    // STEP 2: Confirming the Code
    else {
      const code = document.getElementById('otpCode').value.trim();
      
      try {
        authBtn.textContent = 'Authenticating...';
        authBtn.disabled = true;

        // Verify the hardcoded test OTP
        await confirmationResult.confirm(code);
        // onAuthStateChanged will redirect automatically upon success
      } catch (error) {
        console.error("OTP Error:", error);
        errorMsg.textContent = 'Invalid code. Please try again.';
        errorMsg.style.display = 'block';
        authBtn.textContent = 'Login';
        authBtn.disabled = false;
      }
    }
  });
}

export const logoutUser = () => {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  });
};

// Attach logout function to the dashboard navigation button
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevents the browser from jumping to the top of the page
    logoutUser();
  });
}

export { auth };