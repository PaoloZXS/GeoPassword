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
            <span className="dashboard-logo">🔐</span>
            <div>
              <h1>GeoPassword</h1>
              <p>Benvenuto, {user?.username}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Esci
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
