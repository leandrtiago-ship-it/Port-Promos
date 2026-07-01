/* ==========================================================================
   Port Promos — supabaseClient.js
   Cria o cliente Supabase usado pelo site inteiro. Precisa ser carregado
   DEPOIS do <script> do CDN do supabase-js e ANTES de products-data.js.

   A publishable key abaixo é segura para ficar no frontend — ela só
   consegue fazer o que as políticas de RLS do banco permitirem.
   NUNCA coloque a secret/service_role key aqui.
   ========================================================================== */
const PP_SUPABASE_URL = "https://fnwaspjtfwigaroifrap.supabase.co";
const PP_SUPABASE_ANON_KEY = "sb_publishable_ULUBfrLYdhOLRBVTM_OVLA_J8eTKlQH";

const PP_SB = supabase.createClient(PP_SUPABASE_URL, PP_SUPABASE_ANON_KEY);
