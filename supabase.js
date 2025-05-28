import { createClient } from "@supabase/supabase-js";
const process_env = process.env.ENV_SUPABASE_TOKEN;
const supabaseKey = "";
const supabase = createClient(
  "",
  process.env.ENV_SUPABASE_TOKEN || supabaseKey
);

export default supabase;
