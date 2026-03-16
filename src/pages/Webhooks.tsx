import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { 
    Webhook as WebhookIcon, 
    Plus, 
    Trash2, 
    ExternalLink, 
    Shield, 
    CheckCircle2, 
    XCircle,
    Copy,
    Info,
    Send
} from 'lucide-react'
import type { Webhook } from '@/types'
import { usePermissions } from '@/hooks/usePermissions'
import ConfirmationModal from '@/components/common/ConfirmationModal'

export default function Webhooks() {
    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        url: '',
        description: '',
        events: ['sale.created']
    })

    // Modal de confirmación de eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null)

    const { data: webhooks, isLoading } = useQuery<Webhook[]>({
        queryKey: ['webhooks'],
        queryFn: async () => {
            const response = await api.get('/api/v1/webhooks/')
            return response.data
        }
    })

    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => api.post('/api/v1/webhooks/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
            toast.success('Webhook registrado correctamente')
            setIsModalOpen(false)
            setFormData({ url: '', description: '', events: ['sale.created'] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Error al registrar webhook')
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/webhooks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
            toast.success('Webhook eliminado')
        }
    })

    const testMutation = useMutation({
        mutationFn: (id: number) => api.post(`/api/v1/webhooks/${id}/test`),
        onSuccess: () => {
            toast.success('Petición de prueba enviada')
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Error al enviar prueba')
        }
    })

    if (!hasPermission('webhooks:view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para ver webhooks.</p>
            </div>
        )
    }

    const canManage = hasPermission('webhooks:manage')

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copiado al portapapeles')
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <WebhookIcon className="h-6 w-6 text-primary-600" />
                        Webhooks e Integraciones
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Configura URLs para recibir notificaciones en tiempo real sobre eventos de tu sistema.
                    </p>
                </div>
                {canManage && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary flex items-center gap-2 shadow-lg shadow-primary-200"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Webhook
                    </button>
                )}
            </div>

            {/* Alerta Informativa */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">¿Cómo funcionan los webhooks?</p>
                    <p>Cuando ocurra un evento (ej: una nueva venta), nuestro servidor enviará una petición POST JSON a la URL que configures. 
                    Las peticiones incluyen una firma <code>X-Webhook-Signature</code> para verificar la autenticidad.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
                    ))}
                </div>
            ) : webhooks?.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <WebhookIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No hay webhooks configurados</h3>
                    <p className="text-gray-500 mt-1">Comienza integrando tu app favorita.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {webhooks?.map((webhook) => (
                        <div key={webhook.id} className="card hover:shadow-md transition-shadow group relative overflow-hidden">
                            {canManage && (
                                <div className="absolute top-0 right-0 p-4">
                                    <button
                                        onClick={() => {
                                            setWebhookToDelete(webhook)
                                            setIsDeleteModalOpen(true)
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3 mb-4">
                                <div className={webhook.is_active ? "bg-green-100 p-2 rounded-lg" : "bg-gray-100 p-2 rounded-lg"}>
                                    {webhook.is_active ? 
                                        <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                                        <XCircle className="h-5 w-5 text-gray-500" />
                                    }
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 truncate pr-8" title={webhook.url}>
                                        {webhook.description || 'Sin descripción'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <span className="truncate max-w-[150px]">{webhook.url}</span>
                                        <a href={webhook.url} target="_blank" rel="noreferrer" className="hover:text-primary-600">
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Eventos</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {webhook.events.map(event => (
                                            <span key={event} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded-full">
                                                {event}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                    <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Secret Key</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => copyToClipboard(webhook.secret_key!)}
                                                className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                                title="Copiar Secret"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </button>
                                            {canManage && (
                                                <button 
                                                    onClick={() => testMutation.mutate(webhook.id)}
                                                    disabled={testMutation.isPending}
                                                    className="p-1 hover:bg-primary-100 rounded text-primary-600 font-bold text-[10px] flex items-center gap-1"
                                                    title="Enviar Test PING"
                                                >
                                                    <Send className="h-3 w-3" />
                                                    TEST
                                                </button>
                                            )}
                                        </div>
                                    </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Configurar Nuevo Webhook</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Plus className="h-6 w-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            createMutation.mutate(formData)
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 underline decoration-primary-200 underline-offset-4">Relación / Descripción</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Integración con Slack o Bot de Telegram"
                                    className="input focus:ring-2 focus:ring-primary-500"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 underline decoration-primary-200 underline-offset-4">URL del Endpoint *</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://tudominio.com/api/webhook"
                                    className="input focus:ring-2 focus:ring-primary-500"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Eventos Suscritos</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.events.includes('sale.created')}
                                            onChange={(e) => {
                                                const newEvents = e.target.checked 
                                                    ? [...formData.events, 'sale.created']
                                                    : formData.events.filter(ev => ev !== 'sale.created')
                                                setFormData({ ...formData, events: newEvents })
                                            }}
                                            className="rounded text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Nueva Venta Realizada (<code>sale.created</code>)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn btn-secondary flex-1 font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="btn btn-primary flex-1 font-bold shadow-lg shadow-primary-200"
                                >
                                    {createMutation.isPending ? 'Procesando...' : 'Crear Webhook'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false)
                    setWebhookToDelete(null)
                }}
                onConfirm={() => {
                    if (webhookToDelete) {
                        deleteMutation.mutate(webhookToDelete.id)
                    }
                }}
                title="¿Eliminar Webhook?"
                message={`¿Estás seguro de que deseas eliminar el webhook "${webhookToDelete?.description || webhookToDelete?.url}"? Esta herramienta dejará de recibir notificaciones.`}
                confirmText="Eliminar Webhook"
                type="danger"
            />
        </div>
    )
}
