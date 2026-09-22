import { useEffect, useMemo, useState } from 'react';
import { normalizeAnswer } from '../utils/normalizeAnswer';

export default function ImageQuizScreen({ game, onBack, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [answerError, setAnswerError] = useState('');
  const [resultSummary, setResultSummary] = useState({ correct: 0, incorrect: 0 });

  const current = game?.customQuiz?.[currentIndex];
  const isLastQuestion = currentIndex === (game?.customQuiz?.length || 1) - 1;
  const answerPrompt = current?.id === 'vestibulo-da-boca'
    ? 'espaço entre os dentes/gengivas e as paredes da boca.'
    : current?.id === 'cavidade-propria-da-boca'
      ? 'parte interna da boca, limitada pelos dentes e pela arcada alveolar.'
      : 'Observe a imagem e confie no que você sabe.';
  const progress = useMemo(() => {
    if (!game?.customQuiz?.length) return 0;
    return ((currentIndex + 1) / game.customQuiz.length) * 100;
  }, [currentIndex, game]);

  useEffect(() => {
    if (!feedback) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, isLastQuestion, currentIndex]);

  if (!current) return null;

  const submitAnswer = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setAnswerError('Digite uma resposta antes de continuar.');
      return;
    }

    setAnswerError('');
    const isCorrect = normalizeAnswer(trimmed) === normalizeAnswer(current.answer);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setResultSummary((previous) => ({
      correct: previous.correct + (isCorrect ? 1 : 0),
      incorrect: previous.incorrect + (isCorrect ? 0 : 1),
    }));
  };

  const handleNext = () => {
    if (!feedback) return;
    if (!isLastQuestion) {
      setCurrentIndex((index) => index + 1);
      setInput('');
      setFeedback(null);
      setAnswerError('');
      return;
    }

    const finalSummary = {
      correct: resultSummary.correct + (feedback === 'correct' ? 1 : 0),
      incorrect: resultSummary.incorrect + (feedback === 'incorrect' ? 1 : 0),
      total: game.customQuiz.length,
    };

    onFinish({
      ...finalSummary,
      percentage: Math.round((finalSummary.correct / finalSummary.total) * 100),
    });
  };

  return (
    <main className="game-page page-enter">
      <div className="game-topbar">
        <button className="back-link" onClick={onBack}>← Sair da rodada</button>
        <div className="progress-copy"><span>QUESTÃO {String(currentIndex + 1).padStart(2, '0')}</span><strong>{String(game.customQuiz.length).padStart(2, '0')}</strong></div>
      </div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>

      <div className="game-layout">
        <section className="viewer-column">
          <div className="viewer-shell image-quiz-shell">
            <img src={current.image} alt={current.question} className="image-quiz-image" />
          </div>
        </section>

        <section className="answer-column">
          <p className="eyebrow">Identificação anatômica</p>
          <h1>Qual é esta <em>estrutura?</em></h1>
          <p className="answer-prompt">{answerPrompt}</p>

          <form onSubmit={submitAnswer} className="answer-form">
            <label htmlFor="image-quiz-answer">Sua resposta</label>
            <input
              id="image-quiz-answer"
              type="text"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (feedback) setFeedback(null);
                if (answerError) setAnswerError('');
              }}
              placeholder="Digite o nome da estrutura"
              autoFocus
              disabled={Boolean(feedback)}
              aria-invalid={Boolean(answerError)}
              aria-describedby={answerError ? 'image-answer-error' : undefined}
            />

            {answerError && <small id="image-answer-error" className="answer-error" role="alert">{answerError}</small>}

            {feedback && (
              <div className={`feedback ${feedback}`}>
                <span>{feedback === 'correct' ? '✓' : '×'}</span>
                <div>
                  <strong>{feedback === 'correct' ? 'Correto!' : 'Resposta incorreta'}</strong>
                  {feedback === 'incorrect' && <small>Resposta: {current.answer}</small>}
                </div>
              </div>
            )}

            <div className="button-row">
              {!feedback ? (
                <button type="submit" className="primary-button">Responder <span>↗</span></button>
              ) : (
                <button type="button" className="primary-button" onClick={handleNext}>{isLastQuestion ? 'Finalizar' : 'Próxima questão'} <span>→</span></button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
