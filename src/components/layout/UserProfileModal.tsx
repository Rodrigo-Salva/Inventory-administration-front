import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { X, User as UserIcon, Mail, Check, Edit2, ShieldCheck } from 'lucide-react'
import type { User } from '@/types'

interface UserProfileModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const queryClient = useQueryClient()
    const [editingField, setEditingField] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
    })

    const { data: user, isLoading } = useQuery<User>({
        queryKey: ['user-me'],
        queryFn: async () => {
            const response = await api.get('/api/v1/users/me')
            return response.data
        },
        enabled: isOpen,
    })

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || '',
            })
        }
    }, [user])

    const updateMutation = useMutation({
        mutationFn: (data: Partial<User>) => api.patch('/api/v1/users/me', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-me'] })
            setEditingField(null)
            toast.success('Perfil actualizado')
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Error al actualizar perfil')
        },
    })

    if (!isOpen) return null

    const handleSave = (field: string) => {
        const value = formData[field as keyof typeof formData]
        updateMutation.mutate({ [field]: value })
    }

    const handleCancel = (field: string) => {
        setFormData({
            ...formData,
            [field]: user?.[field as keyof User] || ''
        })
        setEditingField(null)
    }

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                    onClick={onClose} 
                />
                
                <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
                
                <div className="inline-block transform overflow-hidden rounded-3xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-4 ring-white/10">
                                <UserIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Mi Perfil</h3>
                                <div className="flex items-center gap-2 mt-1 text-primary-100 text-xs font-medium">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    <span>Administrador del Sistema</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-8 space-y-8">
                        {isLoading ? (
                            <div className="py-12 text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                            </div>
                        ) : (
                            <>
                                {/* Personal Info Section */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Información Personal</h4>
                                    
                                    {/* Field: First Name */}
                                    <div className="group">
                                        <label className="block text-xs font-bold text-slate-500 mb-2">Nombre</label>
                                        <div className="flex items-center gap-3 h-10">
                                            {editingField === 'first_name' ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        className="flex-1 bg-slate-50 border-2 border-primary-500 rounded-xl px-3 text-sm focus:outline-none"
                                                        value={formData.first_name}
                                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSave('first_name')}
                                                    />
                                                    <button onClick={() => handleSave('first_name')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                        <Check className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleCancel('first_name')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="flex-1 text-slate-900 font-semibold">{user?.first_name || <span className="text-slate-300 italic font-normal">Sin nombre</span>}</span>
                                                    <button onClick={() => setEditingField('first_name')} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Field: Last Name */}
                                    <div className="group">
                                        <label className="block text-xs font-bold text-slate-500 mb-2">Apellido</label>
                                        <div className="flex items-center gap-3 h-10">
                                            {editingField === 'last_name' ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        className="flex-1 bg-slate-50 border-2 border-primary-500 rounded-xl px-3 text-sm focus:outline-none"
                                                        value={formData.last_name}
                                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSave('last_name')}
                                                    />
                                                    <button onClick={() => handleSave('last_name')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                        <Check className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleCancel('last_name')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="flex-1 text-slate-900 font-semibold">{user?.last_name || <span className="text-slate-300 italic font-normal">Sin apellido</span>}</span>
                                                    <button onClick={() => setEditingField('last_name')} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Field: Phone */}
                                    <div className="group">
                                        <label className="block text-xs font-bold text-slate-500 mb-2">Teléfono</label>
                                        <div className="flex items-center gap-3 h-10">
                                            {editingField === 'phone' ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        className="flex-1 bg-slate-50 border-2 border-primary-500 rounded-xl px-3 text-sm font-mono focus:outline-none"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSave('phone')}
                                                    />
                                                    <button onClick={() => handleSave('phone')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                        <Check className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleCancel('phone')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="flex-1 text-slate-900 font-mono text-sm">{user?.phone || <span className="text-slate-300 italic font-normal">Sin teléfono</span>}</span>
                                                    <button onClick={() => setEditingField('phone')} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Account Info Section */}
                                <div className="pt-6 border-t border-slate-100 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Credenciales de Acceso</h4>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 truncate">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</p>
                                            <p className="text-sm font-semibold text-slate-700 truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
