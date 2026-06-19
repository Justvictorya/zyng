import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sdiqdtzslfubtgbwpmjp.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkaXFkdHpzbGZ1YnRnYndwbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzYwNTQsImV4cCI6MjA5NDQ1MjA1NH0.SFyW0dWd9ftwHOpXQ8tbzm9GS64cieFK3rgssvjJEQo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
