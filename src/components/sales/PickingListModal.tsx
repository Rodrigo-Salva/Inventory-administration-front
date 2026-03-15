import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { MapPin, Printer, X, ClipboardCheck } from 'lucide-react'

interface PickingItem {
    item_id: number;
    product_id: number;
    product_name: string;
    sku: string;
    quantity: number;
    aisle: string | null;
    shelf: string | null;
    bin: string | null;
    location_str: string;
}

interface PickingListModalProps {
    saleId: number;
    onClose: () => void;
}

export default function PickingListModal({ saleId, onClose }: PickingListModalProps) {
    const { data: items, isLoading } = useQuery<PickingItem[]>({
        queryKey: ["picking-list", saleId],
        queryFn: async () => {
            const response = await api.get(`/api/v1/sales/${saleId}/picking-list`)
            return response.data
        }
    })

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3 text-slate-900">
                        <div className="p-2 bg-primary-600 rounded-lg shadow-lg shadow-primary-600/20">
                            <ClipboardCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest leading-none">Lista de Surtido</h2>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Venta #{saleId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePrint}
                            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-primary-600 transition-colors border border-transparent hover:border-slate-200"
                            title="Imprimir"
                        >
                            <Printer className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors border border-transparent hover:border-slate-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 print:p-0">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 print:hidden">
                        <MapPin className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            Esta lista está ordenada por <strong>Pasillo, Estante y Gaveta</strong> para optimizar tu recorrido en bodega.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando ubicaciones...</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {items?.map((item, index) => (
                                <div 
                                    key={item.item_id} 
                                    className="group bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:border-primary-200 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center font-black text-slate-300 text-xs border border-slate-100 group-hover:bg-primary-50 group-hover:text-primary-400 transition-colors">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 leading-tight">{item.product_name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded leading-none uppercase">{item.sku || 'SIN SKU'}</span>
                                                <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded leading-none">CANT: {item.quantity}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-lg shadow-sm">
                                            <MapPin className="h-3 w-3 text-primary-400" />
                                            <span className="text-xs font-black text-white tracking-widest">{item.location_str}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center print:hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">
                        Orden de surtido optimizado v1.0
                    </p>
                    <button 
                        onClick={onClose}
                        className="btn btn-secondary"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            {/* Print Only View */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-only, .print-only * { visibility: visible; }
                    .print-only { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}} />
        </div>
    )
}
