export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  autoDismiss: boolean
  retryAction?: string
}
