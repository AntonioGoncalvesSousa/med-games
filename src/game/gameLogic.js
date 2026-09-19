export function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export function createQueue(structures, randomOrder = true) {
  const orderedStructures = randomOrder ? shuffle(structures) : structures;
  return orderedStructures.map((structure) => ({ structure, status: 'pending' }));
}

export function getScorePercentage(correct, total) {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}
