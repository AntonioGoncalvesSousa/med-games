import { useState } from 'react';
import Header from './components/Header';
import GameSettings from './components/GameSettings';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import { anatomyStructures, muscleRegions, muscleStructures, regions } from './data/anatomyData';
import { bocaFaringeQuestions } from './data/bocaFaringeQuiz';
import { useAnatomyGame } from './hooks/useAnatomyGame';
import ImageQuizScreen from './components/ImageQuizScreen';

const games = [
  { id: 'guess-bone', title: 'Adivinhe o Osso', description: 'Identifique estruturas ósseas com um modelo anatômico 3D interativo.', icon: '✦', status: 'disponível', structures: anatomyStructures, regions, promptNoun: 'osso', modelFile: 'skeleton.glb' },
  { id: 'guess-muscle', title: 'Adivinhe o Músculo', description: 'Identifique músculos e seus compartimentos no modelo anatômico 3D.', icon: '✚', status: 'disponível', structures: muscleStructures, regions: muscleRegions, promptNoun: 'músculo', modelFile: 'muscles.glb' },
  { id: 'boca-e-faringe', title: 'Boca e Faringe', description: 'Questionário com imagens sobre a cavidade oral e o vestibulo.', icon: '◍', status: 'disponível', customQuiz: bocaFaringeQuestions },
  { id: 'arthrology', title: 'Artrologia', description: 'Acesse o questionário de artrologia e teste seus conhecimentos.', icon: '◌', status: 'disponível', externalUrl: 'https://lembro.app/collections/978a8485-8a10-4f61-ac4d-99e8068ab22b' },
];

function Home({ games, onPlay }) {
  const scrollToGames = () => document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return <main className="home-page page-enter"><section className="hero"><div className="hero-copy"><p className="eyebrow">PLATAFORMA DE ANATOMIA · 01</p><h1>Aprenda o corpo<br /><em>de dentro para fora.</em></h1><p className="hero-text">Sessões curtas, visualização tridimensional e o tipo de desafio que faz o conhecimento permanecer.</p><button className="primary-button hero-button" onClick={scrollToGames}>Explorar jogos <span>→</span></button></div><div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-symbol">M<span>+</span></div><span className="orbit-label label-top">ANATOMIA<br />EM FOCO</span><span className="orbit-label label-bottom">GIRO · ZOOM · APRENDA</span></div></section><section id="games-section" className="games-section"><div className="section-intro"><p className="eyebrow">1° SEMESTRE</p><h2>Escolha seu próximo <em>desafio.</em></h2></div><div className="game-card-grid">{games.filter((game) => game.id !== 'boca-e-faringe').map((game) => <article className="game-card" key={game.id}><div className="card-top"><span className="game-icon">{game.icon}</span><span className="available"><i />{game.status}</span></div><div><h3>{game.title}</h3><p>{game.description}</p></div><button onClick={() => onPlay(game)} className="card-link">Jogar agora <span>↗</span></button></article>)}</div><div className="section-intro second-semester"><p className="eyebrow">2° SEMESTRE</p><h2>Boca e Faringe</h2></div><div className="game-card-grid second-semester-grid">{games.filter((game) => game.id === 'boca-e-faringe').map((game) => <article className="game-card" key={game.id}><div className="card-top"><span className="game-icon">{game.icon}</span><span className="available"><i />{game.status}</span></div><div><h3>{game.title}</h3><p>{game.description}</p></div><button onClick={() => onPlay(game)} className="card-link">Jogar agora <span>↗</span></button></article>)}</div></section><footer className="app-footer"><span>MED/GAMES</span><span>Modelos baseados no projeto Z-Anatomy · Consulte a licença e os termos de atribuição.</span><span>2026</span></footer></main>;
}

