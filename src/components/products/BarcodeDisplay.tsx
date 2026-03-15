import { useState, useEffect } from 'react';
import api from '@/api/client';
import { Barcode, QrCode, Download, Printer, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeDisplayProps {
  data: string; // SKU or Barcode
  name: string;
}

export default function BarcodeDisplay({ data, name }: BarcodeDisplayProps) {
  const [barcodeImg, setBarcodeImg] = useState<string | null>(null);
  const [qrImg, setQrImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const [bcRes, qrRes] = await Promise.all([
        api.get(`/api/v1/barcodes/generate/${data}`),
        api.get(`/api/v1/barcodes/qr/${data}`)
      ]);
      setBarcodeImg(bcRes.data.image);
      setQrImg(qrRes.data.image);
    } catch (error) {
      toast.error("Error al cargar representaciones visuales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) fetchCodes();
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Generando códigos...</p>
      </div>
    );
  }

  const downloadImage = (base64: string, type: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `${type}_${data}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Barcode Section */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2 self-start mb-2">
            <Barcode className="h-4 w-4 text-primary-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Código de Barras</span>
          </div>
          {barcodeImg && (
            <>
              <img src={barcodeImg} alt="Barcode" className="max-w-full h-auto" />
              <div className="flex gap-2 w-full mt-4">
                <button 
                  onClick={() => downloadImage(barcodeImg, 'barcode')}
                  className="flex-1 flex items-center justify-center gap-2 h-10 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all text-[10px] font-bold uppercase"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </button>
              </div>
            </>
          )}
        </div>

        {/* QR Section */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2 self-start mb-2">
            <QrCode className="h-4 w-4 text-primary-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Código QR</span>
          </div>
          {qrImg && (
            <>
              <img src={qrImg} alt="QR Code" className="w-32 h-32" />
              <div className="flex gap-2 w-full mt-4">
                <button 
                  onClick={() => downloadImage(qrImg, 'qr')}
                  className="flex-1 flex items-center justify-center gap-2 h-10 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all text-[10px] font-bold uppercase"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-primary-50 p-4 rounded-2xl flex items-center gap-3 border border-primary-100">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Printer className="h-4 w-4 text-primary-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-primary-900 uppercase">Impresión Rápida de Etiquetas</p>
          <p className="text-[10px] text-primary-600 font-medium leading-tight">Usa estos códigos para etiquetar físicamente tus productos en el almacén.</p>
        </div>
      </div>
    </div>
  );
}
