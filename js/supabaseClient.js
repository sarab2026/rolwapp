const SUPABASE_URL = 'https://kyjkqjzyokymmidpplum.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5amtxanp5b2t5bW1pZHBwbHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTg3OTEsImV4cCI6MjA4OTg3NDc5MX0.H2uefzN9VBvrds5IgQ4YG8q0pKPKFgLSYM4ut51wU8Q';

/**
 * Full URL for the login page used in password-reset emails.
 * Email links open in the normal browser; localhost only works on the same computer while your dev server is running.
 * When you deploy, set this to your public URL (and add the same URL in Supabase → Authentication → URL Configuration → Redirect URLs).
 * Example: 'https://your-site.netlify.app/logIn.html'
 */
window.ROLW_PASSWORD_RESET_REDIRECT_URL = '';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true
  }
});
