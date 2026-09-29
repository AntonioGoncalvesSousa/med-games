import { useState } from 'react';
import AnatomyViewer from './AnatomyViewer';

export default function GuidedReviewScreen({ steps, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = steps[currentIndex];
  const structure = {
    id: `guided-${currentIndex}`,
    nome: current.title,
    meshNames: current.meshNames,
    modelFile: current.modelFile,
  };

  const previous = () => setCurrentIndex((index) => Math.max(0, index - 1));
  const next = () => setCurrentIndex((index) => Math.min(steps.length - 1, index + 1));

  return (
    <main className="guided-page page-enter">
      <div className="guided-topbar">
        <button className="back-link" type="button" onClick={onExit}>← Sair do roteiro</button>
        <span className="guided-counter">ETAPA {String(currentIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
      </div>
      <div className="progress-track"><span style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }} /></div>

      <div className="guided-layout">
        <section className="guided-viewer-column">
          <header className="guided-viewer-heading">
            <p className="eyebrow">{current.section}</p>
            <h1>{current.title}</h1>
            <p>Estrutura em destaque no modelo Z-Anatomy</p>
          </header>
          <AnatomyViewer key={currentIndex} structure={structure} modelFile={current.modelFile} contextOpacity={current.modelFile === 'skeleton.glb' ? 0.28 : 1} labels={current.markers ?? []} />
        </section>

        <aside className="guided-details">
          <p className="eyebrow">Roteiro de aula prática</p>
          <h2>Estruturas para observar</h2>
          {current.parts.length ? (
            <ol className="guided-structure-list">
              {current.parts.map((part, index) => (
                <li key={part}><span>{String(index + 1).padStart(2, '0')}</span>{part}</li>
              ))}
            </ol>
          ) : (
            <p className="guided-empty-note">O roteiro não detalha partes adicionais para esta estrutura.</p>
          )}
          {current.missingParts?.length > 0 && (
            <div className="guided-missing-parts">
              <h3>Sem malha própria no modelo</h3>
              <ul>{current.missingParts.map((part) => <li key={part}>{part}</li>)}</ul>
            </div>
          )}
          <p className="guided-model-note">As partes listadas seguem o roteiro. Quando uma parte não existe como malha independente, o osso correspondente permanece destacado no modelo.</p>
        </aside>
      </div>

      <nav className="guided-navigation" aria-label="Navegação do roteiro">
        <button className="guided-nav-button" type="button" onClick={previous} disabled={currentIndex === 0}>← Voltar</button>
        <button className="primary-button" type="button" onClick={next} disabled={currentIndex === steps.length - 1}>Avançar <span>→</span></button>
      </nav>
    </main>
  );
}