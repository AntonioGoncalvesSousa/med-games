import { useState } from 'react';
import Header from './components/Header';
import GameSettings from './components/GameSettings';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import { anatomyStructures, muscleRegions, muscleStructures, regions } from './data/anatomyData';
import { useAnatomyGame } from './hooks/useAnatomyGame';

const games = [
  { id: 'guess-bone', title: 'Adivinhe o Osso', description: 'Identifique estruturas ósseas com um modelo anatômico 3D interativo.', icon: '✦', status: 'disponível', structures: anatomyStructures, regions, promptNoun: 'osso', modelFile: 'skeleton.glb' },
  { id: 'guess-muscle', title: 'Adivinhe o Músculo', description: 'Identifique músculos e seus compartimentos no modelo anatômico 3D.', icon: '✚', status: 'disponível', structures: muscleStructures, regions: muscleRegions, promptNoun: 'músculo', modelFile: 'muscles.glb' },
  { id: 'arthrology', title: 'Artrologia', description: 'Acesse o questionário de artrologia e teste seus conhecimentos.', icon: '◌', status: 'disponível', externalUrl: 'https://lembro.app/collections/978a8485-8a10-4f61-ac4d-99e8068ab22b' },
];

function Home({ games, onPlay }) {
  const scrollToGames = () => document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return <main className="home-page page-enter"><section className="hero"><div className="hero-copy"><p className="eyebrow">PLATAFORMA DE ANATOMIA · 01</p><h1>Aprenda o corpo<br /><em>de dentro para fora.</em></h1><p className="hero-text">Sessões curtas, visualização tridimensional e o tipo de desafio que faz o conhecimento permanecer.</p><button className="primary-button hero-button" onClick={scrollToGames}>Explorar jogos <span>→</span></button></div><div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-symbol">M<span>+</span></div><span className="orbit-label label-top">ANATOMIA<br />EM FOCO</span><span className="orbit-label label-bottom">GIRO · ZOOM · APRENDA</span></div></section><section id="games-section" className="games-section"><div className="section-intro"><p className="eyebrow">1° SEMESTRE</p><h2>Escolha seu próximo <em>desafio.</em></h2></div><div className="game-card-grid">{games.map((game) => <article className="game-card" key={game.id}><div className="card-top"><span className="game-icon">{game.icon}</span><span className="available"><i />{game.status}</span></div><div><h3>{game.title}</h3><p>{game.description}</p></div><button onClick={() => onPlay(game)} className="card-link">Jogar agora <span>↗</span></button></article>)}</div></section><footer className="app-footer"><span>MED/GAMES</span><span>Modelos baseados no projeto Z-Anatomy · Consulte a licença e os termos de atribuição.</span><span>2026</span></footer></main>;
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [lightTheme, setLightTheme] = useState(false);
  const game = useAnatomyGame();
  const [settings, setSettings] = useState(null);
  const [selectedGame, setSelectedGame] = useState(games[0]);
  const startGame = (nextSettings) => { setSettings(nextSettings); const structures = selectedGame.structures.filter((item) => nextSettings.selectedRegions.includes(item.regiao)).map((item) => ({ ...item, modelFile: selectedGame.modelFile })); game.start({ ...nextSettings, promptNoun: selectedGame.promptNoun, modelFile: selectedGame.modelFile }, structures); setScreen('game'); };
  const goHome = () => { game.reset(); setScreen('home'); };
  const openSettings = (nextGame) => {
    if (nextGame.externalUrl) {
      window.open(nextGame.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setSelectedGame(nextGame);
    setScreen('settings');
  };
  return <div className={`app-shell ${lightTheme ? 'light-theme' : ''}`}><Header onHome={goHome} lightTheme={lightTheme} onThemeChange={(event) => setLightTheme(event.target.checked)} />{screen === 'home' && <Home games={games} onPlay={openSettings} />}{screen === 'settings' && <GameSettings game={selectedGame} onBack={goHome} onStart={startGame} />}{screen === 'game' && <GameScreen game={game} onExit={() => setScreen('settings')} onFinish={() => setScreen('result')} />}{screen === 'result' && <ResultScreen game={game} onAgain={() => setScreen('settings')} onHome={goHome} />}</div>;
}
