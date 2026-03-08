import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { 
    Filter, User, Globe, ChevronRight 
} from 'lucide-react'
import clsx from "clsx";
import type { PaginatedResponse } from "@/types";
import Pagination from "@/components/common/Pagination";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
  id: number;
  tenant_id: number;
  user_id: number;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  action: string;
  entity_type: string;
  entity_id: number;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  description: string;
  created_at: string;
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const { data, isLoading } = useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ["audit-logs", page, action, entityType],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "20",
        ...(action && { action }),
        ...(entityType && { entity_type: entityType }),
      });
      const response = await api.get(`/api/v1/audit/?${params}`);
      return response.data;
    },
  });

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      CREATE: "bg-emerald-50  text-emerald-700  border-emerald-100 ",
      UPDATE: "bg-amber-50  text-amber-700  border-amber-100 ",
      DELETE: "bg-red-50  text-red-700  border-red-100 ",
      LOGIN: "bg-blue-50  text-blue-700  border-blue-100 ",
    };
    return (
      <span
        className={clsx(
          "px-2 py-0.5 rounded-full text-[10px] font-bold border",
          styles[action] || "bg-white  text-gray-700  border-gray-100 ",
        )}
      >
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">
            Registros de Auditoría
          </h1>
          <p className="mt-1 text-sm text-gray-600 ">
            Historial de acciones realizadas en el sistema
          </p>
        </div>
        <button
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          className={clsx(
            "btn flex items-center gap-2 h-10 px-4 transition-all border shadow-sm rounded-xl text-xs uppercase tracking-widest font-bold",
            action || entityType
              ? "bg-primary-50  border-primary-200  text-primary-700 "
              : "bg-white  border-gray-200  text-gray-600  hover:bg-white :bg-white",
          )}
        >
          <Filter className="h-4 w-4" />
          Filtrar
        </button>
      </div>

      {isFiltersVisible && (
        <div className="bg-white  p-4 rounded-2xl border border-gray-100  shadow-sm flex flex-wrap gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-400  uppercase mb-1">
              Acción
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full bg-white  border-none rounded-lg text-sm h-10 focus:ring-2 focus:ring-primary-500/20  :bg-white transition-colors"
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">Creación</option>
              <option value="UPDATE">Actualización</option>
              <option value="DELETE">Eliminación</option>
              <option value="LOGIN">Inicio de Sesión</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-400  uppercase mb-1">
              Entidad
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full bg-white  border-none rounded-lg text-sm h-10 focus:ring-2 focus:ring-primary-500/20  :bg-white transition-colors"
            >
              <option value="">Todas las entidades</option>
              <option value="Product">Productos</option>
              <option value="Category">Categorías</option>
              <option value="Supplier">Proveedores</option>
              <option value="Sale">Ventas</option>
              <option value="User">Usuarios</option>
            </select>
          </div>
        </div>
      )}

      <div className="card border-none shadow-sm ">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600  border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-600  font-medium">
              Cargando registros...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 ">
              <thead className="bg-white ">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500  uppercase tracking-wider">
                    Fecha / Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500  uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500  uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500  uppercase tracking-wider">
                    Entidad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500  uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500  uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white  divide-y divide-gray-50 ">
                {data?.items.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-primary-50/5 :bg-white/50 transition-colors group text-sm"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 ">
                          {format(new Date(log.created_at), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </span>
                        <span className="text-[10px] text-gray-400 ">
                          {format(new Date(log.created_at), "HH:mm:ss", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-white  flex items-center justify-center text-gray-400 ">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 ">
                            {log.user
                              ? `${log.user.first_name || ""} ${log.user.last_name || ""}`
                              : "Sistema"}
                          </span>
                          <span className="text-[10px] text-gray-400 ">
                            {log.user?.email || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 ">
                          {log.entity_type}
                        </span>
                        <span className="text-[10px] text-gray-400  italic">
                          ID: {log.entity_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600  line-clamp-2 max-w-xs">
                        {log.description || "Sin descripción"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center gap-2 text-gray-400 ">
                        <div className="flex flex-col items-end mr-2">
                          <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-tighter">
                            <Globe className="h-3 w-3" />{" "}
                            {log.ip_address || "---"}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={data?.metadata?.pages || 0}
          onPageChange={setPage}
          totalItems={data?.metadata?.total}
        />
      </div>
    </div>
  );
}
