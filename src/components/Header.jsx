export default function Header({
  onHome,
  onVisualizations,
  onCreateQuiz,
  onLogin,
  onSignOut,
  isAuthenticated,
  lightTheme,
  onThemeChange,
}) {
  return (
    <header className="app-header">
      <button className="brand" onClick={onHome} aria-label="Voltar ao início">
        <span className="brand-mark">M</span>
        <span>MED<span className="brand-accent">/</span>GAMES</span>
      </button>
      <div className="header-actions">
        <button className="auth-nav-button" onClick={onVisualizations}>Visualizações</button>
        {isAuthenticated ? (
          <>
            <button className="create-quiz-nav" onClick={onCreateQuiz}>+ Criar questionário</button>
            <button className="auth-nav-button" onClick={onSignOut}>Sair</button>
          </>
        ) : (
          <button className="auth-nav-button" onClick={onLogin}>Entrar</button>
        )}
        <label className="theme-control">
          <span>Escuro</span>
          <input type="checkbox" checked={lightTheme} onChange={onThemeChange} aria-label="Alternar entre tema escuro e tema claro" />
          <span className="theme-switch"><i /></span>
          <span>Claro</span>
        </label>
      </div>
    </header>
  );
}