function ImageQuizOrderScreen({ game, onBack, onStart }) {
  return (
    <main className="game-page page-enter">
      <div className="game-topbar">
        <button className="back-link" onClick={onBack}>← Voltar</button>
      </div>
      <div className="game-layout">
        <section className="viewer-column">
          <div className="viewer-shell image-quiz-shell">
            <img src={game.customQuiz[0]?.image} alt="Pré-visualização do questionário" className="image-quiz-image" />
          </div>
        </section>

        <section className="answer-column">
          <p className="eyebrow">Boca e Faringe</p>
          <h1>Em que ordem você quer responder?</h1>
          <p className="answer-prompt">Escolha se o questionário será apresentado na sequência natural ou em ordem aleatória.</p>

          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => onStart('normal')}>Ordem normal <span>→</span></button>
            <button type="button" className="primary-button" onClick={() => onStart('random')}>Ordem aleatória <span>↗</span></button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [lightTheme, setLightTheme] = useState(false);
  const [imageQuizResult, setImageQuizResult] = useState(null);
  const [customQuizSession, setCustomQuizSession] = useState(null);
  const game = useAnatomyGame();
  const [settings, setSettings] = useState(null);
  const [selectedGame, setSelectedGame] = useState(games[0]);
  const startGame = (nextSettings) => { setSettings(nextSettings); const structures = selectedGame.structures.filter((item) => nextSettings.selectedRegions.includes(item.regiao)).map((item) => ({ ...item, modelFile: selectedGame.modelFile })); game.start({ ...nextSettings, promptNoun: selectedGame.promptNoun, modelFile: selectedGame.modelFile }, structures); setScreen('game'); };
  const goHome = () => { game.reset(); setImageQuizResult(null); setCustomQuizSession(null); setScreen('home'); };
  const startCustomQuiz = (mode) => {
    const orderedQuiz = mode === 'random'
      ? [...selectedGame.customQuiz].sort(() => Math.random() - 0.5)
      : [...selectedGame.customQuiz];

    setCustomQuizSession({ ...selectedGame, customQuiz: orderedQuiz });
    setScreen('image-quiz');
  };
  const openSettings = (nextGame) => {
    if (nextGame.externalUrl) {
      window.open(nextGame.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (nextGame.customQuiz) {
      setSelectedGame(nextGame);
      setImageQuizResult(null);
      setScreen('image-quiz-order');
      return;
    }
    setSelectedGame(nextGame);
    setScreen('settings');
  };
  const customResultGame = imageQuizResult ? {
    state: {
      correct: imageQuizResult.correct,
      incorrect: imageQuizResult.incorrect,
      skipped: 0,
      queue: Array.from({ length: imageQuizResult.total }, (_, index) => ({ index, status: index < imageQuizResult.correct ? 'correct' : 'incorrect' })),
    },
    percentage: imageQuizResult.percentage,
  } : null;
  return <div className={`app-shell ${lightTheme ? 'light-theme' : ''}`}><Header onHome={goHome} lightTheme={lightTheme} onThemeChange={(event) => setLightTheme(event.target.checked)} />{screen === 'home' && <Home games={games} onPlay={openSettings} />}{screen === 'settings' && <GameSettings game={selectedGame} onBack={goHome} onStart={startGame} />}{screen === 'image-quiz-order' && <ImageQuizOrderScreen game={selectedGame} onBack={goHome} onStart={startCustomQuiz} />}{screen === 'image-quiz' && <ImageQuizScreen game={customQuizSession ?? selectedGame} onBack={goHome} onFinish={(summary) => { setImageQuizResult(summary); setScreen('image-quiz-result'); }} />}{screen === 'image-quiz-result' && customResultGame && <ResultScreen game={customResultGame} onAgain={() => { setImageQuizResult(null); setCustomQuizSession(null); setScreen('image-quiz-order'); }} onHome={goHome} />}{screen === 'game' && <GameScreen game={game} onExit={() => setScreen('settings')} onFinish={() => setScreen('result')} />}{screen === 'result' && <ResultScreen game={game} onAgain={() => setScreen('settings')} onHome={goHome} />}</div>;
}
