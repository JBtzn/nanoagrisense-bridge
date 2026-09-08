const form = document.getElementById('loginForm');
const mobile = document.getElementById('mobile');
const errorText = document.getElementById('mobileError');
const sendBtn = document.getElementById('sendBtn');

form.addEventListener('submit', function(e){
  e.preventDefault();
  const digits = mobile.value.replace(/\D/g, '');

  if(digits.length < 10){
    errorText.textContent = 'Enter a valid 10-digit mobile number.';
    mobile.focus();
    return;
  }

  errorText.textContent = '';
  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending OTP…';

  // Placeholder for real OTP dispatch call
  setTimeout(() => {
    sendBtn.textContent = 'OTP sent — check your SMS';
  }, 1200);
});

mobile.addEventListener('input', () => { errorText.textContent = ''; });
