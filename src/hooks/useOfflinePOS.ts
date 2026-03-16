import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/posDb';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export function useOfflinePOS() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada. Sincronizando...', { icon: '🌐' });
      syncPendingSales();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sin conexión. Trabajando en modo offline.', { icon: '📶' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Precargar datos para uso offline
  const precacheData = useCallback(async () => {
    if (!isOnline) return;
    
    try {
      // 1. Productos
      const prodRes = await api.get('/api/v1/products/?size=1000&is_active=true');
      await db.products.clear();
      await db.products.bulkAdd(prodRes.data.items);
      
      // 2. Clientes
      const custRes = await api.get('/api/v1/customers/active');
      await db.customers.clear();
      await db.customers.bulkAdd(custRes.data);
      
      console.log('Datos precargados en IndexedDB para modo offline');
    } catch (err) {
      console.error('Error precargando datos offline:', err);
    }
  }, [isOnline]);

  useEffect(() => {
    // Retrasar ligeramente la precarga para no saturar el backend en el arranque
    const timer = setTimeout(() => {
        precacheData();
    }, 1000);
    return () => clearTimeout(timer);
  }, [precacheData]);

  // Sincronizar ventas pendientes
  const syncPendingSales = async () => {
    const pendingCount = await db.pendingSales.count();
    if (pendingCount === 0 || isSyncing) return;

    setIsSyncing(true);
    const pending = await db.pendingSales.toArray();
    let successCount = 0;

    for (const sale of pending) {
      try {
        await api.post('/api/v1/sales/', sale.saleData);
        await db.pendingSales.delete(sale.id!);
        successCount++;
      } catch (err) {
        console.error(`Error sincronizando venta ${sale.id}:`, err);
        // Si es 4xx o 5xx, podrías decidir si borrarla o no.
        // Por ahora la dejamos para intentar después o que el usuario la vea.
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} ventas sincronizadas exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
    setIsSyncing(false);
  };

  const saveSale = async (saleData: any) => {
    if (isOnline) {
      try {
        const res = await api.post('/api/v1/sales/', saleData);
        return { success: true, data: res.data, offline: false };
      } catch (err: any) {
        if (err.code === 'ERR_NETWORK' || !navigator.onLine) {
          // Si falló por red inesperada, guardar offline
          await db.pendingSales.add({
            saleData,
            createdAt: Date.now()
          });
          return { success: true, data: null, offline: true };
        }
        throw err;
      }
    } else {
      // Modo offline explícito
      await db.pendingSales.add({
        saleData,
        createdAt: Date.now()
      });
      return { success: true, data: null, offline: true };
    }
  };

  return {
    isOnline,
    isSyncing,
    saveSale,
    syncPendingSales,
    precacheData
  };
}
