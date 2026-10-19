/* ==========================================================================
   GREEN ENERGY · catálogo de modelos
   --------------------------------------------------------------------------
   OS 16 MODELOS DO SITE ATUAL, na ordem de lá, coletados em 19/10/2026 de
   greenscootereletrica.com.br: card da home (números, tags, preço), popup de
   detalhes (ficha, cores) e galeria de cada modelo. O bruto está em
   projeto/site_atual_green/dados/modelos-wp.json.

   REGRA HERDADA DO FRAMEWORK: nenhum número entra sem fonte. Aqui a fonte é a
   própria loja (o cadastro do WordPress). Onde o card e a ficha do mesmo
   modelo discordam, vale o CARD (é o que o cliente vê primeiro) e a
   divergência fica comentada no modelo e listada no README.

   AS FOTOS vêm de galerias.js (gerado: tamanho, cor de fundo e texto
   alternativo). Aqui elas são referenciadas pelo número da galeria do WP,
   que é o mesmo índice que os swatches de cor do site atual usam.

   CORES: a lista junta as amostras cadastradas no popup com as cores que a
   ficha escreve por extenso. Hex das amostras = medido na imagem da amostra;
   hex das que só existem no texto = aproximação do nome, marcada com `aprox`.
   ========================================================================== */

/* Ordem canônica da ficha, igual para todo modelo. Campo ausente não aparece. */
window.GREEN_FICHA_ORDEM = [
  ['classificacao', 'Classificação'],
  ['velocidade', 'Velocidade máxima'],
  ['potencia', 'Motor'],
  ['autonomia', 'Autonomia'],
  ['bateria', 'Bateria'],
  ['recarga', 'Tempo de recarga'],
  ['carregador', 'Carregador'],
  ['freios', 'Freios'],
  ['suspensao', 'Suspensão'],
  ['rodas', 'Rodas e pneus'],
  ['protecao', 'Proteção'],
  ['carga', 'Carga máxima'],
  ['dimensoes', 'Dimensões'],
  ['peso', 'Peso'],
  ['rampa', 'Rampa'],
  ['garantia', 'Garantia'],
];

/* As cinco categorias do filtro do site atual, na ordem de lá. Um modelo
   pode estar em mais de uma (o Mike é autopropelido E triciclo), como no
   WordPress. A nota aparece sob o filtro quando a categoria é escolhida.
   Categoria sem modelo não vira botão. */
window.GREEN_CATEGORIAS = [
  {
    id: 'todos',
    nome: 'Todos',
    nota: 'Todos os modelos. A classificação de cada um, com ou sem CNH, está no card e nos detalhes.',
  },
  {
    id: 'autopropelido',
    nome: 'Autopropelidos',
    nota: 'Autopropelidos: até 1000 W, até 32 km/h, no máximo 70 cm de largura e 130 cm entre eixos. Sem CNH e sem emplacamento (Resolução CONTRAN nº 996).',
  },
  {
    id: 'ciclomotor',
    nome: 'Ciclomotores',
    nota: 'Mais potência e velocidade. Exigem CNH e emplacamento, e todos são homologados.',
  },
  {
    id: 'scooter',
    nome: 'Scooters',
    nota: 'Scooters elétricas. A classificação legal está nos detalhes do modelo.',
  },
  {
    id: 'triciclo',
    nome: 'Triciclos',
    nota: 'Três rodas, mais estabilidade. Os triciclos da Green são autopropelidos: sem CNH e sem emplacamento.',
  },
];

/* Etiqueta legal. Verde = liberdade, Ink com ponto âmbar = obrigação. Nunca o
   contrário. Substitui os ícones `cnh_0/1` e `emplacamento_0/1` do site atual. */
window.GREEN_CLASSIFICACOES = {
  autopropelido: {
    extenso: 'Autopropelido · CONTRAN 996/23',
    ficha: 'Autopropelido (CONTRAN 996/23) · sem CNH e sem emplacamento',
    selos: [{ t: 'Sem CNH', tom: 'livre' }, { t: 'Sem emplacamento', tom: 'livre' }],
  },
  ciclomotor: {
    extenso: 'Exige CNH e emplacamento',
    ficha: 'Exige CNH e emplacamento · modelo homologado',
    selos: [{ t: 'Requer CNH', tom: 'exige' }, { t: 'Emplacamento', tom: 'exige' }],
  },
};

/* ── Cores ──────────────────────────────────────────────────────────────── */

