/* ==========================================================================
   Port Promos — auth.js
   Helpers de autenticação/RBAC para as páginas de admin.

   IMPORTANTE: isso aqui é só conveniência de interface (esconder a tela de
   quem não é admin, redirecionar rápido). A segurança de verdade está nas
   policies de RLS no Postgres (schema.sql) — mesmo que alguém pule essa
   checagem no navegador, o Supabase recusa qualquer insert/update/delete
   de quem não tiver profiles.role = 'admin'.
   ========================================================================== */
const PP_Auth = (function () {
  "use strict";

  async function getSessionUser() {
    const { data, error } = await PP_SB.auth.getSession();
    if (error || !data.session) return null;
    return data.session.user;
  }

  async function getProfile(userId) {
    const { data, error } = await PP_SB.from("profiles")
      .select("id, full_name, role")
      .eq("id", userId)
      .single();
    if (error) return null;
    return data;
  }

  // Chame no topo de admin.html. Resolve com { user, profile } se for
  // admin autenticado; senão já redireciona pra login.html e nunca resolve.
  async function requireAdmin() {
    const user = await getSessionUser();
    if (!user) {
      window.location.href = "login.html";
      return new Promise(function () {});
    }
    const profile = await getProfile(user.id);
    if (!profile || profile.role !== "admin") {
      await PP_SB.auth.signOut();
      window.location.href = "login.html?negado=1";
      return new Promise(function () {});
    }
    return { user: user, profile: profile };
  }

  async function signIn(email, password) {
    return PP_SB.auth.signInWithPassword({ email: email, password: password });
  }

  async function signOut() {
    await PP_SB.auth.signOut();
    window.location.href = "index.html";
  }

  async function logAction(actorId, action, entity, entityId, metadata) {
    try {
      await PP_SB.from("audit_logs").insert({
        actor_id: actorId,
        action: action,
        entity: entity || null,
        entity_id: entityId ? String(entityId) : null,
        metadata: metadata || null,
      });
    } catch (e) {
      console.warn("Falha ao gravar audit log (não bloqueante):", e);
    }
  }

  return {
    getSessionUser: getSessionUser,
    getProfile: getProfile,
    requireAdmin: requireAdmin,
    signIn: signIn,
    signOut: signOut,
    logAction: logAction,
  };
})();
