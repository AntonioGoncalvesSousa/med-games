import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const createAnswer = () => ({ id: crypto.randomUUID(), acceptedAnswers: '' });

const createQuestion = (type = 'image_identification') => ({
  id: crypto.randomUUID(),
  type,
  prompt: '',
  imageFile: null,
  imagePreview: '',
  imagePath: '',
  imageAlt: '',
  options: Array(4).fill(''),
  correctOptionIndex: 0,
  answers: [createAnswer()],
});

function questionFromQuiz(quizToEdit) {
  const quiz = quizToEdit?.quiz;
  if (!quiz) return [createQuestion()];

  return [...(quiz.quiz_questions ?? [])]
    .sort((first, second) => first.position - second.position)
    .map((savedQuestion) => {
      const answers = [...(savedQuestion.quiz_answers ?? [])]
        .sort((first, second) => first.position - second.position)
        .map((answer) => ({
          id: crypto.randomUUID(),
          acceptedAnswers: answer.accepted_answers ?? '',
        }));

      const options = Array.isArray(savedQuestion.options) ? savedQuestion.options : Array(4).fill('');
      const correctAnswer = (answers[0]?.acceptedAnswers ?? '').trim();
      const correctOptionIndex = options.findIndex((option) => option.trim() === correctAnswer);

      return {
        id: savedQuestion.id ?? crypto.randomUUID(),
        type: savedQuestion.type ?? 'image_identification',
        prompt: savedQuestion.prompt ?? '',
        imageFile: null,
        imagePreview: savedQuestion.image_path ?? '',
        imagePath: savedQuestion.image_path ?? '',
        imageAlt: savedQuestion.image_alt ?? '',
        options: options.length ? options.map((option) => option ?? '') : Array(4).fill(''),
        correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : 0,
        answers: answers.length ? answers : [createAnswer()],
      };
    });
}

function toSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeAcceptedAnswers(value = '') {
  return [...new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

export default function CreateQuizScreen({ onBack, quizToEdit = null }) {
  const [title, setTitle] = useState(quizToEdit?.quiz?.title ?? '');
  const [description, setDescription] = useState(quizToEdit?.quiz?.description ?? '');
  const [questions, setQuestions] = useState(() => questionFromQuiz(quizToEdit));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateQuestion = (questionId, field, value) => {
    setQuestions((current) => current.map((question) => (
      question.id === questionId ? { ...question, [field]: value } : question
    )));
  };

  const updateQuestionOption = (questionId, optionIndex, value) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId) {
        return question;
      }

      const nextOptions = [...question.options];
      nextOptions[optionIndex] = value;
      return { ...question, options: nextOptions };
    }));
  };

  const updateAnswer = (questionId, answerId, value) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId) {
        return question;
      }

      return {
        ...question,
        answers: question.answers.map((answer) => (
          answer.id === answerId ? { ...answer, acceptedAnswers: value } : answer
        )),
      };
    }));
  };

  const addAnswer = (questionId) => {
    setQuestions((current) => current.map((question) => (
      question.id === questionId
        ? { ...question, answers: [...question.answers, createAnswer()] }
        : question
    )));
  };

  const removeAnswer = (questionId, answerId) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId) {
        return question;
      }

      return {
        ...question,
        answers: question.answers.length > 1
          ? question.answers.filter((answer) => answer.id !== answerId)
          : question.answers,
      };
    }));
  };

  const addQuestion = () => {
    setQuestions((current) => [...current, createQuestion(current.at(-1)?.type ?? 'image_identification')]);
  };

  const removeQuestion = (questionId) => {
    setQuestions((current) => (
      current.length > 1 ? current.filter((question) => question.id !== questionId) : current
    ));
  };

  const handleImageChange = (questionId, event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setQuestions((current) => current.map((question) => (
      question.id === questionId
        ? {
            ...question,
            imageFile: file,
            imagePreview: previewUrl,
            imageAlt: question.imageAlt || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
          }
        : question
    )));
  };

  const createAnother = () => {
    setTitle('');
    setDescription('');
    setQuestions([createQuestion()]);
    setError('');
    setSaved(false);
  };

  const saveQuiz = async (event) => {
    event.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Informe o título do questionário antes de salvar.');
      return;
    }

    if (!questions.length) {
      setError('Adicione pelo menos uma pergunta para criar o questionário.');
      return;
    }

    setSaving(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error('Você precisa estar autenticado para criar questionários.');
      }

      const preparedQuestions = [];

      for (const [questionIndex, question] of questions.entries()) {
        const promptValue = (question.prompt || 'Identifique essa estrutura').trim();
        const imageAltValue = (question.imageAlt || 'Imagem do questionário').trim() || 'Imagem do questionário';

        if (question.type === 'image_identification' && !question.imageFile && !question.imagePath) {
          throw new Error(`Selecione uma imagem para a pergunta ${questionIndex + 1}.`);
        }

        let imagePath = question.imagePath || null;
        if (question.type === 'image_identification' && question.imageFile) {
          const fileExtension = question.imageFile.name.split('.').pop() || 'png';
          const storageFileName = `${Date.now()}-${questionIndex + 1}.${fileExtension}`;
          const storagePath = `${userData.user.id}/${storageFileName}`;
          const { data: uploadedFile, error: uploadError } = await supabase.storage
            .from('quiz-images')
            .upload(storagePath, question.imageFile, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            throw new Error(`Não foi possível enviar a imagem da pergunta ${questionIndex + 1}: ${uploadError.message}. Verifique as permissões do bucket "quiz-images" executando supabase/quiz-image-storage.sql no Supabase SQL Editor.`);
          }

          const { data: publicUrlData } = supabase.storage
            .from('quiz-images')
            .getPublicUrl(uploadedFile.path);
          imagePath = publicUrlData.publicUrl;
        }

        if (question.type === 'open_text' || question.type === 'image_identification') {
          const cleanedAnswers = question.answers.map((answer) => normalizeAcceptedAnswers(answer.acceptedAnswers));

          if (!cleanedAnswers.some((entries) => entries.length > 0)) {
            throw new Error(`Adicione pelo menos uma resposta válida para a pergunta ${questionIndex + 1}.`);
          }

          preparedQuestions.push({
            questionIndex,
            type: question.type,
            prompt: promptValue,
            imagePath: question.type === 'open_text' ? null : imagePath,
            imageAlt: question.type === 'open_text' ? null : imageAltValue,
            options: null,
            answerValues: cleanedAnswers
              .map((acceptedAnswers) => acceptedAnswers.join(', '))
              .filter(Boolean),
          });
          continue;
        }

        const optionValues = question.options.map((option) => option.trim()).filter(Boolean);
        if (optionValues.length < 2) {
          throw new Error(`Preencha pelo menos 2 alternativas para a pergunta ${questionIndex + 1}.`);
        }

        if (question.correctOptionIndex < 0 || question.correctOptionIndex >= question.options.length) {
          throw new Error(`Selecione a alternativa correta da pergunta ${questionIndex + 1}.`);
        }

        const correctOption = question.options[question.correctOptionIndex]?.trim();
        if (!correctOption) {
          throw new Error(`Selecione a alternativa correta da pergunta ${questionIndex + 1}.`);
        }

        preparedQuestions.push({
          questionIndex,
          type: question.type,
          prompt: promptValue,
          imagePath: null,
          imageAlt: null,
          options: question.options,
          answerValues: [correctOption],
        });
      }

      const quizValues = {
        title: title.trim(),
        description: description.trim() || null,
      };
      const isEditingExistingQuiz = Boolean(quizToEdit?.quiz?.id);
      const quizRequest = isEditingExistingQuiz
        ? supabase.from('quizzes').update(quizValues).eq('id', quizToEdit.quiz.id)
        : supabase.from('quizzes').insert({
            ...quizValues,
            owner_id: userData.user.id,
            slug: `${toSlug(title || 'questionario')}-${crypto.randomUUID().slice(0, 8)}`,
          });
      const { data: quizRecord, error: quizSaveError } = await quizRequest.select().single();

      if (quizSaveError) {
        throw new Error(`Não foi possível ${isEditingExistingQuiz ? 'atualizar' : 'salvar'} o questionário: ${quizSaveError.message}`);
      }

      if (isEditingExistingQuiz) {
        const { error: deleteQuestionsError } = await supabase
          .from('quiz_questions')
          .delete()
          .eq('quiz_id', quizRecord.id);
        if (deleteQuestionsError) {
          throw new Error(`O questionário foi atualizado, mas não foi possível substituir as perguntas: ${deleteQuestionsError.message}`);
        }
      }

      const questionRows = preparedQuestions.map(({ questionIndex, type, prompt, imagePath, imageAlt, options }) => ({
        quiz_id: quizRecord.id,
        position: questionIndex + 1,
        type,
        prompt,
        image_path: imagePath,
        image_alt: imageAlt,
        options: options ? options : null,
      }));
      const { data: savedQuestions, error: questionsInsertError } = await supabase
        .from('quiz_questions')
        .insert(questionRows)
        .select('id, position');

      if (questionsInsertError) {
        throw new Error(`Não foi possível salvar as perguntas: ${questionsInsertError.message}`);
      }
      if (!savedQuestions?.length) {
        throw new Error('O questionário foi salvo, mas o banco não retornou as perguntas criadas.');
      }

      const answerRows = savedQuestions.flatMap((savedQuestion) => (
        preparedQuestions[savedQuestion.position - 1].answerValues.map((acceptedAnswers, answerIndex) => ({
          question_id: savedQuestion.id,
          position: answerIndex + 1,
          accepted_answers: acceptedAnswers,
        }))
      ));
      const { error: answersInsertError } = await supabase.from('quiz_answers').insert(answerRows);
      if (answersInsertError) {
        throw new Error(`As perguntas foram salvas, mas não foi possível salvar as respostas: ${answersInsertError.message}`);
      }

      setSaved(true);
      return [quizRecord.id];
    } catch (saveError) {
      setError(saveError.message || 'Ocorreu um erro inesperado ao salvar.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <main className="create-quiz-page page-enter">
        <button className="back-link" onClick={onBack}>← Voltar ao início</button>
        <section className="quiz-saved-panel" role="status">
          <p className="eyebrow">{quizToEdit ? 'Questionário atualizado' : 'Questionário salvo'}</p>
          <h1>Pronto para <em>ensinar.</em></h1>
          <p>“{title.trim()}” foi {quizToEdit ? 'atualizado' : 'salvo'} no Supabase.</p>
          <div className="button-row">
            <button className="primary-button" onClick={onBack}>Voltar ao início <span>→</span></button>
            {!quizToEdit && <button className="text-button" onClick={createAnother}>Criar outro</button>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="create-quiz-page page-enter">
      <div className="game-topbar">
        <button className="back-link" onClick={onBack}>← Voltar ao início</button>
        <p className="progress-copy">{quizToEdit ? 'EDITAR QUESTIONÁRIO' : 'NOVO QUESTIONÁRIO'}</p>
      </div>
      <div className="create-quiz-heading">
        <p className="eyebrow">Construtor de conteúdo</p>
        <h1>{quizToEdit ? <>Edite seu <em>questionário.</em></> : <>Crie um novo <em>questionário.</em></>}</h1>
        <p>Defina o título, a descrição e as perguntas com imagem e respostas aceitas.</p>
      </div>

      <form className="quiz-editor" onSubmit={saveQuiz}>
        <section className="quiz-editor-section">
          <div className="section-heading">
            <span className="step-index">01</span>
            <div>
              <h2>Informações principais</h2>
              <p>Comece com o título e a descrição do questionário.</p>
            </div>
          </div>

          <div className="quiz-form-grid single-column">
            <label className="quiz-field quiz-field-wide">
              <span>Título</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={120}
                placeholder="Ex.: Anatomia da cavidade oral"
              />
            </label>
            <label className="quiz-field quiz-field-wide">
              <span>Descrição <small>(opcional)</small></span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Descreva o contexto ou a finalidade do questionário"
              />
            </label>
          </div>
        </section>

        <section className="quiz-editor-section">
          <div className="section-heading">
            <span className="step-index">02</span>
            <div>
              <h2>Perguntas</h2>
              <p>Adicione uma pergunta, a imagem e as respostas aceitas.</p>
            </div>
          </div>

          <div className="quiz-question-list">
            {questions.map((question, questionIndex) => (
              <div className="quiz-question-card" key={question.id}>
                <div className="quiz-question-header">
                  <span className="quiz-answer-number">Pergunta {questionIndex + 1}</span>
                  {questions.length > 1 && (
                    <button type="button" className="remove-answer-button" onClick={() => removeQuestion(question.id)} aria-label={`Remover pergunta ${questionIndex + 1}`}>
                      ×
                    </button>
                  )}
                </div>

                <div className="quiz-form-grid">
                  <label className="quiz-field quiz-field-wide">
                    <span>Tipo da pergunta</span>
                    <select
                      value={question.type}
                      onChange={(event) => updateQuestion(question.id, 'type', event.target.value)}
                    >
                      <option value="image_identification">Identificação por imagem</option>
                      <option value="open_text">Resposta aberta</option>
                      <option value="multiple_choice">Múltipla escolha</option>
                    </select>
                  </label>
                  <label className="quiz-field quiz-field-wide">
                    <span>Pergunta</span>
                    <textarea
                      value={question.prompt}
                      onChange={(event) => updateQuestion(question.id, 'prompt', event.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder={question.type === 'multiple_choice' ? 'Ex.: Qual estrutura é esta?' : 'Identifique essa estrutura'}
                    />
                  </label>
                </div>

                {question.type === 'image_identification' && (
                  <div className="question-media-grid">
                    <label className="quiz-field quiz-field-wide image-upload-box">
                      <span>Imagem da pergunta</span>
                      <input type="file" accept="image/*" onChange={(event) => handleImageChange(question.id, event)} />
                      {question.imagePreview ? (
                        <img src={question.imagePreview} alt={question.imageAlt || 'Prévia da imagem'} className="question-preview" />
                      ) : (
                        <span className="image-upload-placeholder">Selecione uma imagem da sua máquina</span>
                      )}
                      {question.imagePath && !question.imageFile && <small>Selecione outra imagem para substituir a atual.</small>}
                    </label>

                    <label className="quiz-field quiz-field-wide">
                      <span>Texto alternativo da imagem</span>
                      <input
                        value={question.imageAlt}
                        onChange={(event) => updateQuestion(question.id, 'imageAlt', event.target.value)}
                        maxLength={250}
                        placeholder="Descreva a imagem"
                      />
                    </label>
                  </div>
                )}

                {question.type === 'multiple_choice' && (
                  <div className="multiple-choice-grid">
                    {question.options.map((option, optionIndex) => (
                      <div className="multiple-choice-option" key={`${question.id}-option-${optionIndex}`}>
                        <label className="quiz-field quiz-field-wide">
                          <span>Alternativa {optionIndex + 1}</span>
                          <input
                            value={option}
                            onChange={(event) => updateQuestionOption(question.id, optionIndex, event.target.value)}
                            placeholder={`Alternativa ${optionIndex + 1}`}
                          />
                        </label>
                        <input
                          type="radio"
                          name={`correct-option-${question.id}`}
                          checked={question.correctOptionIndex === optionIndex}
                          onChange={() => updateQuestion(question.id, 'correctOptionIndex', optionIndex)}
                          aria-label={`Marcar alternativa ${optionIndex + 1} como correta`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {question.type !== 'multiple_choice' && (
                  <>
                    <div className="quiz-answer-editor">
                      {question.answers.map((answer, answerIndex) => (
                        <div className="quiz-answer-row" key={answer.id}>
                          <span className="quiz-answer-number">{String(answerIndex + 1).padStart(2, '0')}</span>
                          <label className="quiz-field quiz-field-wide">
                            <span>Respostas aceitas <small>(separadas por vírgula)</small></span>
                            <input
                              value={answer.acceptedAnswers}
                              onChange={(event) => updateAnswer(question.id, answer.id, event.target.value)}
                              placeholder="Ex.: palato duro, palato ósseo, palato"
                            />
                          </label>
                          {question.answers.length > 1 && (
                            <button type="button" className="remove-answer-button" onClick={() => removeAnswer(question.id, answer.id)} aria-label={`Remover resposta ${answerIndex + 1}`}>
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button type="button" className="add-answer-button" onClick={() => addAnswer(question.id)}>
                      + Adicionar outra resposta
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <button type="button" className="secondary-button" onClick={addQuestion}>
            + Adicionar outra pergunta
          </button>
        </section>

        {error && <p className="quiz-form-error" role="alert">{error}</p>}

        <div className="quiz-form-actions">
          <button type="button" className="text-button muted" onClick={onBack}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? (quizToEdit ? 'Atualizando…' : 'Salvando…') : (quizToEdit ? 'Salvar alterações' : 'Salvar questionário')} <span>→</span>
          </button>
        </div>
      </form>
    </main>
  );
}
