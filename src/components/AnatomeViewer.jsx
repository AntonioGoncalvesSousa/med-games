import { useEffect, useState } from 'react';

const API_URL = 'https://api.anatome.dev/generateImage';

export default function AnatomeViewer({ structure }) {
  const [loaded, setLoaded] = useState(false);
  const imageUrl = `${API_URL}?gender=male&view=dual&body_color=%232b3333&background=%23182321&layers=E4775A:${encodeURIComponent(structure.anatomeSlug)}&output=raw`;

  useEffect(() => setLoaded(false), [structure]);

  return (
    <div className="viewer-shell anatome-viewer">
      <img className={`anatome-image ${loaded ? 'loaded' : ''}`} src={imageUrl} alt={`Diagrama Anatome com ${structure.nome} destacado`} onLoad={() => setLoaded(true)} />
      <div className="viewer-badge"><span className="live-dot" /> Anatome.dev · SVG remoto</div>
      {!loaded && <div className="viewer-note loading-note">O diagrama do Anatome está carregando.</div>}
      <div className="viewer-hint">Diagrama anatômico · fonte Anatome</div>
    </div>
  );
}