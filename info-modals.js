/* ==========================================================================
   Port Promos — info-modals.js
   Modal popups para links informativos do rodapé.
   Depende de: Bootstrap 5 (já carregado em todas as páginas)
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
   * Shell do modal (injetado uma vez no body)
   * ------------------------------------------------------------------ */
  var MODAL_SHELL =
    '<div class="modal fade" id="ppInfoModal" tabindex="-1" aria-labelledby="ppInfoModalLabel" aria-hidden="true">' +
    '  <div class="modal-dialog modal-lg modal-dialog-scrollable">' +
    '    <div class="modal-content pp-imodal-content">' +
    '      <div class="modal-header pp-imodal-header">' +
    '        <h5 class="modal-title pp-imodal-title" id="ppInfoModalLabel"></h5>' +
    '        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>' +
    '      </div>' +
    '      <div class="modal-body pp-imodal-body" id="ppInfoModalBody"></div>' +
    '      <div class="modal-footer pp-imodal-footer">' +
    '        <button type="button" class="btn btn-pp-primary" data-bs-dismiss="modal">Fechar</button>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  /* ------------------------------------------------------------------
   * Estilos do modal (dark/light theme via CSS vars)
   * ------------------------------------------------------------------ */
  var MODAL_CSS =
    ".pp-imodal-content{" +
      "background:var(--bg-elevated);" +
      "border:1px solid var(--border-color);" +
      "border-radius:1rem;" +
      "color:var(--text);" +
    "}" +
    ".pp-imodal-header{" +
      "border-bottom:1px solid var(--border-color);" +
      "padding:1.25rem 1.5rem;" +
    "}" +
    ".pp-imodal-title{" +
      "font-size:1.15rem;" +
      "font-weight:800;" +
      "color:var(--text);" +
    "}" +
    ".pp-imodal-body{" +
      "padding:1.5rem;" +
      "color:var(--text-muted);" +
      "line-height:1.8;" +
      "font-size:.94rem;" +
    "}" +
    ".pp-imodal-body h3{" +
      "color:var(--text);" +
      "font-size:.98rem;" +
      "font-weight:700;" +
      "margin-top:1.5rem;" +
      "margin-bottom:.6rem;" +
    "}" +
    ".pp-imodal-body h3:first-child{margin-top:0}" +
    ".pp-imodal-body p{margin-bottom:.8rem}" +
    ".pp-imodal-body p:last-child{margin-bottom:0}" +
    ".pp-imodal-body ul,.pp-imodal-body ol{padding-left:1.3rem;margin-bottom:.8rem}" +
    ".pp-imodal-body li{margin-bottom:.45rem}" +
    ".pp-imodal-step{" +
      "display:flex;align-items:flex-start;gap:.85rem;" +
      "padding:.85rem 1.1rem;" +
      "background:var(--bg-elevated-2);" +
      "border-radius:.65rem;" +
      "margin-bottom:.6rem;" +
    "}" +
    ".pp-imodal-num{" +
      "display:flex;align-items:center;justify-content:center;" +
      "width:2.1rem;height:2.1rem;min-width:2.1rem;" +
      "border-radius:50%;" +
      "background:linear-gradient(135deg,var(--pp-royal),var(--pp-royal-light));" +
      "color:#fff;font-weight:800;font-size:.85rem;" +
    "}" +
    ".pp-imodal-step-txt strong{color:var(--text);display:block;margin-bottom:.2rem}" +
    ".pp-imodal-notice{" +
      "background:rgba(var(--pp-orange-rgb),.12);" +
      "border-left:3px solid var(--pp-orange);" +
      "border-radius:.4rem;" +
      "padding:.85rem 1.1rem;" +
      "margin-top:1rem;" +
      "color:var(--text-muted);" +
    "}" +
    ".pp-imodal-notice p{margin:0}" +
    /* FAQ accordion */
    ".pp-imodal-body .accordion-item{" +
      "background:var(--bg-elevated-2);" +
      "border:1px solid var(--border-color) !important;" +
      "border-radius:.65rem !important;" +
      "margin-bottom:.55rem;" +
      "overflow:hidden;" +
    "}" +
    ".pp-imodal-body .accordion-button{" +
      "background:var(--bg-elevated-2);" +
      "color:var(--text);" +
      "font-weight:600;" +
      "font-size:.93rem;" +
      "border-radius:.65rem !important;" +
    "}" +
    ".pp-imodal-body .accordion-button:not(.collapsed){" +
      "background:var(--bg-elevated);" +
      "color:var(--pp-royal-light);" +
      "box-shadow:none;" +
    "}" +
    "[data-theme='light'] .pp-imodal-body .accordion-button::after{filter:none}" +
    ".pp-imodal-body .accordion-button::after{filter:invert(1) brightness(2)}" +
    ".pp-imodal-body .accordion-body{" +
      "background:var(--bg-elevated);" +
      "color:var(--text-muted);" +
      "font-size:.9rem;" +
      "line-height:1.75;" +
    "}" +
    ".pp-imodal-footer{border-top:1px solid var(--border-color);padding:1rem 1.5rem}";

  /* ------------------------------------------------------------------
   * Conteúdo de cada modal
   * ------------------------------------------------------------------ */
  var M = {

    /* ---- Sobre o grupo ---- */
    "sobre": {
      title: "Sobre o grupo",
      body:
        "<p>A <strong>Port Promos</strong> é uma comunidade criada para compartilhar promoções reais, cupons de desconto e ofertas relâmpago.</p>" +
        "<p>Todos os dias monitoramos novas oportunidades para ajudar nossos usuários a economizar em compras online. Reunimos promoções, cupons e ofertas especiais de diversas lojas parceiras em um único lugar.</p>" +
        "<p>Nosso objetivo é facilitar sua busca pelos melhores descontos, destacando oportunidades que realmente valem a pena. As ofertas são atualizadas frequentemente, mas podem expirar ou sofrer alterações a qualquer momento.</p>" +
        '<div class="pp-imodal-notice"><p><i class="bi bi-bell-fill" style="color:var(--pp-orange);margin-right:.4rem;"></i>Ative as notificações e entre no nosso grupo do WhatsApp para receber as melhores promoções em primeira mão!</p></div>' +
        '<div class="mt-3"><a href="https://chat.whatsapp.com/Irc1ZAEOgQYDOvAE1nA97b" target="_blank" rel="noopener" class="btn btn-pp-primary btn-sm"><i class="bi bi-whatsapp me-1"></i>Entrar no grupo</a></div>'
    },

    /* ---- Como funciona ---- */
    "como-funciona": {
      title: "Como funciona",
      body:
        "<p>Nossa equipe monitora promoções em diversas lojas e publica apenas as melhores oportunidades. O processo é simples e transparente:</p>" +
        '<div class="pp-imodal-step"><div class="pp-imodal-num">1</div><div class="pp-imodal-step-txt"><strong>Encontramos uma oferta interessante</strong>Nossa equipe monitora dezenas de lojas parceiras em busca das melhores promoções disponíveis.</div></div>' +
        '<div class="pp-imodal-step"><div class="pp-imodal-num">2</div><div class="pp-imodal-step-txt"><strong>Publicamos na Port Promos</strong>A oferta é verificada e publicada no site com todas as informações necessárias para você decidir.</div></div>' +
        '<div class="pp-imodal-step"><div class="pp-imodal-num">3</div><div class="pp-imodal-step-txt"><strong>Você acessa o link da promoção</strong>Clique em "Ver oferta" e seja direcionado à loja parceira com o melhor preço.</div></div>' +
        '<div class="pp-imodal-step"><div class="pp-imodal-num">4</div><div class="pp-imodal-step-txt"><strong>Finaliza sua compra na loja parceira</strong>A compra é realizada diretamente no site da loja de forma segura, como Shopee ou Mercado Livre.</div></div>' +
        "<h3><i class=\"bi bi-exclamation-circle-fill\" style=\"color:var(--pp-orange);margin-right:.4rem;\"></i>Importante saber:</h3>" +
        "<ul>" +
        "<li><i class=\"bi bi-lightning-charge-fill\" style=\"color:var(--pp-orange);margin-right:.3rem;\"></i>As promoções podem acabar rapidamente.</li>" +
        "<li><i class=\"bi bi-tag-fill\" style=\"color:var(--pp-orange);margin-right:.3rem;\"></i>Os preços podem ser alterados sem aviso prévio.</li>" +
        "<li><i class=\"bi bi-ticket-perforated-fill\" style=\"color:var(--pp-orange);margin-right:.3rem;\"></i>Alguns cupons possuem quantidade limitada.</li>" +
        "<li><i class=\"bi bi-box-seam-fill\" style=\"color:var(--pp-orange);margin-right:.3rem;\"></i>A disponibilidade depende do estoque da loja.</li>" +
        "</ul>"
    },

    /* ---- Perguntas frequentes ---- */
    "faq": {
      title: "Perguntas frequentes",
      body:
        '<div class="accordion" id="ppFaqAcc">' +

        '<div class="accordion-item">' +
        '<h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1" aria-expanded="true">As promoções são gratuitas?</button></h2>' +
        '<div id="faq1" class="accordion-collapse collapse show" data-bs-parent="#ppFaqAcc"><div class="accordion-body">Sim. Você pode acessar todas as ofertas sem qualquer custo. O nosso serviço é 100% gratuito para os usuários.</div></div>' +
        '</div>' +

        '<div class="accordion-item">' +
        '<h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2" aria-expanded="false">As ofertas são atualizadas diariamente?</button></h2>' +
        '<div id="faq2" class="accordion-collapse collapse" data-bs-parent="#ppFaqAcc"><div class="accordion-body">Sim. Novas promoções podem surgir várias vezes ao longo do dia. Recomendamos verificar o site com frequência ou entrar no nosso grupo do WhatsApp para receber alertas em tempo real.</div></div>' +
        '</div>' +

        '<div class="accordion-item">' +
        '<h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3" aria-expanded="false">Por que uma promoção não está mais disponível?</button></h2>' +
        '<div id="faq3" class="accordion-collapse collapse" data-bs-parent="#ppFaqAcc"><div class="accordion-body">Algumas ofertas possuem estoque limitado ou tempo reduzido e podem expirar rapidamente. Infelizmente não temos controle sobre o estoque das lojas parceiras.</div></div>' +
        '</div>' +

        '<div class="accordion-item">' +
        '<h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4" aria-expanded="false">Vocês vendem os produtos?</button></h2>' +
        '<div id="faq4" class="accordion-collapse collapse" data-bs-parent="#ppFaqAcc"><div class="accordion-body">Não. A Port Promos apenas divulga ofertas de lojas parceiras como Shopee e Mercado Livre. A compra é sempre realizada diretamente na loja parceira.</div></div>' +
        '</div>' +

        '<div class="accordion-item">' +
        '<h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq5" aria-expanded="false">Como não perder as melhores promoções?</button></h2>' +
        '<div id="faq5" class="accordion-collapse collapse" data-bs-parent="#ppFaqAcc"><div class="accordion-body">Acompanhe o site regularmente — as melhores ofertas podem durar apenas alguns minutos. Também recomendamos entrar no nosso grupo do WhatsApp para receber alertas em tempo real. <br><br><a href="https://chat.whatsapp.com/Irc1ZAEOgQYDOvAE1nA97b" target="_blank" rel="noopener" class="btn btn-pp-primary btn-sm mt-1"><i class="bi bi-whatsapp me-1"></i>Entrar no grupo</a></div></div>' +
        '</div>' +

        '</div>'
    },

    /* ---- Política de privacidade ---- */
    "privacidade": {
      title: "Política de privacidade",
      body:
        "<p>A <strong>Port Promos</strong> respeita a privacidade dos seus usuários.</p>" +
        "<h3>Coleta de dados</h3>" +
        "<p>Coletamos apenas as informações necessárias para o funcionamento da plataforma, como cadastro, autenticação e preferências do usuário.</p>" +
        "<h3>Uso dos dados</h3>" +
        "<p>Não comercializamos dados pessoais com terceiros. As informações coletadas são utilizadas exclusivamente para melhorar a sua experiência na plataforma.</p>" +
        "<h3>Links externos</h3>" +
        "<p>Alguns links podem direcionar para lojas parceiras, que possuem suas próprias políticas de privacidade. Recomendamos que você leia as políticas de cada loja antes de realizar uma compra.</p>" +
        '<div class="pp-imodal-notice"><p><i class="bi bi-shield-check-fill" style="color:var(--pp-orange);margin-right:.4rem;"></i>Ao utilizar a Port Promos, você concorda com esta política de privacidade.</p></div>'
    },

    /* ---- Termos de uso ---- */
    "termos": {
      title: "Termos de uso",
      body:
        "<p>Ao utilizar a Port Promos, você concorda com os seguintes termos:</p>" +
        "<ul>" +
        "<li>As promoções são divulgadas conforme disponibilidade das lojas parceiras.</li>" +
        "<li>Os preços podem ser alterados sem aviso prévio.</li>" +
        "<li>Não garantimos o estoque dos produtos anunciados.</li>" +
        "<li>A compra é realizada diretamente na loja parceira.</li>" +
        "<li>A Port Promos não é responsável pela entrega, pagamento, garantia ou atendimento dos produtos adquiridos.</li>" +
        "</ul>" +
        "<h3>Responsabilidade</h3>" +
        "<p>A Port Promos atua como intermediária entre os usuários e as lojas parceiras, divulgando promoções disponíveis publicamente. Não nos responsabilizamos por alterações de preço, cancelamento de pedidos, problemas na entrega ou qualquer outro inconveniente relacionado à compra.</p>" +
        '<div class="pp-imodal-notice"><p><i class="bi bi-info-circle-fill" style="color:var(--pp-orange);margin-right:.4rem;"></i>Em caso de problemas com uma compra, entre em contato diretamente com a loja parceira onde o produto foi adquirido.</p></div>'
    },

    /* ---- Fale conosco ---- */
    "contato": {
      title: "Fale conosco",
      body:
        "<p>Encontrou algum problema, quer sugerir melhorias ou precisa de ajuda? Fique à vontade para falar com nossa equipe!</p>" +
        '<div class="pp-imodal-step">' +
          '<div class="pp-imodal-num"><i class="bi bi-whatsapp"></i></div>' +
          '<div class="pp-imodal-step-txt"><strong>Grupo do WhatsApp</strong>Participe do nosso grupo e fale diretamente com a equipe Port Promos.<br><a href="https://chat.whatsapp.com/Irc1ZAEOgQYDOvAE1nA97b" target="_blank" rel="noopener" class="btn btn-pp-primary btn-sm mt-2"><i class="bi bi-whatsapp me-1"></i>Entrar no grupo</a></div>' +
        '</div>' +
        '<div class="pp-imodal-step">' +
          '<div class="pp-imodal-num"><i class="bi bi-instagram"></i></div>' +
          '<div class="pp-imodal-step-txt"><strong>Instagram</strong>Siga-nos e nos envie uma mensagem direta pelo Instagram.<br><a href="https://www.instagram.com/portpromos?igsh=Z3l2MDNya2J0ZWox" target="_blank" rel="noopener" class="btn btn-pp-primary btn-sm mt-2"><i class="bi bi-instagram me-1"></i>Ver perfil</a></div>' +
        '</div>' +
        '<div class="pp-imodal-notice"><p><i class="bi bi-clock-fill" style="color:var(--pp-orange);margin-right:.4rem;"></i>Nossa equipe responde em horário comercial, de segunda a sábado.</p></div>'
    }

  };

  /* ------------------------------------------------------------------
   * Inicialização
   * ------------------------------------------------------------------ */
  function init() {
    /* Injeta CSS */
    var style = document.createElement("style");
    style.textContent = MODAL_CSS;
    document.head.appendChild(style);

    /* Injeta shell do modal no body */
    var tmp = document.createElement("div");
    tmp.innerHTML = MODAL_SHELL;
    document.body.appendChild(tmp.firstElementChild);

    /* Delegação de eventos – captura qualquer clique em [data-pp-modal] */
    document.addEventListener("click", function (e) {
      var link = e.target.closest("[data-pp-modal]");
      if (!link) return;
      e.preventDefault();
      var key  = link.getAttribute("data-pp-modal");
      var data = M[key];
      if (!data) return;
      document.getElementById("ppInfoModalLabel").textContent = data.title;
      document.getElementById("ppInfoModalBody").innerHTML   = data.body;
      var modalEl = document.getElementById("ppInfoModal");
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
