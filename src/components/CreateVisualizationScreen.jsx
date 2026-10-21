import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const createView = () => ({
  id: crypto.randomUUID(),
  viewName: '',
  imageFile: null,
  imagePreview: '',
  imagePath: null,
  pins: [],
  originalPinIds: [],
});

function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return supabase.storage.from('visualizations').getPublicUrl(imagePath).data.publicUrl;
}

export default function CreateVisualizationScreen({ onBack, onSaved, visualizationId = null }) {
  const isEditing = Boolean(visualizationId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [views, setViews] = useState([createView()]);
  const [originalImages, setOriginalImages] = useState([]);
  const [pendingPin, setPendingPin] = useState(null);
  const [pinLabel, setPinLabel] = useState('');
  const [pinDialogError, setPinDialogError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const previewUrls = useRef(new Set());

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  useEffect(() => {
    if (!visualizationId) return undefined;
    let isCurrent = true;

    const loadVisualization = async () => {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('structure_visualizations')
        .select('id, title, description, structure_images(id, view_name, image_path, position, structure_pins(id, label, x_position, y_position))')
        .eq('id', visualizationId)
        .single();

      if (!isCurrent) return;
      if (fetchError) {
        setError(`Não foi possível carregar a visualização para edição: ${fetchError.message}`);
        setLoadFailed(true);
        setLoading(false);
        return;
      }

      const images = [...(data.structure_images ?? [])]
        .sort((first, second) => first.position - second.position);
      setTitle(data.title ?? '');
      setDescription(data.description ?? '');
      setOriginalImages(images.map((image) => ({
        id: image.id,
        imagePath: image.image_path,
      })));
      setViews(images.map((image) => {
        const pins = (image.structure_pins ?? []).map((pin) => ({
          id: pin.id,
          label: pin.label,
          x_position: Number(pin.x_position),
          y_position: Number(pin.y_position),
        }));
        return {
          id: image.id,
          viewName: image.view_name ?? '',
          imageFile: null,
          imagePreview: getImageUrl(image.image_path),
          imagePath: image.image_path,
          pins,
          originalPinIds: pins.map((pin) => pin.id),
        };
      }));
      if (images.length === 0) setViews([]);
      setLoading(false);
    };

    loadVisualization();
    return () => {
      isCurrent = false;
    };
  }, [visualizationId]);

  const updateView = (viewId, updates) => {
    setViews((currentViews) => currentViews.map((view) => (
      view.id === viewId ? { ...view, ...updates } : view
    )));
  };

  const addView = () => setViews((currentViews) => [...currentViews, createView()]);

  const removeView = (viewId) => {
    setViews((currentViews) => {
      const view = currentViews.find((item) => item.id === viewId);
      if (view?.imagePreview && previewUrls.current.has(view.imagePreview)) {
        URL.revokeObjectURL(view.imagePreview);
        previewUrls.current.delete(view.imagePreview);
      }
      return currentViews.filter((item) => item.id !== viewId);
    });
    setPendingPin((currentPin) => currentPin?.viewId === viewId ? null : currentPin);
  };

  const handleImageChange = (viewId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const currentView = views.find((view) => view.id === viewId);
    if (currentView?.imagePreview && previewUrls.current.has(currentView.imagePreview)) {
      URL.revokeObjectURL(currentView.imagePreview);
      previewUrls.current.delete(currentView.imagePreview);
    }

    const imagePreview = URL.createObjectURL(file);
    previewUrls.current.add(imagePreview);
    updateView(viewId, { imageFile: file, imagePreview });
    setPendingPin(null);
    setError('');
  };

  const handleImageClick = (viewId, event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const x = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
    setPendingPin({ viewId, x, y, pinId: null });
    setPinLabel('');
    setPinDialogError('');
  };

  const openPinEditor = (event, viewId, pin) => {
    event.stopPropagation();
    setPendingPin({ viewId, pinId: pin.id });
    setPinLabel(pin.label);
    setPinDialogError('');
  };

  const savePinLabel = (event) => {
    event.preventDefault();
    const label = pinLabel.trim();
    if (!label || !pendingPin) return;

    if (pendingPin.pinId) {
      setViews((currentViews) => currentViews.map((view) => (
        view.id === pendingPin.viewId
          ? { ...view, pins: view.pins.map((pin) => pin.id === pendingPin.pinId ? { ...pin, label } : pin) }
          : view
      )));
    } else {
      setViews((currentViews) => currentViews.map((view) => (
        view.id === pendingPin.viewId
          ? {
              ...view,
              pins: [...view.pins, {
                id: crypto.randomUUID(),
                label,
                x_position: Number(pendingPin.x.toFixed(2)),
                y_position: Number(pendingPin.y.toFixed(2)),
              }],
            }
          : view
      )));
    }
    setPendingPin(null);
    setPinLabel('');
  };

  const deletePinFromDialog = () => {
    if (!pendingPin?.pinId) return;
    setViews((currentViews) => currentViews.map((view) => (
      view.id === pendingPin.viewId
        ? { ...view, pins: view.pins.filter((pin) => pin.id !== pendingPin.pinId) }
        : view
    )));
    setPendingPin(null);
    setPinLabel('');
  };

  const saveVisualization = async (event) => {
    event.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Informe o título da visualização.');
      return;
    }
    if (!views.length) {
      setError('Adicione pelo menos uma vista.');
      return;
    }
    const invalidViewIndex = views.findIndex((view) => !view.viewName.trim() || (!view.imageFile && !view.imagePath));
    if (invalidViewIndex >= 0) {
      setError(`Informe o nome e selecione a imagem da Vista ${invalidViewIndex + 1}.`);
      return;
    }

    setSaving(true);
    let currentVisualizationId = visualizationId;
    const uploadedPaths = [];
    const committedUploadPaths = new Set();
    const oldImagePathsToRemove = [];
    let changesApplied = false;

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Não foi possível verificar a sessão: ${userError.message}`);
      if (!userData?.user) throw new Error('É necessário entrar como administrador para salvar uma visualização.');

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('structure_visualizations')
          .update({ title: title.trim(), description: description.trim() || null })
          .eq('id', visualizationId);
        if (updateError) throw new Error(`Não foi possível atualizar a visualização: ${updateError.message}`);
      } else {
        const { data: visualization, error: insertError } = await supabase
          .from('structure_visualizations')
          .insert({ title: title.trim(), description: description.trim() || null })
          .select('id')
          .single();
        if (insertError) throw new Error(`Não foi possível salvar a visualização: ${insertError.message}`);
        currentVisualizationId = visualization.id;
      }
      changesApplied = true;

      for (const [index, view] of views.entries()) {
        let imageId = view.id;
        let imagePath = view.imagePath;
        const previousPath = view.imagePath;

        if (view.imageFile) {
          const fileExtension = view.imageFile.name.split('.').pop()?.toLowerCase() || 'png';
          imagePath = `${userData.user.id}/${crypto.randomUUID()}.${fileExtension}`;
          const { error: uploadError } = await supabase.storage
            .from('visualizations')
            .upload(imagePath, view.imageFile, { cacheControl: '3600', upsert: false });
          if (uploadError) throw new Error(`Não foi possível enviar a imagem da vista "${view.viewName}": ${uploadError.message}`);
          uploadedPaths.push(imagePath);
        }

        if (originalImages.some((image) => image.id === view.id)) {
          const { error: imageUpdateError } = await supabase
            .from('structure_images')
            .update({
              view_name: view.viewName.trim(),
              image_path: imagePath,
              position: index + 1,
            })
            .eq('id', view.id);
          if (imageUpdateError) throw new Error(`Não foi possível atualizar a vista "${view.viewName}": ${imageUpdateError.message}`);
          if (view.imageFile && previousPath) oldImagePathsToRemove.push(previousPath);
        } else {
          const { data: savedImage, error: imageInsertError } = await supabase
            .from('structure_images')
            .insert({
              visualization_id: currentVisualizationId,
              view_name: view.viewName.trim(),
              image_path: imagePath,
              position: index + 1,
            })
            .select('id')
            .single();
          if (imageInsertError) throw new Error(`Não foi possível salvar a vista "${view.viewName}": ${imageInsertError.message}`);
          imageId = savedImage.id;
        }

        if (view.imageFile) committedUploadPaths.add(imagePath);

        const currentPinIds = new Set(view.pins.map((pin) => pin.id));
        const removedPinIds = view.originalPinIds.filter((pinId) => !currentPinIds.has(pinId));
        if (removedPinIds.length > 0) {
          const { error: pinDeleteError } = await supabase
            .from('structure_pins')
            .delete()
            .in('id', removedPinIds);
          if (pinDeleteError) throw new Error(`Não foi possível excluir pins da vista "${view.viewName}": ${pinDeleteError.message}`);
        }

        if (view.pins.length > 0) {
          const pinRows = view.pins.map(({ id, label, x_position, y_position }) => ({
            id,
            image_id: imageId,
            label,
            x_position,
            y_position,
          }));
          const { error: pinUpsertError } = await supabase
            .from('structure_pins')
            .upsert(pinRows);
          if (pinUpsertError) throw new Error(`Não foi possível sincronizar pins da vista "${view.viewName}": ${pinUpsertError.message}`);
        }
      }

      const retainedImageIds = new Set(views.filter((view) => originalImages.some((image) => image.id === view.id)).map((view) => view.id));
      const removedImages = originalImages.filter((image) => !retainedImageIds.has(image.id));
      for (const image of removedImages) {
        const { error: imageDeleteError } = await supabase
          .from('structure_images')
          .delete()
          .eq('id', image.id);
        if (imageDeleteError) throw new Error(`Não foi possível excluir uma vista removida: ${imageDeleteError.message}`);
        if (image.imagePath) oldImagePathsToRemove.push(image.imagePath);
      }

      if (oldImagePathsToRemove.length > 0) {
        const uniqueOldPaths = [...new Set(oldImagePathsToRemove)];
        const { error: oldFilesError } = await supabase.storage
          .from('visualizations')
          .remove(uniqueOldPaths);
        if (oldFilesError) {
          throw new Error(`Os dados foram sincronizados, mas não foi possível excluir imagens antigas: ${oldFilesError.message}`);
        }
      }

      setSaved(true);
    } catch (saveError) {
      let message = saveError.message || 'Ocorreu um erro inesperado ao salvar.';
      const createdVisualization = !isEditing && currentVisualizationId;
      if (createdVisualization) {
        const { error: rollbackError } = await supabase
          .from('structure_visualizations')
          .delete()
          .eq('id', currentVisualizationId);
        if (rollbackError) {
          message += ` Não foi possível remover o registro parcial: ${rollbackError.message}`;
        }
      }

      const pathsToCleanup = createdVisualization
        ? uploadedPaths
        : uploadedPaths.filter((path) => !committedUploadPaths.has(path));
      if (pathsToCleanup.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from('visualizations')
          .remove(pathsToCleanup);
        if (cleanupError) message += ` Não foi possível remover imagens temporárias: ${cleanupError.message}`;
      }
      if (changesApplied) {
        if (isEditing) message += ' Algumas alterações anteriores ao erro podem já ter sido aplicadas.';
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const pinCount = views.reduce((total, view) => total + view.pins.length, 0);

  if (loading) {
    return (
      <main className="visualizations-page page-enter">
        <p className="created-quizzes-message" role="status">Carregando visualização...</p>
      </main>
    );
  }

  if (loadFailed) {
    return (
      <main className="visualizations-page page-enter">
        <button type="button" className="back-link" onClick={onBack}>← Voltar às visualizações</button>
        <p className="created-quizzes-message created-quizzes-error" role="alert">{error}</p>
      </main>
    );
  }

  if (saved) {
    return (
      <main className="visualizations-page page-enter">
        <section className="quiz-saved-panel" role="status">
          <p className="eyebrow">{isEditing ? 'Visualização atualizada' : 'Visualização salva'}</p>
          <h1>Pronta para <em>explorar.</em></h1>
          <p>“{title.trim()}” foi {isEditing ? 'atualizada' : 'salva'} com {views.length} {views.length === 1 ? 'vista' : 'vistas'} e {pinCount} {pinCount === 1 ? 'pin' : 'pins'}.</p>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={onSaved}>Voltar às visualizações <span>→</span></button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="visualizations-page page-enter">
      <div className="game-topbar">
        <button type="button" className="back-link" onClick={onBack}>← Voltar às visualizações</button>
        <p className="progress-copy">{isEditing ? 'EDITAR VISUALIZAÇÃO' : 'NOVA VISUALIZAÇÃO'}</p>
      </div>

      <div className="create-quiz-heading">
        <p className="eyebrow">CONSTRUTOR DE ESTRUTURAS</p>
        <h1>{isEditing ? <>Edite a <em>visualização.</em></> : <>Crie uma <em>visualização.</em></>}</h1>
        <p>Gerencie as vistas e marque nelas as estruturas que deseja identificar.</p>
      </div>

      <form className="quiz-editor" onSubmit={saveVisualization}>
        <section className="quiz-editor-section">
          <div className="quiz-form-grid single-column">
            <label className="quiz-field quiz-field-wide">
              <span>Título</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
                placeholder="Ex.: Fígado"
              />
            </label>
            <label className="quiz-field quiz-field-wide">
              <span>Descrição <small>(opcional)</small></span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Descreva o conteúdo desta visualização"
              />
            </label>
          </div>
        </section>

        <section className="quiz-editor-section">
          <div className="section-heading">
            <span className="step-index">01</span>
            <div>
              <h2>Vistas da estrutura</h2>
              <p>Adicione, remova ou atualize as imagens e seus pins.</p>
            </div>
          </div>

          <div className="visualization-view-editor-list">
            {views.map((view, viewIndex) => (
              <article className="visualization-view-editor" key={view.id}>
                <div className="visualization-view-editor-heading">
                  <span className="quiz-answer-number">Vista {String(viewIndex + 1).padStart(2, '0')}</span>
                  <button
                    type="button"
                    className="remove-answer-button"
                    onClick={() => removeView(view.id)}
                    aria-label={`Remover vista ${viewIndex + 1}`}
                    disabled={views.length === 1}
                    title={views.length === 1 ? 'A visualização precisa ter pelo menos uma vista.' : 'Remover vista'}
                  >
                    ×
                  </button>
                </div>
                <div className="quiz-form-grid single-column">
                  <label className="quiz-field quiz-field-wide">
                    <span>Nome da vista</span>
                    <input
                      value={view.viewName}
                      onChange={(event) => updateView(view.id, { viewName: event.target.value })}
                      maxLength={120}
                      required
                      placeholder="Ex.: Vista anterior"
                    />
                  </label>
                  <label className="quiz-field quiz-field-wide image-upload-box">
                    <span>{view.imagePath ? 'Substituir imagem (opcional)' : 'Imagem da vista'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleImageChange(view.id, event)}
                      required={!view.imagePath}
                    />
                  </label>
                </div>

                {view.imagePreview && (
                  <>
                    <p className="visualization-pin-hint">Clique na imagem para adicionar pins. Clique em um pin para editar ou excluir.</p>
                    <div className="visualization-pin-canvas">
                      <img
                        src={view.imagePreview}
                        alt={`Pré-visualização da ${view.viewName || `vista ${viewIndex + 1}`}`}
                        onClick={(event) => handleImageClick(view.id, event)}
                      />
                      {view.pins.map((pin, pinIndex) => (
                        <button
                          type="button"
                          className="visualization-pin-marker"
                          key={pin.id}
                          style={{ left: `${pin.x_position}%`, top: `${pin.y_position}%` }}
                          title={`${pin.label} — clique para editar`}
                          aria-label={`Editar pin ${pinIndex + 1}: ${pin.label}`}
                          onClick={(event) => openPinEditor(event, view.id, pin)}
                        >
                          <span>{pinIndex + 1}</span>
                          <strong>{pin.label}</strong>
                        </button>
                      ))}
                    </div>
                    <p className="visualization-pin-hint">
                      {view.pins.length} {view.pins.length === 1 ? 'pin' : 'pins'} nesta vista.
                    </p>
                  </>
                )}
              </article>
            ))}
          </div>

          <button type="button" className="secondary-button visualization-add-view" onClick={addView}>
            + Adicionar Nova Vista
          </button>
        </section>

        {error && <p className="quiz-form-error" role="alert">{error}</p>}
        <div className="quiz-form-actions">
          <button type="button" className="text-button muted" onClick={onBack}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? (isEditing ? 'Atualizando…' : 'Salvando…') : (isEditing ? 'Salvar alterações' : 'Salvar Visualização')} <span>→</span>
          </button>
        </div>
      </form>

      {pendingPin && (
        <div className="visualization-modal-backdrop" role="presentation">
          <form
            className="visualization-pin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="visualization-pin-title"
            onSubmit={savePinLabel}
          >
            <h2 id="visualization-pin-title">{pendingPin.pinId ? 'Editar estrutura' : 'Nova estrutura'}</h2>
            <p>{pendingPin.pinId ? 'Altere o nome do pin ou exclua este marcador.' : 'Informe o nome que será associado a este ponto da imagem.'}</p>
            <label className="quiz-field">
              <span>Estrutura</span>
              <input
                autoFocus
                value={pinLabel}
                onChange={(event) => {
                  setPinLabel(event.target.value);
                  setPinDialogError('');
                }}
                maxLength={120}
                required
                placeholder="Ex.: Glabela"
              />
            </label>
            {pinDialogError && <p className="quiz-form-error" role="alert">{pinDialogError}</p>}
            <div className="button-row">
              {pendingPin.pinId && (
                <button type="button" className="text-button visualization-delete-pin" onClick={deletePinFromDialog}>
                  Excluir pin
                </button>
              )}
              <button type="button" className="text-button muted" onClick={() => setPendingPin(null)}>Cancelar</button>
              <button type="submit" className="primary-button">
                {pendingPin.pinId ? 'Salvar nome' : 'Adicionar pin'} <span>{pendingPin.pinId ? '✓' : '+'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
