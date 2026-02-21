import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Building, Save, ShieldCheck, Mail, Phone, Globe, MapPin, Hash } from 'lucide-react'
import type { Tenant } from '@/types'

export default function Settings() {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        name: '',
        tax_id: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: '',
        logo_url: '',
    })

    const { data: tenant, isLoading } = useQuery<Tenant>({
        queryKey: ['tenant-me'],
        queryFn: async () => {
            const response = await api.get('/api/v1/tenant/me')
            return response.data
        },
    })

    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name,
                tax_id: tenant.tax_id || '',
                email: tenant.email || '',
                phone: tenant.phone || '',
                website: tenant.website || '',
                address: tenant.address || '',
                city: tenant.city || '',
                state: tenant.state || '',
                country: tenant.country || '',
                logo_url: tenant.logo_url || '',
            })
        }
    }, [tenant])

    const updateMutation = useMutation({
        mutationFn: (data: Partial<Tenant>) => api.patch('/api/v1/tenant/me', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-me'] })
            toast.success('Configuración actualizada')
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Error al actualizar configuración')
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateMutation.mutate(formData)
    }

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-600">Cargando configuración...</p>
            </div>
        )
    }

    const isDirty = JSON.stringify(formData) !== JSON.stringify({
        name: tenant?.name,
        tax_id: tenant?.tax_id || '',
        email: tenant?.email || '',
        phone: tenant?.phone || '',
        website: tenant?.website || '',
        address: tenant?.address || '',
        city: tenant?.city || '',
        state: tenant?.state || '',
        country: tenant?.country || '',
        logo_url: tenant?.logo_url || '',
    })

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración Avanzada</h1>
                <p className="mt-1 text-sm text-gray-600">Completa el perfil de tu empresa para mayor personalización en reportes y facturación</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Perfil Básico */}
                <div className="card shadow-sm border-none">
                    <div className="flex items-center gap-2 mb-6 text-lg font-bold text-gray-900 border-b pb-4">
                        <Building className="h-5 w-5 text-primary-600" />
                        Identificación de la Empresa
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 underline decoration-primary-200 underline-offset-4">Razón Social *</label>
                            <input
                                type="text"
                                required
                                className="input focus:ring-2 focus:ring-primary-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">NIT / Tax ID</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="input pl-10"
                                    placeholder="Ej: 123.456.789-0"
                                    value={formData.tax_id}
                                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5" /> Subdominio (Solo lectura)
                            </label>
                            <div className="input bg-gray-50 text-gray-500 border-gray-200 flex items-center font-mono text-sm">
                                {tenant?.subdomain}.tu-almacen.com
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1.5">Plan de Suscripción</label>
                            <div className="flex items-center gap-2 h-[42px] px-4 bg-primary-50 text-primary-700 rounded-lg border border-primary-100 font-bold capitalize">
                                <ShieldCheck className="h-5 w-5" />
                                {tenant?.plan}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding / Logo */}
                <div className="card shadow-sm border-none bg-gradient-to-br from-white to-primary-50/30">
                    <div className="flex items-center gap-2 mb-6 text-md font-bold text-gray-900 border-b pb-4">
                        <ShieldCheck className="h-5 w-5 text-primary-600" />
                        Imagen de Marca (Logotipo)
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/2 space-y-4">
                            <label className="block text-sm font-semibold text-gray-700">URL del Logotipo</label>
                            <input
                                type="url"
                                className="input"
                                placeholder="https://ejemplo.com/logo.png"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                            />
                            <p className="text-xs text-gray-500">
                                Proporciona la URL de una imagen PNG o SVG con fondo transparente para mejores resultados.
                            </p>
                        </div>
                        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary-200 rounded-xl bg-white">
                            <span className="text-[10px] uppercase font-bold text-primary-400 mb-3 tracking-widest">Vista Previa</span>
                            {formData.logo_url ? (
                                <img 
                                    src={formData.logo_url} 
                                    alt="Logo preview" 
                                    className="h-20 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/200x80?text=Error+Cargando'
                                    }}
                                />
                            ) : (
                                <div className="h-20 w-40 bg-gray-100 rounded flex items-center justify-center text-gray-300 italic text-xs">
                                    Sin Logo
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contacto y Ubicación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card shadow-sm border-none">
                        <div className="flex items-center gap-2 mb-6 text-md font-bold text-gray-900 border-b pb-4">
                            <Mail className="h-5 w-5 text-blue-600" />
                            Contacto
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico Corporativo</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        className="input pl-10"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono de Contacto</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className="input pl-10"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sitio Web</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="url"
                                        className="input pl-10"
                                        placeholder="https://www.tuempresa.com"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-none">
                        <div className="flex items-center gap-2 mb-6 text-md font-bold text-gray-900 border-b pb-4">
                            <MapPin className="h-5 w-5 text-red-600" />
                            Ubicación
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección Principal</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ciudad</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado / Prov.</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">País</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Flotante de Acciones */}
                <div className="sticky bottom-6 flex justify-end gap-3 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100">
                    <button
                        type="button"
                        onClick={() => tenant && setFormData({
                            name: tenant.name,
                            tax_id: tenant.tax_id || '',
                            email: tenant.email || '',
                            phone: tenant.phone || '',
                            website: tenant.website || '',
                            address: tenant.address || '',
                            city: tenant.city || '',
                            state: tenant.state || '',
                            country: tenant.country || '',
                            logo_url: tenant.logo_url || '',
                        })}
                        className="btn btn-secondary px-6 font-bold"
                        disabled={!isDirty}
                    >
                        Descartar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary px-8 flex items-center gap-2 shadow-lg shadow-primary-200 font-bold"
                        disabled={updateMutation.isPending || !isDirty}
                    >
                        <Save className="h-5 w-5" />
                        {updateMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>

            <div className="card bg-gray-900 border-none text-gray-400 mt-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <h4 className="text-white font-bold text-sm">Información de Seguridad</h4>
                        <p className="text-xs">Los datos proporcionados serán utilizados exclusivamente para la generación de documentos legales dentro de la plataforma.</p>
                    </div>
                    <div className="text-right text-[10px] space-y-0.5 opacity-50 font-mono">
                        <p>ID_TENANT: {tenant?.id}</p>
                        <p>TIMESTAMP: {tenant?.created_at}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
