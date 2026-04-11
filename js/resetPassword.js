(function () {
  var newPw = document.getElementById('new-password');
  var confirmPw = document.getElementById('confirm-new-password');
  var saveBtn = document.getElementById('save-new-password');
  var recoveryError = document.getElementById('recovery-error');

  if (!saveBtn || !newPw || !confirmPw) {
    return;
  }

  supabaseClient.auth.onAuthStateChange(function (event) {
    if (event === 'PASSWORD_RECOVERY') {
      recoveryError.textContent = '';
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
    try {
      localStorage.removeItem('rolw_pw_reset_started');
    } catch (e) {}
    window.location.replace('dashboard.html');
  });
})();
