export default function CreateContentScreen({
  onBack,
  onCreateQuiz,
  onCreateVisualization,
  onCreateExternalLink,
}) {
  return (
    <main className="create-quiz-page page-enter">
      <button type="button" className="back-link" onClick={onBack}>← Voltar ao início</button>
      <div className="create-quiz-heading">
        <p className="eyebrow">NOVO CONTEÚDO</p>
        <h1>O que vamos <em>criar?</em></h1>
        <p>Escolha o tipo de conteúdo que deseja adicionar à plataforma.</p>
      </div>
      <div className="create-content-options">
        <button type="button" className="create-content-option" onClick={onCreateQuiz}>
          <span className="game-icon" aria-hidden="true">◍</span>
          <span><strong>Criar Questionário</strong><small>Monte perguntas e respostas para praticar.</small></span>
          <span className="create-content-arrow" aria-hidden="true">→</span>
        </button>
        <button type="button" className="create-content-option" onClick={onCreateVisualization}>
          <span className="game-icon" aria-hidden="true">◉</span>
          <span><strong>Criar Visualização</strong><small>Adicione imagens interativas de estruturas.</small></span>
          <span className="create-content-arrow" aria-hidden="true">→</span>
        </button>
        <button type="button" className="create-content-option" onClick={onCreateExternalLink}>
          <span className="game-icon" aria-hidden="true">↗</span>
          <span><strong>Adicionar Link Externo</strong><small>Compartilhe um recurso de estudo externo.</small></span>
          <span className="create-content-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}
