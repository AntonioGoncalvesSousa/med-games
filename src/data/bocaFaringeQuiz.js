import vestibuloImage from '../styles/assets/questionario boca e faringe pt.1/1 CAVIDADE ORAL/vestibulo.jpeg';
import cavidadePropriaImage from '../styles/assets/questionario boca e faringe pt.1/1 CAVIDADE ORAL/cavidade propria.jpeg';
import istmoImage from '../styles/assets/questionario boca e faringe pt.1/1 CAVIDADE ORAL/istmo.jpeg';
import palatosUvulaImage from '../styles/assets/questionario boca e faringe pt.1/1 CAVIDADE ORAL/palatos ulvula.png';
import frenuloImage from '../styles/assets/questionario boca e faringe pt.1/1 CAVIDADE ORAL/frenulo assoalho inferior.png';
import raizCorpoApiceImage from '../styles/assets/questionario boca e faringe pt.1/2 Lingua/raiz corpo apice .png';
import sulcoForameImage from '../styles/assets/questionario boca e faringe pt.1/2 Lingua/sulco forame.png';
import papilasImage from '../styles/assets/questionario boca e faringe pt.1/2 Lingua/papilas.png';
import nasoOroLaringoImage from '../styles/assets/questionario boca e faringe pt.1/3 faringe divisoes/naso oro laringo.png';
import tonsilasImage from '../styles/assets/questionario boca e faringe pt.1/3 faringe divisoes/tonsilas.jpeg';
import musculosFaringeImage from '../styles/assets/questionario boca e faringe pt.1/faringe musculo/musculos faringe.png';

