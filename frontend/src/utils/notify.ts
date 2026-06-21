import Swal from 'sweetalert2'
import { i18next } from '@/i18n'

// Modale mostrato quando una chiamata di salvataggio (Impostazioni) fallisce.
export function showSaveError(): void {
  Swal.fire({
    icon: 'error',
    title: i18next.t('common.save_error'),
  })
}
