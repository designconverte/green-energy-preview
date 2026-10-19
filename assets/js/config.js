/* ==========================================================================
   GREEN ENERGY · configuração da loja
   Único lugar onde dados de negócio moram. O HTML e o app.js leem daqui.
   Fonte: site atual (greenscootereletrica.com.br), coletado em 19/10/2026,
   e o "Green Energy Styleguide" v1.0.
   ========================================================================== */

window.GREEN_CONFIG = {
  marca: {
    nome: 'Green Energy',
    nomeLoja: 'Green Energy - Jundiaí',
    razaoSocial: 'GREEN ENERGY MOBILIDADE ELETRICA LTDA',
    cnpj: '44.646.835/0001-99',
  },

  /* Vendas e assistência têm números próprios no site atual.
     `numero` é só para exibição; `e164` é o que entra no link wa.me. */
  whatsapp: {
    numero: '(11) 92221-2056',
    e164: '5511922212056',
  },
  assistencia: {
    numero: '(15) 98161-6225',
    e164: '5515981616225',
  },

  endereco: {
    logradouro: 'R. Hilda Del Nero Bisquolo, 102',
    complemento: 'The One Office Tower (lojas 10 e 11)',
    bairro: 'Jardim Florida',
    cidade: 'Jundiaí',
    uf: 'SP',
    cep: '13208-703',
    get completo() {
      return `${this.logradouro} · ${this.complemento} · ${this.bairro}, ${this.cidade} - ${this.uf} · ${this.cep}`;
    },
    // Usado no link "traçar rota" e no mapa.
    get busca() {
      return `${this.logradouro}, ${this.complemento}, ${this.bairro}, ${this.cidade} - ${this.uf}, ${this.cep}`;
    },
  },

  /* Horários do site atual. Enquanto `confirmado` for false, o rodapé mostra
     "consulte pelo WhatsApp" em vez de um horário que pode estar errado. */
  horarios: {
    confirmado: true,
    vendas: 'Dias úteis: 9h às 18h · Sáb. e feriados: 9h às 13h',
    assistencia: 'Dias úteis: 9h às 18h',
  },

  redes: {
    instagram: 'https://www.instagram.com/greenjundiai/',
    instagramUsuario: '@greenjundiai',
    tiktok: 'https://www.tiktok.com/@greenjundiai',
    youtube: 'https://www.youtube.com/channel/UC-NM7SLnYSsEglorc06w1Yw',
  },

  /* ── Comunicado de segurança ──────────────────────────────────────────
     Pedido do cliente (19/10/2026): um domínio que não é da Green usa o nome
     e elementos da marca. Um AVISO discreto aparece no canto da tela (não
     trava a página); o comunicado completo só abre se a pessoa pedir, pelo
     aviso ou pelo link "Comunicado de segurança" no rodapé.

       ativo: true   LIGA/DESLIGA. false some com o aviso, o comunicado e o link.
       versao        troque ao mudar o texto ou a lista de domínios: quem já
                     fechou o aviso volta a vê-lo.
       atrasoMs      quanto o aviso espera depois da carga para entrar.
       reexibirAposDias  quem fecha o aviso só o vê de novo depois disso.
       dominiosNaoReconhecidos  pode ter mais de um; lista vazia esconde o quadro.

     Para conferir o aviso a qualquer momento (mesmo depois de fechado), abra o
     site com ?aviso no endereço: greenscootereletrica.com.br/?aviso

     versao '…-canto': o aviso saiu do pop-up para o canto da tela. Quem fechou
     o pop-up antigo tinha a marca da versão anterior e não via o novo. */
  alertaSeguranca: {
    ativo: true,
    versao: '2026-10-19-canto',
    siteOficial: 'greenscootereletrica.com.br',
    dominiosNaoReconhecidos: ['scootersgreenbrasil.online'],
    atrasoMs: 2500,
    reexibirAposDias: 7,
  },

  /* Mensagens pré-preenchidas. As de modelo e de assistência são as do site
     atual, palavra por palavra ("Olá, gostaria de saber mais sobre o modelo
     V8 Ultra"): é por elas que a equipe já reconhece o lead que vem do site.
     `{modelo}` e `{cor}` são trocados na hora do clique.

     `prefixoMensagem` vazio: a Green não tem a regra do "Vim pelo site" da KOM.
     Preenchido, o app.js garante que toda mensagem comece por ele. */
  prefixoMensagem: '',
  mensagens: {
    geral: 'Olá! Gostaria de saber mais sobre os modelos e condições especiais da Green Energy - Jundiaí.',
    produtos: 'Olá, gostaria de saber mais sobre os Produtos da Green Energy - Jundiaí.',
    modelo: 'Olá, gostaria de saber mais sobre o modelo {modelo}.',
    modeloCor: 'Olá, gostaria de saber mais sobre o modelo {modelo} na cor {cor}.',
    testRideGeral: 'Olá! Gostaria de agendar um test ride na Green Energy - Jundiaí.',
    testRideModelo: 'Olá! Gostaria de agendar um test ride do modelo {modelo}.',
    testRideModeloCor: 'Olá! Gostaria de agendar um test ride do modelo {modelo} na cor {cor}.',
    assistencia: 'Olá, gostaria de falar com o time de Assistência Técnica da Green Energy - Jundiaí.',
    categoria: 'Olá! Gostaria de ver as opções de {categoria} da Green Energy - Jundiaí.',
    confirmarOficial: 'Olá! Quero confirmar se estou falando com o atendimento oficial da Green Energy - Jundiaí.',
  },
};
