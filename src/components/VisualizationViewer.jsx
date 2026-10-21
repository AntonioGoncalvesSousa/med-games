import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import ResultScreen from './ResultScreen';

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function normalizeAnswer(value = '') {
  return value.trim().toLocaleLowerCase();
}

function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  return supabase.storage.from('visualizations').getPublicUrl(imagePath).data.publicUrl;
}

export default function VisualizationViewer({ visualizationId, onBack }) {
  const [visualization, setVisualization] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [activePinId, setActivePinId] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testPins, setTestPins] = useState([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testAnswer, setTestAnswer] = useState('');
  const [testFeedback, setTestFeedback] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testScore, setTestScore] = useState({ correct: 0, incorrect: 0 });
  const nextButtonRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadVisualization = async () => {
      setLoading(true);
      setError('');

      const { data: record, error: visualizationError } = await supabase
        .from('structure_visualizations')
        .select('id, title, description, structure_images(id, view_name, image_path, position, structure_pins(id, label, accepted_answers, x_position, y_position))')
        .eq('id', visualizationId)
        .single();

      if (!isCurrent) return;
      if (visualizationError) {
        setError(`Não foi possível carregar a visualização: ${visualizationError.message}`);
        setVisualization(null);
        setImages([]);
        setLoading(false);
        return;
      }

      setVisualization(record);
      const orderedImages = [...(record.structure_images ?? [])]
        .sort((first, second) => first.position - second.position)
        .map((image) => ({
          ...image,
          pins: (image.structure_pins ?? []).map((pin) => ({
            ...pin,
            imageId: image.id,
          })),
        }));
      setImages(orderedImages);
      setSelectedImageId((currentId) => (
        orderedImages.some((image) => image.id === currentId)
          ? currentId
          : orderedImages[0]?.id ?? null
      ));
      setLoading(false);
    };

    loadVisualization();
    return () => {
      isCurrent = false;
    };
  }, [visualizationId]);

  useEffect(() => {
    if (testFeedback) nextButtonRef.current?.focus();
  }, [testFeedback]);

  if (loading) {
    return (
      <main className="visualizations-page page-enter">
        <p className="created-quizzes-message" role="status">Carregando visualização...</p>
      </main>
    );
  }

  if (error || !visualization) {
    return (
      <main className="visualizations-page page-enter">
        <button type="button" className="back-link" onClick={onBack}>← Voltar às visualizações</button>
        <p className="created-quizzes-message created-quizzes-error" role="alert">
          {error || 'A visualização solicitada não foi encontrada.'}
        </p>
      </main>
    );
  }

  if (testResult) {
    const resultGame = {
      state: {
        correct: testResult.correct,
        incorrect: testResult.incorrect,
        skipped: 0,
        queue: Array.from({ length: testResult.total }, (_, index) => ({ index })),
      },
      percentage: Math.round((testResult.correct / testResult.total) * 100),
    };

    return (
      <ResultScreen
        game={resultGame}
        onAgain={() => {
          setTestResult(null);
          startTestMode();
        }}
        onHome={onBack}
      />
    );
  }

  const selectedImage = images.find((image) => image.id === selectedImageId);
  const allPins = images.flatMap((image) => image.pins);
  const currentTestPin = testPins[testIndex];
  const testImage = images.find((image) => image.id === currentTestPin?.imageId);
  const displayedImage = isTestMode ? testImage : selectedImage;
  const imageUrl = getImageUrl(displayedImage?.image_path);

  const startTestMode = () => {
    const shuffledPins = shuffle(allPins);
    if (!shuffledPins.length) return;
    setTestPins(shuffledPins);
    setTestIndex(0);
    setTestAnswer('');
    setTestFeedback(null);
    setTestResult(null);
    setTestScore({ correct: 0, incorrect: 0 });
    setActivePinId(null);
    setIsTestMode(true);
  };

  const submitTestAnswer = (event) => {
    event.preventDefault();
    if (!currentTestPin || testFeedback) return;

    const acceptedAnswers = [
      currentTestPin.label,
      ...(currentTestPin.accepted_answers ?? '').split(','),
    ].map(normalizeAnswer).filter(Boolean);
    const isCorrect = acceptedAnswers.includes(normalizeAnswer(testAnswer));
    setTestFeedback(isCorrect ? 'correct' : 'incorrect');
    setTestScore((score) => ({
      correct: score.correct + (isCorrect ? 1 : 0),
      incorrect: score.incorrect + (isCorrect ? 0 : 1),
    }));
  };

  const nextTestPin = () => {
    if (testIndex + 1 >= testPins.length) {
      setIsTestMode(false);
      setTestResult({
        correct: testScore.correct,
        incorrect: testScore.incorrect,
        total: testPins.length,
      });
      return;
    }
    setTestIndex((index) => index + 1);
    setTestAnswer('');
    setTestFeedback(null);
  };

  return (
    <main className="visualizations-page page-enter">
      <div className="game-topbar visualization-viewer-topbar">
        <button type="button" className="back-link" onClick={onBack}>← Voltar às visualizações</button>
        <p className="progress-copy">VISUALIZAÇÃO INTERATIVA</p>
      </div>

      <header className="visualization-viewer-heading">
        <p className="eyebrow">ESTUDO DE ESTRUTURAS</p>
        <h1>{visualization.title}</h1>
        {visualization.description && <p>{visualization.description}</p>}
        <small>{isTestMode ? `Questão ${testIndex + 1} de ${testPins.length}` : 'Clique em um marcador ou passe o cursor para revelar o nome da estrutura.'}</small>
      </header>

      <div className="visualization-viewer-actions">
        {isTestMode ? (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setIsTestMode(false);
              setTestFeedback(null);
              setTestAnswer('');
              setTestPins([]);
            }}
          >
            Voltar ao modo de estudo
          </button>
        ) : (
          <button
            type="button"
            className="primary-button visualization-test-button"
            onClick={startTestMode}
            disabled={allPins.length === 0}
            title={allPins.length === 0 ? 'Adicione pins para iniciar o teste.' : undefined}
          >
            Modo Teste <span>↗</span>
          </button>
        )}
      </div>

      {!isTestMode && images.length > 1 && (
        <nav className="visualization-view-tabs" aria-label="Vistas da estrutura">
          {images.map((image) => (
            <button
              type="button"
              key={image.id}
              className={`visualization-view-tab ${selectedImageId === image.id ? 'active' : ''}`}
              aria-pressed={selectedImageId === image.id}
              onClick={() => {
                setSelectedImageId(image.id);
                setActivePinId(null);
              }}
            >
              {image.view_name}
            </button>
          ))}
        </nav>
      )}

      {imageUrl ? (
        <>
        <div className={`visualization-viewer-canvas ${isTestMode ? 'test-mode-canvas' : ''}`}>
          <img
            key={displayedImage.id}
            src={imageUrl}
            alt={`${displayedImage?.view_name || 'Vista'}: ${visualization.title}`}
          />
          {(isTestMode ? [currentTestPin] : selectedImage?.pins ?? []).filter(Boolean).map((pin, index) => (
            <button
              type="button"
              key={pin.id}
              className={`visualization-viewer-pin ${isTestMode ? 'visualization-test-pin' : ''} ${activePinId === pin.id ? 'is-active' : ''}`}
              style={{ left: `${pin.x_position}%`, top: `${pin.y_position}%` }}
              aria-label={isTestMode ? `Pin da questão ${testIndex + 1}` : `Estrutura ${index + 1}: ${pin.label}`}
              aria-pressed={isTestMode ? undefined : activePinId === pin.id}
              onClick={isTestMode ? undefined : () => setActivePinId((currentId) => currentId === pin.id ? null : pin.id)}
            >
              <span className="visualization-viewer-pin-dot" aria-hidden="true" />
              {!isTestMode && <span className="visualization-viewer-pin-label">{pin.label}</span>}
            </button>
          ))}
        </div>
        {isTestMode && currentTestPin && (
          <form className="visualization-test-form" onSubmit={submitTestAnswer}>
            <label htmlFor="visualization-test-answer">Qual é o nome desta estrutura?</label>
            <input
              id="visualization-test-answer"
              value={testAnswer}
              onChange={(event) => setTestAnswer(event.target.value)}
              placeholder="Digite o nome da estrutura"
              autoComplete="off"
              disabled={Boolean(testFeedback)}
              className={testFeedback ? `visualization-test-input ${testFeedback}` : 'visualization-test-input'}
              required
            />
            {testFeedback && (
              <div className={`feedback ${testFeedback}`} role="status">
                <span>{testFeedback === 'correct' ? '✓' : '×'}</span>
                <div>
                  <strong>{testFeedback === 'correct' ? 'Acertou!' : 'Errou.'}</strong>
                  {testFeedback === 'incorrect' && <small>Resposta correta: {currentTestPin.label}</small>}
                </div>
              </div>
            )}
            <div className="visualization-test-actions">
              {!testFeedback ? (
                <button type="submit" className="primary-button">Responder <span>→</span></button>
              ) : (
                <button ref={nextButtonRef} type="button" className="primary-button" onClick={nextTestPin}>
                  {testIndex + 1 >= testPins.length ? 'Finalizar teste' : 'Próximo'} <span>→</span>
                </button>
              )}
            </div>
          </form>
        )}
        </>
      ) : (
        <p className="created-quizzes-message created-quizzes-error" role="alert">
          {images.length ? 'Esta vista não possui uma imagem disponível.' : 'Esta visualização ainda não possui imagens.'}
        </p>
      )}
    </main>
  );
}
