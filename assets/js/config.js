/*
 * Connexion Supabase. La clé « publishable » est faite pour être publique :
 * la sécurité repose sur les règles RLS côté base de données.
 * Evilance partage pour l'instant le projet Supabase « harmonie-olivet » :
 * toutes ses tables et son stockage sont préfixés « evilance ».
 * Pour séparer les projets plus tard, il suffira de changer les valeurs ci-dessous.
 */
window.EVILANCE_CONFIG = {
  supabaseUrl: "https://kdcflcvufukagdjycwww.supabase.co",
  supabaseKey: "sb_publishable_fddNT8v7PhkFJRqhyhilSQ_Pj3CDGDv",
  contentTable: "evilance_content",
  messagesTable: "evilance_messages",
  adminCheck: "evilance_is_admin",
  bucket: "evilance-media"
};
