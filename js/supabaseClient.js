const SUPABASE_URL = 'https://kyjkqjzyokymmidpplum.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5amtxanp5b2t5bW1pZHBwbHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTg3OTEsImV4cCI6MjA4OTg3NDc5MX0.H2uefzN9VBvrds5IgQ4YG8q0pKPKFgLSYM4ut51wU8Q';

/**
 * Optional override for password-reset email links (see js/logIn.js). Leave '' to use the current site origin
 * (works for https://rolw-web-app.vercel.app and for a custom domain once DNS points here).
 *
 * Supabase (Authentication → URL configuration):
 * - Site URL: your canonical home, e.g. https://rolw-web-app.vercel.app or https://www.your-domain.com
 * - Redirect URLs: include every login URL you use, e.g.
 *   https://rolw-web-app.vercel.app/logIn.html
 *   https://www.your-domain.com/logIn.html
 *
 * Custom domain: Vercel → Project → Settings → Domains → add domain → set DNS at your registrar as shown in Vercel.
 */
window.ROLW_PASSWORD_RESET_REDIRECT_URL = '';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true
  }
});
