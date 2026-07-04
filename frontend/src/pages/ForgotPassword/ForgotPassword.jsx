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
      <div className="forgot-card">
        <h1 className="forgot-title">GeoPassword</h1>

        {step === 1 && (
          <>
            <p className="forgot-subtitle">Recupero account</p>
            {error && <p className="forgot-error">{error}</p>}
            <form className="forgot-form" onSubmit={handleVerifyEmail}>
              <div className="form-group">
                <label htmlFor="email">Email di recupero</label>
                <input
                  type="email"
                  id="email"
                  placeholder="La tua email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">
                  Username <span className="optional">(opzionale)</span>
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="Se non ricordi, lascia vuoto"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <button type="submit" className="forgot-btn" disabled={loading}>
                {loading ? "Verifica..." : "Verifica"}
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
              <div className="form-group">
                <label htmlFor="newPassword">Nuova Password</label>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="Nuova password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmNewPassword">Conferma Password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  placeholder="Riscrivi la password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="forgot-btn" disabled={loading}>
                {loading ? "Salvataggio..." : "Reimposta Password"}
              </button>
            </form>
          </>
        )}

        <p className="forgot-login-link">
          <Link to="/login">Torna al Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
