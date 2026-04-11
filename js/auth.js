window.userRole = null;
window.userName = null;

function hasRole(...roles) {
  return roles.includes(window.userRole);
}

(async function () {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = 'logIn.html';
    return;
  }

  var meta = session.user.user_metadata || {};
  window.userName = meta.first_name || null;

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    window.userRole = 'member';
  } else {
    window.userRole = profile.role;
  }

  document.querySelectorAll('[data-role-required]').forEach(function (el) {
    var allowed = el.getAttribute('data-role-required').split(',');
    if (!hasRole(...allowed)) {
      el.style.display = 'none';
    }
  });

  document.dispatchEvent(new Event('authReady'));
})();

async function signOut() {
  await supabaseClient.auth.signOut();
  window.location.href = 'logIn.html';
}
