import { supabase } from '../lib/supabaseClient';

const contentTypes = {
  quiz: { label: 'Questionário', icon: '◍', action: 'Jogar agora' },
  visualization: { label: 'Visualização', icon: '◉', action: 'Explorar agora' },
  external_link: { label: 'Link Externo', icon: '↗', action: 'Abrir link' },
};

export default function ContentCard({ item, onOpen, loading = false }) {
  const contentType = contentTypes[item.type];
  if (!contentType) return null;

  const openItem = () => {
    if (loading) return;
    if (item.type === 'external_link') {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onOpen(item);
  };

  if (item.type === 'visualization') {
    const coverImage = item.images?.[0];
    const imagePath = coverImage?.image_path;
    const imageUrl = !imagePath
      ? ''
      : /^https?:\/\//i.test(imagePath)
        ? imagePath
        : supabase.storage.from('visualizations').getPublicUrl(imagePath).data.publicUrl;

    return (
      <article
        className="visualization-card visualization-card-interactive"
        role="button"
        tabIndex={0}
        aria-disabled={loading}
        onClick={openItem}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          openItem();
        }}
      >
        {imageUrl ? (
          <img
            className="visualization-card-image"
            src={imageUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="visualization-card-image visualization-card-placeholder" aria-hidden="true">
            <span>MED/GAMES</span>
          </div>
        )}
        <div className="visualization-card-copy">
          <h2>{item.title}</h2>
          {item.description && <p>{item.description}</p>}
          <small className="visualization-view-count">
            {item.images?.length ?? 0} {(item.images?.length ?? 0) === 1 ? 'vista' : 'vistas'}
          </small>
        </div>
      </article>
    );
  }

  return (
    <article
      className="game-card interactive-game-card feed-card"
      role="button"
      tabIndex={0}
      aria-disabled={loading}
      onClick={openItem}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openItem();
      }}
    >
      <div className="card-top">
        <span className="game-icon" aria-hidden="true">{contentType.icon}</span>
        <span className={`content-type-badge content-type-${item.type}`}>
          {contentType.label}
        </span>
      </div>
      <div className="feed-card-copy">
        <h3 className="feed-card-title">
          {item.title}
          {item.type === 'external_link' && (
            <svg
              className="external-link-icon"
              viewBox="0 0 16 16"
              aria-label="Abre fora da plataforma em uma nova aba"
              role="img"
            >
              <path d="M9 2h5v5h-1.5V4.56l-6.97 6.97-1.06-1.06 6.97-6.97H9V2Z" fill="currentColor" />
              <path d="M12.5 9v4.5h-9v-9H8V3H3.5C2.67 3 2 3.67 2 4.5v9c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5V9h-1.5Z" fill="currentColor" />
            </svg>
          )}
        </h3>
        <p>{item.description || (item.type === 'quiz' ? 'Questionário de identificação anatômica.' : contentType.label)}</p>
      </div>
      <div className="card-link">
        <span>{loading ? 'Carregando...' : contentType.action}</span>
        <span aria-hidden="true">↗</span>
      </div>
    </article>
  );
}
