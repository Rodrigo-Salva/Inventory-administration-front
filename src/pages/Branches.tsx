import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Building2,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { branchApi, Branch } from '../api/branches';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { usePermissions } from '@/hooks/usePermissions';
import DetailModal from '@/components/common/DetailModal';
import clsx from 'clsx';

export const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<{ id: number, name: string } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { hasPermission } = usePermissions();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    is_active: true
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const { data } = await branchApi.getAll();
      setBranches(data.items);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await branchApi.update(editingBranch.id, formData);
        toast.success('Sucursal actualizada con éxito');
      } else {
        await branchApi.create(formData);
        toast.success('Sucursal creada con éxito');
      }
      setIsModalOpen(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', is_active: true });
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error('Error al guardar la sucursal');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      is_active: branch.is_active
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number, name: string) => {
    setBranchToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (branchToDelete) {
      try {
        await branchApi.delete(branchToDelete.id);
        toast.success('Sucursal eliminada con éxito');
        fetchBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
        toast.error('Error al eliminar la sucursal');
      } finally {
        setIsDeleteModalOpen(false);
        setBranchToDelete(null);
      }
    }
  };



  if (!hasPermission('branches:view')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <Store className="h-16 w-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
        <p className="text-gray-500 mt-2">No tienes permisos para ver las sucursales.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600" />
            Sucursales
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestione las sucursales y puntos de venta de su negocio
          </p>
        </div>
        
        {hasPermission('branches:create') && (
          <button
            onClick={() => {
              setEditingBranch(null);
              setFormData({ name: '', address: '', phone: '', is_active: true });
              setIsModalOpen(true);
            }}
            className="mt-4 sm:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Sucursal
          </button>
        )}
      </div>

      {/* Grid of Branches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div key={branch.id} className="card group hover:border-primary-200 hover:shadow-xl transition-all border-none shadow-lg shadow-gray-200/50 flex flex-col p-5 h-full bg-white rounded-3xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-white flex items-center justify-center text-primary-500 group-hover:bg-primary-50 transition-colors border border-gray-100 group-hover:border-primary-100 shadow-sm">
                  <Building2 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-primary-700 transition-colors line-clamp-1">{branch.name}</h3>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-md ${
                  branch.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {branch.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="mt-6 space-y-3.5 flex-1 pl-1">
              {branch.phone && (
                <div className="flex items-center gap-4 text-sm group/item">
                  <Phone className="h-4 w-4 text-gray-400 group-hover/item:text-primary-500 transition-colors" />
                  <span className="font-medium text-gray-600">{branch.phone}</span>
                </div>
              )}
              {branch.address && (
                <div className="flex items-center gap-4 text-sm group/item">
                  <MapPin className="h-4 w-4 text-gray-400 group-hover/item:text-primary-500 transition-colors" />
                  <span className="font-medium text-gray-600 truncate">{branch.address}</span>
                </div>
              )}
            </div>

            <div className="mt-8 pt-5 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                VER DETALLES
              </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedBranch(branch);
                        setIsDetailModalOpen(true);
                      }}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Ver Detalles"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {hasPermission('branches:edit') && (
                      <button
                        onClick={() => handleEdit(branch)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                    )}
                    {hasPermission('branches:delete') && (
                      <button
                        onClick={() => handleDeleteClick(branch.id, branch.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
            </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Sin sucursales</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Comience agregando su primera sucursal para poder gestionar inventario en múltiples locaciones.
            </p>
            {hasPermission('branches:create') && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Agregar sucursal
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar Sucursal?"
        message={`¿Estás seguro de que deseas eliminar la sucursal "${branchToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Sucursal"
        type="danger"
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="branch-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección (Opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={255}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="tel"
                    maxLength={50}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-gray-50/50"
                  />
                </div>

              </form>
              
              <div className="mt-6 flex items-center justify-between p-3 bg-white rounded-xl border">
                <span className="text-sm font-semibold text-gray-700">Estado de la Sucursal</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-white rounded-xl border border-gray-200 transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="branch-form"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedBranch?.name || "Detalles de Sucursal"}
        subtitle={selectedBranch?.address || "Sin Dirección"}
        icon={Store}
        statusBadge={
          selectedBranch && (
            <span className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
              selectedBranch.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {selectedBranch.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {selectedBranch.is_active ? "Activa" : "Inactiva"}
            </span>
          )
        }
        sections={[
          {
            title: "Información General",
            fields: [
              { label: "Nombre de Sucursal", value: selectedBranch?.name },
              { label: "Teléfono", value: selectedBranch?.phone || "N/A" },
              { label: "Dirección", value: selectedBranch?.address, fullWidth: true },
            ]
          },
          {
            title: "Fechas",
            fields: [
              { label: "Fecha de Registro", value: selectedBranch ? new Date(selectedBranch.created_at).toLocaleString() : "" },
              { label: "Última Actualización", value: selectedBranch ? new Date(selectedBranch.updated_at).toLocaleString() : "" },
            ]
          }
        ]}
        footerActions={
          <>
            {hasPermission('branches:edit') && (
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  if (selectedBranch) handleEdit(selectedBranch);
                }}
                className="flex-[1.5] h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-95"
              >
                <Edit2 className="h-5 w-5" />
                Editar Sucursal
              </button>
            )}
          </>
        }
      />
    </div>
  );
};
