import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ddomurmtmathdzftwbtc.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkb211cm10bWF0aGR6ZnR3YnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDMyMzQsImV4cCI6MjEwMDQxOTIzNH0.rYuO47ZDqVmw5sYcu7qwkVbO1tcFlg9YuFD9iXQbM_4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
