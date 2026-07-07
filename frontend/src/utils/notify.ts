import Swal from 'sweetalert2'
import { i18next } from '@/i18n'
import { useUIStore } from '@/stores/ui'

// SweetAlert2 (dalla v11.10) ha un tema chiaro/scuro nativo, ma non lo
// applica da solo in base al resto dell'app: senza questo, i suoi popup
// restano sempre bianchi anche quando l'utente ha scelto il tema scuro
// nelle Impostazioni. Va passato esplicitamente ad ogni Swal.fire, letto
// al momento della chiamata (non una volta fissa) così segue il tema attuale.
export function swalTheme(): { theme: 'dark' | 'light' } {
  return { theme: useUIStore().isDark ? 'dark' : 'light' }
}

// Modale mostrato quando una chiamata di salvataggio (Impostazioni) fallisce.
export function showSaveError(): void {
  Swal.fire({
    ...swalTheme(),
    icon: 'error',
    title: i18next.t('common.save_error'),
  })
}

// Il backend risponde agli errori con un CODICE stabile (es. { error: 'LESSON_NOT_FOUND' }),
// non con una frase già pronta, così il messaggio mostrato all'utente segue la lingua
// scelta nell'app invece di restare fisso in italiano. Questa funzione fa da ponte:
// legge il codice dalla risposta axios e lo traduce con i18next, con un fallback
// generico se il codice non è tra quelli noti (es. errore di rete, server irraggiungibile).
export function apiErrorMessage(err: unknown): string {
  const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
  if (code && i18next.exists(`errors.${code}`)) {
    return i18next.t(`errors.${code}`)
  }
  return i18next.t('common.error')
}
