import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalItems?: number
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems }: PaginationProps) {
    // Si no hay ítems o solo hay una página, opcionalmente podrías mostrarlo deshabilitado
    // El usuario pidió expresamente que "aparezca" el botón.

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100 rounded-b-2xl">
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-secondary text-xs uppercase font-bold"
                >
                    Anterior
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary text-xs uppercase font-bold"
                >
                    Siguiente
                </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Página <span className="text-primary-600">{currentPage}</span> de <span className="text-gray-900">{totalPages}</span>
                        {totalItems !== undefined && (
                            <> — <span className="text-gray-400">Total:</span> <span className="text-gray-900">{totalItems}</span></>
                        )}
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex gap-2" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-xl px-3 py-2 text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:border-primary-200 hover:text-primary-600 transition-all shadow-sm disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            <span className="ml-1 text-xs font-bold uppercase tracking-wider">Anterior</span>
                        </button>
                        
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-xl px-3 py-2 text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:border-primary-200 hover:text-primary-600 transition-all shadow-sm disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <span className="mr-1 text-xs font-bold uppercase tracking-wider">Siguiente</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    )
}
