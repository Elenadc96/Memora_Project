import Swal from 'sweetalert2'
import { i18next } from '@/i18n'

// Modale mostrato quando una chiamata di salvataggio (Impostazioni) fallisce.
export function showSaveError(): void {
  Swal.fire({
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
