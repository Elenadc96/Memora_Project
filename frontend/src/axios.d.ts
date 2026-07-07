// Estende la config di axios con un flag custom: le chiamate che gestiscono
// da sole un 401 "previsto" (es. login con password sbagliata, cambio
// password con password attuale sbagliata) lo passano per dire
// all'interceptor globale in main.ts di non trattarlo come sessione scaduta.
import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean
  }
}
