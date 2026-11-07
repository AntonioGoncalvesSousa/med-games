import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function CreateExternalLinkScreen({ userId, externalLink = null, onBack, onSaved }) {
  const isEditing = Boolean(externalLink);
  const [title, setTitle] = useState(externalLink?.title ?? '');
  const [description, setDescription] = useState(externalLink?.description ?? '');
  const [externalUrl, setExternalUrl] = useState(externalLink?.externalUrl ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    let parsedUrl;
    try {
      parsedUrl = new URL(externalUrl.trim());
    } catch {
      setError('Informe uma URL válida usando http ou https.');
      return;
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setError('A URL deve começar com http:// ou https://.');
      return;
    }

    setSaving(true);

    try {
      if (isEditing) {
        const { data, error: updateError } = await supabase
          .from('quizzes')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            external_url: parsedUrl.toString(),
          })
          .eq('id', externalLink.databaseId)
          .eq('owner_id', userId)
          .select('id')
          .maybeSingle();

        if (updateError) throw new Error(updateError.message);
        if (!data) throw new Error('O link não foi atualizado. Verifique se você ainda tem permissão para editá-lo.');
      } else {
        const { error: insertError } = await supabase.from('quizzes').insert({
          title: title.trim(),
          description: description.trim() || null,
          content_type: 'external_link',
          external_url: parsedUrl.toString(),
          status: 'published',
          owner_id: userId,
          slug: `link-${crypto.randomUUID()}`,
        });

        if (insertError) throw new Error(insertError.message);
      }
      onSaved();
    } catch (submitError) {
      setError(`Não foi possível adicionar o link externo: ${submitError.message || 'erro de conexão.'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="create-quiz-page page-enter">
      <button type="button" className="back-link" onClick={onBack}>← Voltar às opções</button>
      <div className="create-quiz-heading">
        <p className="eyebrow">LINK EXTERNO</p>
        <h1>{isEditing ? 'Editar o ' : 'Adicionar um '}<em>link.</em></h1>
      </div>
      <form className="external-link-form" onSubmit={submit}>
        <label className="quiz-field">
          Título
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={160}
          />
        </label>
        <label className="quiz-field">
          Descrição
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
          />
        </label>
        <label className="quiz-field">
          URL Externa
          <input
            type="url"
            value={externalUrl}
            onChange={(event) => setExternalUrl(event.target.value)}
            placeholder="https://..."
            required
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="quiz-form-actions">
          <button type="button" className="text-button" onClick={onBack}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Adicionar Link'} <span>→</span>
          </button>
        </div>
      </form>
    </main>
  );
}
