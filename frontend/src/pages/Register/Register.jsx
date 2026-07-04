import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../utils/supabase.js";
import "./Register.css";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Inserisci uno username");
      return;
    }
    if (password.length < 4) {
      setError("La password deve essere almeno 4 caratteri");
      return;
    }
    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    setLoading(true);
    const { error: rpcError } = await supabase.rpc("register", {
      p_username: username.trim(),
      p_password: password,
      p_email: email.trim()
    });

    if (rpcError) {
      setError(
        rpcError.message === "Username già esistente"
          ? "Questo username è già preso"
          : "Errore durante la registrazione"
      );
      setLoading(false);
      return;
    }

    navigate("/login", { replace: true });
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-logo">
          <span className="register-logo-icon">🔐</span>
        </div>
        <h1 className="register-title">Crea account</h1>
        <p className="register-subtitle">Registrati per usare GeoPassword</p>

        {error && <p className="register-error">{error}</p>}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Scegli uno username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email (per recupero)</label>
            <input
              type="email"
              id="email"
              placeholder="La tua email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Scegli una password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Conferma Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Riscrivi la password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Registrazione..." : "Registrati"}
          </button>
        </form>

        <p className="register-login-link">
          Hai già un account? <Link to="/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
