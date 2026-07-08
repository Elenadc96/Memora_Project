const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const VALID_THEMES    = new Set(['light', 'dark']);
const VALID_LANGUAGES = new Set(['it', 'en']);
const ALLOWED_SETTINGS_KEYS = new Set(['theme', 'language']);

function isValidPassword(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}

// Restituisce false se settings contiene chiavi non consentite o valori non validi.
// null/undefined è accettato (settings è opzionale).
function isValidSettings(settings) {
  if (settings == null) return true;
  if (typeof settings !== 'object' || Array.isArray(settings)) return false;
  if (Object.keys(settings).some(k => !ALLOWED_SETTINGS_KEYS.has(k))) return false;
  if (settings.theme    !== undefined && !VALID_THEMES.has(settings.theme))       return false;
  if (settings.language !== undefined && !VALID_LANGUAGES.has(settings.language)) return false;
  return true;
}

module.exports = { isValidPassword, isValidSettings };
