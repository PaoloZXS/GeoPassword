-- ============================================================
-- GeoPassword - Schema Database Supabase
-- Esegui tutto in una volta nel SQL Editor di Supabase
-- ============================================================

-- 1. TABELLA USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- 2. TABELLA PASSWORD_ENTRIES
CREATE TABLE password_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELLA PASSWORD_FIELDS
CREATE TABLE password_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES password_entries(id) ON DELETE CASCADE,
  section TEXT DEFAULT '',
  label TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indici per performance
CREATE INDEX idx_password_entries_user_id ON password_entries(user_id);
CREATE INDEX idx_password_fields_entry_id ON password_fields(entry_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_fields ENABLE ROW LEVEL SECURITY;

-- Policy: tutti gli utenti autenticati possono leggere e scrivere su users
CREATE POLICY "Tutti gli autenticati possono leggere users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Tutti gli autenticati possono inserire users"
  ON users FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tutti gli autenticati possono modificare users"
  ON users FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: tutti gli autenticati possono leggere e scrivere su password_entries
CREATE POLICY "Tutti gli autenticati possono leggere password_entries"
  ON password_entries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Tutti gli autenticati possono inserire password_entries"
  ON password_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tutti gli autenticati possono modificare password_entries"
  ON password_entries FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Tutti gli autenticati possono eliminare password_entries"
  ON password_entries FOR DELETE
  USING (auth.role() = 'authenticated');

-- Policy: tutti gli autenticati possono leggere e scrivere su password_fields
CREATE POLICY "Tutti gli autenticati possono leggere password_fields"
  ON password_fields FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Tutti gli autenticati possono inserire password_fields"
  ON password_fields FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tutti gli autenticati possono modificare password_fields"
  ON password_fields FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Tutti gli autenticati possono eliminare password_fields"
  ON password_fields FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- UTENTI PREDEFINITI
-- Password: admin1 / admin2
-- ============================================================
INSERT INTO users (username, password_hash) VALUES
  ('admin1', '$2a$10$68h.lh1xmNUgM3ZWiZTQreWIV25ub4wiHANnFdjQiVISgp6SW9IOi'),
  ('admin2', '$2a$10$fi0mnOUlkRTs81lBZllmVOWbv01LhyC2Xcj2QREeI7XGC7V9uvd3a');

-- ============================================================
-- FUNZIONE DI LOGIN (verifica password con bcrypt)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION login(p_username TEXT, p_password TEXT)
RETURNS TABLE (id UUID, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$;

-- ============================================================
-- FUNZIONI CRUD (bypassano RLS con SECURITY DEFINER)
-- ============================================================

-- Ottiene tutte le entries di un utente con conteggio campi
CREATE OR REPLACE FUNCTION get_my_entries(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  category TEXT,
  description TEXT,
  favorite BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  fields_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.user_id,
    e.title,
    e.category,
    e.description,
    e.favorite,
    e.created_at,
    e.updated_at,
    COALESCE((SELECT COUNT(*) FROM password_fields f WHERE f.entry_id = e.id), 0) AS fields_count
  FROM password_entries e
  WHERE e.user_id = p_user_id
  ORDER BY e.created_at DESC;
END;
$$;

-- Inserisce una nuova entry
CREATE OR REPLACE FUNCTION insert_entry(
  p_user_id UUID,
  p_title TEXT,
  p_category TEXT DEFAULT '',
  p_description TEXT DEFAULT ''
)
RETURNS SETOF password_entries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO password_entries (user_id, title, category, description)
  VALUES (p_user_id, p_title, p_category, p_description)
  RETURNING *;
END;
$$;

-- Verifica se esiste già un titolo per l'utente
CREATE OR REPLACE FUNCTION check_entry_title_exists(
  p_user_id UUID,
  p_title TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM password_entries
    WHERE user_id = p_user_id AND title = p_title
  ) INTO v_exists;
  RETURN v_exists;
END;
$$;

-- Aggiorna una entry (solo se appartiene all'utente)
CREATE OR REPLACE FUNCTION update_entry(
  p_entry_id UUID,
  p_user_id UUID,
  p_title TEXT,
  p_category TEXT DEFAULT '',
  p_description TEXT DEFAULT ''
)
RETURNS SETOF password_entries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE password_entries
  SET title = p_title, category = p_category, description = p_description, updated_at = now()
  WHERE id = p_entry_id AND user_id = p_user_id
  RETURNING *;
END;
$$;

-- Ottiene una singola entry con i suoi campi
CREATE OR REPLACE FUNCTION get_entry_detail(p_entry_id UUID, p_user_id UUID)
RETURNS SETOF password_entries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM password_entries e
  WHERE e.id = p_entry_id AND e.user_id = p_user_id;
END;
$$;

-- Elimina una entry (solo se appartiene all'utente)
CREATE OR REPLACE FUNCTION delete_entry(p_entry_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_entries
  WHERE id = p_entry_id AND user_id = p_user_id;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- FUNZIONI DI RECUPERO PASSWORD
-- ============================================================

-- Aggiunge colonne email e recovery_code alla tabella users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_code TEXT;

-- Genera un codice di recupero casuale
CREATE OR REPLACE FUNCTION generate_recovery_code()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
                substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
                substr(md5(random()::text || clock_timestamp()::text), 1, 4));
$$;

-- Registrazione con email e codice di recupero
CREATE OR REPLACE FUNCTION register(
  p_username TEXT,
  p_password TEXT,
  p_email TEXT DEFAULT ''
)
RETURNS TABLE (id UUID, username TEXT, recovery_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
BEGIN
  v_code := generate_recovery_code();

  RETURN QUERY
  INSERT INTO users (username, password_hash, email, recovery_code)
  VALUES (
    p_username,
    crypt(p_password, gen_salt('bf', 10)),
    nullif(trim(p_email), ''),
    v_code
  )
  RETURNING users.id, users.username, users.recovery_code;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Username già esistente';
END;
$$;

-- Verifica email di recupero (accetta username opzionale, cerca anche solo per email)
CREATE OR REPLACE FUNCTION verify_recovery(p_email TEXT, p_username TEXT DEFAULT '')
RETURNS TABLE (success BOOLEAN, recovery_code TEXT, found_username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_code TEXT;
  v_user TEXT;
BEGIN
  IF p_username != '' THEN
    SELECT u.email, u.recovery_code, u.username INTO v_email, v_code, v_user
    FROM users u WHERE u.username = p_username;
  ELSE
    SELECT u.email, u.recovery_code, u.username INTO v_email, v_code, v_user
    FROM users u WHERE u.email = p_email;
  END IF;

  IF v_email IS NULL THEN
    RETURN QUERY SELECT false, 'Nessun account trovato con questi dati'::TEXT, ''::TEXT;
    RETURN;
  END IF;

  IF v_email = p_email THEN
    RETURN QUERY SELECT true, v_code, v_user;
  ELSE
    RETURN QUERY SELECT false, 'Email non corrispondente'::TEXT, ''::TEXT;
  END IF;
END;
$$;

-- Resetta la password (dopo verifica codice)
CREATE OR REPLACE FUNCTION reset_password(
  p_username TEXT,
  p_recovery_code TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT u.recovery_code INTO v_code
  FROM users u
  WHERE u.username = p_username;

  IF v_code IS NULL OR v_code <> p_recovery_code THEN
    RETURN false;
  END IF;

  UPDATE users
  SET password_hash = crypt(p_new_password, gen_salt('bf', 10))
  WHERE username = p_username;

  RETURN true;
END;
$$;
