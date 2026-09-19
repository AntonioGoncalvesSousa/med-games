import { useEffect, useState } from 'react';
import AnatomyViewer from './AnatomyViewer';

export default function GameScreen({ game, onExit, onFinish }) {
  const { state, current, completed, total, answer, reveal, markUnknown, markFlashcard, skip, next } = game;
  const [input, setInput] = useState('');
  useEffect(() => setInput(''), [current]);
  if (!current) return null;
  const answered = Boolean(state.feedback);
  const last = state.currentIndex >= total - 1;
  const submit = (event) => { event.preventDefault(); if (input.trim()) answer(input); };
  const advance = () => { if (last) onFinish(); else next(); };
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
  return <main className="game-page page-enter"><div className="game-topbar"><button className="back-link" onClick={onExit}>← Sair da rodada</button><div className="progress-copy"><span>QUESTÃO {String(completed + 1).padStart(2, '0')}</span><strong>{String(total).padStart(2, '0')}</strong></div></div><div className="progress-track"><span style={{ width: `${(completed / total) * 100}%` }} /></div><div className="game-layout"><section className="viewer-column"><AnatomyViewer structure={current} /></section><section className="answer-column"><p className="eyebrow">Identificação óssea</p><h1>Qual é este <em>osso?</em></h1><p className="answer-prompt">Observe a estrutura destacada no modelo e confie no que você sabe.</p>{state.mode === 'write' ? <form onSubmit={submit} className="answer-form"><label htmlFor="answer">Sua resposta</label><input id="answer" autoComplete="off" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Digite o nome do osso" disabled={answered} autoFocus={!answered} />{state.feedback && <div className={`feedback ${state.feedback.type}`}><span>{state.feedback.type === 'correct' ? '✓' : '×'}</span><div><strong>{state.feedback.type === 'correct' ? 'Correto!' : 'Resposta incorreta'}</strong>{state.feedback.type === 'incorrect' && <small>Resposta: {current.nome}</small>}</div></div>}<div className="button-row">{answered ? <button type="button" className="primary-button" onClick={advance}>{last ? 'Ver resultado' : 'Próximo osso'} <span>→</span></button> : <button className="primary-button" disabled={!input.trim()}>Responder <span>↗</span></button>}{!answered && state.allowSkip && <button type="button" className="text-button" onClick={skip}>Passar <span>↗</span></button>}{!answered && <button type="button" className="text-button muted" onClick={() => { reveal(); answer(''); }}>Não sei</button>}</div></form> : <div className="flashcard-actions">{!state.revealed && <button className="reveal-button" onClick={reveal}>Mostrar resposta <span>⌄</span></button>}{state.revealed && !answered && <div className="revealed-answer"><small>A estrutura é</small><strong>{current.nome}</strong><div className="button-row"><button className="primary-button" onClick={() => markFlashcard(true)}>Eu sabia <span>✓</span></button><button className="secondary-button" onClick={() => markFlashcard(false)}>Não sabia</button></div></div>}{answered && <div className="feedback flash-feedback"><span>{state.feedback.type === 'correct' ? '✓' : '×'}</span><strong>{state.feedback.type === 'correct' ? 'Boa memória.' : 'Vale revisar esta estrutura.'}</strong><button className="primary-button" onClick={advance}>{last ? 'Ver resultado' : 'Próximo osso'} <span>→</span></button></div>}</div>}</section></div></main>;
}
