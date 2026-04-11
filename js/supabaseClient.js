const SUPABASE_URL = 'https://kyjkqjzyokymmidpplum.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5amtxanp5b2t5bW1pZHBwbHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTg3OTEsImV4cCI6MjA4OTg3NDc5MX0.H2uefzN9VBvrds5IgQ4YG8q0pKPKFgLSYM4ut51wU8Q';

/**
 * Password-reset return URL: leave '' to use current origin + /reset-password.html (see js/logIn.js).
 * PKCE reset links often use ?code= (no #hash). Root / is a tiny router (index.html), not the sign-up form (sign-up.html).
 *
 * Supabase Dashboard → Authentication → URL configuration (required):
 * - Use https://www.rolw.app only — not https://rolw.app. Apex→www redirects often drop the URL #hash (tokens), leaving rolw.app/# and a broken reset.
 * - Site URL: https://www.rolw.app (no trailing space — a space becomes %20 in links and breaks DNS)
 * - Redirect URLs (no trailing spaces), e.g.:
 *   https://www.rolw.app/reset-password.html
 *   https://www.rolw.app/logIn.html
 *   https://rolw-web-app.vercel.app/reset-password.html
 *   https://rolw-web-app.vercel.app/logIn.html
 *
 * ROLW_PASSWORD_RESET_REDIRECT_URL is set below to https://www.rolw.app/reset-password.html on production
 * so reset emails never use rolw.app (apex). Server redirects from apex strip #fragments and break implicit auth.
 *
 * Hosting: Vercel → Project → Settings → Domains → add www.rolw.app and rolw.app → DNS at registrar per Vercel.
 * Apex rolw.app redirects to www via vercel.json.
 */
(function () {
  var h = window.location.hostname;
  var isLocal = h === 'localhost' || h === '127.0.0.1';
  var isVercelHost = /\.vercel\.app$/i.test(h);
  window.ROLW_PASSWORD_RESET_REDIRECT_URL = isLocal || isVercelHost ? '' : 'https://www.rolw.app/reset-password.html';
})();

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