const COR = {
  preta: { nome: 'Preta', hex: '#141414' },
  pretaFosca: { nome: 'Preta fosca', hex: '#2A2A2A' },
  branca: { nome: 'Branca', hex: '#FFFFFF' },
  vermelha: { nome: 'Vermelha', hex: '#E5323A' },
  vermelhaEscura: { nome: 'Vermelha', hex: '#BD010A' },
  cinza: { nome: 'Cinza', hex: '#615E62' },
  bege: { nome: 'Bege', hex: '#D9D4C8' },
  azul: { nome: 'Azul', hex: '#1A42C4' },
  azulClaro: { nome: 'Azul-claro', hex: '#97D4E6' },
  prata: { nome: 'Prata', imagem: 'assets/img/cores/prata.webp', hex: '#B9B9BC' },
  // Só no texto da ficha: aproximação do nome.
  laranja: { nome: 'Laranja', hex: '#F28C28', aprox: true },
  verde: { nome: 'Verde', hex: '#3A9B48', aprox: true },
  rosa: { nome: 'Rosa', hex: '#F2A7BE', aprox: true },
  carbono: { nome: 'Carbono', hex: '#3B3D40', aprox: true },
  reinoUnido: { nome: 'Reino Unido', bicolor: ['#012169', '#C8102E'], aprox: true },
};

/* ── Fotos ──────────────────────────────────────────────────────────────── */

const G = window.GREEN_GALERIAS || {};

/** Fotos de um modelo pelo número da galeria do WP (1-based). Sem números, todas. */
function fotos(id, ...numeros) {
  const lista = G[id] || [];
  const escolhidas = numeros.length ? numeros.map((n) => lista[n - 1]).filter(Boolean) : lista;
  return escolhidas.map((f) => ({ ...f }));
}

/** Fotos de detalhe: ficam na galeria qualquer que seja a cor escolhida. */
const detalhes = (id, ...numeros) => fotos(id, ...numeros).map((f) => ({ ...f, detalhe: true }));

/* Foto de uma cor enviada em projeto/modelos_a_adicionar/<modelo>/<cor>.webp
   (o nome do arquivo é a chave: azul, branco, grafite…). */
const FC = window.GREEN_FOTOS_COR || {};
function fotoCor(id, cor) {
  const f = FC[id]?.[cor];
  return f ? [{ ...f }] : [];
}

/* O recorte do card como foto de galeria, para a cor que só existe nele. Sem
   miniatura própria: o modal usa o próprio recorte, que já está em cache. */
const doCard = (id, alt) => [{ src: `assets/img/models/${id}-card.webp`, alt, fundo: '#FFFFFF', estudio: true }];

/* Ordem da vitrine = ordem do site atual. Mexer aqui é a forma certa de
   reordenar; quem não estiver na lista aparece depois, na ordem do catálogo. */
window.GREEN_ORDEM = [
  'v8-ultra', 'x13-pro', 'kuyan-litio-pro', 'x13', 'q5-dimoon', 'mech-t',
  'gt2000', 'liberty', 'tiger-x6', 'kn8', 'mike', 'x11-3000w', 'ved',
  'mia-tri', 'roma', 's8-3000w',
];

