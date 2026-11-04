(() => {
  "use strict";

  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("primaryNav");

  /**
   * Fecha o menu de navegação mobile e atualiza os atributos de acessibilidade do botão.
   * @returns {void}
   */
  function closeNav() {
    nav.classList.remove("is-open");
    navToggle.classList.remove("is-active");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menu de navegação");
    document.body.classList.remove("nav-open");
  }

  /**
   * Abre o menu de navegação mobile e trava a rolagem da página por trás dele.
   * @returns {void}
   */
  function openNav() {
    nav.classList.add("is-open");
    navToggle.classList.add("is-active");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Fechar menu de navegação");
    document.body.classList.add("nav-open");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("is-open");
      isOpen ? closeNav() : openNav();
    });

    nav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });
  }

  const header = document.querySelector(".site-header");

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight + 1;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });

      history.pushState(null, "", targetId);
    });
  });

  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 6, 5) * 60}ms`;
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.removeAttribute("aria-current"));
            link.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const copyEmailBtn = document.getElementById("copyEmailBtn");
  const copyEmailLabel = document.getElementById("copyEmailLabel");
  const toast = document.getElementById("toast");

  /** @type {number | undefined} */
  let toastTimeout;

  /**
   * Exibe uma notificação temporária no rodapé da tela.
   * @param {string} message Texto exibido na notificação.
   * @returns {void}
   */
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2400);
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", async () => {
      const email = copyEmailBtn.dataset.email;
      const originalLabel = copyEmailLabel.textContent;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = email;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        copyEmailLabel.textContent = "E-mail copiado!";
        showToast("E-mail copiado para a área de transferência.");

        setTimeout(() => {
          copyEmailLabel.textContent = originalLabel;
        }, 2000);
      } catch (error) {
        showToast("Não foi possível copiar. Tente novamente.");
      }
    });
  }

  /**
   * Aplica uma sombra ao cabeçalho fixo assim que a página sai do topo.
   * @returns {void}
   */
  function updateHeaderOnScroll() {
    if (!header) return;
    if (window.scrollY > 8) {
      header.style.boxShadow = "0 12px 30px -20px rgba(0, 0, 0, 0.6)";
    } else {
      header.style.boxShadow = "none";
    }
  }

  window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
  updateHeaderOnScroll();

  /**
   * Formata uma quantidade de meses no padrão do LinkedIn, por exemplo "2 anos e 5 meses".
   * @param {number} totalMonths Total de meses, já contando o mês inicial e o atual.
   * @returns {string} Duração por extenso em português.
   */
  function formatDuration(totalMonths) {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts = [];
    if (years) parts.push(`${years} ${years === 1 ? "ano" : "anos"}`);
    if (months) parts.push(`${months} ${months === 1 ? "mês" : "meses"}`);
    return parts.join(" e ") || "1 mês";
  }

  /**
   * Conta os meses entre um mês inicial e a data atual, incluindo os dois extremos.
   * @param {string} since Mês inicial no formato "AAAA-MM".
   * @param {Date} [now=new Date()] Data de referência.
   * @returns {number} Total de meses.
   */
  function monthsSince(since, now = new Date()) {
    const [year, month] = since.split("-").map(Number);
    return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month) + 1;
  }

  document.querySelectorAll("[data-since]").forEach((el) => {
    el.textContent = formatDuration(monthsSince(el.dataset.since));
  });

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
