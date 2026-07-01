/* ==========================================================================
   Port Promos — login.js
   ========================================================================== */
(function () {
  "use strict";

  function showAlert(msg) {
    const el = document.getElementById("pp-login-alert");
    el.textContent = msg;
    el.classList.remove("d-none");
  }

  function hideAlert() {
    document.getElementById("pp-login-alert").classList.add("d-none");
  }

  function setLoading(loading) {
    const btn = document.getElementById("pp-login-btn");
    btn.disabled = loading;
    btn.querySelector(".pp-login-btn-text").textContent = loading
      ? "Entrando..."
      : "Entrar";
  }

  async function init() {
    // Se já chegou logado e a sessão é de admin, já manda direto pro painel.
    const user = await PP_Auth.getSessionUser();
    if (user) {
      const profile = await PP_Auth.getProfile(user.id);
      if (profile && profile.role === "admin") {
        window.location.href = "admin.html";
        return;
      }
    }

    if (new URLSearchParams(window.location.search).get("negado") === "1") {
      showAlert("Essa conta não tem acesso administrativo.");
    }

    document
      .getElementById("pp-login-form")
      .addEventListener("submit", async function (e) {
        e.preventDefault();
        hideAlert();
        setLoading(true);

        const email = document.getElementById("pp-email").value.trim();
        const password = document.getElementById("pp-password").value;

        try {
          const { data, error } = await PP_Auth.signIn(email, password);
          if (error) {
            showAlert("E-mail ou senha incorretos.");
            return;
          }
          const profile = await PP_Auth.getProfile(data.user.id);
          if (!profile || profile.role !== "admin") {
            await PP_SB.auth.signOut();
            showAlert("Essa conta não tem acesso administrativo.");
            return;
          }
          window.location.href = "admin.html";
        } catch (err) {
          console.error(err);
          showAlert("Não foi possível entrar agora. Tente novamente.");
        } finally {
          setLoading(false);
        }
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
