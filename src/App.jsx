import { useEffect, useState } from 'react';
import Header from './components/Header';
import GameSettings from './components/GameSettings';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import { anatomyStructures, muscleRegions, muscleStructures, regions } from './data/anatomyData';
import { bocaFaringeQuestions } from './data/bocaFaringeQuiz';
import { useAnatomyGame } from './hooks/useAnatomyGame';
import ImageQuizScreen from './components/ImageQuizScreen';
import GuidedReviewScreen from './components/GuidedReviewScreen';
import { guidedHeadReview } from './data/guidedHeadReview';
import CreateQuizScreen from './components/CreateQuizScreen';
import LoginScreen from './components/LoginScreen';
import { supabase } from './lib/supabaseClient';

const games = [
  { id: 'guess-bone', title: 'Adivinhe o Osso', description: 'Identifique estruturas ósseas com um modelo anatômico 3D interativo.', icon: '✦', status: 'disponível', structures: anatomyStructures, regions, promptNoun: 'osso', modelFile: 'skeleton.glb' },
  { id: 'guess-muscle', title: 'Adivinhe o Músculo', description: 'Identifique músculos e seus compartimentos no modelo anatômico 3D.', icon: '✚', status: 'disponível', structures: muscleStructures, regions: muscleRegions, promptNoun: 'músculo', modelFile: 'muscles.glb' },
  { id: 'guided-head-review', title: 'Roteiro de Cabeça', description: 'Percorra os ossos e músculos do roteiro com visualização anatômica 3D.', icon: '◉', status: 'disponível', guided: true },
  { id: 'boca-e-faringe', title: 'Boca e Faringe', description: 'Questionário com imagens sobre a cavidade oral e o vestibulo.', icon: '◍', status: 'disponível', customQuiz: bocaFaringeQuestions },
  { id: 'arthrology', title: 'Artrologia', description: 'Acesse o questionário de artrologia e teste seus conhecimentos.', icon: '◌', status: 'disponível', externalUrl: 'https://lembro.app/collections/978a8485-8a10-4f61-ac4d-99e8068ab22b' },
];

function Home({ games, onPlay, onPlayCreatedQuiz }) {
  const [createdQuizzes, setCreatedQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState('');
  const [launchingQuizId, setLaunchingQuizId] = useState(null);
  const [launchError, setLaunchError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadCreatedQuizzes = async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, slug, title, description, created_at')
        .order('created_at', { ascending: false });

      if (!isCurrent) return;

      if (error) {
        setQuizzesError(`Não foi possível carregar os questionários: ${error.message}`);
        setCreatedQuizzes([]);
      } else {
        setCreatedQuizzes(data ?? []);
        setQuizzesError('');
      }

      setQuizzesLoading(false);
    };

    loadCreatedQuizzes();
    return () => { isCurrent = false; };
  }, []);

  const scrollToGames = () => document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const launchCreatedQuiz = async (quiz) => {
    setLaunchingQuizId(quiz.id);
    setLaunchError('');
    try {
      await onPlayCreatedQuiz(quiz);
    } catch (error) {
      setLaunchError(error.message || 'Não foi possível iniciar o questionário.');
    } finally {
      setLaunchingQuizId(null);
    }
  };

  const renderGameCard = (game) => (
    <article
      className="game-card interactive-game-card"
      key={game.id}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (event.target.closest('button')) return;
        onPlay(game);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onPlay(game);
      }}
    >
      <div className="card-top"><span className="game-icon">{game.icon}</span><span className="available"><i />{game.status}</span></div>
      <div><h3>{game.title}</h3><p>{game.description}</p></div>
      <div className="card-link" onClick={(event) => { event.stopPropagation(); onPlay(game); }} role="button" tabIndex={0} onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onPlay(game);
        }
      }}>
        <span>Jogar agora</span>
        <span>↗</span>
      </div>
    </article>
  );
  const firstSemesterGames = games.filter((game) => game.id !== 'boca-e-faringe' && game.id !== 'guided-head-review');
  const secondSemesterGames = games.filter((game) => game.id === 'boca-e-faringe' || game.id === 'guided-head-review');

  return (
    <main className="home-page page-enter">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">PLATAFORMA DE ANATOMIA · 01</p>
          <h1>Aprenda o corpo<br /><em>de dentro para fora.</em></h1>
          <p className="hero-text">Sessões curtas, visualização tridimensional e o tipo de desafio que faz o conhecimento permanecer.</p>
          <button className="primary-button hero-button" onClick={scrollToGames}>Explorar jogos <span>→</span></button>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-symbol">M<span>+</span></div>
          <span className="orbit-label label-top">ANATOMIA<br />EM FOCO</span>
          <span className="orbit-label label-bottom">GIRO · ZOOM · APRENDA</span>
        </div>
      </section>
      <section id="games-section" className="games-section">
        <div className="section-intro"><p className="eyebrow">1° SEMESTRE</p><h2>Escolha seu próximo <em>desafio.</em></h2></div>
        <div className="game-card-grid">{firstSemesterGames.map(renderGameCard)}</div>
        <div className="section-intro second-semester"><p className="eyebrow">2° SEMESTRE</p><h2>Boca e Faringe</h2></div>
        <div className="game-card-grid second-semester-grid">{secondSemesterGames.map(renderGameCard)}</div>
        <div className="section-intro created-quizzes-heading">
          <p className="eyebrow">SUPABASE</p>
          <h2>Questionários criados</h2>
        </div>
        {quizzesLoading && <p className="created-quizzes-message" role="status">Carregando questionários...</p>}
        {quizzesError && <p className="created-quizzes-message created-quizzes-error" role="alert">{quizzesError}</p>}
        {!quizzesLoading && !quizzesError && createdQuizzes.length === 0 && (
          <p className="created-quizzes-message">Ainda não há questionários criados.</p>
        )}
        {!quizzesLoading && !quizzesError && createdQuizzes.length > 0 && (
          <div className="game-card-grid">
            {createdQuizzes.map((quiz) => (
              <article
                className="game-card interactive-game-card"
                key={quiz.id}
                role="button"
                tabIndex={0}
                aria-disabled={launchingQuizId === quiz.id}
                onClick={(event) => {
                  if (event.target.closest('button') || launchingQuizId === quiz.id) return;
                  launchCreatedQuiz(quiz);
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
                  event.preventDefault();
                  if (launchingQuizId !== quiz.id) launchCreatedQuiz(quiz);
                }}
              >
                <div className="card-top">
                  <span className="game-icon">◍</span>
                  <span className="available"><i />Questionário</span>
                </div>
                <div>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.description || 'Questionário de identificação anatômica.'}</p>
                </div>
                <div
                  className="card-link"
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (launchingQuizId !== quiz.id) launchCreatedQuiz(quiz);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      if (launchingQuizId !== quiz.id) launchCreatedQuiz(quiz);
                    }
                  }}
                >
                  <span>{launchingQuizId === quiz.id ? 'Carregando...' : 'Jogar agora'}</span>
                  <span>↗</span>
                </div>
              </article>
            ))}
          </div>
        )}
        {launchError && <p className="created-quizzes-message created-quizzes-error" role="alert">{launchError}</p>}
      </section>
      <footer className="app-footer"><span>MED/GAMES</span><span>Modelos baseados no projeto Z-Anatomy · Consulte a licença e os termos de atribuição.</span><span>2026</span></footer>
    </main>
  );
}

