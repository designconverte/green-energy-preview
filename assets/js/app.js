/* ==========================================================================
   GREEN ENERGY · comportamento da página
   Framework estático da KOM/Urbana, com a realidade da Green: preço e selo
   legal no card, modelo em mais de uma categoria, foto por cor, mapa só no
   clique e JSON-LD escrito a partir do mesmo dado que desenha a página.
   Sem dependências. GSAP é opcional e vive em motion.js; nada aqui depende
   dele, então a página continua inteira e utilizável se o CDN falhar.
   ========================================================================== */

(() => {
  'use strict';

  const cfg = window.GREEN_CONFIG;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /** Lê 'endereco.completo' dentro do config, inclusive getters. */
  const pegar = (caminho) => caminho.split('.').reduce((o, k) => (o == null ? o : o[k]), cfg);

  const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const real = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const ICONE_WHATS = '<svg aria-hidden="true"><use href="#i-whats"></use></svg>';

  /* Avisa o tracking sem depender dele. Se tracking.js não estiver na página,
     o evento cai no vazio e nada quebra. */
  function emitir(nome, params = {}, opcoes = {}) {
    dispatchEvent(new CustomEvent('green:evento', { detail: { nome, params, opcoes } }));
  }

  /* Nome de evento do GA4: minúsculo, sem acento, só letra número e underscore,
     no máximo 40 caracteres. Fora dessa regra o GA4 descarta em silêncio. */
  function slugEvento(texto) {
    return texto
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
  }

  // Nome para análise: com fabricante quando a loja informa.
  const nomeCompleto = (m) => [m.fabricante, m.nome].filter(Boolean).join(' ');
  const categoriasDe = (m) => m.categorias || (m.categoria ? [m.categoria] : []);

  /* Todo caminho que leva ao WhatsApp de um modelo passa por aqui, para os
     dois eventos saírem sempre iguais e sempre juntos:
     1. `generate_lead`, A conversão (uma só, com o modelo em parâmetro);
     2. `btn_interesse_{marca}_{modelo}`, só para segmentar no GA4. */
  function interesseNoModelo(modelo, origem, extras = {}) {
    if (!modelo) return;
    const dados = {
      origem,
      item_id: modelo.id,
      item_name: nomeCompleto(modelo),
      item_brand: modelo.fabricante || undefined,
      item_category: categoriasDe(modelo)[0],
      value: modelo.preco?.valor || undefined,
      currency: modelo.preco?.valor ? 'BRL' : undefined,
      ...extras,
    };
    emitir('generate_lead', dados);
    emitir(slugEvento(`btn_interesse_${nomeCompleto(modelo)}`), dados, { somenteGa4: true });
  }

  /** Monta o link do WhatsApp com a mensagem já preenchida. */
  function linkWhats(chave, trocas = {}) {
    let texto = cfg.mensagens[chave] || cfg.mensagens.geral;
    for (const [k, v] of Object.entries(trocas)) {
      texto = texto.replaceAll(`{${k}}`, v);
    }
    const prefixo = cfg.prefixoMensagem;
    if (prefixo && !texto.toLowerCase().startsWith(prefixo.toLowerCase())) texto = `${prefixo}. ${texto}`;
    const numero = chave === 'assistencia' ? (cfg.assistencia?.e164 || cfg.whatsapp.e164) : cfg.whatsapp.e164;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  /* ── 1. Dados da loja no HTML ─────────────────────────────────────────── */

  function aplicarConfig() {
    $$('[data-config]').forEach((el) => { el.textContent = pegar(el.dataset.config) ?? ''; });
    $$('[data-config-href]').forEach((el) => { el.href = pegar(el.dataset.configHref) ?? '#'; });

    $$('[data-whats]').forEach((el) => {
      el.href = linkWhats(el.dataset.whats);
      el.target = '_blank';
      el.rel = 'noopener';
    });

    const rota = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cfg.endereco.busca)}`;
    $$('[data-rota]').forEach((el) => { el.href = rota; });

    // Consentimento tem que ser tão fácil de retirar quanto de dar (LGPD).
    $('#rever-cookies')?.addEventListener('click', () => window.GREEN_CONSENTIMENTO?.reabrir());

    $$('[data-horarios]').forEach((el) => {
      el.textContent = cfg.horarios.confirmado
        ? (cfg.horarios[el.dataset.horarios] || cfg.horarios.vendas)
        : 'Horário de atendimento: consulte pelo WhatsApp';
    });

    // Números da faixa de prova contados do próprio dado: nunca envelhecem.
    $$('[data-total="modelos"]').forEach((el) => { el.dataset.contador = String((window.GREEN_MODELOS || []).length); el.textContent = el.dataset.contador; });
    $$('[data-total="marcas"]').forEach((el) => { el.dataset.contador = String($$('.marcas__item').length); el.textContent = el.dataset.contador; });
    $$('[data-ano]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  }

  /* ── 2. Header e botão flutuante ──────────────────────────────────────── */

  function scrollUI() {
    const header = $('#header');
    const flutuante = $('#flutuante');
    let ticking = false;

    /* O header nasce transparente sobre o vídeo do hero e vira Ink 92% com
       vidro depois de 24 px de rolagem (regra do styleguide). */
    const atualizar = () => {
      header.classList.toggle('is-fixo', window.scrollY > 24);
      ticking = false;
    };

    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(atualizar);
    }, { passive: true });

    atualizar();
    requestAnimationFrame(() => flutuante?.classList.add('is-visivel'));
  }

  /* ── 3. Menu mobile ───────────────────────────────────────────────────── */

  function menu() {
    const painel = $('#menu');
    const toggle = $('#menu-toggle');
    if (!painel || !toggle) return;

    const itens = $$('.menu__item-wrap', painel);
    itens.forEach((item, i) => item.style.setProperty('--i', i));

    const corpo = $('.menu__painel', painel);
    const header = $('#header');

    const definir = (aberto) => {
      if (aberto) {
        // Medir na hora: o primeiro item nunca nasce embaixo do botão de fechar.
        corpo.style.paddingTop = `${Math.round(header.getBoundingClientRect().bottom) + 24}px`;
      }
      painel.classList.toggle('is-aberto', aberto);
      painel.setAttribute('aria-hidden', String(!aberto));
      toggle.setAttribute('aria-expanded', String(aberto));
      $('.u-visually-hidden', toggle).textContent = aberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação';
      document.body.classList.toggle('is-locked', aberto);
      document.body.classList.toggle('menu-aberto', aberto);
      window.GREEN_MOTION?.travarScroll(aberto);
      if (aberto) $('.menu__item', painel)?.focus({ preventScroll: true });
    };

    toggle.addEventListener('click', () => definir(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('.menu__item, .menu__rodape a', painel).forEach((a) => a.addEventListener('click', () => definir(false)));

    painel.addEventListener('click', (e) => {
      if (!e.target.closest('.menu__painel')) definir(false);
    });

    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && painel.classList.contains('is-aberto')) {
        definir(false);
        toggle.focus();
      }
    });

    // Voltar para desktop com o menu aberto deixaria o body travado.
    matchMedia('(min-width: 1101px)').addEventListener('change', (e) => {
      if (e.matches) definir(false);
    });
  }

  /* ── 4. Carrossel (depoimentos) ───────────────────────────────────────
     Snap e rolagem são do CSS, o que dá swipe nativo no toque. O JS entra só
     para arrastar com o mouse, setas do teclado, anterior/próximo e pontos,
     que marcam PÁGINA e não item. */

  function carrossel(raiz) {
    const trilho = $('.carrossel__trilho', raiz);
    const pontos = $('.carrossel__pontos', raiz);
    const anterior = $('[data-carrossel-passo="-1"]', raiz);
    const proximo = $('[data-carrossel-passo="1"]', raiz);
    if (!trilho) return { atualizar: () => {} };

    const rotulo = raiz.dataset.carrosselRotulo || 'itens';

    const passo = () => {
      const [a, b] = trilho.children;
      if (!a) return trilho.clientWidth;
      return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
    };
    const maximo = () => Math.max(0, trilho.scrollWidth - trilho.clientWidth);
    const porPagina = () => Math.max(1, Math.floor((trilho.clientWidth + 1) / passo()));
    const paginas = () => (maximo() <= 2 ? 1 : Math.ceil(trilho.children.length / porPagina()));

    function paginaAtual() {
      const total = paginas();
      if (total <= 1) return 0;
      if (trilho.scrollLeft >= maximo() - 2) return total - 1;
      return Math.min(total - 1, Math.round(trilho.scrollLeft / (porPagina() * passo())));
    }

    const MAX_PONTOS = 9;

    function desenharPontos() {
      const total = paginas();
      raiz.classList.toggle('is-estatico', total <= 1);
      if (!pontos) return;
      pontos.hidden = total <= 1;
      pontos.innerHTML = total > MAX_PONTOS
        ? '<span class="carrossel__contador" aria-hidden="true"></span>'
        : Array.from({ length: total }, (_, i) => `
          <button class="carrossel__ponto" type="button" data-pagina="${i}"
                  aria-label="Página ${i + 1} de ${total} dos ${rotulo}"></button>`).join('');
      marcar();
    }

    function marcar() {
      const atual = paginaAtual();
      const contador = $('.carrossel__contador', raiz);
      if (contador) contador.textContent = `${atual + 1} / ${paginas()}`;
      $$('.carrossel__ponto', pontos || raiz).forEach((b, i) => b.setAttribute('aria-current', String(i === atual)));
      if (anterior) anterior.disabled = trilho.scrollLeft <= 2;
      if (proximo) proximo.disabled = trilho.scrollLeft >= maximo() - 2;
    }

    const rolar = (left) => trilho.scrollTo({ left, behavior: semMovimento() ? 'auto' : 'smooth' });

    let pendente = false;
    trilho.addEventListener('scroll', () => {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(() => { pendente = false; marcar(); });
    }, { passive: true });

    pontos?.addEventListener('click', (e) => {
      const botao = e.target.closest('[data-pagina]');
      if (botao) rolar(Number(botao.dataset.pagina) * porPagina() * passo());
    });

    [anterior, proximo].forEach((botao) => botao?.addEventListener('click', () => {
      rolar(trilho.scrollLeft + Number(botao.dataset.carrosselPasso) * passo());
    }));

    trilho.addEventListener('keydown', (e) => {
      if (e.target !== trilho) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); rolar(trilho.scrollLeft + passo()); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); rolar(trilho.scrollLeft - passo()); }
    });

    /* Arrasto com mouse. O ponteiro só é CAPTURADO depois que o mouse andou
       alguns pixels; depois de um arrasto de verdade, o clique que o encerra é
       engolido, senão soltar em cima de um link o dispararia. */
    let arrastando = false;
    let capturado = false;
    let inicioX = 0;
    let inicioScroll = 0;

    trilho.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      arrastando = true;
      capturado = false;
      inicioX = e.clientX;
      inicioScroll = trilho.scrollLeft;
    });

    trilho.addEventListener('pointermove', (e) => {
      if (!arrastando) return;
      const delta = e.clientX - inicioX;
      if (!capturado) {
        if (Math.abs(delta) < 6) return;
        capturado = true;
        trilho.setPointerCapture(e.pointerId);
        trilho.classList.add('is-arrastando');
      }
      trilho.scrollLeft = inicioScroll - delta;
    });

    const soltar = (e) => {
      if (!arrastando) return;
      arrastando = false;
      if (!capturado) return;
      capturado = false;
      trilho.classList.remove('is-arrastando');
      if (trilho.hasPointerCapture?.(e.pointerId)) trilho.releasePointerCapture(e.pointerId);
      trilho.addEventListener('click', (c) => { c.preventDefault(); c.stopPropagation(); }, { capture: true, once: true });
      requestAnimationFrame(() => rolar(Math.round(trilho.scrollLeft / passo()) * passo()));
    };
    trilho.addEventListener('pointerup', soltar);
    trilho.addEventListener('pointercancel', soltar);
    trilho.addEventListener('dragstart', (e) => e.preventDefault());

    let redimensionar = null;
    addEventListener('resize', () => {
      clearTimeout(redimensionar);
      redimensionar = setTimeout(desenharPontos, 150);
    });

    desenharPontos();
    return { atualizar: desenharPontos };
  }

  /* ── 5. Vitrine ───────────────────────────────────────────────────────── */

  const HEX_VALIDO = /^#[0-9a-fA-F]{6}$/;
  /* Caminho de imagem do próprio site, para entrar em `url()` dentro de um
     atributo style: qualquer outra coisa é descartada, não remendada. */
  const IMAGEM_LOCAL = /^assets\/img\/[a-z0-9/_-]+\.webp$/;

  function selos(m, classe = '') {
    const c = m.classificacao ? window.GREEN_CLASSIFICACOES[m.classificacao] : null;
    if (!c) return '';
    return `<ul class="selos ${classe}" aria-label="Classificação legal">${c.selos.map((s) => `
      <li class="selo selo--${s.tom}">${escapar(s.t)}</li>`).join('')}</ul>`;
  }

  const vitrine = (() => {
    const grade = $('#vitrine-grade');
    const vazio = $('#vitrine-vazio');
    const barra = $('#filtro');
    const nota = $('#filtro-nota');
    let ativa = 'todos';

    const modelos = () => {
      const todos = window.GREEN_MODELOS || [];
      const prioridade = window.GREEN_ORDEM || [];
      if (!prioridade.length) return todos;
      const posicao = new Map(prioridade.map((id, i) => [id, i]));
      return todos
        .map((m, i) => ({ m, i }))
        .sort((a, b) => {
          const pa = posicao.has(a.m.id) ? posicao.get(a.m.id) : Infinity;
          const pb = posicao.has(b.m.id) ? posicao.get(b.m.id) : Infinity;
          return pa - pb || a.i - b.i;
        })
        .map((x) => x.m);
    };
    const daCategoria = (id) => (id === 'todos' ? modelos() : modelos().filter((m) => categoriasDe(m).includes(id)));
    const contar = (id) => daCategoria(id).length;

    /* No máximo três números, sempre nesta ordem, só os que a loja informa. */
    const ORDEM_NUMEROS = [
      ['velocidade', 'Velocidade'],
      ['potencia', 'Potência'],
      ['autonomia', 'Autonomia'],
    ];
    const numerico = (v) => v && typeof v === 'object' && v.valor != null && v.unidade;

    function numeros(m, classe = '') {
      const s = m.specs;
      const disponiveis = s ? ORDEM_NUMEROS.filter(([campo]) => numerico(s[campo])) : [];
      if (!disponiveis.length) return '';
      return `
        <dl class="specs ${classe}">
          ${disponiveis.map(([campo, rotulo]) => `
            <div class="spec">
              <dt>${rotulo}</dt>
              <dd><b>${escapar(s[campo].valor)}</b><span>${escapar(s[campo].unidade)}</span></dd>
            </div>`).join('')}
        </dl>`;
    }

    function preco(m, classe = '') {
      if (!m.preco?.valor) return '';
      return `
        <p class="preco ${classe}">
          <span class="preco__rotulo">Valor</span>
          <span class="preco__valor">${real.format(m.preco.valor)}</span>
          ${m.preco.parcelas ? `<span class="preco__parcelas">${escapar(m.preco.parcelas)}</span>` : ''}
        </p>`;
    }

    /* Linha de cima do nome. No modal: "Aima · Scooter elétrica". No card só
       cabe uma informação sem quebrar linha (e desalinhar os nomes da fileira):
       a marca, ou o tipo quando a loja não informa a marca. */
    const eyebrow = (m) => [m.fabricante, m.descritivo].filter(Boolean).join(' · ');
    const eyebrowCurto = (m) => m.fabricante || m.descritivo || '';

    function card(m) {
      const bloco = numeros(m) || `
        <p class="card__pendente"><strong>Ficha técnica sob consulta</strong>
          Velocidade, potência e autonomia confirmadas pelo WhatsApp.</p>`;
      const tags = (m.tags || []).join(' · ');
      return `
        <li data-anima>
          <article class="card" data-id="${escapar(m.id)}">
            <div class="card__midia">
              <button class="card__foto${m.recorte === false ? ' card__foto--chapada' : ''}" type="button" data-detalhes="${escapar(m.id)}"
                      aria-label="Ver detalhes do ${escapar(m.nome)}">
                <img src="${escapar(m.foto)}" alt="${escapar(m.alt)}" loading="lazy" decoding="async" width="640" height="536">
              </button>
              ${selos(m, 'card__selos')}
            </div>
            <div class="card__corpo">
              <div class="card__cabeca">
                <p class="card__eyebrow">${escapar(eyebrowCurto(m))}</p>
                <h3 class="card__nome">${escapar(m.nome)}</h3>
                ${tags ? `<p class="card__tags">${escapar(tags)}</p>` : ''}
              </div>
              ${bloco}
              ${preco(m, 'card__preco')}
              <div class="card__acoes">
                <!-- O texto oculto fica DENTRO do rótulo: solto, virava um item
                     a mais do flex e ganhava o gap, descentralizando o botão. -->
                <a class="btn btn--primario btn--card" href="${linkWhats('modelo', { modelo: m.nome })}" target="_blank" rel="noopener">${ICONE_WHATS}<span>Comprar<span class="u-visually-hidden"> o ${escapar(m.nome)} pelo WhatsApp</span></span></a>
                <button class="btn btn--contorno btn--card" type="button" data-detalhes="${escapar(m.id)}"><span>+ Detalhes<span class="u-visually-hidden"> do ${escapar(m.nome)}</span></span></button>
              </div>
            </div>
          </article>
        </li>`;
    }

    const visiveisAgora = () => daCategoria(ativa);

    function render() {
      const visiveis = visiveisAgora();
      grade.innerHTML = visiveis.map(card).join('');
      grade.hidden = visiveis.length === 0;

      const meta = window.GREEN_CATEGORIAS.find((c) => c.id === ativa);
      nota.textContent = meta ? meta.nota : '';

      if (visiveis.length === 0) {
        vazio.hidden = false;
        vazio.innerHTML = `
          <p class="t-h4" style="margin:0 0 var(--sp-3)">Estamos atualizando os modelos desta categoria.</p>
          <p style="margin:0 auto var(--sp-6);max-width:52ch">A equipe da Green passa as opções pelo WhatsApp.</p>
          <a class="btn btn--primario" href="${linkWhats('categoria', { categoria: meta ? meta.nome.toLowerCase() : 'modelos' })}" target="_blank" rel="noopener">
            ${ICONE_WHATS}Quero ver as opções
          </a>`;
      } else {
        vazio.hidden = true;
      }

      brilhoDeBorda();
      window.GREEN_MOTION?.revelar(grade);
      // A grade mudou de altura: sem recalcular, o que vem abaixo fica em opacity 0.
      window.GREEN_MOTION?.recalcular();
    }

    /* Depois de filtrar, traz o visitante de volta ao topo da grade, se ele
       saiu da tela. Se o topo já está visível, não rola. */
    function irParaVitrine() {
      const estilo = getComputedStyle(document.documentElement);
      const alturaHeader = parseFloat(estilo.getPropertyValue('--ge-header')) || 80;
      const alturaFiltro = barra ? barra.getBoundingClientRect().height : 0;
      const topo = alturaHeader + alturaFiltro + 16;
      /* O alvo é a NOTA da categoria, logo acima da grade: é ela que diz se
         aquela categoria exige CNH. Mirando a grade, a nota ficava sob a barra. */
      const alvo = nota.textContent ? nota : (grade.hidden ? vazio : grade);
      const r = alvo.getBoundingClientRect();
      if (r.top >= topo && r.top < innerHeight * 0.6) return;
      window.GREEN_MOTION?.rolarPara(alvo, -topo);
    }

    function barraFiltro() {
      barra.innerHTML = window.GREEN_CATEGORIAS.filter((c) => c.id === 'todos' || contar(c.id) > 0).map((c) => `
        <button class="filtro__btn" type="button" data-cat="${c.id}" aria-pressed="${c.id === ativa}">
          <span class="filtro__contagem">${contar(c.id)}<span class="u-visually-hidden"> modelos</span></span>
          ${escapar(c.nome)}
        </button>
      `).join('');
    }

    function filtrar(id, rolar = true, origem = 'filtro') {
      if (id !== ativa) emitir('filtrar_categoria', { categoria: id, origem });
      ativa = id;
      $$('.filtro__btn', barra).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === id)));
      render();
      if (rolar) requestAnimationFrame(irParaVitrine);
    }

    /**
     * A barra de filtro gruda embaixo do header.
     * Geometria em vez de IntersectionObserver (bug herdado da Urbana):
     * `!isIntersecting` é verdade com a sentinela ACIMA e ABAIXO da tela.
     * A margem de baixo absorve a diferença de altura entre barra solta e
     * grudada, para nada abaixo dela dar salto no instante em que gruda.
     */
    function grudar() {
      const sentinela = $('#filtro-sentinela');
      if (!barra || !sentinela) return;
      let alturaHeader = 80;
      const medirHeader = () => {
        alturaHeader = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ge-header')) || 80;
      };

      let alturaSolta = 0;
      let margemBase = null;
      const medirSolta = () => {
        alturaSolta = barra.getBoundingClientRect().height;
        if (margemBase === null) margemBase = parseFloat(getComputedStyle(barra).marginBottom) || 0;
      };

      let pendente = false;
      const conferir = () => {
        pendente = false;
        const deveGrudar = sentinela.getBoundingClientRect().top < alturaHeader + 10;
        const estaGrudada = barra.classList.contains('is-fixo');
        if (deveGrudar === estaGrudada) return;

        if (deveGrudar) {
          medirSolta();
          barra.classList.add('is-fixo');
          const diferenca = alturaSolta - barra.getBoundingClientRect().height;
          barra.style.marginBottom = `${Math.max(0, margemBase + diferenca)}px`;
        } else {
          barra.classList.remove('is-fixo');
          barra.style.marginBottom = '';
          medirSolta();
        }
      };
      const agendar = () => {
        if (pendente) return;
        pendente = true;
        requestAnimationFrame(conferir);
      };

      medirHeader();
      conferir();
      addEventListener('scroll', agendar, { passive: true });
      addEventListener('load', () => { medirHeader(); conferir(); });
      let agendado = null;
      addEventListener('resize', () => {
        clearTimeout(agendado);
        agendado = setTimeout(() => {
          medirHeader();
          if (barra.classList.contains('is-fixo')) {
            barra.classList.remove('is-fixo');
            barra.style.marginBottom = '';
            medirSolta();
          }
          conferir();
        }, 150);
      });
    }

    function iniciar() {
      if (!grade) return;
      barraFiltro();
      render();
      grudar();

      barra.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cat]');
        if (btn) filtrar(btn.dataset.cat);
      });

      addEventListener('load', () => window.GREEN_MOTION?.recalcular());

      grade.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-detalhes]');
        if (btn) { modal.abrir(btn.dataset.detalhes, btn); return; }

        const comprar = e.target.closest('.card a[href*="wa.me"]');
        if (comprar) {
          const cartao = comprar.closest('.card');
          comprar.dataset.rastreado = '1'; // já contado aqui, não repetir na delegação
          interesseNoModelo(modelos().find((x) => x.id === cartao?.dataset.id), 'card');
        }
      });
    }

    return { iniciar, filtrar, visiveis: visiveisAgora, numeros, preco, eyebrow, todos: modelos };
  })();

  /* ── 6. Facho de luz neon na borda do card ────────────────────────────
     Duas variáveis CSS: proximidade da borda e ângulo do cursor. Nada anima
     em JS: o CSS faz o resto. Só com ponteiro fino e movimento liberado. */

  function brilhoDeBorda() {
    if (matchMedia('(hover: none)').matches || semMovimento()) return;

    $$('.card').forEach((card) => {
      if (card.dataset.brilho === 'on') return;
      card.dataset.brilho = 'on';

      let pendente = false;
      let ultimo = null;

      const escrever = () => {
        pendente = false;
        if (!ultimo) return;
        card.style.setProperty('--brilho', ultimo.brilho.toFixed(3));
        card.style.setProperty('--angulo', `${ultimo.angulo.toFixed(1)}deg`);
      };

      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const kx = dx === 0 ? Infinity : (r.width / 2) / Math.abs(dx);
        const ky = dy === 0 ? Infinity : (r.height / 2) / Math.abs(dy);
        const proximidade = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
        let angulo = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (angulo < 0) angulo += 360;
        ultimo = { brilho: Math.max(0, (proximidade - 0.35) / 0.65), angulo };
        if (!pendente) {
          pendente = true;
          requestAnimationFrame(escrever);
        }
      });

      card.addEventListener('pointerleave', () => {
        ultimo = null;
        card.style.setProperty('--brilho', '0');
      });
    });
  }

  /* ── 7. Lightbox da galeria ───────────────────────────────────────────── */

  const lightbox = (() => {
    const raiz = $('#lightbox');
    let fotos = [];
    let indice = 0;
    let voltarPara = null;

    function pintar() {
      const foto = fotos[indice];
      if (!foto) return;
      $('#lightbox-foto').src = foto.src;
      $('#lightbox-foto').alt = foto.alt || '';
      $('#lightbox-contador').textContent = `${indice + 1} / ${fotos.length}`;
      const soUma = fotos.length < 2;
      $$('.lightbox__seta', raiz).forEach((b) => { b.hidden = soUma; });
      $('#lightbox-contador').hidden = soUma;
    }

    function andar(passo) {
      if (!fotos.length) return;
      indice = (indice + passo + fotos.length) % fotos.length;
      pintar();
    }

    function abrir(lista, inicio = 0) {
      if (!raiz || !lista?.length) return;
      fotos = lista;
      indice = Math.max(0, Math.min(inicio, lista.length - 1));
      voltarPara = document.activeElement;
      pintar();
      raiz.classList.add('is-aberto');
      raiz.setAttribute('aria-hidden', 'false');
      $('.lightbox__fechar', raiz).focus({ preventScroll: true });
    }

    function fechar() {
      if (!raiz || !raiz.classList.contains('is-aberto')) return;
      raiz.classList.remove('is-aberto');
      raiz.setAttribute('aria-hidden', 'true');
      voltarPara?.focus?.({ preventScroll: true });
      voltarPara = null;
    }

    const estaAberto = () => Boolean(raiz?.classList.contains('is-aberto'));

    function iniciar() {
      if (!raiz) return;
      raiz.addEventListener('click', (e) => {
        const passo = e.target.closest('[data-lightbox-passo]');
        if (passo) { andar(Number(passo.dataset.lightboxPasso)); return; }
        fechar();
      });
      addEventListener('keydown', (e) => {
        if (!estaAberto()) return;
        if (e.key === 'Escape') { e.stopPropagation(); fechar(); }
        if (e.key === 'ArrowRight') andar(1);
        if (e.key === 'ArrowLeft') andar(-1);
      }, true);
    }

    return { iniciar, abrir, fechar, estaAberto };
  })();

  /* ── 8. Modal de detalhes ─────────────────────────────────────────────
     Três faixas: cabeçalho parado, miolo rolando, base parada com cor, preço
     e as duas saídas (Comprar e Agendar test ride), já com modelo e cor. */

  const modal = (() => {
    const raiz = $('#modal');
    let origem = null;
    let atual = null;
    let corAtiva = 0;
    // Cores do modelo aberto que viram bolinha: só as que têm foto.
    let paleta = [];

    const temFoto = (c) => Array.isArray(c?.galeria) && c.galeria.length > 0;

    /* Bolinha que não troca a foto parece quebrada (pedido do cliente,
       27/10/2026). Cor sem foto sai do seletor e vai por extenso para a
       ficha (ver ficha). O catálogo continua com todas: chegando a foto, a
       bolinha volta sozinha. */
    const paletaDe = (m) => (m.cores || []).filter(temFoto);

    /* A cor troca as fotos do VEÍCULO INTEIRO. As de detalhe ficam sempre. */
    function fotosDaCorAtiva(m) {
      const daCor = paleta[corAtiva]?.galeria;
      if (!daCor) return m.galeria || [];
      return [...daCor, ...(m.galeria || []).filter((f) => f.detalhe)];
    }

    /* Foto de estúdio: cabe inteira sobre a cor da própria borda, e a sobra do
       quadro some. Foto de ambiente: cabe inteira sobre uma cópia desfocada de
       si mesma, para não boiar numa faixa de cor chapada. */
    function slide(f, k, total) {
      const fundo = HEX_VALIDO.test(f.fundo || '') ? f.fundo : '#F5F7F2';
      const ambiente = !f.estudio && IMAGEM_LOCAL.test(f.src);
      /* URL ABSOLUTA: `url()` dentro de variável CSS é resolvida a partir da
         folha que a usa (assets/css/), não da página. Relativa, dava 404. */
      const estilo = ambiente
        ? `--fundo:${fundo};--foto:url('${new URL(f.src, document.baseURI).href}')`
        : `--fundo:${fundo}`;
      return `
        <div class="modal__slide${ambiente ? ' is-ambiente' : ''}" role="group" aria-roledescription="slide"
             aria-label="${k + 1} de ${total}" style="${escapar(estilo)}">
          <img src="${escapar(f.src)}" alt="${escapar(f.alt)}" draggable="false" decoding="async"
               ${f.w ? `width="${Number(f.w)}" height="${Number(f.h)}"` : ''}${k > 0 ? ' loading="lazy"' : ''}>
        </div>`;
    }

    function galeria(m, indice = 0) {
      const trilho = $('#modal-slider');
      const fotos = fotosDaCorAtiva(m);
      if (!fotos.length) return;
      const i = Math.min(indice, fotos.length - 1);

      trilho.innerHTML = fotos.map((f, k) => slide(f, k, fotos.length)).join('');

      $('#modal-miniaturas').hidden = fotos.length < 2;
      $('.modal__galeria').classList.toggle('tem-miniaturas', fotos.length > 1);
      $('#modal-miniaturas').innerHTML = fotos.map((f, k) => `
        <button class="modal__mini" type="button" data-foto="${k}" aria-current="${k === i}"
                aria-label="Ver foto ${k + 1} de ${fotos.length}">
          <img src="${escapar(f.mini || f.src)}" alt="" loading="lazy" decoding="async" width="180" height="127">
        </button>
      `).join('');

      irPara(i, 'auto');
    }

    /* ── Slider ────────────────────────────────────────────────────────── */

    let houveArrasto = false;
    const trilhoArrastou = () => houveArrasto;

    function slideAtual() {
      const trilho = $('#modal-slider');
      const largura = trilho.clientWidth || 1;
      return Math.round(trilho.scrollLeft / largura);
    }

    function irPara(indice, comportamento = 'smooth') {
      const trilho = $('#modal-slider');
      const slides = trilho.children.length;
      if (!slides) return;
      const alvo = Math.max(0, Math.min(indice, slides - 1));
      trilho.scrollTo({ left: alvo * trilho.clientWidth, behavior: semMovimento() ? 'auto' : comportamento });
      marcarMiniatura(alvo);
    }

    function marcarMiniatura(indice) {
      $$('#modal-miniaturas .modal__mini').forEach((b, k) => {
        b.setAttribute('aria-current', String(k === indice));
        if (k === indice) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    }

    function ligarSlider() {
      const trilho = $('#modal-slider');
      if (!trilho) return;

      let pendente = false;
      trilho.addEventListener('scroll', () => {
        if (pendente) return;
        pendente = true;
        requestAnimationFrame(() => {
          pendente = false;
          marcarMiniatura(slideAtual());
        });
      }, { passive: true });

      trilho.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); irPara(slideAtual() + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(slideAtual() - 1); }
      });

      $$('[data-slide-passo]', raiz).forEach((b) => b.addEventListener('click', () => {
        irPara(slideAtual() + Number(b.dataset.slidePasso));
      }));

      // Arrasto com mouse. No toque o próprio browser já resolve.
      let arrastando = false;
      let inicioX = 0;
      let inicioScroll = 0;
      let moveu = 0;

      trilho.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        arrastando = true;
        moveu = 0;
        inicioX = e.clientX;
        inicioScroll = trilho.scrollLeft;
        trilho.classList.add('is-arrastando');
        trilho.setPointerCapture(e.pointerId);
      });

      trilho.addEventListener('pointermove', (e) => {
        if (!arrastando) return;
        const delta = e.clientX - inicioX;
        moveu = Math.abs(delta);
        trilho.scrollLeft = inicioScroll - delta;
      });

      const soltar = (e) => {
        if (!arrastando) return;
        arrastando = false;
        houveArrasto = moveu > 6;
        setTimeout(() => { houveArrasto = false; }, 0);
        trilho.classList.remove('is-arrastando');
        if (trilho.hasPointerCapture?.(e.pointerId)) trilho.releasePointerCapture(e.pointerId);
        // Passou de um quinto da largura, vai para o próximo; senão, volta.
        const largura = trilho.clientWidth || 1;
        const partiu = Math.round(inicioScroll / largura);
        const delta = trilho.scrollLeft - inicioScroll;
        if (moveu > largura * 0.2) irPara(partiu + (delta > 0 ? 1 : -1));
        else irPara(partiu);
      };

      trilho.addEventListener('pointerup', soltar);
      trilho.addEventListener('pointercancel', soltar);
    }

    function ficha(m) {
      const alvo = $('#modal-ficha');
      const classe = m.classificacao ? window.GREEN_CLASSIFICACOES[m.classificacao] : null;
      const nomes = (m.cores || []).map((c) => c.nome);
      // Alguma cor ficou fora do seletor: a lista completa vai por extenso.
      const coresNoTexto = nomes.length > paleta.length ? nomesPorExtenso(nomes) : null;
      const specs = {
        ...(m.specs || {}),
        ...(classe ? { classificacao: classe.ficha } : {}),
        ...(coresNoTexto ? { cores: coresNoTexto } : {}),
      };
      /* Campo sem dado simplesmente não aparece: dez linhas de "não
         informado" comunicam ausência, não especificação. */
      alvo.innerHTML = window.GREEN_FICHA_ORDEM
        .filter(([chave]) => specs[chave] != null)
        .map(([chave, rotulo]) => {
          const bruto = specs[chave];
          const valor = typeof bruto === 'object' ? `${bruto.valor} ${bruto.unidade}` : bruto;
          // Número com condição carrega a condição NA MESMA LINHA.
          const nota = typeof bruto === 'object' && bruto.nota
            ? `<small class="ficha__nota">${escapar(bruto.nota)}</small>`
            : '';
          return `<div><dt>${rotulo}</dt><dd>${escapar(valor)}${nota}</dd></div>`;
        }).join('');
    }

    function equipamentos(m) {
      const bloco = $('#modal-equipamentos');
      const itens = m.equipamentos || [];
      bloco.hidden = !itens.length;
      if (!itens.length) return;
      $('#modal-equipamentos-lista').innerHTML = itens.map((item) => `<li>${escapar(item)}</li>`).join('');
    }

    /**
     * Fundo da bolinha, em ordem de precedência: bicolor → imagem → hex.
     * SEGURANÇA: o valor entra numa declaração CSS dentro de um atributo
     * style, então hex passa pela regex e imagem só se for caminho do próprio
     * site (IMAGEM_LOCAL). O resto é descartado e cai no hex.
     */
    const parDeHex = (v) => Array.isArray(v) && v.length === 2 && v.every((h) => HEX_VALIDO.test(h));

    function fundoDoSwatch(c) {
      if (parDeHex(c.bicolor)) return `background:linear-gradient(135deg, ${c.bicolor[0]} 50%, ${c.bicolor[1]} 50%)`;
      if (c.imagem && IMAGEM_LOCAL.test(c.imagem)) return `background:url('${c.imagem}') center/cover no-repeat`;
      return `background:${HEX_VALIDO.test(c.hex || '') ? c.hex : 'transparent'}`;
    }

    /* "Preta, Laranja e Verde". */
    function nomesPorExtenso(nomes) {
      try {
        return new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(nomes);
      } catch (e) {
        return nomes.join(', ');
      }
    }

    function cores() {
      const bloco = $('#modal-cores');
      bloco.hidden = !paleta.length;
      if (!paleta.length) { $('#modal-swatches').innerHTML = ''; return; }
      $('#modal-cor-nome').textContent = paleta[corAtiva].nome;
      // Uma cor só: fica o rótulo (entra na mensagem), sai a bolinha sem função.
      $('#modal-swatches').hidden = paleta.length < 2;
      $('#modal-swatches').innerHTML = paleta.map((c, i) => `
        <button class="modal__swatch" type="button" data-cor="${i}"
                aria-pressed="${i === corAtiva}" aria-label="Cor ${escapar(c.nome)}"
                title="${escapar(c.nome)}">
          <i style="${fundoDoSwatch(c)}" aria-hidden="true"></i>
        </button>
      `).join('');
    }

    /* Remonta os dois links da base com o modelo e a cor escolhidos. */
    function cta() {
      const nome = atual.nome;
      const cor = paleta[corAtiva]?.nome;
      $('#modal-cta').href = cor ? linkWhats('modeloCor', { modelo: nome, cor }) : linkWhats('modelo', { modelo: nome });
      $('#modal-testride').href = cor
        ? linkWhats('testRideModeloCor', { modelo: nome, cor })
        : linkWhats('testRideModelo', { modelo: nome });
    }

    function vizinhos() {
      const lista = vitrine.visiveis();
      const i = lista.findIndex((m) => m.id === atual?.id);
      if (i < 0) return { lista, i, anterior: null, proximo: null };
      return {
        lista,
        i,
        anterior: lista[(i - 1 + lista.length) % lista.length] || null,
        proximo: lista[(i + 1) % lista.length] || null,
      };
    }

    function setas() {
      const bloco = $('#modal-navegacao');
      if (!bloco) return;
      const { lista, i, anterior, proximo } = vizinhos();
      bloco.hidden = lista.length < 2 || i < 0;
      if (bloco.hidden) return;
      $('#modal-anterior').setAttribute('aria-label', `Ver ${anterior.nome}`);
      $('#modal-proximo').setAttribute('aria-label', `Ver ${proximo.nome}`);
      $('#modal-posicao').textContent = `${i + 1} de ${lista.length}`;
    }

    function irParaModelo(direcao) {
      const { anterior, proximo } = vizinhos();
      const alvo = direcao < 0 ? anterior : proximo;
      if (alvo) abrir(alvo.id);
    }

    function abrir(id, gatilho) {
      atual = (window.GREEN_MODELOS || []).find((m) => m.id === id);
      if (!atual) return;
      if (gatilho !== undefined) origem = gatilho || null;
      corAtiva = 0;
      paleta = paletaDe(atual);

      $('#modal-eyebrow').textContent = vitrine.eyebrow(atual);
      $('#modal-titulo').textContent = atual.nome;
      $('#modal-selo').innerHTML = selos(atual, 'selos--modal');

      const tags = $('#modal-tags');
      tags.textContent = (atual.tags || []).join(' · ');
      tags.hidden = !(atual.tags || []).length;

      const destaque = $('#modal-numeros');
      destaque.innerHTML = vitrine.numeros(atual, 'specs--modal');
      destaque.hidden = !destaque.innerHTML.trim();

      $('#modal-preco').innerHTML = vitrine.preco(atual, 'preco--modal');

      galeria(atual);
      ficha(atual);
      equipamentos(atual);
      cores();
      cta();
      setas();
      $('#modal-corpo').scrollTop = 0;

      emitir('view_item', {
        item_id: atual.id,
        item_name: nomeCompleto(atual),
        item_brand: atual.fabricante || undefined,
        item_category: categoriasDe(atual)[0],
        value: atual.preco?.valor || undefined,
        currency: atual.preco?.valor ? 'BRL' : undefined,
      });

      raiz.classList.add('is-aberto');
      raiz.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      window.GREEN_MOTION?.travarScroll(true);
      history.replaceState(null, '', `#modelo/${atual.id}`);
      $('#modal-titulo').setAttribute('tabindex', '-1');
      $('#modal-titulo').focus({ preventScroll: true });
    }

    function fechar() {
      lightbox.fechar();
      raiz.classList.remove('is-aberto');
      raiz.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      window.GREEN_MOTION?.travarScroll(false);
      if (location.hash.startsWith('#modelo/')) {
        history.replaceState(null, '', location.pathname + location.search);
      }
      origem?.focus({ preventScroll: true });
      origem = null;
      atual = null;
    }

    function iniciar() {
      if (!raiz) return;
      ligarSlider();
      lightbox.iniciar();

      raiz.addEventListener('click', (e) => {
        if (e.target.closest('[data-fechar-modal]')) { fechar(); return; }

        const mini = e.target.closest('[data-foto]');
        if (mini) { irPara(Number(mini.dataset.foto)); return; }

        const seta = e.target.closest('[data-modelo-passo]');
        if (seta) { irParaModelo(Number(seta.dataset.modeloPasso)); return; }

        if (e.target.closest('[data-slide-passo]')) return;

        /* Clique na foto grande abre a versão ampliada. O alvo é o TRILHO:
           durante o arrasto ele captura o ponteiro e recebe o clique. */
        if (e.target.closest('.modal__slider') && !trilhoArrastou()) {
          lightbox.abrir(fotosDaCorAtiva(atual), slideAtual());
          return;
        }

        // `botaoCta`, e não `cta`: existe uma função cta() neste escopo.
        const botaoCta = e.target.closest('#modal-cta, #modal-testride');
        if (botaoCta && atual) {
          botaoCta.dataset.rastreado = '1';
          const testRide = botaoCta.id === 'modal-testride';
          interesseNoModelo(atual, testRide ? 'modal_testride' : 'modal', { cor: paleta[corAtiva]?.nome });
          return;
        }

        const swatch = e.target.closest('[data-cor]');
        if (swatch) {
          // Compara pelo SRC da primeira foto: fotosDaCorAtiva monta array novo.
          const anterior = fotosDaCorAtiva(atual)[0]?.src;
          corAtiva = Number(swatch.dataset.cor);
          cores();
          if (fotosDaCorAtiva(atual)[0]?.src !== anterior) galeria(atual, 0);
          cta();
          $(`#modal-swatches [data-cor="${corAtiva}"]`)?.focus({ preventScroll: true });
        }
      });

      addEventListener('keydown', (e) => {
        if (!raiz.classList.contains('is-aberto')) return;
        if (lightbox.estaAberto()) return; // com o lightbox por cima, o ESC é dele
        if (e.key === 'Escape') { fechar(); return; }
        if (e.key !== 'Tab') return;

        // Prende o foco dentro do modal enquanto ele estiver aberto.
        const focaveis = $$('button, a[href], [tabindex]:not([tabindex="-1"])', raiz)
          .filter((el) => el.offsetParent !== null);
        if (!focaveis.length) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      });

      /* Âncora compartilhável: /#modelo/tiger-x6 abre o modal direto. */
      const abrirPorHash = () => {
        const hash = location.hash.match(/^#modelo\/(.+)$/);
        if (hash) abrir(decodeURIComponent(hash[1]), null);
      };
      addEventListener('hashchange', abrirPorHash);
      requestAnimationFrame(abrirPorHash);
    }

    return { iniciar, abrir };
  })();

  /* ── 9. FAQ ───────────────────────────────────────────────────────────── */

  function faq() {
    const alvo = $('#faq-lista');
    if (!alvo) return;

    alvo.innerHTML = (window.GREEN_FAQ || []).map((f, i) => `
      <div class="faq__item${i === 0 ? ' is-aberto' : ''}">
        <h3 class="faq__pergunta">
          <button class="faq__botao" type="button" aria-expanded="${i === 0}" aria-controls="faq-r${i}" id="faq-q${i}">
            <span>${escapar(f.q)}</span>
            <span class="faq__sinal" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="faq__resposta" id="faq-r${i}" role="region" aria-labelledby="faq-q${i}">
          <div><p>${escapar(f.a)}</p></div>
        </div>
      </div>
    `).join('');

    alvo.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq__botao');
      if (!btn) return;
      const item = btn.closest('.faq__item');
      const aberto = item.classList.toggle('is-aberto');
      btn.setAttribute('aria-expanded', String(aberto));
      if (aberto) emitir('faq_abrir', { pergunta: $('span', btn).textContent.slice(0, 90) });
      // A resposta muda a altura da página: os gatilhos abaixo precisam saber.
      setTimeout(() => window.GREEN_MOTION?.recalcular(), 320);
    });
  }

  /* ── 10. Depoimentos ───────────────────────────────────────────────────── */

  const ICONE_GOOGLE = `<svg class="depoimento__origem" viewBox="0 0 24 24" role="img" aria-label="Avaliação no Google">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"/>
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24Z"/>
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z"/>
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"/>
    </svg>`;

  function depoimentos() {
    const lista = window.GREEN_DEPOIMENTOS || [];
    const secao = $('#depoimentos');
    if (!secao) return;
    // Sem depoimento real, o bloco não existe: melhor sem prova social do que com prova inventada.
    if (!lista.length) { secao.hidden = true; return; }

    $('#depoimentos-trilho').innerHTML = lista.map((d) => {
      const estrelas = Math.min(5, Number(d.estrelas) || 5);
      const avatar = d.avatar && IMAGEM_LOCAL.test(d.avatar)
        ? `<img class="depoimento__avatar" src="${d.avatar}" alt="" width="48" height="48" loading="lazy" decoding="async">`
        : `<span class="depoimento__avatar depoimento__avatar--inicial" aria-hidden="true">${escapar(d.nome.trim()[0] || '')}</span>`;
      return `
        <li>
          <figure class="depoimento">
            <div class="depoimento__estrelas" role="img" aria-label="${estrelas} de 5 estrelas">${'★'.repeat(estrelas)}</div>
            <blockquote class="depoimento__texto">“${escapar(d.texto)}”</blockquote>
            <figcaption class="depoimento__autor">
              ${avatar}
              <span class="depoimento__quem">
                <span class="depoimento__nome">${escapar(d.nome)}</span>
                <span class="depoimento__fonte">Cliente Google</span>
              </span>
              ${d.origem === 'google' ? ICONE_GOOGLE : ''}
            </figcaption>
          </figure>
        </li>`;
    }).join('');

    carrossel($('#depoimentos-carrossel'));
  }

  /* ── 11. Dados estruturados ───────────────────────────────────────────
     Escritos a partir do MESMO dado que desenha a página. Fixos no HTML, um
     dia diriam um preço e o card mostraria outro. O Google lê JSON-LD
     injetado por JavaScript. */

  function dadosEstruturados() {
    const base = location.origin && location.origin !== 'null' ? `${location.origin}${location.pathname}` : '';
    const scripts = [];

    const faqs = window.GREEN_FAQ || [];
    if (faqs.length) {
      scripts.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }

    const modelos = vitrine.todos();
    if (modelos.length) {
      scripts.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Modelos Green Energy',
        itemListElement: modelos.map((m, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: nomeCompleto(m),
            image: base ? new URL(m.foto, base).href : m.foto,
            description: [m.descritivo, ...(m.tags || [])].filter(Boolean).join(', '),
            ...(m.fabricante ? { brand: { '@type': 'Brand', name: m.fabricante } } : {}),
            url: base ? `${base}#modelo/${m.id}` : undefined,
            ...(m.preco?.valor ? {
              offers: {
                '@type': 'Offer',
                price: m.preco.valor.toFixed(2),
                priceCurrency: 'BRL',
                availability: 'https://schema.org/InStock',
                seller: { '@type': 'Organization', name: cfg.marca.nomeLoja },
              },
            } : {}),
          },
        })),
      });
    }

    scripts.forEach((dado) => {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      // JSON.stringify não escapa "</": sem isto, um texto com </script> fecharia a tag.
      s.textContent = JSON.stringify(dado).replace(/</g, '\\u003c');
      document.head.appendChild(s);
    });
  }

  /* ── 12. Mídia pesada só quando faz sentido ───────────────────────────── */

  function midia() {
    /* Vídeo não carrega com movimento reduzido nem com economia de dados: o
       pôster fica, e é a mesma cena. */
    const conexao = navigator.connection || {};
    const poupar = semMovimento() || conexao.saveData === true || /(^|-)2g$/.test(conexao.effectiveType || '');
    if (poupar) return;

    const anexar = (video, src) => {
      if (!src || video.src) return;
      video.src = src;
      video.addEventListener('canplay', () => video.classList.add('is-pronto'), { once: true });
      video.play().catch(() => { /* autoplay bloqueado: o pôster fica */ });
    };

    const hero = $('#hero-video');
    if (hero) {
      const celular = matchMedia('(max-width: 760px)').matches;
      anexar(hero, celular ? hero.dataset.srcCelular : hero.dataset.src);
    }

    const lazy = $$('[data-lazy-video]');
    if (!lazy.length) return;

    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        anexar(entrada.target, entrada.target.dataset.src);
        obs.unobserve(entrada.target);
      });
    }, { rootMargin: '200px' });
    lazy.forEach((v) => obs.observe(v));

    // Vídeo fora da tela não precisa gastar bateria.
    const pausar = new IntersectionObserver((entradas) => {
      entradas.forEach(({ target, isIntersecting }) => {
        if (!target.src) return;
        if (isIntersecting) target.play().catch(() => {});
        else target.pause();
      });
    });
    [hero, ...lazy].filter(Boolean).forEach((v) => pausar.observe(v));
  }

  /* ── 13. Mapa ─────────────────────────────────────────────────────────
     Aparece sem clique (pedido do cliente, 19/10/2026), mas só quando o
     rodapé chega a 600 px da tela: o Google fica fora do carregamento inicial.
     O endereço sai do config.js, o mesmo do texto ao lado. */

  function mapa() {
    const frame = $('#mapa');
    if (!frame) return;
    const src = `https://maps.google.com/maps?q=${encodeURIComponent(cfg.endereco.busca)}&t=m&z=17&output=embed&iwloc=near`;
    const carregar = () => {
      if (frame.src) return;
      frame.src = src;
      frame.addEventListener('load', () => frame.closest('.mapa')?.classList.add('is-carregado'), { once: true });
    };
    if (!('IntersectionObserver' in window)) { carregar(); return; }
    const obs = new IntersectionObserver((entradas, o) => {
      if (!entradas[0].isIntersecting) return;
      carregar();
      o.disconnect();
    }, { rootMargin: '600px' });
    obs.observe(frame);
  }

  /* ── 14. Comunicado de segurança ──────────────────────────────────────
     Liga/desliga em config.js → alertaSeguranca.ativo. Dois níveis, para
     avisar sem interromper (pedido do cliente, 19/10/2026):
       1. AVISO no canto: entra sozinho depois de `atrasoMs`, não trava a
          rolagem nem tira o foco de ninguém. Quem fecha (ou abre os detalhes)
          só o vê de novo depois de `reexibirAposDias`, ou quando a `versao`
          mudar. Em tela estreita espera a escolha de cookies, que ocupa a
          mesma base da tela.
       2. COMUNICADO completo (diálogo): só abre se a pessoa pedir, pelo
          "Ver detalhes" do aviso ou pelo link do rodapé. */

  function alertaSeguranca() {
    const opcoes = cfg.alertaSeguranca;
    const raiz = $('#alerta-seguranca');
    const aviso = $('#aviso-seguranca');
    const reabrir = $('#abrir-alerta');
    if (!raiz) return;
    if (!opcoes?.ativo) {
      raiz.remove();
      aviso?.remove();
      reabrir?.remove();
      return;
    }

    $('[data-alerta="oficial"]', raiz).textContent = opcoes.siteOficial || location.hostname;
    const falsos = (opcoes.dominiosNaoReconhecidos || []).filter(Boolean);
    $('[data-alerta="falsos"]', raiz).innerHTML = falsos.map((d) => `
      <li><svg aria-hidden="true"><use href="#i-x"></use></svg><strong>${escapar(d)}</strong></li>`).join('');
    $('[data-alerta="caixa-falsos"]', raiz).hidden = !falsos.length;
    // No aviso curto entra só o primeiro domínio, como exemplo.
    const exemplo = aviso && $('[data-aviso="exemplo"]', aviso);
    if (exemplo) exemplo.innerHTML = falsos.length ? `, como <strong>${escapar(falsos[0])}</strong>` : '';

    raiz.hidden = false;
    if (reabrir) reabrir.hidden = false;

    const CHAVE = 'green:alerta-seguranca';
    const DIA = 86400000;
    const jaVisto = () => {
      try {
        const v = JSON.parse(localStorage.getItem(CHAVE) || 'null');
        return Boolean(v && v.versao === opcoes.versao && Date.now() - v.em < (opcoes.reexibirAposDias ?? 7) * DIA);
      } catch (e) { return false; } // modo privado ou armazenamento bloqueado: mostra
    };
    const marcarVisto = () => {
      try { localStorage.setItem(CHAVE, JSON.stringify({ versao: opcoes.versao, em: Date.now() })); } catch (e) { /* segue */ }
    };

    const botaoMais = $('#alerta-mais');
    const detalhes = $('#alerta-detalhes');
    const modalAberto = () => Boolean($('#modal')?.classList.contains('is-aberto'));
    const estaAberto = () => raiz.classList.contains('is-aberto');
    let voltarPara = null;

    function abrir(gatilho = 'automatico') {
      if (estaAberto()) return;
      voltarPara = document.activeElement;
      raiz.classList.add('is-aberto');
      raiz.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      window.GREEN_MOTION?.travarScroll(true);
      $('#alerta-titulo').focus({ preventScroll: true });
      emitir('alerta_seguranca_ver', { origem: gatilho });
    }

    function fechar() {
      if (!estaAberto()) return;
      raiz.classList.remove('is-aberto');
      raiz.setAttribute('aria-hidden', 'true');
      marcarVisto();
      // Leu o comunicado inteiro: o aviso do canto, se ainda estiver lá, sai junto.
      if (aviso && !aviso.hidden) {
        aviso.classList.remove('is-visivel');
        setTimeout(() => { aviso.hidden = true; }, 300);
      }
      if (!modalAberto()) {
        document.body.classList.remove('is-locked');
        window.GREEN_MOTION?.travarScroll(false);
      }
      voltarPara?.focus?.({ preventScroll: true });
      voltarPara = null;
    }

    raiz.addEventListener('click', (e) => {
      if (e.target.closest('[data-fechar-alerta]')) { fechar(); return; }
      // Foi conferir no WhatsApp ou no Instagram: o aviso cumpriu o papel.
      if (e.target.closest('a[href]')) marcarVisto();
    });

    botaoMais.addEventListener('click', () => {
      const abrirDetalhes = detalhes.hidden;
      detalhes.hidden = !abrirDetalhes;
      botaoMais.setAttribute('aria-expanded', String(abrirDetalhes));
      botaoMais.textContent = abrirDetalhes ? 'Ocultar detalhes' : 'Ver detalhes';
      if (abrirDetalhes) emitir('alerta_seguranca_detalhes', {});
    });

    addEventListener('keydown', (e) => {
      if (!estaAberto()) return;
      if (e.key === 'Escape') { e.stopPropagation(); fechar(); return; }
      if (e.key !== 'Tab') return;
      const focaveis = $$('button, a[href]', raiz).filter((el) => el.offsetParent !== null);
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === $('#alerta-titulo'))) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primeiro.focus();
      }
    }, true);

    reabrir?.addEventListener('click', () => abrir('rodape'));

    /* ── Nível 1: o aviso do canto ── */
    if (!aviso) return;

    function mostrarAviso() {
      aviso.hidden = false;
      requestAnimationFrame(() => aviso.classList.add('is-visivel'));
      emitir('aviso_seguranca_ver', {});
    }

    function esconderAviso() {
      if (aviso.hidden) return;
      marcarVisto();
      aviso.classList.remove('is-visivel');
      setTimeout(() => { aviso.hidden = true; }, 300);
    }

    aviso.addEventListener('click', (e) => {
      if (e.target.closest('[data-fechar-aviso]')) { esconderAviso(); return; }
      if (e.target.closest('#aviso-detalhes')) {
        esconderAviso();
        abrir('aviso');
      }
    });

    /* `?aviso` no endereço mostra o aviso mesmo para quem já o fechou: é o
       jeito de a loja (ou quem testa) conferir sem limpar o navegador. */
    const forcar = new URLSearchParams(location.search).has('aviso');
    if (jaVisto() && !forcar) return;

    /* O aviso mora no mesmo canto do aviso de cookies (esquerda no desktop,
       base da tela no celular): se a escolha de cookies ainda está pendente,
       espera por ela, para os dois nunca se sobreporem. */
    const cookiesPendentes = () => Boolean(window.GREEN_CONSENTIMENTO && !window.GREEN_CONSENTIMENTO.estado().decidido);
    const agendar = (ms) => setTimeout(mostrarAviso, ms);

    if (cookiesPendentes()) {
      addEventListener('green:consentimento', () => agendar(1200), { once: true });
    } else {
      agendar(Number(opcoes.atrasoMs) || 0);
    }
  }

  /* ── partida ──────────────────────────────────────────────────────────── */

  function iniciar() {
    aplicarConfig();
    scrollUI();
    menu();
    vitrine.iniciar();
    modal.iniciar();
    faq();
    depoimentos();
    dadosEstruturados();
    midia();
    mapa();
    alertaSeguranca();

    /* motion.js (defer) já rodou e só se declarou: a coreografia começa aqui,
       com a vitrine, o FAQ e os depoimentos já no DOM e os números da faixa
       de prova já contados. Sem GSAP, GREEN_MOTION é no-op. */
    window.GREEN_APP_PRONTO = true;
    window.GREEN_MOTION?.iniciar?.();
  }

  /* Este script fica no fim do <body>: o DOM de que ele precisa já existe.
     Partir agora, e não no DOMContentLoaded, evita esperar os scripts `defer`
     do movimento — a vitrine aparece mesmo se eles atrasarem. */
  if (document.getElementById('lightbox')) iniciar();
  else document.addEventListener('DOMContentLoaded', iniciar);
})();
