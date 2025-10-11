import { Toaster as SonnerToaster } from "sonner"
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const toast = {
  success: (message: string, data?: ToastProps) => {
    return sonnerToast.success(message, {
      description: data?.description,
      action: data?.action ? {
        label: data.action.label,
        onClick: data.action.onClick,
      } : undefined,
    })
  },
  error: (message: string, data?: ToastProps) => {
    return sonnerToast.error(message, {
      description: data?.description,
      action: data?.action ? {
        label: data.action.label,
        onClick: data.action.onClick,
      } : undefined,
    })
  },
  info: (message: string, data?: ToastProps) => {
    return sonnerToast.info(message, {
      description: data?.description,
      action: data?.action ? {
        label: data.action.label,
        onClick: data.action.onClick,
      } : undefined,
    })
  },
  warning: (message: string, data?: ToastProps) => {
    return sonnerToast.warning(message, {
      description: data?.description,
      action: data?.action ? {
        label: data.action.label,
        onClick: data.action.onClick,
      } : undefined,
    })
  },
  message: (message: string, data?: ToastProps) => {
    return sonnerToast.message(message, {
      description: data?.description,
      action: data?.action ? {
        label: data.action.label,
        onClick: data.action.onClick,
      } : undefined,
    })
  },
}

// Export both the toast functions and the Toaster component
export { toast, SonnerToaster as Toaster }