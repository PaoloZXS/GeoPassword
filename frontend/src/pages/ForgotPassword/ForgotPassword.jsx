import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../utils/supabase.js";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=nuova password
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const recoveryCodeRef = useRef("");

  // Step 1: verifica email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Inserisci la tua email");
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("verify_recovery", {
      p_email: email.trim(),
      p_username: username.trim() || ""
    });

    if (rpcError) {
      setError("Errore durante la verifica");
      setLoading(false);
      return;
    }

    if (!data || !data[0]?.success) {
      setError(data?.[0]?.recovery_code || "Verifica fallita");
      setLoading(false);
      return;
    }

    recoveryCodeRef.current = data[0].recovery_code;
    if (data[0].found_username) {
      setUsername(data[0].found_username);
    }
    setStep(2);
    setLoading(false);
  };

  // Step 2: nuova password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 4) {
      setError("La password deve essere almeno 4 caratteri");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Le password non coincidono");
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("reset_password", {
      p_username: username.trim(),
      p_recovery_code: recoveryCodeRef.current,
      p_new_password: newPassword
    });

    if (rpcError || !data) {
      setError("Errore durante il reset");
      setLoading(false);
      return;
    }

    navigate("/login", {
      state: { recoveredUsername: username.trim() },
      replace: true
    });
  };

  return (
    <div className="forgot-container">
      <main className="forgot-main">
        <header className="forgot-header">
          <button
            className="forgot-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
        </header>

        <section className="forgot-brand">
          <div className="forgot-icon-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-[#00e5ff]"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h1 className="forgot-title">Recupero account</h1>
        </section>

        {step === 1 && (
          <>
            <p className="forgot-subtitle">
              Inserisci la tua email di recupero
            </p>
            {error && <p className="forgot-error">{error}</p>}
            <form className="forgot-form" onSubmit={handleVerifyEmail}>
              <div className="input-glass">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white/70 mr-3 shrink-0"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  className="input-field"
                  placeholder="La tua email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </div>
              <div className="input-glass">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white/70 mr-3 shrink-0"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  className="input-field"
                  placeholder="Username (opzionale)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                />
              </div>
              <button type="submit" className="forgot-btn" disabled={loading}>
                {loading ? "VERIFICA..." : "VERIFICA"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className="forgot-subtitle">Scegli una nuova password</p>
            {username && (
              <div className="forgot-account-found">
                Account trovato: <strong>{username}</strong>
              </div>
            )}
            {error && <p className="forgot-error">{error}</p>}
            <form className="forgot-form" onSubmit={handleResetPassword}>
              <div className="input-glass">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white/70 mr-3 shrink-0"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  className="input-field"
                  placeholder="Nuova password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  type="password"
                />
              </div>
              <div className="input-glass">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white/70 mr-3 shrink-0"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  className="input-field"
                  placeholder="Conferma password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  type="password"
                />
              </div>
              <button type="submit" className="forgot-btn" disabled={loading}>
                {loading ? "SALVATAGGIO..." : "REIMPOSTA PASSWORD"}
              </button>
            </form>
          </>
        )}

        <div className="forgot-login-link">
          <p className="text-sm text-white/60">
            <Link to="/login">Torna al Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;
