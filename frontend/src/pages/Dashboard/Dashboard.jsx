import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../utils/supabase.js";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import "./Dashboard.css";

function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_my_entries", {
      p_user_id: user.id
    });

    if (error) {
      console.error("Errore caricamento entries:", error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const filteredEntries = entries.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header-top">
          <div className="dashboard-header-left">
            <div className="dashboard-header-icon">
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
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1>GeoPassword</h1>
              <p>Benvenuto, {user?.username}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block mr-1.5"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            Esci
          </button>
        </div>
      </header>

      <div className="dashboard-toolbar">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <button className="new-btn" onClick={() => navigate("/entry/new")}>
          + Nuovo Servizio
        </button>
      </div>

      <main className="dashboard-content">
        {loading ? (
          <div className="dashboard-loading">
            <p>Caricamento...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="dashboard-empty">
            {searchTerm ? (
              <p>Nessun servizio trovato per "{searchTerm}"</p>
            ) : (
              <>
                <p>Nessun servizio ancora aggiunto.</p>
                <p className="empty-hint">
                  Clicca "+ Nuovo Servizio" per iniziare.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="entries-count">
              {filteredEntries.length} servizio
              {filteredEntries.length !== 1 ? "i" : ""}
            </div>
            <div className="entries-list">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="entry-card"
                  onClick={() => navigate(`/entry/${entry.id}`)}
                >
                  <div className="entry-card-main">
                    <div className="entry-card-info">
                      <h3 className="entry-card-title">
                        {entry.title}
                        {entry.favorite && (
                          <span className="entry-star">⭐</span>
                        )}
                      </h3>
                    </div>
                    <span className="entry-field-count">
                      {entry.fields_count ?? 0} campo
                      {(entry.fields_count ?? 0) !== 1 ? "i" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