window.GREEN_MODELOS = [
  {
    id: 'v8-ultra',
    nome: 'V8 Ultra',
    fabricante: null,
    descritivo: 'Bike elétrica',
    tags: ['Estilo', 'Clássica', 'Leveza'],
    categorias: ['autopropelido'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/v8-ultra-card.webp',
    alt: 'Bike elétrica V8 Ultra preta com banco marrom e pneus fat',
    preco: { valor: 7990, parcelas: '12x R$ 734,59 s/ juros' },
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 750, unidade: 'W', nota: 'Pico de 1000 W.' },
      autonomia: { valor: 97, unidade: 'km', nota: 'Com pedal assistido.' },
      bateria: 'Lítio 48V 15Ah, removível',
      carregador: 'Smart bivolt 110/220V, tomada convencional',
      freios: 'A disco',
      suspensao: 'Dianteira e traseira',
      rodas: 'Fat tire 20"',
      protecao: 'IP54 · resistente à poeira e água',
      garantia: '1 ano para motor e bateria',
    },
    equipamentos: ['Câmbio Shimano 7 marchas', 'Iluminação full LED', 'Banco duplo'],
    cores: [COR.preta, COR.laranja, COR.verde],
    galeria: fotos('v8-ultra'),
  },
  {
    id: 'x13-pro',
    nome: 'X13 Pro',
    fabricante: null,
    descritivo: 'Scooter elétrica',
    tags: ['Estilo', 'Clássica', 'Leveza'],
    categorias: ['autopropelido'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/x13-pro-card.webp',
    alt: 'Scooter elétrica X13 Pro vermelha e preta com pneus largos',
    preco: { valor: 11990, parcelas: '12x R$ 982,50 s/ juros' },
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 1000, unidade: 'W', nota: 'Pico de 2500 W.' },
      autonomia: { valor: 50, unidade: 'km' },
      bateria: 'Lítio 60V 24Ah, removível',
      carregador: 'Smart (5A) bivolt 110/220V, tomada convencional',
      garantia: '1 ano para motor e bateria',
    },
    equipamentos: ['Bluetooth', 'Conector de cabo USB', 'Marcha ré', 'Suporte de celular', 'Piloto automático'],
    cores: [{ ...COR.vermelha, hex: '#F94B52' }, COR.carbono, COR.branca],
    galeria: fotos('x13-pro'),
  },
  {
    id: 'kuyan-litio-pro',
    nome: 'Kuyan Lítio Pro',
    fabricante: 'Aima',
    descritivo: 'Scooter elétrica',
    tags: ['Estilo', 'Mobilidade', 'Urban'],
    categorias: ['autopropelido'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/kuyan-litio-pro-card.webp',
    alt: 'Scooter elétrica Aima Kuyan Lítio Pro branca com banco bege e cesta',
    preco: { valor: 8590, parcelas: '12x R$ 799,17 s/ juros' },
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 1000, unidade: 'W', nota: 'Pico de 2000 W.' },
      autonomia: { valor: 70, unidade: 'km' },
      bateria: 'Lítio 48V 24Ah, removível',
      carregador: 'Smart (3A) bivolt 110/220V, tomada convencional',
      garantia: '2 anos para motor e 6 meses para bateria',
    },
    /* A ficha lista seis cores; as amostras cadastradas são bege e azul, e as
       fotos da galeria são da azul. */
    cores: [COR.bege, { nome: 'Azul', hex: '#7D9DD4' }, COR.cinza, COR.preta, COR.branca, COR.prata, COR.verde],
    galeria: fotos('kuyan-litio-pro'),
  },
  {
    id: 'x13',
    nome: 'X13',
    fabricante: null,
    descritivo: 'Scooter elétrica',
    tags: ['Estilo', 'Confiança', 'Clássica'],
    categorias: ['autopropelido'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/x13-card.webp',
    alt: 'Scooter elétrica X13 branca com pneus largos e banco com encosto',
    preco: { valor: 9590, parcelas: '12x R$ 890,83 s/ juros' },
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 1000, unidade: 'W', nota: 'Pico de 2000 W.' },
      autonomia: { valor: 50, unidade: 'km' },
      bateria: 'Lítio 60V 24Ah, removível',
      carregador: 'Smart (5A) bivolt 110/220V, tomada convencional',
      garantia: '1 ano para motor e bateria',
    },
    cores: [COR.branca, COR.preta, COR.reinoUnido, COR.laranja],
    galeria: fotos('x13'),
  },
  {
    id: 'q5-dimoon',
    nome: 'Q5 Dimoon',
    fabricante: 'Aima',
    descritivo: 'Scooter elétrica',
    tags: ['Estilo', 'Design', 'Clássica'],
    categorias: ['autopropelido'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/q5-dimoon-card.webp',
    alt: 'Scooter elétrica Aima Q5 Dimoon creme com banco vermelho e baú',
    preco: { valor: 11590, parcelas: '12x R$ 1.065,57 s/ juros' },
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 1000, unidade: 'W', nota: 'Pico de 2600 W.' },
      autonomia: { valor: 80, unidade: 'km' },
      bateria: 'LiFePO4 64V 30Ah (1.200 ciclos), removível',
      carregador: 'Smart (5A) bivolt 110/220V, tomada convencional',
      garantia: '2 anos para motor e 6 meses para bateria',
    },
    equipamentos: ['Conexão com app', 'Conector de cabo USB', 'Marcha ré', 'Sensor de pezinho', 'Controle de tração'],
    cores: [COR.bege, COR.preta, COR.cinza, COR.verde, COR.rosa, COR.azul],
    galeria: fotos('q5-dimoon'),
  },
  {
    id: 'mech-t',
    nome: 'MECH-T',
    fabricante: null,
    descritivo: 'Scooter elétrica',
    tags: ['Estilo', 'Potência', 'Leveza'],
    categorias: ['autopropelido'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/mech-t-card.webp',
    alt: 'Scooter elétrica MECH-T preta fosca com baú traseiro',
    preco: { valor: 10990, parcelas: '12x R$ 1.024,17 s/ juros' },
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 1000, unidade: 'W', nota: 'Pico de 2600 W.' },
      autonomia: { valor: 50, unidade: 'km' },
      bateria: 'Lítio 60V 24Ah, removível',
      carregador: 'Smart bivolt 110/220V, tomada convencional',
      garantia: '1 ano para motor e bateria',
    },
    equipamentos: ['Bluetooth', 'Conector de cabo USB', 'Marcha ré', 'Piloto automático'],
    cores: [COR.pretaFosca, COR.vermelha, COR.cinza, COR.branca],
    galeria: fotos('mech-t'),
  },
  {
    id: 'gt2000',
    nome: 'GT2000',
    fabricante: null,
    descritivo: 'Bike elétrica',
    tags: ['Estilo', 'Confiança', 'Autonomia'],
    categorias: ['autopropelido'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/gt2000-card.webp',
    alt: 'Bike elétrica GT2000 preta com pneus de trilha',
    preco: { valor: 11590, parcelas: '12x R$ 1.065,57 s/ juros' },
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 1000, unidade: 'W', nota: 'Pico de 2000 W.' },
      autonomia: { valor: 100, unidade: 'km', nota: 'Com pedal assistido.' },
      bateria: 'Lítio 48V 30Ah (2.200 ciclos), removível',
      carregador: 'Smart bivolt 110/220V, tomada convencional',
      freios: 'A disco hidráulicos',
      suspensao: 'Dianteira invertida com regulagem',
      rodas: 'Aro 24" com pneu de trilha',
      protecao: 'IP54 · resistente à poeira e água',
      garantia: '1 ano para motor e bateria',
    },
    equipamentos: ['Câmbio Shimano 7 marchas', '5 modos de condução', 'Modo torque para rampas', 'Iluminação full LED'],
    cores: [COR.preta, COR.laranja, COR.verde],
    galeria: fotos('gt2000'),
  },
  {
    id: 'liberty',
    nome: 'Liberty',
    fabricante: 'Aima',
    descritivo: 'Scooter elétrica',
    tags: ['Estilo', 'Potência', 'Design'],
    categorias: ['autopropelido'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/liberty-card.webp',
    alt: 'Scooter elétrica Aima Liberty prata com baú traseiro',
    preco: { valor: 11990, parcelas: '10x de R$ 1.199,00 no cartão' },
    /* Autonomia: o card diz 50 km; a ficha, "de 50 a 70 km". Vale o card, e
       a faixa da ficha vai na nota. */
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 1000, unidade: 'W', nota: 'Motor AIMA Hub, pico de 2600 W.' },
      autonomia: { valor: 50, unidade: 'km', nota: 'De 50 a 70 km, segundo a ficha.' },
      bateria: 'Lítio 64V 30Ah',
      recarga: '7 a 8 horas',
      carregador: 'Bivolt 110–220V, tomada comum',
      freios: 'Disco dianteiro e traseiro',
      rodas: 'Alumínio',
      dimensoes: '1769 × 680 × 1150 mm · 1250 mm entre eixos',
    },
    equipamentos: ['Baú traseiro incluso', 'Farol em LED', 'Painel digital LED', 'Econômica e silenciosa', 'Baixo custo de manutenção'],
    // Fotos 10 a 14 da galeria do WP são as cinco cores; 1 a 9, detalhes.
    cores: [
      { ...COR.prata, galeria: fotos('liberty', 10) },
      { ...COR.vermelhaEscura, galeria: fotos('liberty', 11) },
      { ...COR.bege, galeria: fotos('liberty', 12) },
      { nome: 'Dourada', hex: '#BAAF8E', galeria: fotos('liberty', 13) },
      { ...COR.preta, galeria: fotos('liberty', 14) },
    ],
    galeria: detalhes('liberty', 1, 2, 3, 4, 5, 6, 7, 8, 9),
  },
  {
    id: 'tiger-x6',
    nome: 'Tiger X6',
    fabricante: 'Aima',
    descritivo: 'Scooter elétrica',
    tags: ['Estilo', 'Design', 'Economia'],
    categorias: ['ciclomotor', 'scooter'],
    classificacao: 'ciclomotor',
    foto: 'assets/img/models/tiger-x6-card.webp',
    alt: 'Scooter elétrica Aima Tiger X6 preta com farol em LED azul',
    preco: { valor: 23900, parcelas: 'Em até 10x no cartão' },
    specs: {
      velocidade: { valor: 80, unidade: 'km/h' },
      potencia: { valor: 3000, unidade: 'W', nota: 'Pico de 6000 W.' },
      autonomia: { valor: 103, unidade: 'km' },
      bateria: '2 baterias de lítio removíveis, 60V 29Ah',
      carregador: 'Smart (5A), tomada convencional',
      freios: 'A disco hidráulicos, dianteiro e traseiro, com CBS',
      suspensao: 'Hidráulica dianteira e traseira',
      rodas: 'Aro 12"',
      protecao: 'IPX7 · resistente à água',
      carga: 'Até 180 kg',
      garantia: '2 anos para motor e 1 ano para bateria',
    },
    equipamentos: [
      'Alto-falantes Bluetooth', 'Iluminação full LED', 'Painel LED',
      'Acionamento por chave ou controle', 'Alarme antifurto sonoro e com travamento',
      'Marcha ré', 'Descanso lateral com sensor', 'Cavalete central',
    ],
    // Fotos 1 a 4 da galeria do WP são as quatro cores; 5 a 22, detalhes.
    cores: [
      { ...COR.prata, galeria: fotos('tiger-x6', 1) },
      { ...COR.branca, galeria: fotos('tiger-x6', 2) },
      { ...COR.preta, galeria: fotos('tiger-x6', 3) },
      { ...COR.cinza, galeria: fotos('tiger-x6', 4) },
    ],
    galeria: detalhes('tiger-x6', 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22),
  },
  {
    id: 'kn8',
    nome: 'KN8',
    fabricante: 'Kappak',
    descritivo: 'Scooter elétrica',
    tags: ['Leveza', 'Dia a dia', 'Economia'],
    categorias: ['autopropelido'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/kn8-card.webp',
    alt: 'Scooter elétrica Kappak KN8 branca e preta com baú',
    preco: { valor: 11490, parcelas: 'Em até 10x sem juros no cartão' },
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 1000, unidade: 'W' },
      autonomia: { valor: 60, unidade: 'km' },
      bateria: 'Lítio 60V 24Ah',
      freios: 'A disco, dianteiro e traseiro',
      suspensao: 'Reforçada',
      rodas: 'Aro 10"',
      carga: 'Até 150 kg',
    },
    equipamentos: ['Painel digital'],
    cores: [COR.branca, COR.azul],
    galeria: fotos('kn8'),
  },
  {
    id: 'mike',
    nome: 'Mike',
    fabricante: 'Aima',
    descritivo: 'Triciclo elétrico',
    tags: ['Estilo', 'Conforto', 'Design'],
    categorias: ['autopropelido', 'triciclo'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/mike-card.webp',
    recorte: false, // a foto do card do WP veio com fundo branco, sem alfa
    alt: 'Triciclo elétrico Aima Mike verde com banco marrom e cesta',
    preco: { valor: 13990, parcelas: 'Em até 10x sem juros no cartão' },
    /* Autonomia: o card diz 50 km; a ficha, "de 30 a 50 km". */
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 650, unidade: 'W', nota: 'Pico de 1500 W.' },
      autonomia: { valor: 50, unidade: 'km', nota: 'De 30 a 50 km, segundo a ficha.' },
      bateria: 'Grafeno chumbo 72V 21,8Ah (fixa)',
      carregador: 'Smart bivolt, com desligamento automático',
      freios: 'A tambor',
      suspensao: 'Dianteira e traseira',
      carga: 'Até 140 kg (90 kg em subidas)',
    },
    equipamentos: [
      'Assentos para até 3 pessoas (bancos ocultos/retráteis)', 'Baú integrado com trava',
      'Painel digital LCD com borda infinita', '3 modos de velocidade e marcha ré',
      'Iluminação full LED com farol alto e baixo', 'Alarme, setas e buzina',
    ],
    // Fotos 5 a 8 da galeria do WP são as cores; 1 a 4, detalhes.
    cores: [
      { nome: 'Verde', hex: '#9DB788', galeria: fotos('mike', 6) },
      { nome: 'Bege', hex: '#BAAF8E', galeria: fotos('mike', 7) },
      { nome: 'Cinza', hex: '#A0A0A0', galeria: fotos('mike', 8) },
      { nome: 'Azul-claro', hex: '#B8CED6', galeria: fotos('mike', 5) },
    ],
    galeria: detalhes('mike', 1, 2, 3, 4),
  },
  {
    id: 'x11-3000w',
    nome: 'X11 3000W',
    fabricante: 'MotoChefe',
    descritivo: 'Scooter elétrica',
    tags: ['Potência', 'Agilidade', 'Urban'],
    categorias: ['ciclomotor'],
    classificacao: 'ciclomotor',
    foto: 'assets/img/models/x11-3000w-card.webp',
    alt: 'Scooter elétrica MotoChefe X11 3000W com a bandeira do Reino Unido',
    preco: { valor: 12490, parcelas: 'Em até 10x sem juros no cartão' },
    specs: {
      velocidade: { valor: 70, unidade: 'km/h' },
      potencia: { valor: 3000, unidade: 'W' },
      autonomia: { valor: 50, unidade: 'km', nota: 'Com a bateria extra.' },
      recarga: '6 a 8 horas',
      carregador: 'Bivolt',
      freios: 'A disco',
      rodas: 'Liga leve aro 10"',
      protecao: 'IP65 · resistente à água',
      carga: 'Até 180 kg',
    },
    equipamentos: [
      'Alarme com bloqueio e trava', 'Painel digital', 'Liga/desliga com cartão NFC',
      'Compartimento para bateria extra', 'Encosto para passageiro',
      'Farol de LED com 3 níveis', 'Porta-objetos sob o assento',
    ],
    /* O popup do WP não tinha cores. Grafite, preta e vermelha vieram com foto
       em modelos_a_adicionar; Reino Unido é a do card e da foto 1 do WP. */
    cores: [
      { ...COR.reinoUnido, aprox: false, galeria: fotos('x11-3000w', 1) },
      { nome: 'Grafite', hex: '#4A4D52', galeria: fotoCor('x11-3000w', 'grafite') },
      { ...COR.preta, galeria: fotoCor('x11-3000w', 'preto') },
      { ...COR.vermelha, galeria: fotoCor('x11-3000w', 'vermelho') },
    ],
    galeria: detalhes('x11-3000w', 2, 3, 4, 5),
  },
  {
    id: 'ved',
    nome: 'VED',
    fabricante: 'MotoChefe',
    descritivo: 'Triciclo elétrico',
    tags: ['Conforto', 'Dia a dia', 'Economia'],
    categorias: ['autopropelido', 'triciclo'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/ved-card.webp',
    alt: 'Triciclo elétrico MotoChefe VED vermelho com baú e encosto',
    preco: { valor: 14900, parcelas: 'Em até 10x sem juros no cartão' },
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 1000, unidade: 'W' },
      autonomia: { valor: 45, unidade: 'km' },
      bateria: 'Lítio 48V 20Ah',
      carregador: 'Bivolt',
      freios: 'A disco hidráulico, traseiro',
      rodas: 'Roda de segurança antiderrapante',
      carga: 'Até 150 kg',
    },
    equipamentos: [
      'Controle remoto de acionamento', 'Farol de LED em 3 níveis', 'Piso antiderrapante',
      'Quadro em aço carbono', 'Alarme com bloqueio e trava', 'Buzina', 'Chave reserva',
    ],
    cores: [COR.vermelhaEscura, { nome: 'Cinza', hex: '#515151' }, COR.branca],
    galeria: fotos('ved'),
  },
  {
    id: 'mia-tri',
    nome: 'Mia Tri',
    fabricante: 'MotoChefe',
    descritivo: 'Triciclo elétrico',
    tags: ['Estilo', 'Clássica', 'Leveza'],
    categorias: ['autopropelido', 'triciclo'],
    classificacao: 'autopropelido',
    foto: 'assets/img/models/mia-tri-card.webp',
    alt: 'Triciclo elétrico MotoChefe Mia Tri azul-claro com baú',
    preco: { valor: 12990, parcelas: 'Em até 10x sem juros no cartão' },
    /* A ficha do WP traz "Tamanho do veículo: 1356562mm", medida truncada no
       cadastro. Fica fora até a loja confirmar (ver README). */
    specs: {
      velocidade: { valor: 32, unidade: 'km/h' },
      potencia: { valor: 800, unidade: 'W' },
      autonomia: { valor: 40, unidade: 'km' },
      bateria: 'Lítio 60V 20Ah',
      freios: 'Disco dianteiro e tambor traseiro',
      suspensao: 'Hidráulica dianteira e traseira',
      rodas: 'Liga leve',
      carga: 'Até 180 kg',
      peso: '87,75 kg',
      rampa: 'Até 12°',
    },
    /* Azul-claro é a do card e do site atual (sem foto de galeria: usa o
       recorte). Azul, branca, preta e vermelha vieram com foto. A foto 1 do WP
       (a Mia Tri preta inteira) sai: a preta agora tem foto de estúdio. */
    cores: [
      { ...COR.azulClaro, galeria: doCard('mia-tri', 'Triciclo elétrico MotoChefe Mia Tri azul-claro com baú') },
      { nome: 'Azul', hex: '#1B3FB0', galeria: fotoCor('mia-tri', 'azul') },
      { ...COR.branca, galeria: fotoCor('mia-tri', 'branco') },
      { ...COR.preta, hex: '#1C1C1C', galeria: fotoCor('mia-tri', 'preto') },
      { ...COR.vermelha, hex: '#C8161D', galeria: fotoCor('mia-tri', 'vermelho') },
    ],
    galeria: detalhes('mia-tri', 2, 3, 4, 5, 6),
  },
  {
    id: 'roma',
    nome: 'Roma',
    fabricante: 'MotoChefe',
    descritivo: 'Scooter elétrica',
    tags: ['Conforto', 'Design', 'Clássica'],
    categorias: ['ciclomotor'],
    classificacao: 'ciclomotor',
    foto: 'assets/img/models/roma-card.webp',
    alt: 'Scooter elétrica MotoChefe Roma azul-claro com banco marrom',
    preco: { valor: 16490, parcelas: 'Em até 10x sem juros no cartão' },
    specs: {
      velocidade: { valor: 50, unidade: 'km/h', nota: 'Com a 2ª bateria, até 70 km/h.' },
      potencia: { valor: 3000, unidade: 'W' },
      autonomia: { valor: 50, unidade: 'km', nota: 'Com a 2ª bateria, até 100 km. Varia com o nível de velocidade.' },
      bateria: 'Até 2 baterias de lítio 72V 25Ah, com uso simultâneo',
      recarga: '4 a 6 horas',
      carregador: 'Bivolt',
      freios: 'A disco hidráulicos, traseiros',
      rodas: 'Ferro aro 12"',
    },
    equipamentos: [
      'Banco duplo', 'Trava na ignição', 'Modo parking', 'Descanso central',
      'Alarme com bloqueio e trava', 'Porta-objetos', 'Velocidade ajustável em 3 níveis', 'Marcha ré',
    ],
    // Azul-claro: foto 1 do WP (a do card). Bege e preta: modelos_a_adicionar.
    cores: [
      { ...COR.azulClaro, galeria: fotos('roma', 1) },
      { nome: 'Bege', hex: '#D0C6B3', galeria: fotoCor('roma', 'bege') },
      { ...COR.preta, hex: '#101010', galeria: fotoCor('roma', 'preto') },
    ],
    galeria: detalhes('roma', 2, 3),
  },
  {
    id: 's8-3000w',
    nome: 'S8 3000W',
    fabricante: 'MotoChefe',
    descritivo: 'Scooter elétrica',
    tags: ['Estilo', 'Potência', 'Autonomia'],
    categorias: ['ciclomotor'],
    classificacao: 'ciclomotor',
    foto: 'assets/img/models/s8-3000w-card.webp',
    alt: 'Scooter elétrica MotoChefe S8 3000W prata e preta com pneus largos',
    preco: { valor: 13490, parcelas: 'Em até 10x sem juros no cartão' },
    /* DIVERGÊNCIA (README): o card diz 50 km/h e 3000 W; a ficha lista duas
       versões, 2000 W/50 km/h/aro 10" e 3000 W/70 km/h/aro 12". O card
       mistura as duas. Fica o card, com as versões na nota. */
    specs: {
      velocidade: { valor: 50, unidade: 'km/h', nota: 'A ficha lista 2000 W a 50 km/h (aro 10") e 3000 W a 70 km/h (aro 12").' },
      potencia: { valor: 3000, unidade: 'W' },
      autonomia: { valor: 80, unidade: 'km', nota: 'Com a bateria extra.' },
      recarga: '6 a 8 horas',
      carregador: 'Bivolt',
      freios: 'A disco',
      rodas: 'Liga leve aro 10" ou 12", conforme a versão',
      protecao: 'IP65 · resistente à água',
      carga: 'Até 180 kg',
    },
    equipamentos: [
      'Alarme com bloqueio e trava', 'Painel digital', 'Liga/desliga com cartão NFC',
      'Compartimento para bateria extra', 'Encosto para passageiro', 'Farol de LED com 3 níveis',
    ],
    /* Só as cores COM foto (modelos_a_adicionar), decisão do cliente em
       19/10/2026: as oito amostras do WP quebravam a linha de cores do modal.
       Saíram a vermelha e as três listradas, que não tinham fotografia. O
       "cinza" das amostras do WP é o grafite. */
    cores: [
      { ...COR.preta, hex: '#101010', galeria: [...fotoCor('s8-3000w', 'preto'), ...fotos('s8-3000w', 1)] },
      { nome: 'Grafite', hex: '#4A4D52', galeria: fotoCor('s8-3000w', 'grafite') },
      { nome: 'Azul', hex: '#1833C3', galeria: fotoCor('s8-3000w', 'azul') },
      { ...COR.branca, galeria: fotoCor('s8-3000w', 'branco') },
    ],
    galeria: detalhes('s8-3000w', 2, 3),
  },
];

