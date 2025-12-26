import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase ENV variables are missing");
}

// MOBILE FIX: Critical auth options for mobile browsers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Persist session in localStorage (mobile critical)
    autoRefreshToken: true,      // Auto refresh tokens
    detectSessionInUrl: true,    // Detect OAuth callback params in URL (mobile critical)
    flowType: 'pkce'             // Use PKCE flow (more secure, better mobile support)
  }
});
