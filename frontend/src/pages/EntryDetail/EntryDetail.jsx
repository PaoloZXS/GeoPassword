import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../utils/supabase.js";
import "./EntryDetail.css";

function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchEntry();
  }, [id, user]);

  const fetchEntry = async () => {
    const { data, error } = await supabase.rpc("get_entry_detail", {
      p_entry_id: id,
      p_user_id: user.id
    });

    if (error || !data || data.length === 0) {
      navigate("/dashboard", { replace: true });
      return;
    }
    setEntry(data[0]);
    setLoading(false);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Eliminare questo account?");
    if (!confirmed) return;

    const { error } = await supabase.rpc("delete_entry", {
      p_entry_id: id,
      p_user_id: user.id
    });

    if (error) {
      alert("Errore durante l'eliminazione");
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  if (loading) {
    return (
      <div className="entry-detail-container">
        <div className="entry-detail-loading">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="entry-detail-container">
      <header className="entry-detail-header">
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
        <h1>{entry.title}</h1>
      </header>

      <div className="entry-detail-card">
        {entry.favorite && (
          <span className="entry-detail-fav">⭐ Preferito</span>
        )}

        {entry.description && (
          <p className="entry-detail-desc">{entry.description}</p>
        )}

        <div className="entry-actions">
          <button className="btn-primary-form" onClick={() => navigate(`/entry/edit/${id}`)}>
            Modifica
          </button>
          <button className="btn-outline-form" onClick={handleDelete}>
            Elimina
          </button>
          <button className="btn-text-form" onClick={() => navigate("/dashboard")}>
            ← Indietro
          </button>
        </div>
            ← Indietro
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EntryDetail;