function ImageQuizOrderScreen({ game, onBack, onStart, onEdit, canEdit }) {
  return (
    <main className="game-page page-enter">
      <div className="game-topbar">
        <button className="back-link" onClick={onBack}>← Voltar</button>
      </div>
      <div className="game-layout">
        <section className="viewer-column">
          <div className="viewer-shell image-quiz-shell">
            <img
              src={game.customQuiz[0]?.image}
              alt={game.customQuiz[0]?.imageAlt || 'Pré-visualização do questionário'}
              className="image-quiz-image"
            />
          </div>
        </section>

        <section className="answer-column">
          <p className="eyebrow">{game.title}</p>
          <h1>Em que ordem você quer responder?</h1>
          <p className="answer-prompt">Escolha se o questionário será apresentado na sequência natural ou em ordem aleatória.</p>

          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => onStart('normal')}>Ordem normal <span>→</span></button>
            <button type="button" className="primary-button" onClick={() => onStart('random')}>Ordem aleatória <span>↗</span></button>
          </div>
          {game.isCreatedQuiz && canEdit && (
            <button type="button" className="text-button quiz-edit-button" onClick={onEdit}>
              Editar questionário <span>✎</span>
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [lightTheme, setLightTheme] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [imageQuizResult, setImageQuizResult] = useState(null);
  const [customQuizSession, setCustomQuizSession] = useState(null);
  const game = useAnatomyGame();
  const [settings, setSettings] = useState(null);
  const [selectedGame, setSelectedGame] = useState(games[0]);
  const [quizToEdit, setQuizToEdit] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isCurrent) return;
      if (error) {
        setAuthError(`Não foi possível verificar a sessão: ${error.message}`);
      }
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      isCurrent = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user && screen === 'create-quiz') {
      setQuizToEdit(null);
      setScreen('home');
    }
    if (user && screen === 'login') {
      setScreen('home');
    }
  }, [authLoading, screen, user]);

  const signOut = async () => {
    setAuthError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(`Não foi possível sair da conta: ${error.message}`);
        return;
      }
      setQuizToEdit(null);
      setScreen('home');
    } catch (error) {
      setAuthError(`Não foi possível sair da conta: ${error.message || 'erro de conexão.'}`);
    }
  };

  const handleLoginSuccess = () => {
    setAuthError('');
    setScreen('home');
  };

  const playCreatedQuiz = async (quiz) => {
    const { data: quizTree, error } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*, quiz_answers(*))')
      .eq('slug', quiz.slug)
      .single();

    if (error) {
      throw new Error(`Não foi possível carregar o questionário: ${error.message}`);
    }

    const questionRecords = [...(quizTree.quiz_questions ?? [])]
      .sort((first, second) => first.position - second.position);
    if (!questionRecords.length) {
      throw new Error('Este questionário ainda não tem perguntas cadastradas.');
    }

    const customQuestions = questionRecords.map((question) => {
      const answerRecords = [...(question.quiz_answers ?? [])]
        .sort((first, second) => first.position - second.position);
      const acceptedAnswers = answerRecords.map((answer) => (
        answer.accepted_answers.split(',').map((value) => value.trim()).filter(Boolean)
      ));

      if (!acceptedAnswers.length || acceptedAnswers.some((answers) => !answers.length)) {
        throw new Error('Este questionário tem perguntas sem respostas válidas cadastradas.');
      }

      return {
        id: question.id,
        image: question.image_path,
        imageAlt: question.image_alt,
        question: question.prompt,
        isCreatedQuiz: true,
        ...(acceptedAnswers.length > 1
          ? {
              type: 'multiple',
              answers: acceptedAnswers.map((answers, answerIndex) => ({
                label: `Estrutura ${answerIndex + 1}`,
                answer: answers[0],
                acceptedAnswers: answers,
              })),
            }
          : {
              answer: acceptedAnswers[0][0],
              acceptedAnswers: acceptedAnswers[0],
            }),
      };
    });
    const createdQuizGame = {
      id: quizTree.id,
      title: quizTree.title,
      isCreatedQuiz: true,
      quizRecord: quizTree,
      customQuiz: customQuestions,
    };

    setSelectedGame(createdQuizGame);
    setImageQuizResult(null);
    setScreen('image-quiz-order');
  };
  const startGame = (nextSettings) => { setSettings(nextSettings); const structures = selectedGame.structures.filter((item) => nextSettings.selectedRegions.includes(item.regiao)).map((item) => ({ ...item, modelFile: selectedGame.modelFile })); game.start({ ...nextSettings, promptNoun: selectedGame.promptNoun, modelFile: selectedGame.modelFile }, structures); setScreen('game'); };
  const goHome = () => { game.reset(); setImageQuizResult(null); setCustomQuizSession(null); setScreen('home'); };
  const editCreatedQuiz = () => {
    if (!user) return;
    setQuizToEdit({
      quiz: selectedGame.quizRecord,
    });
    setScreen('create-quiz');
  };
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
    if (nextGame.guided) {
      setScreen('guided-review');
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
  if (authLoading) {
    return <div className={`app-shell ${lightTheme ? 'light-theme' : ''}`}><p className="created-quizzes-message auth-loading" role="status">Verificando sessão…</p></div>;
  }

  return (
    <div className={`app-shell ${lightTheme ? 'light-theme' : ''}`}>
      <Header
        onHome={goHome}
        onCreateQuiz={() => {
          if (!user) return;
          setQuizToEdit(null);
          setScreen('create-quiz');
        }}
        onLogin={() => setScreen('login')}
        onSignOut={signOut}
        isAuthenticated={Boolean(user)}
        lightTheme={lightTheme}
        onThemeChange={(event) => setLightTheme(event.target.checked)}
      />
      {authError && <p className="created-quizzes-message created-quizzes-error auth-message" role="alert">{authError}</p>}
      {screen === 'home' && <Home games={games} onPlay={openSettings} onPlayCreatedQuiz={playCreatedQuiz} />}
      {screen === 'login' && !user && <LoginScreen onBack={goHome} onLoginSuccess={handleLoginSuccess} />}
      {screen === 'create-quiz' && user && <CreateQuizScreen quizToEdit={quizToEdit} onBack={goHome} />}
      {screen === 'settings' && <GameSettings game={selectedGame} onBack={goHome} onStart={startGame} />}
      {screen === 'guided-review' && <GuidedReviewScreen steps={guidedHeadReview} onExit={goHome} />}
      {screen === 'image-quiz-order' && (
        <ImageQuizOrderScreen game={selectedGame} onBack={goHome} onStart={startCustomQuiz} onEdit={editCreatedQuiz} canEdit={Boolean(user)} />
      )}
      {screen === 'image-quiz' && <ImageQuizScreen game={customQuizSession ?? selectedGame} onBack={goHome} onFinish={(summary) => { setImageQuizResult(summary); setScreen('image-quiz-result'); }} />}
      {screen === 'image-quiz-result' && customResultGame && <ResultScreen game={customResultGame} onAgain={() => { setImageQuizResult(null); setCustomQuizSession(null); setScreen('image-quiz-order'); }} onHome={goHome} />}
      {screen === 'game' && <GameScreen game={game} onExit={() => setScreen('settings')} onFinish={() => setScreen('result')} />}
      {screen === 'result' && <ResultScreen game={game} onAgain={() => setScreen('settings')} onHome={goHome} />}
    </div>
  );
}
