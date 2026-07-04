import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../utils/supabase.js";
import Button from "../../components/Button/Button.jsx";
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
      navigate(`/entry/${id}`, { replace: true });
    } else {
      const { data, error: insertError } = await supabase.rpc("insert_entry", {
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
      navigate(`/entry/${data[0].id}`, { replace: true });
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
      <header className="entry-form-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
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
            className="w-5 h-5"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </button>
        <h1>{isEditing ? "Modifica Account" : "Nuovo servizio"}</h1>
      </header>

      <form className="entry-form-card" onSubmit={handleSubmit}>
        {error && <p className="entry-form-error">{error}</p>}

        <div className="form-group">
          <label htmlFor="title">
            Servizio <span className="required">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="es. BANCA SAN PAOLO"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Username/Password</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="es. Tutte le credenziali della banca"
            rows={8}
          />
        </div>

        <div className="entry-form-actions">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving
              ? "Salvataggio..."
              : isEditing
                ? "Aggiorna"
                : "Crea Servizio"}
          </Button>
          <Button variant="danger" onClick={() => navigate("/dashboard")}>
            Annulla
          </Button>
          <Button variant="success" onClick={() => navigate("/dashboard")}>
            ← Indietro
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EntryForm;
