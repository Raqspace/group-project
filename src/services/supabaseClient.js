import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = "https://yjhpbjfuxvcpcxnpotgi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lf7tdCw59aCpc-EKnMmQ5g_masCn398";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
