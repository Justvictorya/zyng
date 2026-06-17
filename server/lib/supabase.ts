import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabaseUrl = env("SUPABASE_URL");
const supabaseKey = env("SUPABASE_ANON_KEY");
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

export const supabase = createClient(supabaseUrl, supabaseKey);

export const adminAuth = createClient(supabaseUrl, serviceRoleKey).auth.admin;
