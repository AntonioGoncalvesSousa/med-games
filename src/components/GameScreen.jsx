import { useEffect, useState } from 'react';
import AnatomyViewer from './AnatomyViewer';

export default function GameScreen({ game, onExit, onFinish }) {
  const { state, current, completed, total, answer, reveal, markFlashcard, skip, next } = game;
  const [input, setInput] = useState('');
  const promptNoun = state.promptNoun || 'osso';
  const answered = Boolean(state.feedback);
  const last = state.currentIndex >= total - 1;

  useEffect(() => setInput(''), [current]);

  const advance = () => {
    if (last) onFinish();
    else next();
  };

  useEffect(() => {
    if (!answered) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      advance();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, last, onFinish]);

  if (!current) return null;

  const submit = (event) => {
    event.preventDefault();
    if (input.trim()) answer(input);
  };

  return (
    <main className="game-page page-enter">
      <div className="game-topbar">
        <button className="back-link" onClick={onExit}>← Sair da rodada</button>
        <div className="progress-copy"><span>QUESTÃO {String(completed + 1).padStart(2, '0')}</span><strong>{String(total).padStart(2, '0')}</strong></div>
      </div>
      <div className="progress-track"><span style={{ width: `${(completed / total) * 100}%` }} /></div>
      <div className="game-layout">
        <section className="viewer-column"><AnatomyViewer structure={current} /></section>
        <section className="answer-column">
          <p className="eyebrow">Identificação anatômica</p>
          <h1>Qual é este <em>{promptNoun}?</em></h1>
          <p className="answer-prompt">Observe a estrutura destacada no modelo e confie no que você sabe.</p>
          {state.mode === 'write' ? (
            <form onSubmit={submit} className="answer-form">
              <label htmlFor="answer">Sua resposta</label>
              <input id="answer" autoComplete="off" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Digite o nome da estrutura" disabled={answered} autoFocus={!answered} />
              {state.feedback && <div className={`feedback ${state.feedback.type}`}><span>{state.feedback.type === 'correct' ? '✓' : '×'}</span><div><strong>{state.feedback.type === 'correct' ? 'Correto!' : 'Resposta incorreta'}</strong>{state.feedback.type === 'incorrect' && <small>Resposta: {current.nome}</small>}</div></div>}
              <div className="button-row">
                {answered ? <button type="button" className="primary-button" onClick={advance}>{last ? 'Ver resultado' : 'Próxima estrutura'} <span>→</span></button> : <button className="primary-button" disabled={!input.trim()}>Responder <span>↗</span></button>}
                {!answered && state.allowSkip && <button type="button" className="text-button" onClick={skip}>Passar <span>↗</span></button>}
                {!answered && <button type="button" className="text-button muted" onClick={() => { reveal(); answer(''); }}>Não sei</button>}
              </div>
            </form>
          ) : (
            <div className="flashcard-actions">
              {!state.revealed && <button className="reveal-button" onClick={reveal}>Mostrar resposta <span>↗</span></button>}
              {state.revealed && <div className="flashcard-answer"><span>Resposta</span><strong>{current.nome}</strong></div>}
              <div className="button-row">
                {state.revealed ? <><button className="primary-button" onClick={() => markFlashcard(true)}>Eu sabia <span>→</span></button><button className="text-button" onClick={() => markFlashcard(false)}>Ainda não <span>↗</span></button></> : state.allowSkip && <button type="button" className="text-button" onClick={skip}>Passar <span>↗</span></button>}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
