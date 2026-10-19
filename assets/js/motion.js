/* ==========================================================================
   GREEN ENERGY · movimento
   Vocabulário curto, reusado na página inteira (styleguide, seção 10):
   · entrada: sobe 16 px + fade, 500 ms, cubic-bezier(.2,.7,.2,1), UMA vez;
   · título do hero: linhas saindo de uma máscara;
   · assinatura: o neon de "não com gasolina" acende uma vez, como o letreiro
     da loja, e a barra sob o título "carrega" — sem piscar em loop (WCAG 2.3);
   · contadores da faixa de prova;
   · profundidade leve no vídeo do hero e no do Sobre, só no desktop.
   Este arquivo só SE DECLARA. Quem dá a partida é o app.js, depois de montar
   vitrine, FAQ e depoimentos. Sem GSAP ou com movimento reduzido, tudo vira
   no-op e nada fica escondido (ver a classe `sem-anima` no <head>).
   ========================================================================== */

(() => {
  'use strict';

  const raiz = document.documentElement;
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!window.gsap || !window.ScrollTrigger || semMovimento) {
    raiz.classList.add('sem-anima');
    window.GREEN_MOTION = {
      iniciar: () => {},
      revelar: () => {},
      travarScroll: () => {},
      recalcular: () => {},
      rolarPara: (alvo, deslocamento = 0) => {
        if (alvo) window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY + deslocamento });
      },
    };
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const EASE = 'power3.out'; // o mais próximo de cubic-bezier(.2,.7,.2,1)
  const ENTRADA = { duracao: 0.5, deslocamento: 16 };
  const desktopFino = '(min-width: 1025px) and (pointer: fine)';

  /* ── Scroll suave (só desktop com ponteiro fino) ──────────────────────── */

  let lenis = null;

  /* Overlays têm rolagem própria: com modal ou menu aberto o Lenis sai do
     caminho, senão a roda dentro do painel não faz nada. */
  function travarScroll(travado) {
    if (!lenis) return;
    if (travado) lenis.stop();
    else lenis.start();
  }

  const alturaHeader = () => parseFloat(getComputedStyle(raiz).getPropertyValue('--ge-header')) || 80;

  function scrollSuave() {
    if (!window.Lenis || !matchMedia(desktopFino).matches) return;

    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((tempo) => lenis.raf(tempo * 1000));
    gsap.ticker.lagSmoothing(0);

    // Âncoras pedem ao Lenis, senão o scroll nativo briga com ele.
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (id.length < 2 || id.startsWith('#modelo/')) return;
      const alvo = document.querySelector(id);
      if (!alvo) return;
      e.preventDefault();
      lenis.scrollTo(alvo, { offset: -(alturaHeader() + 16), duration: 1 });
    });
  }

  /* ── Entradas ─────────────────────────────────────────────────────────── */

  function revelar(escopo = document) {
    const alvos = Array.from(escopo.querySelectorAll('[data-anima]'))
      .filter((el) => !el.dataset.animaPronto);
    alvos.forEach((el) => { el.dataset.animaPronto = '1'; });

    // Vizinhos que entram juntos ganham stagger; o resto entra sozinho.
    const grupos = new Map();
    alvos.forEach((el) => {
      const pai = el.parentElement;
      if (!grupos.has(pai)) grupos.set(pai, []);
      grupos.get(pai).push(el);
    });

    grupos.forEach((itens) => {
      gsap.fromTo(itens, { opacity: 0, y: ENTRADA.deslocamento }, {
        opacity: 1,
        y: 0,
        duration: ENTRADA.duracao,
        ease: EASE,
        stagger: itens.length > 1 ? 0.07 : 0,
        clearProps: 'transform',
        scrollTrigger: { trigger: itens[0], start: 'top 90%', once: true },
      });
    });
  }

  /* ── Hero ─────────────────────────────────────────────────────────────── */

  function hero() {
    const titulo = document.querySelector('[data-anima-linhas]');
    if (titulo) {
      /* Cada linha (separada por <br>) vira uma máscara. O <span> do neon
         sobrevive à divisão porque o split é por <br>, nunca dentro de tag. */
      const linhas = titulo.innerHTML.split(/<br\s*\/?>/i);
      titulo.innerHTML = linhas
        .map((l) => `<span class="hero__linha"><span>${l.trim()}</span></span>`)
        .join('');
      titulo.dataset.animaPronto = '1';
      gsap.set(titulo, { opacity: 1 });

      const tl = gsap.timeline({ delay: 0.15 });
      tl.from(titulo.querySelectorAll('.hero__linha > span'), {
        yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.09,
      });

      /* Ignição do neon: três degraus de brilho e depois fica aceso. Acontece
         UMA vez, em 0,5 s — não é piscar, é ligar. */
      const neon = titulo.querySelector('.hero__neon');
      if (neon) {
        tl.fromTo(neon, { '--neon': 0 }, {
          keyframes: [
            { '--neon': 0.9, duration: 0.06 },
            { '--neon': 0.15, duration: 0.08 },
            { '--neon': 1, duration: 0.06 },
            { '--neon': 0.45, duration: 0.1 },
            { '--neon': 1, duration: 0.2 },
          ],
          ease: 'none',
        }, '-=0.35');
      }

      const carga = document.querySelector('.hero__carga');
      if (carga) tl.fromTo(carga, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '-=0.5');
    }

    // O resto do hero entra em cascata curta, sem esperar scroll.
    const restante = Array.from(document.querySelectorAll('.hero [data-anima]')).filter((el) => el !== titulo);
    restante.forEach((el) => { el.dataset.animaPronto = '1'; });
    gsap.fromTo(restante, { opacity: 0, y: ENTRADA.deslocamento }, {
      opacity: 1, y: 0, duration: 0.6, ease: EASE, stagger: 0.08, delay: 0.55, clearProps: 'transform',
    });

    /* Ao sair do hero, a mídia se afasta um pouco e escurece: a página
       "entra" na loja. Só desktop: no celular é rolagem que pesa e não conta
       nada. */
    gsap.matchMedia().add(desktopFino, () => {
      gsap.to('.hero__midia', {
        scale: 1.08, yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero__conteudo', {
        yPercent: -12, opacity: 0.35, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ── Contadores da faixa de prova ─────────────────────────────────────── */

  function contadores() {
    document.querySelectorAll('[data-contador]').forEach((el) => {
      const alvo = Number(el.dataset.contador);
      if (!Number.isFinite(alvo)) return;
      const estado = { valor: 0 };
      const formatar = (v) => (alvo >= 1900 ? String(Math.round(v)) : Math.round(v).toLocaleString('pt-BR'));
      // Ano "2019" sobe a partir de 2000: contar de zero até 2019 é ruído.
      if (alvo >= 1900) estado.valor = alvo - 19;
      el.textContent = formatar(estado.valor);
      gsap.to(estado, {
        valor: alvo,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = formatar(estado.valor); },
        scrollTrigger: { trigger: el, start: 'top bottom', once: true },
      });
    });
  }

  /* ── Profundidade no Sobre (desktop) ─────────────────────────────────── */

  function profundidade() {
    gsap.matchMedia().add(desktopFino, () => {
      gsap.fromTo('.sobre__video', { yPercent: 6 }, {
        yPercent: -6, ease: 'none',
        scrollTrigger: { trigger: '.sobre', start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.fromTo('.sobre__recorte', { yPercent: 10, xPercent: 4 }, {
        yPercent: -4, xPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.sobre', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ── Seção atual no menu ──────────────────────────────────────────────── */

  function menuAtivo() {
    document.querySelectorAll('.header__link').forEach((link) => {
      const secao = document.querySelector(link.getAttribute('href'));
      if (!secao) return;
      ScrollTrigger.create({
        trigger: secao,
        start: 'top 40%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        },
      });
    });
  }

  /* Qualquer coisa que mude a ALTURA da página invalida as posições do
     ScrollTrigger. Filtrar a vitrine muda a altura em milhares de pixels. */
  const recalcular = () => ScrollTrigger.refresh();

  /* Rolagem que respeita o Lenis (com ele ativo, scrollTo nativo dá solavanco). */
  function rolarPara(alvo, deslocamento = 0) {
    if (!alvo) return;
    if (lenis) {
      lenis.scrollTo(alvo, { offset: deslocamento, duration: 0.8 });
      return;
    }
    window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY + deslocamento, behavior: 'smooth' });
  }

  let iniciado = false;
  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    raiz.classList.add('motion-ok');

    hero();
    scrollSuave();
    contadores();
    profundidade();
    menuAtivo();
    revelar();

    // Fonte chegando depois muda altura de bloco e desalinha os gatilhos.
    document.fonts?.ready.then(recalcular);
    addEventListener('load', () => {
      recalcular();
      /* Rede de segurança: [data-anima] que entrou no DOM sem passar por
         revelar() ficaria invisível. Conteúdo faltando é pior que sem animação. */
      setTimeout(() => {
        const orfaos = document.querySelectorAll('[data-anima]:not([data-anima-pronto])');
        if (orfaos.length) gsap.set(orfaos, { opacity: 1, y: 0, clearProps: 'transform' });
      }, 1200);
    });
  }

  window.GREEN_MOTION = { iniciar, revelar, travarScroll, recalcular, rolarPara };

  // Se o app.js já terminou (ordem de carga inesperada), parte agora.
  if (window.GREEN_APP_PRONTO) iniciar();
})();
