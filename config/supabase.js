const { createClient } = require("@supabase/supabase-js");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase environment variables are missing. API data routes will return a configuration error.");
}
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
 ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}})
 : null;
function db(){ if(!supabase){const e=new Error("Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");e.status=503;throw e;} return supabase; }
module.exports={db};
