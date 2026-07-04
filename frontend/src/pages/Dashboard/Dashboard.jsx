import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../utils/supabase.js";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import "./Dashboard.css";

function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, title }
  const menuRef = useRef(null);
  const { user, logout } = useAuth();

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpenId) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        const btn = e.target.closest(".entry-card-menu-btn");
        if (!btn) setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpenId]);
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
      setEntries((data || []).sort((a, b) => a.title.localeCompare(b.title)));
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    const entry = entries.find((e) => e.id === id);
    setDeleteConfirm({ id, title: entry?.title || "questo servizio" });
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { error } = await supabase.rpc("delete_entry", {
      p_entry_id: deleteConfirm.id,
      p_user_id: user.id
    });
    if (!error) {
      setEntries((prev) =>
        prev.filter((entry) => entry.id !== deleteConfirm.id)
      );
    }
    setDeleteConfirm(null);
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    if (menuOpenId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpenId]);

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
              {filteredEntries.length}{" "}
              {filteredEntries.length === 1 ? "servizio" : "servizi"}
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
                    <div className="entry-card-menu-wrap">
                      <button
                        className="entry-card-menu-btn"
                        data-menu-id={entry.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          const btn = e.currentTarget;
                          const rect = btn.getBoundingClientRect();
                          setMenuPos({
                            top: rect.bottom + 4,
                            right: window.innerWidth - rect.right
                          });
                          setMenuOpenId(
                            menuOpenId === entry.id ? null : entry.id
                          );
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating menu */}
      {menuOpenId && (
        <div
          ref={menuRef}
          className="entry-card-menu-fixed"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <button
            className="menu-item"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/entry/edit/${menuOpenId}`);
              setMenuOpenId(null);
            }}
          >
            Modifica
          </button>
          <button
            className="menu-item menu-item-danger"
            onClick={(e) => handleDeleteClick(e, menuOpenId)}
          >
            Elimina
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
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
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="modal-title">Eliminare questo servizio?</h3>
            <p className="modal-text">
              Stai per eliminare <strong>"{deleteConfirm.title}"</strong>.
              Questa azione non può essere annullata.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Annulla
              </button>
              <button
                className="modal-btn modal-btn-danger"
                onClick={confirmDelete}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
