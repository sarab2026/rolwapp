function passwordResetRedirectTo() {
  var configured = (window.ROLW_PASSWORD_RESET_REDIRECT_URL || '').trim();
  var origin = window.location.origin;
  if (window.location.hostname === 'rolw.app') {
    origin = 'https://www.rolw.app';
  }
  var url = (configured || origin + '/reset-password.html').trim();
  url = url.replace(/^[\s\u00a0\u200b]+|[\s\u00a0\u200b]+$/g, '');
  url = url.replace(/^(https?:\/\/[^/?#]+)(?:%20|\s)+(?=\/|\?|#|$)/i, '$1');
  return url;
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

  try {
    localStorage.setItem('rolw_pw_reset_started', String(Date.now()));
  } catch (e) {}

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

  var qs = window.location.search || '';
  var hashRaw = (window.location.hash || '').replace(/^#/, '');
  var hp = new URLSearchParams(hashRaw);
  var typeRecovery = (hp.get('type') || '').toLowerCase() === 'recovery' || hashRaw.indexOf('type%3Drecovery') !== -1;

  var resetStarted = null;
  try {
    resetStarted = localStorage.getItem('rolw_pw_reset_started');
  } catch (e) {}

  var codePresent = /[?&]code=/.test(qs);
  var withinWindow = resetStarted && !isNaN(parseInt(resetStarted, 10)) && Date.now() - parseInt(resetStarted, 10) < 24 * 60 * 60 * 1000;

  if (typeRecovery) {
    showRecoveryUI();
  } else if (codePresent && withinWindow) {
    try {
      localStorage.removeItem('rolw_pw_reset_started');
    } catch (e) {}
    showRecoveryUI();
  }

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
    try {
      localStorage.removeItem('rolw_pw_reset_started');
    } catch (e) {}
    window.location.replace('dashboard.html');
  });
})();
