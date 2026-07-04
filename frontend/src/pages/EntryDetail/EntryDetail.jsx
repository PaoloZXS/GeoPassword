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

  if (loading) {
    return (
      <div className="entry-detail-container">
        <div className="entry-detail-loading">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="entry-detail-container">
      <div className="entry-detail-card">
        <div className="entry-detail-card-header">
          <div className="entry-detail-card-header-row">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span className="entry-detail-label">Servizio :</span>
          </div>
          <h1 className="entry-detail-title">{entry.title}</h1>
        </div>

        {entry.description && (
          <p className="entry-detail-desc">{entry.description}</p>
        )}
        <div className="detail-back-btn">
          <button onClick={() => navigate("/dashboard")}>Indietro</button>
        </div>
      </div>
    </div>
  );
}

export default EntryDetail;
