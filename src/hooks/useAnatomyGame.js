import { useCallback, useMemo, useReducer } from 'react';
import { answerMatches } from '../utils/normalizeAnswer';
import { createQueue, getScorePercentage } from '../game/gameLogic';

const initialState = {
  mode: 'write',
  allowSkip: true,
  queue: [],
  currentIndex: 0,
  correct: 0,
  incorrect: 0,
  skipped: 0,
  history: [],
  feedback: null,
  revealed: false,
  started: false,
};

function reducer(state, action) {
  const current = state.queue[state.currentIndex];
  switch (action.type) {
    case 'START':
      return { ...initialState, ...action.settings, queue: createQueue(action.structures), started: true };
    case 'ANSWER': {
      if (!current || state.feedback) return state;
      const isCorrect = answerMatches(action.answer, current.structure);
      return {
        ...state,
        feedback: { type: isCorrect ? 'correct' : 'incorrect', answer: action.answer },
        revealed: true,
        correct: state.correct + (isCorrect ? 1 : 0),
        incorrect: state.incorrect + (isCorrect ? 0 : 1),
        queue: state.queue.map((item, index) => index === state.currentIndex ? { ...item, status: isCorrect ? 'correct' : 'incorrect' } : item),
      };
    }
    case 'REVEAL':
      return state.feedback ? state : { ...state, revealed: true };
    case 'UNKNOWN':
      if (!current || state.feedback) return state;
      return {
        ...state,
        feedback: { type: 'incorrect', answer: '' },
        revealed: true,
        incorrect: state.incorrect + 1,
        queue: state.queue.map((item, index) => index === state.currentIndex ? { ...item, status: 'incorrect' } : item),
      };
    case 'MARK_FLASHCARD':
      if (!current || state.feedback) return state;
      return {
        ...state,
        feedback: { type: action.known ? 'correct' : 'incorrect', answer: '' },
        revealed: true,
        correct: state.correct + (action.known ? 1 : 0),
        incorrect: state.incorrect + (action.known ? 0 : 1),
        queue: state.queue.map((item, index) => index === state.currentIndex ? { ...item, status: action.known ? 'correct' : 'incorrect' } : item),
      };
    case 'SKIP': {
      if (!current || !state.allowSkip || state.feedback) return state;
      const moved = [...state.queue];
      const [skippedItem] = moved.splice(state.currentIndex, 1);
      moved.push({ ...skippedItem, status: 'skipped' });
      return { ...state, queue: moved, currentIndex: state.currentIndex >= moved.length ? 0 : state.currentIndex, skipped: state.skipped + 1, history: [...state.history, { structure: current.structure, result: 'skipped' }] };
    }
    case 'NEXT':
      if (state.currentIndex >= state.queue.length - 1) return { ...state, started: false };
      return { ...state, currentIndex: state.currentIndex + 1, feedback: null, revealed: false };
    case 'RESTART':
      return initialState;
    default:
      return state;
  }
}

export function useAnatomyGame() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const current = state.queue[state.currentIndex]?.structure || null;
  const total = state.queue.length;
  const completed = state.queue.filter((item) => item.status === 'correct' || item.status === 'incorrect').length;
  const finished = !state.started && total > 0;
  const percentage = useMemo(() => getScorePercentage(state.correct, total), [state.correct, total]);

  const start = useCallback((settings, structures) => dispatch({ type: 'START', settings, structures }), []);
  return { state, current, total, completed, finished, percentage, start, answer: (value) => dispatch({ type: value.trim() ? 'ANSWER' : 'UNKNOWN', answer: value }), reveal: () => dispatch({ type: 'REVEAL' }), markUnknown: () => dispatch({ type: 'UNKNOWN' }), markFlashcard: (known) => dispatch({ type: 'MARK_FLASHCARD', known }), skip: () => dispatch({ type: 'SKIP' }), next: () => dispatch({ type: 'NEXT' }), reset: () => dispatch({ type: 'RESTART' }) };
}