/* FAQ do site atual, as doze perguntas na ordem de lá. Revisão mínima de
   texto: "nos cartão" virou "no cartão", "R$ 0,90 uma carga" virou "por carga"
   e a sigla da resolução ganhou o número por extenso. */
window.GREEN_FAQ = [
  {
    q: 'Quais modelos não precisam de CNH e emplacamento?',
    a: 'Nossos modelos autopropelidos, bikes e patinetes se enquadram corretamente na legislação. Sendo assim, esses modelos não têm a obrigatoriedade de CNH e emplacamento. Autopropelidos: potência de até 1000 W, velocidade de até 32 km/h, no máximo 70 cm de largura e até 130 cm entre eixos, conforme a Resolução CONTRAN nº 996.',
  },
  {
    q: 'Vocês possuem modelos homologados?',
    a: 'Todos os modelos que necessitam de CNH e emplacamento são homologados e atendem às normativas vigentes em nossa legislação.',
  },
  {
    q: 'Vocês vendem as peças para a manutenção das scooters?',
    a: 'Quem é cliente GREEN ENERGY tem acesso a manutenção profissional e ao nosso estoque de peças.',
  },
  {
    q: 'É obrigatório o uso de capacete?',
    a: 'Não. A Resolução CONTRAN nº 996/23 não cita equipamentos de segurança, porém nós da Green Energy sempre aconselhamos!',
  },
  {
    q: 'Vocês têm assistência técnica?',
    a: 'Sim. Nossa loja conta com uma oficina toda equipada, além de estoque de peças para reposição imediata e mão de obra qualificada, feita por técnicos especializados.',
  },
  {
    q: 'Qual é o tempo de recarga completa?',
    a: 'Depende do modelo, mas geralmente entre 4h e 5h para uma carga completa.',
  },
  {
    q: 'Quanto gasto de luz para carregar minha scooter?',
    a: 'Você gasta em torno de R$ 0,90 por carga completa! Pode variar conforme o modelo.',
  },
  {
    q: 'Como faço a limpeza da minha scooter?',
    a: 'Nossas scooters contam com índice de proteção (IP65), que possibilita não só a lavagem a seco, como também a lavagem com água corrente para a melhor limpeza.',
  },
  {
    q: 'Quais são as formas de pagamento?',
    a: 'Até 10x sem juros no cartão de crédito, dinheiro, PIX ou transferência bancária.',
  },
  {
    q: 'Posso carregar minha moto em tomada 110V e 220V?',
    a: 'A maioria dos nossos modelos conta com carregador Smart bivolt 110V/220V. Consulte os modelos.',
  },
  {
    q: 'As baterias são de lítio?',
    a: 'Sim! A maioria dos nossos modelos conta com bateria de lítio. Elas são muito mais leves do que os outros tipos de bateria do mesmo tamanho, além de terem vantagens em relação às de chumbo: não viciam (pode carregar a qualquer momento), têm maior vida útil, maior eficiência de carga e descarga e menor tempo de carregamento. Além disso, a maioria das peças das baterias de lítio é reciclável, o que as torna ótimas opções para o meio ambiente.',
  },
  {
    q: 'Motivos para comprar uma scooter elétrica',
    a: 'Veículo autossustentável que te ajuda a otimizar o seu tempo, economizar dinheiro e ainda cuidar do meio ambiente.',
  },
];

