import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  return supabase.storage.from('visualizations').getPublicUrl(imagePath).data.publicUrl;
}

export default function VisualizationViewer({ visualizationId, onBack }) {
  const [visualization, setVisualization] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [activePinId, setActivePinId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadVisualization = async () => {
      setLoading(true);
      setError('');

      const { data: record, error: visualizationError } = await supabase
        .from('structure_visualizations')
        .select('id, title, description, structure_images(id, view_name, image_path, position, structure_pins(id, label, x_position, y_position))')
        .eq('id', visualizationId)
        .single();

      if (!isCurrent) return;
      if (visualizationError) {
        setError(`Não foi possível carregar a visualização: ${visualizationError.message}`);
        setVisualization(null);
        setImages([]);
        setLoading(false);
        return;
      }

      setVisualization(record);
      const orderedImages = [...(record.structure_images ?? [])]
        .sort((first, second) => first.position - second.position)
        .map((image) => ({
          ...image,
          pins: image.structure_pins ?? [],
        }));
      setImages(orderedImages);
      setSelectedImageId((currentId) => (
        orderedImages.some((image) => image.id === currentId)
          ? currentId
          : orderedImages[0]?.id ?? null
      ));
      setLoading(false);
    };

    loadVisualization();
    return () => {
      isCurrent = false;
    };
  }, [visualizationId]);

  if (loading) {
    return (
      <main className="visualizations-page page-enter">
        <p className="created-quizzes-message" role="status">Carregando visualização...</p>
      </main>
    );
  }

  if (error || !visualization) {
    return (
      <main className="visualizations-page page-enter">
        <button type="button" className="back-link" onClick={onBack}>← Voltar às visualizações</button>
        <p className="created-quizzes-message created-quizzes-error" role="alert">
          {error || 'A visualização solicitada não foi encontrada.'}
        </p>
      </main>
    );
  }

  const selectedImage = images.find((image) => image.id === selectedImageId);
  const imageUrl = getImageUrl(selectedImage?.image_path);

  return (
    <main className="visualizations-page page-enter">
      <div className="game-topbar visualization-viewer-topbar">
        <button type="button" className="back-link" onClick={onBack}>← Voltar às visualizações</button>
        <p className="progress-copy">VISUALIZAÇÃO INTERATIVA</p>
      </div>

      <header className="visualization-viewer-heading">
        <p className="eyebrow">ESTUDO DE ESTRUTURAS</p>
        <h1>{visualization.title}</h1>
        {visualization.description && <p>{visualization.description}</p>}
        <small>Clique em um marcador ou passe o cursor para revelar o nome da estrutura.</small>
      </header>

      {images.length > 1 && (
        <nav className="visualization-view-tabs" aria-label="Vistas da estrutura">
          {images.map((image) => (
            <button
              type="button"
              key={image.id}
              className={`visualization-view-tab ${selectedImageId === image.id ? 'active' : ''}`}
              aria-pressed={selectedImageId === image.id}
              onClick={() => {
                setSelectedImageId(image.id);
                setActivePinId(null);
              }}
            >
              {image.view_name}
            </button>
          ))}
        </nav>
      )}

      {imageUrl ? (
        <div className="visualization-viewer-canvas">
          <img
            key={selectedImage.id}
            src={imageUrl}
            alt={`${selectedImage?.view_name || 'Vista'}: ${visualization.title}`}
          />
          {(selectedImage?.pins ?? []).map((pin, index) => (
            <button
              type="button"
              key={pin.id}
              className={`visualization-viewer-pin ${activePinId === pin.id ? 'is-active' : ''}`}
              style={{ left: `${pin.x_position}%`, top: `${pin.y_position}%` }}
              aria-label={`Estrutura ${index + 1}: ${pin.label}`}
              aria-pressed={activePinId === pin.id}
              onClick={() => setActivePinId((currentId) => currentId === pin.id ? null : pin.id)}
            >
              <span className="visualization-viewer-pin-dot" aria-hidden="true" />
              <span className="visualization-viewer-pin-label">{pin.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="created-quizzes-message created-quizzes-error" role="alert">
          {images.length ? 'Esta vista não possui uma imagem disponível.' : 'Esta visualização ainda não possui imagens.'}
        </p>
      )}
    </main>
  );
}
