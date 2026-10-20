import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginScreen({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setError(`Não foi possível entrar: ${loginError.message}`);
        return;
      }

      onLoginSuccess();
    } catch (loginError) {
      setError(`Não foi possível entrar: ${loginError.message || 'erro de conexão.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="create-quiz-page page-enter">
      <div className="game-topbar">
        <button type="button" className="back-link" onClick={onBack}>← Voltar ao início</button>
      </div>
      <div className="create-quiz-heading">
        <p className="eyebrow">ACESSO RESTRITO</p>
        <h1>Entrar na <em>plataforma.</em></h1>
        <p>Entre com as credenciais de um usuário autorizado.</p>
      </div>

      <form className="quiz-editor login-form" onSubmit={handleSubmit}>
        <section className="quiz-editor-section">
          <div className="quiz-form-grid single-column">
            <label className="quiz-field quiz-field-wide">
              <span>E-mail</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="quiz-field quiz-field-wide">
              <span>Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
          </div>
        </section>

        {error && <p className="quiz-form-error" role="alert">{error}</p>}

        <div className="quiz-form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'} <span>→</span>
          </button>
        </div>
      </form>
    </main>
  );
}
