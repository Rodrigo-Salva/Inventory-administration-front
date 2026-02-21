import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { User as UserIcon, Mail, Check, Edit2, ShieldCheck, X, ArrowLeft, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'

export default function Profile() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const setUser = useAuthStore(state => state.setUser)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [editingField, setEditingField] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        avatar_url: '',
    })

    const { data: user, isLoading } = useQuery<User>({
        queryKey: ['user-me'],
        queryFn: async () => {
            const response = await api.get('/api/v1/users/me')
            return response.data
        },
    })

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || '',
                avatar_url: user.avatar_url || '',
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen')
            return
        }

        const formData = new FormData()
        formData.append('file', file)

        setIsUploading(true)
        try {
            const response = await api.post('/api/v1/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            queryClient.invalidateQueries({ queryKey: ['user-me'] })
            setUser(response.data) // Update authStore for header
            toast.success('Foto de perfil actualizada')
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al subir la imagen')
        } finally {
            setIsUploading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-r-transparent"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header / Navigation back */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mi Perfil</h1>
                    <p className="text-sm text-slate-500">Gestiona tu información personal y credenciales</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Summary Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card bg-white p-8 text-center space-y-4">
                        <div className="relative inline-block group/avatar">
                            <div className="h-24 w-24 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto ring-8 ring-slate-50 overflow-hidden relative">
                                {user?.avatar_url ? (
                                    <img src={`${api.defaults.baseURL}${user.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="h-10 w-10 text-primary-600" />
                                )}
                                
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="absolute inset-0 bg-primary-600/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all text-white disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                                    ) : (
                                        <Camera className="h-6 w-6" />
                                    )}
                                </button>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-emerald-500 rounded-xl border-4 border-white flex items-center justify-center shadow-lg">
                                <ShieldCheck className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {user?.first_name} {user?.last_name}
                            </h2>
                            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1">Administrador</p>
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                                <Mail className="h-4 w-4" />
                                <span className="truncate max-w-[180px]">{user?.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edición de campos */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card bg-white p-8 space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-4 mb-6">Configuración de Cuenta</h3>
                            
                            <div className="grid grid-cols-1 gap-8">
                                {/* Campo: Nombre */}
                                <div className="group">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                                    <div className="flex items-center gap-4 h-11">
                                        {editingField === 'first_name' ? (
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="flex-1 bg-slate-50 border-2 border-primary-500 rounded-xl px-4 text-sm focus:outline-none"
                                                    value={formData.first_name}
                                                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSave('first_name')}
                                                />
                                                <button onClick={() => handleSave('first_name')} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                                    <Check className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleCancel('first_name')} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="flex-1 text-slate-700 font-semibold text-base">{user?.first_name || <span className="text-slate-300 italic font-normal">No asignado</span>}</span>
                                                <button onClick={() => setEditingField('first_name')} className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Campo: Apellido */}
                                <div className="group">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Apellido</label>
                                    <div className="flex items-center gap-4 h-11">
                                        {editingField === 'last_name' ? (
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="flex-1 bg-slate-50 border-2 border-primary-500 rounded-xl px-4 text-sm focus:outline-none"
                                                    value={formData.last_name}
                                                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSave('last_name')}
                                                />
                                                <button onClick={() => handleSave('last_name')} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                                    <Check className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleCancel('last_name')} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="flex-1 text-slate-700 font-semibold text-base">{user?.last_name || <span className="text-slate-300 italic font-normal">No asignado</span>}</span>
                                                <button onClick={() => setEditingField('last_name')} className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Campo: Teléfono */}
                                <div className="group">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Teléfono Personal</label>
                                    <div className="flex items-center gap-4 h-11">
                                        {editingField === 'phone' ? (
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="flex-1 bg-slate-50 border-2 border-primary-500 rounded-xl px-4 text-sm font-mono focus:outline-none"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSave('phone')}
                                                />
                                                <button onClick={() => handleSave('phone')} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                                    <Check className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleCancel('phone')} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="flex-1 text-slate-700 font-mono text-base">{user?.phone || <span className="text-slate-300 italic font-normal">No asignado</span>}</span>
                                                <button onClick={() => setEditingField('phone')} className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Campo: Foto de Perfil */}
                                <div className="group">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">URL Foto de Perfil</label>
                                    <div className="flex items-center gap-4 h-11">
                                        {editingField === 'avatar_url' ? (
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="URL de la imagen (ej: https://...)"
                                                    className="flex-1 bg-slate-50 border-2 border-primary-500 rounded-xl px-4 text-sm focus:outline-none"
                                                    value={formData.avatar_url}
                                                    onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSave('avatar_url')}
                                                />
                                                <button onClick={() => handleSave('avatar_url')} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                                    <Check className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleCancel('avatar_url')} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="flex-1 text-slate-700 font-medium text-sm truncate">{user?.avatar_url || <span className="text-slate-300 italic font-normal">Sin foto de perfil</span>}</span>
                                                <button onClick={() => setEditingField('avatar_url')} className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <div className="bg-slate-50/50 p-6 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cuenta vinculada</p>
                                        <p className="text-sm font-bold text-slate-700">{user?.email}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] bg-slate-200 text-slate-500 font-black px-2 py-1 rounded uppercase tracking-tighter">Solo Lectura</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
