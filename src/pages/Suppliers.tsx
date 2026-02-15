import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Building2, Mail, Phone, MapPin } from 'lucide-react'
import type { Supplier, PaginatedResponse } from '@/types'

export default function Suppliers() {
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery<PaginatedResponse<Supplier>>({
        queryKey: ['suppliers', page],
        queryFn: async () => {
            const response = await api.get(`/api/v1/suppliers/?page=${page}&size=10`)
            return response.data
        },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
                    <p className="mt-1 text-sm text-gray-600">Gestión de proveedores</p>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando proveedores...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {data?.items.map((supplier) => (
                            <div key={supplier.id} className="card">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                                            <Building2 className="h-6 w-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                                            <p className="text-sm text-gray-500">{supplier.code}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {supplier.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {supplier.contact_name && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="font-medium">Contacto:</span>
                                            <span>{supplier.contact_name}</span>
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="h-4 w-4" />
                                            <span>{supplier.email}</span>
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="h-4 w-4" />
                                            <span>{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.city && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4" />
                                            <span>
                                                {supplier.city}
                                                {supplier.state && `, ${supplier.state}`}
                                                {supplier.country && ` - ${supplier.country}`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {supplier.notes && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">{supplier.notes}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {data && data.metadata.pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn btn-secondary"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-700">
                                Página {page} de {data.metadata.pages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(data.metadata.pages, p + 1))}
                                disabled={page === data.metadata.pages}
                                className="btn btn-secondary"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
