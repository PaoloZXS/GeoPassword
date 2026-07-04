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
      <main className="register-main">
        <header className="register-header">
          <button
            className="register-back"
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

        <section className="register-brand">
          <div className="register-icon-box">
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
          <h1 className="register-title">Crea account</h1>
          <p className="register-tagline">Registrati per usare GeoPassword</p>
        </section>

        <section className="register-form-section">
          {error && <p className="register-error">{error}</p>}
          <form className="register-form" onSubmit={handleSubmit}>
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
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                type="text"
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
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                className="input-field"
                placeholder="Email (per recupero)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                className="input-field"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                placeholder="Conferma Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                type="password"
              />
            </div>
            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading ? "REGISTRAZIONE..." : "REGISTRATI"}
            </button>
            <div className="register-login-link">
              <p className="text-sm text-white/60">
                Hai già un account? <Link to="/login">Accedi</Link>
              </p>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Register;
