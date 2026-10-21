import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  return supabase.storage.from('visualizations').getPublicUrl(imagePath).data.publicUrl;
}

export default function VisualizationsScreen({ canCreate, onCreate, onOpen, onEdit }) {
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadVisualizations = async () => {
      const { data, error: fetchError } = await supabase
        .from('structure_visualizations')
        .select('id, title, description, structure_images(id, view_name, image_path, position)');

      if (!isCurrent) return;

      if (fetchError) {
        setError(`Não foi possível carregar as visualizações: ${fetchError.message}`);
      } else {
        setVisualizations((data ?? []).map((visualization) => ({
          ...visualization,
          images: [...(visualization.structure_images ?? [])]
            .sort((first, second) => first.position - second.position),
        })));
      }

      setLoading(false);
    };

    loadVisualizations();
    return () => {
      isCurrent = false;
    };
  }, []);

  const deleteVisualization = async (event, visualization) => {
    event.stopPropagation();
    if (deletingId) return;
    if (!window.confirm(`Excluir "${visualization.title}" e todas as suas vistas e pins? Esta ação não pode ser desfeita.`)) return;

    setDeletingId(visualization.id);
    setActionError('');
    const { error: deleteError } = await supabase
      .from('structure_visualizations')
      .delete()
      .eq('id', visualization.id);

    if (deleteError) {
      setActionError(`Não foi possível excluir "${visualization.title}": ${deleteError.message}`);
      setDeletingId(null);
      return;
    }

    setVisualizations((current) => current.filter((item) => item.id !== visualization.id));
    setDeletingId(null);
    const paths = visualization.images.map((image) => image.image_path).filter(Boolean);
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from('visualizations').remove(paths);
      if (storageError) {
        setActionError(`A visualização foi excluída, mas não foi possível remover os arquivos do Storage: ${storageError.message}`);
      }
    }
  };

  return (
    <main className="visualizations-page page-enter">
      <div className="visualizations-heading">
        <div>
          <p className="eyebrow">ESTUDO INTERATIVO</p>
          <h1>Visualização de <em>Estruturas</em></h1>
          <p>Explore as estruturas anatômicas disponíveis.</p>
        </div>
        {canCreate && (
          <button type="button" className="primary-button" onClick={onCreate}>
            Criar Nova Visualização <span>+</span>
          </button>
        )}
      </div>

      {loading && <p className="created-quizzes-message" role="status">Carregando visualizações...</p>}
      {!loading && error && <p className="created-quizzes-message created-quizzes-error" role="alert">{error}</p>}
      {!loading && !error && visualizations.length === 0 && (
        <p className="created-quizzes-message">Ainda não há visualizações de estruturas.</p>
      )}
      {!loading && !error && visualizations.length > 0 && (
        <div className="visualizations-grid">
          {visualizations.map((visualization) => {
            const coverImage = visualization.images[0];
            const imageUrl = getImageUrl(coverImage?.image_path);

            return (
              <article
                className="visualization-card visualization-card-interactive"
                key={visualization.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(visualization.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  onOpen(visualization.id);
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
                  <h2>{visualization.title}</h2>
                  {visualization.description && <p>{visualization.description}</p>}
                  <small className="visualization-view-count">
                    {visualization.images.length} {visualization.images.length === 1 ? 'vista' : 'vistas'}
                  </small>
                  {canCreate && (
                    <div className="visualization-card-actions">
                      <button
                        type="button"
                        className="text-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(visualization.id);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-button visualization-delete-button"
                        disabled={deletingId === visualization.id}
                        onClick={(event) => deleteVisualization(event, visualization)}
                      >
                        {deletingId === visualization.id ? 'Excluindo…' : 'Excluir'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {actionError && <p className="created-quizzes-message created-quizzes-error" role="alert">{actionError}</p>}
    </main>
  );
}
