/* ==========================================================================
   GREEN ENERGY · moldes de HTML (card, preço, selos, FAQ)
   --------------------------------------------------------------------------
   O MESMO molde serve aos dois lados:
   · o navegador: o app.js desenha a vitrine e o FAQ a partir do catalogo.js,
     como sempre (o dado novo aparece sem build);
   · o build: tools/gerar-seo.js grava esse HTML dentro do index.html, para
     quem lê a página SEM rodar JavaScript (ChatGPT, Claude, Perplexity, Bing
     no primeiro passe). Sem isto, a página crua não tinha nenhum modelo,
     preço ou pergunta do FAQ.

   Só funções puras: leem window.GREEN_* na hora da chamada e não tocam no
   DOM. Mudou um molde aqui → rodar `node tools/gerar-seo.js`.
   ========================================================================== */

window.GREEN_RENDER = (() => {
  'use strict';

  const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const real = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const ICONE_WHATS = '<svg aria-hidden="true"><use href="#i-whats"></use></svg>';

  // Nome para análise: com fabricante quando a loja informa.
  const nomeCompleto = (m) => [m.fabricante, m.nome].filter(Boolean).join(' ');
  const categoriasDe = (m) => m.categorias || (m.categoria ? [m.categoria] : []);

  /** Monta o link do WhatsApp com a mensagem já preenchida. */
  function linkWhats(chave, trocas = {}) {
    const cfg = window.GREEN_CONFIG;
    let texto = cfg.mensagens[chave] || cfg.mensagens.geral;
    for (const [k, v] of Object.entries(trocas)) {
      texto = texto.replaceAll(`{${k}}`, v);
    }
    const prefixo = cfg.prefixoMensagem;
    if (prefixo && !texto.toLowerCase().startsWith(prefixo.toLowerCase())) texto = `${prefixo}. ${texto}`;
    const numero = chave === 'assistencia' ? (cfg.assistencia?.e164 || cfg.whatsapp.e164) : cfg.whatsapp.e164;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  /* Ordem da vitrine: GREEN_ORDEM primeiro, o resto na ordem do catálogo. */
  function ordenados() {
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
  }

  function selos(m, classe = '') {
    const c = m.classificacao ? window.GREEN_CLASSIFICACOES[m.classificacao] : null;
    if (!c) return '';
    return `<ul class="selos ${classe}" aria-label="Classificação legal">${c.selos.map((s) => `
      <li class="selo selo--${s.tom}">${escapar(s.t)}</li>`).join('')}</ul>`;
  }

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

  /* Sem preço (modelo novo antes de a loja informar): o bloco continua no
     lugar, para o card não ficar mais baixo que os vizinhos da fileira. */
  /* Parcelamento confirmado pela loja (29/10/2026) vem como objeto: o dado é
     o total no cartão e a parcela sai da conta, para não voltar a divergir
     do total (README, seção 1). O texto herdado do WP continua string.
     Decisão do cliente (29/10/2026): "sem juros" por extenso quando não há
     juros; com juros, a linha não fala neles.
     05/11/2026 (loja): o à vista é só no PIX ou dinheiro, então o rótulo diz
     onde ele vale e a parcela vem como alternativa ("ou 12x"), em tom mais
     discreto que o preço. Os cartões aceitos aparecem também no card
     ("tem que deixar na home"), numa linha própria: junto da parcela, o pior
     caso vazava o card a 320, 1024, 1280 e 1440 px. Sem o total a prazo, no
     card e no modal (pedido do dono, mesmo avisado do Decreto 5.903/2006;
     README, seção 1): o card e o modal mostram as mesmas linhas. */
  function parcelas(p) {
    if (!p) return '';
    if (typeof p === 'string') return `<span class="preco__parcelas">${escapar(p)}</span>`;
    const juros = p.juros ? '' : ' sem juros';
    const linha = `<span class="preco__parcelas">ou ${p.vezes}x de ${real.format(p.total / p.vezes)}${juros}</span>`;
    const cartoes = p.cartoes ? `<span class="preco__cartoes">no cartão ${escapar(p.cartoes)}</span>` : '';
    return linha + cartoes;
  }

  function preco(m, classe = '') {
    if (!m.preco?.valor) {
      return `
        <p class="preco ${classe}">
          <span class="preco__rotulo">Valor</span>
          <span class="preco__valor">Sob consulta</span>
          <span class="preco__parcelas">Condições pelo WhatsApp</span>
        </p>`;
    }
    const aVista = window.GREEN_PAGAMENTO?.aVista;
    return `
        <p class="preco ${classe}">
          <span class="preco__rotulo">${aVista ? `À vista · ${escapar(aVista)}` : 'Valor'}</span>
          <span class="preco__valor">${real.format(m.preco.valor)}</span>
          ${parcelas(m.preco.parcelas)}
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

  /* FAQ: a primeira pergunta já vem aberta. */
  function faq(lista) {
    return (lista || []).map((f, i) => `
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
  }

  return {
    escapar, real, ICONE_WHATS, nomeCompleto, categoriasDe, linkWhats,
    ordenados, selos, numeros, parcelas, preco, eyebrow, eyebrowCurto, card, faq,
  };
})();