/* Depoimentos reais, do Google, como estão no site atual. Texto do cliente
   sem retoque; só saiu o espaço antes da exclamação no do Glauco e o "x11"
   virou "X11", que é o nome do modelo. O avatar é o mesmo do site atual. */
window.GREEN_DEPOIMENTOS = [
  {
    nome: 'Glauco Rocha de Oliveira',
    avatar: 'assets/img/depoimentos/glauco-rocha-de-oliveira.webp',
    origem: 'google',
    estrelas: 5,
    texto: 'Adorei a motinha!!! A Jet tem um ótimo desempenho urbano! É linda para meus passeios, inclusive com a namorada na garupa!',
  },
  {
    nome: 'Madu Magalhães',
    avatar: 'assets/img/depoimentos/madu-magalhaes.webp',
    origem: 'google',
    estrelas: 5,
    texto: 'As motos são excelentes e de altíssima qualidade, o atendimento é incrível todos eles são super atenciosos e cuidadosos com os clientes!',
  },
  {
    nome: 'Natália Pereira',
    avatar: 'assets/img/depoimentos/natalia-pereira.webp',
    origem: 'google',
    estrelas: 5,
    texto: 'MELHOR PÓS VENDA QUE EXISTE!! Super satisfeita com minha moto!! Comprei para ir e voltar do trabalho, além da economia de tempo e dinheiro o atendimento da loja é excelente!! Recomendo!!!',
  },
  {
    nome: 'Diamond Service',
    avatar: 'assets/img/depoimentos/diamond-service.webp',
    origem: 'google',
    estrelas: 5,
    texto: 'Comprei uma moto elétrica com eles, chegou em perfeito estado como esperado. Eles fazem todo o check list antes e correspondeu todas as minhas expectativas. Super indico.',
  },
  {
    nome: 'Marcela Bastos',
    avatar: 'assets/img/depoimentos/marcela-bastos.webp',
    origem: 'google',
    estrelas: 5,
    texto: 'Comprei uma X11 há seis meses e a moto superou as expectativas!! Uso no dia a dia e estou muito feliz com a aquisição. Vale o investimento!!!',
  },
  {
    nome: 'Marcio Quintella',
    avatar: 'assets/img/depoimentos/marcio-quintella.webp',
    origem: 'google',
    estrelas: 5,
    texto: 'Ótimo atendimento, consegui a entrega no mesmo dia a pronta entrega, muito boa a scooter deles, indico dms a galera me atendeu muito bem!!',
  },
];
