import { create } from 'zustand'

interface Toast {
  id: number
  message: string
}

interface ToastStore {
  toasts: Toast[]
  showToast: (message: string) => void
  removeToast: (id: number) => void
}

let toastId = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  showToast: (message) => {
    const id = ++toastId
    set(state => ({ toasts: [...state.toasts, { id, message }] }))
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 3000)
  },

  removeToast: (id) =>
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}))
