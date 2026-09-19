import { useState } from 'react';
import { regions } from '../data/anatomyData';

export default function GameSettings({ onStart, onBack }) {
  const [mode, setMode] = useState('write');
  const [allowSkip, setAllowSkip] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState(regions.map((region) => region.id));
  const [error, setError] = useState('');
  const toggleRegion = (id) => setSelectedRegions((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const selectAll = () => setSelectedRegions(selectedRegions.length === regions.length ? [] : regions.map((region) => region.id));
  const submit = () => {
    if (!selectedRegions.length) { setError('Selecione pelo menos uma região anatômica.'); return; }
    onStart({ mode, allowSkip, selectedRegions });
  };
  return <main className="settings-page page-enter"><button className="back-link" onClick={onBack}>← Voltar ao início</button><div className="settings-heading"><p className="eyebrow">Preparação da sessão</p><h1>Como você quer <em>estudar?</em></h1><p>Escolha o formato e o recorte anatômico para montar sua rodada.</p></div><div className="settings-grid"><section className="settings-panel"><div className="section-heading"><span className="step-index">01</span><div><h2>Modo de resposta</h2><p>O formato que combina com seu ritmo.</p></div></div><div className="mode-options"><button className={`mode-option ${mode === 'write' ? 'selected' : ''}`} onClick={() => setMode('write')}><span className="option-icon">⌨</span><span><strong>Escrever</strong><small>Digite o nome do osso</small></span><span className="radio-dot" /></button><button className={`mode-option ${mode === 'flashcards' ? 'selected' : ''}`} onClick={() => setMode('flashcards')}><span className="option-icon">◈</span><span><strong>Flashcards</strong><small>Revele e avalie sua memória</small></span><span className="radio-dot" /></button></div><div className="setting-toggle"><div><strong>Permitir passar um osso</strong><small>Ele volta ao final da fila para uma nova tentativa.</small></div><button className={`switch ${allowSkip ? 'on' : ''}`} onClick={() => setAllowSkip(!allowSkip)} aria-label="Permitir passar"><span /></button></div></section><section className="settings-panel"><div className="section-heading"><span className="step-index">02</span><div><h2>Escolha as regiões</h2><p>Você pode combinar quantas quiser.</p></div></div><button className="select-all" onClick={selectAll}>{selectedRegions.length === regions.length ? 'Limpar seleção' : 'Selecionar todos'} <span>↗</span></button><div className="region-list">{regions.map((region) => <button key={region.id} className={`region-option ${selectedRegions.includes(region.id) ? 'selected' : ''}`} onClick={() => toggleRegion(region.id)}><span className="region-check">{selectedRegions.includes(region.id) ? '✓' : ''}</span>{region.label}<span className="region-arrow">→</span></button>)}</div>{error && <p className="form-error">{error}</p>}</section></div><button className="primary-button start-button" onClick={submit}>Começar rodada <span>→</span></button></main>;
}
