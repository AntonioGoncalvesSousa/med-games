import { useEffect, useMemo, useState } from 'react';
import { normalizeAnswer } from '../utils/normalizeAnswer';

const buildEmptyMultiState = (answers = []) => Object.fromEntries(
  answers.map((_, index) => [index + 1, ''])
);

const buildEmptyMultiStatus = (answers = []) => Object.fromEntries(
  answers.map((_, index) => [index + 1, null])
);

export default function ImageQuizScreen({ game, onBack, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [multiInputs, setMultiInputs] = useState(() => buildEmptyMultiState(game?.customQuiz?.[0]?.answers || []));
  const [multiStatus, setMultiStatus] = useState(() => buildEmptyMultiStatus(game?.customQuiz?.[0]?.answers || []));
  const [feedback, setFeedback] = useState(null);
  const [answerError, setAnswerError] = useState('');
  const [resultSummary, setResultSummary] = useState({ correct: 0, incorrect: 0 });

  const current = game?.customQuiz?.[currentIndex];
  const isMultiAnswerQuestion = current?.type === 'multiple';
  const isLastQuestion = currentIndex === (game?.customQuiz?.length || 1) - 1;
  const answerPrompt = current?.id === 'vestibulo-da-boca'
    ? 'espaço entre os dentes/gengivas e as paredes da boca.'
    : current?.id === 'cavidade-propria-da-boca'
      ? 'parte interna da boca, limitada pelos dentes e pela arcada alveolar.'
      : current?.id === 'istmo-das-fauces'
        ? 'passagem que comunica a boca com a faringe.'
        : isMultiAnswerQuestion
          ? 'Identifique cada estrutura indicada na imagem.'
          : 'Observe a imagem e confie no que você sabe.';
  const progress = useMemo(() => {
    if (!game?.customQuiz?.length) return 0;
    return ((currentIndex + 1) / game.customQuiz.length) * 100;
  }, [currentIndex, game]);

  useEffect(() => {
    if (!current || !current.answers) {
      return undefined;
    }

    setMultiInputs(buildEmptyMultiState(current.answers));
    setMultiStatus(buildEmptyMultiStatus(current.answers));
    setInput('');
    setFeedback(null);
    setAnswerError('');
    return undefined;
  }, [current?.id]);

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

    if (isMultiAnswerQuestion) {
      const expectedFields = current.answers.length;
      const values = Array.from({ length: expectedFields }, (_, index) => (multiInputs[index + 1] || '').trim());
      if (values.some((value) => !value)) {
        setAnswerError(`Preencha as ${expectedFields} estruturas antes de continuar.`);
        return;
      }

      const nextStatus = {};
      current.answers.forEach((item, index) => {
        const hasCorrectValue = normalizeAnswer(values[index]) === normalizeAnswer(item.answer);
        nextStatus[index + 1] = hasCorrectValue ? 'correct' : 'incorrect';
      });

      const isCorrect = Object.values(nextStatus).every((status) => status === 'correct');
      setMultiStatus(nextStatus);
      setAnswerError('');
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      setResultSummary((previous) => ({
        correct: previous.correct + (isCorrect ? 1 : 0),
        incorrect: previous.incorrect + (isCorrect ? 0 : 1),
      }));
      return;
    }

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
      setMultiInputs(buildEmptyMultiState(current.answers));
      setMultiStatus(buildEmptyMultiStatus(current.answers));
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
            {!isMultiAnswerQuestion ? (
              <>
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
              </>
            ) : (
              <div className="multi-answer-list">
                {current.answers.map((item, index) => (
                  <div key={item.label} className="multi-answer-item">
                    <label htmlFor={`image-quiz-answer-${index + 1}`}>{item.label}</label>
                    <input
                      id={`image-quiz-answer-${index + 1}`}
                      type="text"
                      value={multiInputs[index + 1]}
                      className={feedback ? (multiStatus[index + 1] === 'correct' ? 'field-correct' : 'field-incorrect') : ''}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setMultiInputs((previous) => ({ ...previous, [index + 1]: nextValue }));
                        if (feedback) setFeedback(null);
                        if (answerError) setAnswerError('');
                      }}
                      placeholder={item.label}
                      autoFocus={index === 0}
                      disabled={Boolean(feedback)}
                      aria-invalid={Boolean(answerError)}
                      aria-describedby={answerError ? 'image-answer-error' : undefined}
                    />
                  </div>
                ))}
              </div>
            )}

            {answerError && <small id="image-answer-error" className="answer-error" role="alert">{answerError}</small>}

            {feedback && (
              <div className={`feedback ${feedback}`}>
                <span>{feedback === 'correct' ? '✓' : '×'}</span>
                <div>
                  <strong>{feedback === 'correct' ? 'Correto!' : 'Resposta incorreta'}</strong>
                  {feedback === 'incorrect' && (
                    <small>
                      {isMultiAnswerQuestion
                        ? `Respostas corretas: ${current.answers.map((item) => item.answer).join(' • ')}`
                        : `Resposta: ${current.answer}`}
                    </small>
                  )}
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