export const bocaFaringeQuestions = [
  {
    id: 'vestibulo-da-boca',
    image: vestibuloImage,
    question: 'Qual estrutura é indicada na imagem?',
    answer: 'vestibulo da boca',
    explanation: 'Esse espaço entre os dentes/gengivas e as paredes da boca.',
  },
  {
    id: 'cavidade-propria-da-boca',
    image: cavidadePropriaImage,
    question: 'Qual estrutura é indicada na imagem?',
    answer: 'cavidade propria da boca',
    explanation: 'Parte interna da boca, limitada pelos dentes e pela arcada alveolar.',
  },
  {
    id: 'istmo-das-fauces',
    image: istmoImage,
    question: 'Qual estrutura é indicada na imagem?',
    answer: 'istmo das fauces',
    explanation: 'Passagem que comunica a boca com a faringe.',
  },
  {
    id: 'palatos-e-ulvula',
    type: 'multiple',
    image: palatosUvulaImage,
    question: 'Qual é esta estrutura?',
    answers: [
      {
        label: 'Estrutura 1',
        answer: 'palato duro',
        description: 'Parte óssea do teto da boca, formada pelo palatino e maxilar.',
      },
      {
        label: 'Estrutura 2',
        answer: 'palato mole',
        description: 'Parte posterior do palato, formada por tecido muscular e membranoso.',
      },
      {
        label: 'Estrutura 3',
        answer: 'uvula',
        description: 'Estrutura pendular no teto da boca que ajuda na deglutição.',
      },
    ],
  },
  {
    id: 'frenulo-lingual',
    type: 'multiple',
    image: frenuloImage,
    question: 'Qual é esta estrutura?',
    answers: [
      {
        label: 'Estrutura 1',
        answer: 'frenulo lingual',
        description: 'Pregas de tecido mucoso que liga a língua ao assoalho da boca.',
      },
      {
        label: 'Estrutura 2',
        answer: 'assoalho da boca',
        description: 'Área inferior da cavidade oral, localizada sob a língua.',
      },
      {
        label: 'Estrutura 3',
        answer: 'face inferior da lingua',
        description: 'Superfície ventral da língua, voltada para o assoalho da boca.',
      },
    ],
  },
  {
    id: 'raiz-corpo-apice-da-lingua',
    type: 'multiple',
    image: raizCorpoApiceImage,
    question: 'Qual é esta estrutura?',
    answers: [
      {
        label: 'Estrutura 1',
        answer: 'raiz da lingua',
        description: 'Parte posterior da língua, fixa à base oral e à faringe.',
      },
      {
        label: 'Estrutura 2',
        answer: 'corpo da lingua',
        description: 'Porção central e principal da língua, responsável pela maioria do volume.',
      },
      {
        label: 'Estrutura 3',
        answer: 'apice da lingua',
        description: 'Extremidade anterior da língua, mais livre e móvel.',
      },
      {
        label: 'Estrutura 4',
        answer: 'dorso da lingua',
        description: 'Superfície superior da língua, rica em papilas gustativas.',
      },
    ],
  },
  {
    id: 'sulco-terminal-e-forame-cego',
    type: 'multiple',
    image: sulcoForameImage,
    question: 'Qual é esta estrutura?',
    answers: [
      {
        label: 'Estrutura 1',
        answer: 'sulco terminal da lingua',
        description: 'Linha em forma de V que marca a divisão entre as porções anterior e posterior da língua.',
      },
      {
        label: 'Estrutura 2',
        answer: 'forame cego',
        description: 'Pequena abertura na linha mediana da parte posterior do dorso da língua.',
      },
    ],
  },
  {
    id: 'papilas-da-lingua',
    type: 'multiple',
    image: papilasImage,
    question: 'Qual é esta estrutura?',
    answers: [
      {
        label: 'Estrutura 1',
        answer: 'papilas circunvaladas',
        description: 'Papilas grandes, em formato de montes, localizadas na parte posterior da língua.',
      },
      {
        label: 'Estrutura 2',
        answer: 'papilas folhadas',
        description: 'Papilas em pregas laterais da língua, mais desenvolvidas em alguns animais.',
      },
      {
        label: 'Estrutura 3',
        answer: 'papilas filiformes',
        description: 'Papilas finas e numerosas, responsáveis pela textura e pela sensibilidade tátil.',
      },
      {
        label: 'Estrutura 4',
        answer: 'papilas fungiformes',
        description: 'Papilas em forma de cogumelo, distribuídas principalmente na porção anterior da língua.',
      },
    ],
  },
  {
    id: 'divisoes-da-faringe',
    type: 'multiple',
    image: nasoOroLaringoImage,
    question: 'Qual é esta estrutura?',
    answers: [
      {
        label: 'Estrutura 1',
        answer: 'nasofaringe',
        description: 'Porção superior da faringe, localizada atrás das cavidades nasais.',
      },
      {
        label: 'Estrutura 2',
        answer: 'orofaringe',
        description: 'Parte média da faringe, situada atrás da cavidade oral.',
      },
      {
        label: 'Estrutura 3',
        answer: 'laringofaringe',
        description: 'Porção inferior da faringe, que continua até a laringe e ao esôfago.',
      },
    ],
  },
  {
    id: 'tonsilas-faringeas',
    type: 'multiple',
    image: tonsilasImage,
    question: 'Qual é esta estrutura?',
    answers: [
      {
        label: 'Estrutura 1',
        answer: 'tonsila palatina',
        description: 'Tonsila amígdalas laterais da orofaringe, visíveis na região amigdalar.',
      },
      {
        label: 'Estrutura 2',
        answer: 'ostio faringeo da tuba auditiva',
        description: 'Abertura da tuba auditiva na parede da nasofaringe.',
      },
      {
        label: 'Estrutura 3',
        answer: 'tonsila tubaria',
        description: 'Tonsilas localizadas ao redor da abertura da tuba auditiva.',
      },
      {
        label: 'Estrutura 4',
        answer: 'tonsila palatina',
        description: 'Tonsila palatina, frequentemente destacada na amígdala orofaríngea.',
      },
      {
        label: 'Estrutura 5',
        answer: 'tonsila lingual',
        description: 'Tonsila localizada na base da língua, na região posterior da cavidade oral.',
      },
    ],
  },
  {
    id: 'musculos-da-faringe',
    type: 'multiple',
    image: musculosFaringeImage,
    question: 'Qual é esta estrutura?',
    answers: [
      {
        label: 'Estrutura 1',
        answer: 'estilofaringeo',
        description: 'Músculo que eleva a faringe durante a deglutição.',
      },
      {
        label: 'Estrutura 2',
        answer: 'constritor superior da faringe',
        description: 'Músculo constritor que fecha a parte superior da faringe.',
      },
      {
        label: 'Estrutura 3',
        answer: 'salpingofaringeo',
        description: 'Músculo que eleva a faringe e abre a tuba auditiva.',
      },
      {
        label: 'Estrutura 4',
        answer: 'palatofaringeo',
        description: 'Músculo que eleva a faringe durante a deglutição.',
      },
      {
        label: 'Estrutura 5',
        answer: 'constritor medio da faringe',
        description: 'Músculo constritor da região média da faringe.',
      },
      {
        label: 'Estrutura 6',
        answer: 'constritor inferior da faringe',
        description: 'Músculo constritor da porção inferior da faringe.',
      },
    ],
  },
];
