import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Configuramos el scanner
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
          ]
        },
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
          if (scannerRef.current) {
            scannerRef.current.clear().catch(error => {
               console.error("Failed to clear html5QrcodeScanner. ", error);
            });
          }
        },
        () => {
          // Error handler
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner on unmount. ", error);
        });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-white bg-opacity-70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white p-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
            Escanear Código
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-600 "
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
            <div id="reader" className="overflow-hidden rounded-xl border border-gray-100 "></div>
            <p className="mt-4 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                Centra el código de barras o QR en el cuadro
            </p>
        </div>
      </div>
    </div>
  );
}
