import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase ENV variables are missing");
}

// MOBILE FIX: Critical auth options for mobile browsers
// NOTE: Do NOT use flowType: 'pkce' - causes "code verifier not found" on mobile
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Persist session in localStorage
    autoRefreshToken: true,      // Auto refresh tokens
    detectSessionInUrl: true     // Detect OAuth callback params in URL
  }
});
