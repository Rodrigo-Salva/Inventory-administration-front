import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
    keepOpen?: boolean;
}

export default function BarcodeScanner({ onScan, onClose, keepOpen = false }: BarcodeScannerProps) {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText: string) => {
                onScan(decodedText);
                if (!keepOpen) {
                    scanner.clear();
                    onClose();
                }
            },
            (_error: any) => {
                // Silently ignore errors as they happen on every frame if no code is found
            }
        );

        return () => {
            scanner.clear().catch((error: any) => console.error("Failed to clear scanner", error));
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
            <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-white/20 shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Escanear Código</h3>
                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Coloca el código frente a la cámara</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-gray-50 rounded-2xl transition-all group"
                    >
                        <X className="h-6 w-6 text-gray-300 group-hover:text-red-500" />
                    </button>
                </div>
                
                <div className="p-8">
                    <div id="reader" className="w-full"></div>
                </div>

                <div className="p-6 bg-gray-50/50 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Compatible con Códigos de Barras y QR
                    </p>
                </div>
            </div>
        </div>
    );
}
