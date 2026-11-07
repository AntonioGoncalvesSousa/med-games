import { useEffect, useRef, useState } from 'react';
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
import ContentCard from './components/ContentCard';
import CreateContentScreen from './components/CreateContentScreen';
import CreateExternalLinkScreen from './components/CreateExternalLinkScreen';
import LoginScreen from './components/LoginScreen';
import CreateVisualizationScreen from './components/CreateVisualizationScreen';
import VisualizationViewer from './components/VisualizationViewer';
import { supabase } from './lib/supabaseClient';

const games = [
  { id: 'guess-bone', title: 'Adivinhe o Osso', description: 'Identifique estruturas ósseas com um modelo anatômico 3D interativo.', icon: '✦', status: 'disponível', structures: anatomyStructures, regions, promptNoun: 'osso', modelFile: 'skeleton.glb' },
  { id: 'guess-muscle', title: 'Adivinhe o Músculo', description: 'Identifique músculos e seus compartimentos no modelo anatômico 3D.', icon: '✚', status: 'disponível', structures: muscleStructures, regions: muscleRegions, promptNoun: 'músculo', modelFile: 'muscles.glb' },
  { id: 'guided-head-review', title: 'Roteiro de Cabeça', description: 'Percorra os ossos e músculos do roteiro com visualização anatômica 3D.', icon: '◉', status: 'disponível', guided: true },
  { id: 'boca-e-faringe', title: 'Boca e Faringe', description: 'Questionário com imagens sobre a cavidade oral e o vestibulo.', icon: '◍', status: 'disponível', customQuiz: bocaFaringeQuestions },
];

function getAppRoute(pathname) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const appPath = basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))
    ? pathname.slice(basePath.length) || '/'
    : pathname;
  const path = appPath.replace(/\/+$/, '') || '/';
  const decodePathPart = (part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return '';
    }
  };
  const segments = path.split('/').filter(Boolean).map(decodePathPart);

  if (path === '/' || path === '/questionarios') return { screen: 'home' };
  if (segments[0] === 'visualizacoes' && segments[1]) {
    return { screen: 'visualization-viewer', visualizationId: segments[1] };
  }
  if (segments[0] === 'questionarios' && segments[1]) {
    const game = games.find((item) => item.id === segments[1] && item.customQuiz);
    return game
      ? { screen: 'image-quiz-order', game }
      : { screen: 'quiz-loading', quizSlug: segments[1] };
  }
  if (segments[0] === 'jogos' && segments[1]) {
    const game = games.find((item) => item.id === segments[1]);
    if (game?.guided) return { screen: 'guided-review', game };
    if (game?.customQuiz) return { screen: 'image-quiz-order', game };
    if (game && !game.externalUrl) return { screen: 'settings', game };
  }

  return { screen: 'home' };
}

