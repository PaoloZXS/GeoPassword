import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../utils/supabase.js";
import "./EntryForm.css";

function EntryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicateTitle, setDuplicateTitle] = useState(null);
  const [loadingEntry, setLoadingEntry] = useState(isEditing);

  useEffect(() => {
    if (isEditing && user) {
      loadEntry();
    }
  }, [id, user]);

  const loadEntry = async () => {
    const { data, error } = await supabase.rpc("get_entry_detail", {
      p_entry_id: id,
      p_user_id: user.id
    });

    if (error || !data || data.length === 0) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setTitle(data[0].title);
    setDescription(data[0].description || "");
    setLoadingEntry(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Il titolo è obbligatorio");
      return;
    }

    setSaving(true);
    setError("");

    if (isEditing) {
      const { error: updateError } = await supabase.rpc("update_entry", {
        p_entry_id: id,
        p_user_id: user.id,
        p_title: title.trim(),
        p_category: "",
        p_description: description.trim()
      });

      if (updateError) {
        setError("Errore durante il salvataggio");
        setSaving(false);
        return;
      }
      navigate("/dashboard", { replace: true });
    } else {
      // Check for duplicate title
      const { data: exists } = await supabase.rpc("check_entry_title_exists", {
        p_user_id: user.id,
        p_title: title.trim()
      });

      if (exists) {
        setDuplicateTitle(title.trim());
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase.rpc("insert_entry", {
        p_user_id: user.id,
        p_title: title.trim(),
        p_category: "",
        p_description: description.trim()
      });

      if (insertError) {
        setError("Errore durante la creazione");
        setSaving(false);
        return;
      }
      navigate("/dashboard", { replace: true });
    }
  };

  if (loadingEntry) {
    return (
      <div className="entry-form-container">
        <div className="entry-form-loading">
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-form-container">
      {/* Floating glow */}
      <div className="form-glow" />

      {/* Fixed header */}
      <header className="form-header">
        <div className="form-header-inner">
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
            className="w-5 h-5 inline-block mr-2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h1>{isEditing ? "Modifica servizio" : "Nuovo servizio"}</h1>
        </div>
      </header>

      <main className="form-main">
        <div className="form-glass">
          {/* Corner accent */}
          <div className="form-corner" />

          <form className="form-inner" onSubmit={handleSubmit}>
            {error && <p className="form-error">{error}</p>}

            {/* Servizio field */}
            <div className="field-group">
              <label className="field-label" htmlFor="title">
                Servizio <span className="field-required">*</span>
              </label>
              <div className="field-input-wrap">
                <input
                  id="title"
                  className="field-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. BANCA SAN PAOLO"
                  required
                />
              </div>
            </div>

            {/* Username/Password field */}
            <div className="field-group">
              <label className="field-label" htmlFor="description">
                Username/Password
              </label>
              <div className="field-input-wrap">
                <textarea
                  id="description"
                  className="field-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="es. Tutte le credenziali della banca"
                  rows={8}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="form-buttons">
              <button
                type="submit"
                className="btn-primary-form"
                disabled={saving}
              >
                {saving
                  ? "Salvataggio..."
                  : isEditing
                    ? "Aggiorna"
                    : "Salva Servizio"}
              </button>
              <button
                type="button"
                className="btn-outline-form"
                onClick={() => navigate("/dashboard")}
              >
                Indietro
              </button>
              <button
                type="button"
                className="btn-text-form"
                onClick={() => navigate("/dashboard")}
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Duplicate title modal */}
      {duplicateTitle && (
        <div className="modal-overlay" onClick={() => setDuplicateTitle(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon modal-icon-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="modal-title">Servizio già esistente</h3>
            <p className="modal-text">
              Esiste già un servizio chiamato{" "}
              <strong>"{duplicateTitle}"</strong>. Scegli un nome diverso per
              evitare duplicati.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-primary"
                onClick={() => setDuplicateTitle(null)}
              >
                OK, cambia nome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntryForm;
