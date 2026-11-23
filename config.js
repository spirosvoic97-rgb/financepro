/*
 * Supabase connection. Leave empty to run the app in demo mode (data stays in the browser).
 * The anon key is meant to be public: security comes from the row-level-security policies in supabase/schema.sql.
 */
window.FINANCEPRO_CONFIG = {
  supabaseUrl: 'https://uklulobwmzbrdwoyvolc.supabase.co',
  supabaseAnonKey: 'sb_publishable_AjGQakIKpOamCRefUiiAXw_qLE4Z1tj' // publishable key (safe in the browser; RLS protects the data)
};