function withAppBasePath(path) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${basePath}${path}`;
}

function getPathForScreen(screen, selectedGame, visualizationId, quizSlug) {
  if (screen === 'visualization-viewer' && visualizationId) {
    return withAppBasePath(`/visualizacoes/${encodeURIComponent(visualizationId)}`);
  }
  if (['quiz-loading', 'quiz-error'].includes(screen) && quizSlug) {
    return withAppBasePath(`/questionarios/${encodeURIComponent(quizSlug)}`);
  }
  if (['image-quiz-order', 'image-quiz', 'image-quiz-result'].includes(screen) && selectedGame?.customQuiz) {
    const quizId = selectedGame.quizRecord?.slug || selectedGame.id;
    return withAppBasePath(`/questionarios/${encodeURIComponent(quizId)}`);
  }
  if (['settings', 'game', 'result', 'guided-review'].includes(screen) && selectedGame?.id) {
    return withAppBasePath(`/jogos/${encodeURIComponent(selectedGame.id)}`);
  }
  return withAppBasePath('/');
}

const feedFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'quiz', label: 'Questionários' },
  { id: 'visualization', label: 'Visualizações' },
  { id: 'external_link', label: 'Links Externos' },
];

function Home({ games, userId, onPlay, onPlayCreatedQuiz, onOpenVisualization, onEditItem }) {
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [launchingQuizId, setLaunchingQuizId] = useState(null);
  const [launchError, setLaunchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    const loadFeed = async () => {
      try {
        const [quizResult, visualizationResult] = await Promise.all([
          supabase
            .from('quizzes')
            .select('id, slug, title, description, created_at, content_type, external_url, owner_id')
            .eq('status', 'published'),
          supabase
            .from('structure_visualizations')
            .select('id, title, description, created_at, owner_id, structure_images(id, view_name, image_path, position)'),
        ]);

        if (!isCurrent) return;

        const errors = [];
        if (quizResult.error) errors.push(`questionários: ${quizResult.error.message}`);
        if (visualizationResult.error) errors.push(`visualizações: ${visualizationResult.error.message}`);

        const items = [
          ...(quizResult.data ?? []).map((quiz) => ({
            id: `${quiz.content_type === 'external_link' ? 'external' : 'quiz'}-${quiz.id}`,
            databaseId: quiz.id,
            slug: quiz.slug,
            title: quiz.title,
            description: quiz.description,
            createdAt: quiz.created_at,
            type: quiz.content_type === 'external_link' ? 'external_link' : 'quiz',
            externalUrl: quiz.external_url ?? null,
            ownerId: quiz.owner_id,
          })),
          ...(visualizationResult.data ?? []).map((visualization) => ({
            id: `visualization-${visualization.id}`,
            databaseId: visualization.id,
            visualizationId: visualization.id,
            title: visualization.title,
            description: visualization.description,
            createdAt: visualization.created_at,
            type: 'visualization',
            images: [...(visualization.structure_images ?? [])]
              .sort((first, second) => first.position - second.position),
            ownerId: visualization.owner_id,
            externalUrl: null,
          })),
          ...games.filter((game) => game.externalUrl).map((game) => ({
            id: `external-${game.id}`,
            title: game.title,
            description: game.description,
            createdAt: null,
            type: 'external_link',
            externalUrl: game.externalUrl,
          })),
        ];
        const timestamp = (date) => {
          const value = Date.parse(date ?? '');
          return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
        };

        setFeedItems(items.sort((first, second) => timestamp(second.createdAt) - timestamp(first.createdAt)));
        setFeedError(errors.length ? `Não foi possível carregar ${errors.join(' e ')}.` : '');
      } catch (error) {
        if (!isCurrent) return;
        setFeedError(`Não foi possível carregar o feed: ${error.message || 'erro de conexão.'}`);
      } finally {
        if (isCurrent) setFeedLoading(false);
      }
    };

    loadFeed();
    return () => { isCurrent = false; };
  }, [games]);

  const scrollToGames = () => document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const openFeedItem = async (item) => {
    if (item.type === 'visualization') {
      onOpenVisualization(item);
      return;
    }

    setLaunchingQuizId(item.id);
    setLaunchError('');
    try {
      await onPlayCreatedQuiz(item);
    } catch (error) {
      setLaunchError(error.message || 'Não foi possível iniciar o questionário.');
    } finally {
      setLaunchingQuizId(null);
    }
  };
  const manageFeedItem = async (item, action) => {
    if (!userId || item.ownerId !== userId) return;
    setActionLoadingId(item.id);
    setActionError('');

    try {
      if (action === 'delete') {
        if (!window.confirm(`Excluir "${item.title}"? Esta ação não pode ser desfeita.`)) return;
        const table = item.type === 'visualization' ? 'structure_visualizations' : 'quizzes';
        const { data: deletedItem, error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', item.databaseId)
          .eq('owner_id', userId)
          .select('id')
          .maybeSingle();

        if (deleteError) throw new Error(deleteError.message);
        if (!deletedItem) throw new Error('O conteúdo não foi excluído. Verifique se você ainda tem permissão para removê-lo.');
        setFeedItems((current) => current.filter((feedItem) => feedItem.id !== item.id));

        if (item.type === 'visualization') {
          const paths = item.images.map((image) => image.image_path).filter(Boolean);
          if (paths.length) {
            const { error: storageError } = await supabase.storage.from('visualizations').remove(paths);
            if (storageError) {
              setActionError(`O conteúdo foi excluído, mas não foi possível remover os arquivos associados: ${storageError.message}`);
            }
          }
        }
      } else {
        await onEditItem(item);
      }
    } catch (error) {
      setActionError(error.message || `Não foi possível ${action === 'delete' ? 'excluir' : 'editar'} o conteúdo.`);
    } finally {
      setActionLoadingId(null);
    }
  };
  const filteredItems = feedItems.filter((item) => (
    (activeFilter === 'all' || item.type === activeFilter)
    && item.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ));

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
  const firstSemesterGames = games.filter((game) => !game.externalUrl && game.id !== 'boca-e-faringe' && game.id !== 'guided-head-review');
  const secondSemesterGames = games.filter((game) => !game.externalUrl && (game.id === 'boca-e-faringe' || game.id === 'guided-head-review'));

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
          <p className="eyebrow">BIBLIOTECA</p>
          <h2>Explore para <em>estudar.</em></h2>
        </div>
        <div className="feed-controls">
          <label className="feed-search">
            <span className="visually-hidden">Pesquisar pelo título</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar pelo título..."
            />
            <span aria-hidden="true">⌕</span>
          </label>
          <div className="feed-filters" role="tablist" aria-label="Filtrar itens do feed">
            {feedFilters.map((filter) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.id}
                className={`feed-filter${activeFilter === filter.id ? ' active' : ''}`}
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        {feedLoading && <p className="created-quizzes-message" role="status">Carregando questionários e visualizações...</p>}
        {feedError && <p className="created-quizzes-message created-quizzes-error" role="alert">{feedError}</p>}
        {!feedLoading && filteredItems.length === 0 && (
          <p className="created-quizzes-message">
            {feedItems.length === 0 ? 'Ainda não há conteúdos disponíveis.' : 'Nenhum conteúdo corresponde à pesquisa e aos filtros.'}
          </p>
        )}
        {!feedLoading && filteredItems.length > 0 && (
          <div className="game-card-grid feed-grid">
            {filteredItems.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                userId={userId}
                onOpen={openFeedItem}
                onEdit={(feedItem) => manageFeedItem(feedItem, 'edit')}
                onDelete={(feedItem) => manageFeedItem(feedItem, 'delete')}
                loading={launchingQuizId === item.id}
                actionLoading={actionLoadingId === item.id}
              />
            ))}
          </div>
        )}
        {launchError && <p className="created-quizzes-message created-quizzes-error" role="alert">{launchError}</p>}
        {actionError && <p className="created-quizzes-message created-quizzes-error" role="alert">{actionError}</p>}
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
          {game.customQuiz[0]?.image ? (
            <div className="viewer-shell image-quiz-shell">
              <img
                src={game.customQuiz[0]?.image}
                alt={game.customQuiz[0]?.imageAlt || 'Pré-visualização do questionário'}
                className="image-quiz-image"
              />
            </div>
          ) : (
            <div className="viewer-shell image-quiz-shell placeholder-quiz-shell">
              <div className="quiz-placeholder-copy">
                <span>Questionário</span>
                <strong>{game.title}</strong>
              </div>
            </div>
          )}
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
  const [initialRoute] = useState(() => getAppRoute(window.location.pathname));
  const [screen, setScreen] = useState(initialRoute.screen);
  const [lightTheme, setLightTheme] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [quizLoadError, setQuizLoadError] = useState('');
  const [imageQuizResult, setImageQuizResult] = useState(null);
  const [customQuizSession, setCustomQuizSession] = useState(null);
  const game = useAnatomyGame();
  const [settings, setSettings] = useState(null);
  const [selectedGame, setSelectedGame] = useState(initialRoute.game ?? games[0]);
  const [quizToEdit, setQuizToEdit] = useState(null);
  const [externalLinkToEdit, setExternalLinkToEdit] = useState(null);
  const [selectedVisualizationId, setSelectedVisualizationId] = useState(initialRoute.visualizationId ?? null);
  const [pendingQuizSlug, setPendingQuizSlug] = useState(initialRoute.quizSlug ?? '');
  const routeSyncReady = useRef(false);

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
    const handlePopState = () => {
      const route = getAppRoute(window.location.pathname);
      setScreen(route.screen);
      setSelectedGame(route.game ?? games[0]);
      setSelectedVisualizationId(route.visualizationId ?? null);
      setPendingQuizSlug(route.quizSlug ?? '');
      setQuizLoadError('');
      setCustomQuizSession(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const path = getPathForScreen(screen, selectedGame, selectedVisualizationId, pendingQuizSlug);
    if (!routeSyncReady.current) {
      routeSyncReady.current = true;
      if (window.location.pathname !== path) {
        window.history.replaceState(null, '', path);
      }
      return;
    }
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [screen, selectedGame, selectedVisualizationId, pendingQuizSlug]);

  useEffect(() => {
    if (!authLoading && !user && screen === 'create-quiz') {
      setQuizToEdit(null);
      setScreen('home');
    }
    if (!authLoading && !user && ['create-content', 'create-external-link', 'edit-external-link'].includes(screen)) {
      setExternalLinkToEdit(null);
      setScreen('home');
    }
    if (!authLoading && !user && screen === 'create-visualization') {
      setScreen('create-content');
    }
    if (!authLoading && !user && screen === 'edit-visualization') {
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

  const editFeedItem = async (item) => {
    if (!user || item.ownerId !== user.id) {
      throw new Error('Você não tem permissão para editar este conteúdo.');
    }

    if (item.type === 'visualization') {
      setSelectedVisualizationId(item.databaseId);
      setScreen('edit-visualization');
      return;
    }

    if (item.type === 'external_link') {
      setExternalLinkToEdit(item);
      setScreen('edit-external-link');
      return;
    }

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*, quiz_answers(*))')
      .eq('id', item.databaseId)
      .eq('owner_id', user.id)
      .single();

    if (error) throw new Error(`Não foi possível carregar o questionário para edição: ${error.message}`);
    setQuizToEdit({ quiz });
    setScreen('create-quiz');
  };

  const playCreatedQuiz = async (quiz, isCurrent = () => true) => {
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
      const type = question.type || 'image_identification';
      const options = Array.isArray(question.options) ? question.options.map((option) => String(option).trim()).filter(Boolean) : [];
      const acceptedAnswers = answerRecords.map((answer) => (
        (answer.accepted_answers || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      ));

      if (!acceptedAnswers.length || acceptedAnswers.some((answers) => !answers.length)) {
        throw new Error('Este questionário tem perguntas sem respostas válidas cadastradas.');
      }

      if (type === 'multiple_choice') {
        const canonicalOptions = options.length ? options : acceptedAnswers.map((answerGroup) => answerGroup[0]);
        return {
          id: question.id,
          image: question.image_path,
          imageAlt: question.image_alt,
          question: question.prompt,
          type: 'multiple_choice',
          options: canonicalOptions.slice(0, 4),
          answer: acceptedAnswers[0]?.[0] ?? canonicalOptions[0] ?? '',
          acceptedAnswers: acceptedAnswers[0] ?? [canonicalOptions[0] ?? ''],
          isCreatedQuiz: true,
        };
      }

      return {
        id: question.id,
        image: question.image_path,
        imageAlt: question.image_alt,
        question: question.prompt,
        type,
        isCreatedQuiz: true,
        ...(type === 'image_identification'
          ? {
              answer: acceptedAnswers[0]?.[0] ?? '',
              acceptedAnswers: acceptedAnswers[0] ?? [],
            }
          : {
              answer: acceptedAnswers[0]?.[0] ?? '',
              acceptedAnswers: acceptedAnswers[0] ?? [],
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

    if (!isCurrent()) return;
    setSelectedGame(createdQuizGame);
    setImageQuizResult(null);
    setCustomQuizSession(null);
    setPendingQuizSlug('');
    setQuizLoadError('');
    setScreen('image-quiz-order');
  };

  useEffect(() => {
    if (authLoading || !pendingQuizSlug) return undefined;
    let isCurrent = true;

    playCreatedQuiz({ slug: pendingQuizSlug }, () => isCurrent).catch((error) => {
      if (!isCurrent) return;
      setQuizLoadError(error.message || 'Não foi possível carregar o questionário.');
      setScreen('quiz-error');
    });

    return () => {
      isCurrent = false;
    };
  }, [authLoading, pendingQuizSlug]);

  const startGame = (nextSettings) => { setSettings(nextSettings); const structures = selectedGame.structures.filter((item) => nextSettings.selectedRegions.includes(item.regiao)).map((item) => ({ ...item, modelFile: selectedGame.modelFile })); game.start({ ...nextSettings, promptNoun: selectedGame.promptNoun, modelFile: selectedGame.modelFile }, structures); setScreen('game'); };
  const goHome = () => {
    game.reset();
    setImageQuizResult(null);
    setCustomQuizSession(null);
    setPendingQuizSlug('');
    setQuizLoadError('');
    setScreen('home');
  };
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
    setSelectedGame(nextGame);
    if (nextGame.guided) {
      setScreen('guided-review');
      return;
    }
    if (nextGame.customQuiz) {
      setImageQuizResult(null);
      setScreen('image-quiz-order');
      return;
    }
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
    <div className={`app-shell ${lightTheme ? 'light-theme' : ''} ${screen === 'visualization-viewer' ? 'visualization-viewer-shell' : ''}`}>
      <Header
        onHome={goHome}
        onCreateQuiz={() => {
          if (!user) return;
          setPendingQuizSlug('');
          setQuizToEdit(null);
          setScreen('create-content');
        }}
        onLogin={() => {
          setPendingQuizSlug('');
          setScreen('login');
        }}
        onSignOut={signOut}
        isAuthenticated={Boolean(user)}
        lightTheme={lightTheme}
        onThemeChange={(event) => setLightTheme(event.target.checked)}
      />
      {authError && <p className="created-quizzes-message created-quizzes-error auth-message" role="alert">{authError}</p>}
      {screen === 'home' && (
        <Home
          games={games}
          userId={user?.id}
          onPlay={openSettings}
          onPlayCreatedQuiz={playCreatedQuiz}
          onEditItem={editFeedItem}
          onOpenVisualization={(item) => {
            setSelectedVisualizationId(item.visualizationId);
            setScreen('visualization-viewer');
          }}
        />
      )}
      {screen === 'quiz-loading' && (
        <main className="game-page page-enter">
          <p className="created-quizzes-message" role="status">Carregando questionário...</p>
        </main>
      )}
      {screen === 'quiz-error' && (
        <main className="game-page page-enter">
          <p className="created-quizzes-message created-quizzes-error" role="alert">{quizLoadError}</p>
          <button type="button" className="back-link" onClick={goHome}>← Voltar ao início</button>
        </main>
      )}
      {screen === 'visualization-viewer' && selectedVisualizationId && (
        <VisualizationViewer
          visualizationId={selectedVisualizationId}
          onBack={goHome}
        />
      )}
      {screen === 'create-visualization' && user && (
        <CreateVisualizationScreen
          onBack={() => setScreen('create-content')}
          onSaved={goHome}
          ownerId={user.id}
        />
      )}
      {screen === 'edit-visualization' && user && selectedVisualizationId && (
        <CreateVisualizationScreen
          visualizationId={selectedVisualizationId}
          onBack={goHome}
          onSaved={goHome}
          ownerId={user.id}
        />
      )}
      {screen === 'login' && !user && <LoginScreen onBack={goHome} onLoginSuccess={handleLoginSuccess} />}
      {screen === 'create-content' && user && (
        <CreateContentScreen
          onBack={goHome}
          onCreateQuiz={() => {
            setQuizToEdit(null);
            setScreen('create-quiz');
          }}
          onCreateVisualization={() => setScreen('create-visualization')}
          onCreateExternalLink={() => setScreen('create-external-link')}
        />
      )}
      {screen === 'create-external-link' && user && (
        <CreateExternalLinkScreen
          userId={user.id}
          onBack={() => setScreen('create-content')}
          onSaved={goHome}
        />
      )}
      {screen === 'edit-external-link' && user && externalLinkToEdit && (
        <CreateExternalLinkScreen
          key={externalLinkToEdit.databaseId}
          userId={user.id}
          externalLink={externalLinkToEdit}
          onBack={goHome}
          onSaved={goHome}
        />
      )}
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
