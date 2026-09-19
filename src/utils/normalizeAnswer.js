export function normalizeAnswer(text = '') {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function answerMatches(answer, structure) {
  const normalized = normalizeAnswer(answer);
  return [structure.nome, ...(structure.aliases || [])].some(
    (candidate) => normalizeAnswer(candidate) === normalized,
  );
}
