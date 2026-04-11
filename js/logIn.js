function passwordResetRedirectTo() {
  var configured = (window.ROLW_PASSWORD_RESET_REDIRECT_URL || '').trim();
  if (configured) {
    return configured;
  }
  return window.location.origin + '/logIn.html';
}

document.querySelector('.signup-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('form-error');

  errorEl.textContent = '';

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    errorEl.textContent = error.message;
    return;
  }

  window.location.href = 'dashboard.html';
});

document.getElementById('forgot-password-link').addEventListener('click', async function (e) {
  e.preventDefault();

  var email = document.getElementById('email').value.trim();
  var msgEl = document.getElementById('reset-message');
  msgEl.textContent = '';
  msgEl.style.color = '';

  if (!email) {
    msgEl.textContent = 'Enter your email above, then click Forgot password.';
    msgEl.style.color = '#d9534f';
    return;
  }

  var { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectTo()
  });

  if (error) {
    msgEl.textContent = error.message;
    msgEl.style.color = '#d9534f';
    return;
  }

  msgEl.textContent = 'Password reset link sent! Check your email.';
  msgEl.style.color = '#088395';
});

(function setupPasswordRecovery() {
  var loginSection = document.getElementById('login-section');
  var recoverySection = document.getElementById('password-recovery-section');
  var loginForm = document.querySelector('.signup-form');
  var newPw = document.getElementById('new-password');
  var confirmPw = document.getElementById('confirm-new-password');
  var saveBtn = document.getElementById('save-new-password');
  var recoveryError = document.getElementById('recovery-error');

  if (!recoverySection || !saveBtn) {
    return;
  }

  function showRecoveryUI() {
    recoverySection.hidden = false;
    if (loginForm) {
      loginForm.hidden = true;
    }
    if (loginSection) {
      loginSection.hidden = true;
    }
  }

  supabaseClient.auth.onAuthStateChange(function (event) {
    if (event === 'PASSWORD_RECOVERY') {
      showRecoveryUI();
    }
  });

  saveBtn.addEventListener('click', async function () {
    recoveryError.textContent = '';
    var a = newPw.value;
    var b = confirmPw.value;
    if (a !== b) {
      recoveryError.textContent = 'Passwords do not match.';
      return;
    }
    if (a.length < 6) {
      recoveryError.textContent = 'Use at least 6 characters.';
      return;
    }
    var { error } = await supabaseClient.auth.updateUser({ password: a });
    if (error) {
      recoveryError.textContent = error.message;
      return;
    }
    window.location.replace('dashboard.html');
  });
})();
