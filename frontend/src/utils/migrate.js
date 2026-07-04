import { supabase } from "./supabase.js";
import { loadKey, encryptText, decryptText } from "./crypto.js";

/**
 * Encrypt all plain-text descriptions for the current user.
 * Skips entries that are already encrypted.
 * Returns { total, migrated, skipped, errors }
 */
export async function migrateEntries(userId) {
  const key = await loadKey();
  if (!key)
    throw new Error("Chiave di crittografia non trovata. Effettua il login.");

  // Fetch all entries
  const { data: entries, error } = await supabase.rpc("get_my_entries", {
    p_user_id: userId
  });

  if (error) throw new Error("Errore caricamento servizi: " + error.message);
  if (!entries || entries.length === 0)
    return { total: 0, migrated: 0, skipped: 0, errors: 0 };

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of entries) {
    if (!entry.description) {
      skipped++;
      continue;
    }

    try {
      // Test if already encrypted by trying to decrypt
      const decrypted = await decryptText(key, entry.description);

      if (decrypted !== entry.description) {
        // Already encrypted — skip
        skipped++;
        continue;
      }

      // Plain text — encrypt it
      const encrypted = await encryptText(key, entry.description);

      const { error: updateError } = await supabase.rpc("update_entry", {
        p_entry_id: entry.id,
        p_user_id: userId,
        p_title: entry.title,
        p_category: entry.category || "",
        p_description: encrypted
      });

      if (updateError) {
        errors++;
      } else {
        migrated++;
      }
    } catch {
      errors++;
    }
  }

  return { total: entries.length, migrated, skipped, errors };
}
