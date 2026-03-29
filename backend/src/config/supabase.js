const { createClient } = require('@supabase/supabase-js');


const supabaseUrl = process.env.SUPABASE_URL;
// Compatibilidade: aceita SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY ou SUPABASE_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY não configurados nas variáveis de ambiente!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
