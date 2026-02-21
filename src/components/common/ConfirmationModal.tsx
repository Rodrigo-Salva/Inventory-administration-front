import { X, AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Eliminar',
    cancelText = 'Cancelar',
    type = 'danger'
}: ConfirmationModalProps) {
    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div 
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                    onClick={onClose} 
                />
                
                <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            type === 'danger' ? 'bg-red-100 text-red-600' : 
                            type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                            'bg-blue-100 text-blue-600'
                        }`}>
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            className="btn btn-secondary flex-1 h-11 font-semibold"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            className={`btn flex-1 h-11 font-semibold ${
                                type === 'danger' ? 'btn-danger' : 
                                type === 'warning' ? 'bg-amber-600 text-white hover:bg-amber-700' : 
                                'btn-primary'
                            }`}
                            onClick={() => {
                                onConfirm()
                                onClose()
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
