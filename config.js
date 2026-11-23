/*
 * Supabase connection. Leave empty to run the app in demo mode (data stays in the browser).
 * The publishable key is meant to be public: security comes from the row-level-security policies in supabase/schema.sql.
 */
window.FINANCEPRO_CONFIG = {
  supabaseUrl: 'https://uklulobwmzbrdwoyvolc.supabase.co',
  supabaseAnonKey: 'sb_publishable_AjGQakIKpOamCRefUiiAXw_qLE4Z1tj'
};

// Google sign-in is not enabled yet: hide its button and the "or" divider.
(function () {
  var s = document.createElement('style');
  s.textContent = '[data-act="google"],[data-act="google"]+.divider{display:none!important}';
  document.head.appendChild(s);
})();
