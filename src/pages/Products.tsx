import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import toast from "react-hot-toast";
import {
    Plus, Edit, Trash2, Search, X, Package, DollarSign, Layers, History,
    PlusCircle, MinusCircle, Filter,
    Barcode, Building2, ArrowUpRight, ArrowDownRight, UploadCloud, FileDown,
    Printer, Tag
} from 'lucide-react'
import clsx from "clsx";
import type { Product, PaginatedResponse, Category, Supplier } from "@/types";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import Pagination from "@/components/common/Pagination";
import DateRangePicker from "@/components/common/DateRangePicker";

export default function Products() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isQuickMoveModalOpen, setIsQuickMoveModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [quickMoveType, setQuickMoveType] = useState<"entry" | "exit">("entry");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printQuantity, setPrintQuantity] = useState(12)
  const [productToPrint, setProductToPrint] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category_id: "",
    supplier_id: "",
    price: "",
    cost: "",
    stock: "0",
    min_stock: "5",
    max_stock: "",
    is_active: true,
  });
  const [quickMoveData, setQuickMoveData] = useState({
    quantity: "",
    reference: "",
    notes: "",
  });

  // Modal de confirmación de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const queryClient = useQueryClient();

  // 1. Cargar Productos con Filtros
  const { data: productData, isLoading } = useQuery<PaginatedResponse<Product>>(
    {
      queryKey: [
        "products",
        page,
        search,
        filterCategory,
        filterSupplier,
        filterStatus,
        startDate,
        endDate,
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          page: page.toString(),
          size: "10",
          ...(search && { search }),
          ...(filterCategory && { category_id: filterCategory }),
          ...(filterSupplier && { supplier_id: filterSupplier }),
          ...(filterStatus !== "all" && {
            is_active: filterStatus === "active" ? "true" : "false",
          }),
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
        });
        const response = await api.get(`/api/v1/products/?${params}`);
        return response.data;
      },
    },
  );

  // Resetear a la página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [
    search,
    filterCategory,
    filterSupplier,
    filterStatus,
    startDate,
    endDate,
  ]);

  // 2. Cargar Categorías para el selector
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories-flat-all"],
    queryFn: async () => {
      const response = await api.get("/api/v1/categories/?size=200");
      return response.data.items || [];
    },
  });

  // 3. Cargar Proveedores para el selector
  const { data: suppliers } = useQuery<PaginatedResponse<Supplier>>({
    queryKey: ["suppliers-all"],
    queryFn: async () => {
      const response = await api.get("/api/v1/suppliers/?size=100");
      return response.data;
    },
  });

  // 4. Cargar Historial de un Producto
  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ["product-movements", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return null;
      const response = await api.get(
        `/api/v1/inventory/?product_id=${selectedProduct.id}&size=50`,
      );
      return response.data;
    },
    enabled: !!selectedProduct && isHistoryModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/v1/products/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto creado");
      closeModal();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || "Error al crear"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/api/v1/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto actualizado");
      closeModal();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || "Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto eliminado");
    },
    onError: () => toast.error("Error al eliminar producto"),
  });

  const quickMoveMutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint =
        quickMoveType === "entry"
          ? "/api/v1/inventory/add-stock"
          : "/api/v1/inventory/remove-stock";
      return api.post(endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        quickMoveType === "entry" ? "Entrada registrada" : "Salida registrada",
      );
      setIsQuickMoveModalOpen(false);
      setQuickMoveData({ quantity: "", reference: "", notes: "" });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || "Error en movimiento"),
  });

  const bulkImportMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/v1/products/bulk", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      const { created, skipped, errors } = res.data;
      toast.success(
        `Importación terminada: ${created} creados, ${skipped} omitidos`,
      );
      if (errors.length > 0) {
        console.error("Errores de importación:", errors);
        toast.error(`Hubo ${errors.length} errores (ver consola)`);
      }
      setIsImportModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || "Error al importar"),
  });

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || "",
        description: product.description || "",
        category_id: product.category_id?.toString() || "",
        supplier_id: product.supplier_id?.toString() || "",
        price: product.price.toString(),
        cost: product.cost?.toString() || "",
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
        max_stock: product.max_stock?.toString() || "",
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        description: "",
        category_id: "",
        supplier_id: "",
        price: "",
        cost: "",
        stock: "0",
        min_stock: "5",
        max_stock: "",
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleQuickMoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    quickMoveMutation.mutate({
      product_id: selectedProduct.id,
      quantity: parseInt(quickMoveData.quantity),
      reference: quickMoveData.reference,
      notes: quickMoveData.notes,
    });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      bulkImportMutation.mutate(formData);
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(filterCategory && { category_id: filterCategory }),
        ...(filterSupplier && { supplier_id: filterSupplier }),
        ...(filterStatus !== "all" && {
          is_active: filterStatus === "active" ? "true" : "false",
        }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      });

      toast.loading("Generando Excel...", { id: "export-excel" });
      const response = await api.get(
        `/api/v1/reports/inventory-excel?${params}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Productos_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel generado correctamente", { id: "export-excel" });
    } catch (error) {
      toast.error("Error al generar Excel", { id: "export-excel" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
      price: parseFloat(formData.price),
      cost: formData.cost ? parseFloat(formData.cost) : null,
      stock: parseInt(formData.stock),
      min_stock: parseInt(formData.min_stock),
      max_stock: formData.max_stock ? parseInt(formData.max_stock) : null,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
      setIsDeleteModalOpen(false);
    }
  };

  const handlePrintLabels = (product: Product) => {
    setProductToPrint(product)
    setPrintQuantity(12)
    setIsPrintModalOpen(true)
  }

  const executePrint = async () => {
    if (!productToPrint) return

    const quantity = printQuantity
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Por favor ingresa un número válido")
      return
    }

    const toastId = toast.loading('Generando etiquetas PDF...')
    try {
      const response = await api.get(`/api/v1/products/${productToPrint.id}/labels?quantity=${quantity}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Etiquetas_${productToPrint.sku}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Etiquetas generadas con éxito', { id: toastId })
      setIsPrintModalOpen(false)
    } catch (error) {
      toast.error('Error al generar etiquetas', { id: toastId })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestión de productos del inventario
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:gap-3">
          <button
            onClick={() => setIsFiltersVisible(true)}
            className={clsx(
              "btn flex items-center gap-2 h-10 px-4 transition-all border shadow-sm rounded-xl text-xs uppercase tracking-widest font-bold",
              filterCategory ||
                filterSupplier ||
                filterStatus !== "all" ||
                startDate ||
                endDate
                ? "bg-primary-50 border-primary-200 text-primary-700 font-bold"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
            )}
          >
            <Filter className="h-4 w-4" />
            Filtrar
            {(filterCategory ||
              filterSupplier ||
              filterStatus !== "all" ||
              startDate ||
              endDate) && (
              <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="btn btn-secondary flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest"
          >
            <UploadCloud className="h-5 w-5 text-gray-400" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button
            onClick={() => openModal()}
            className="btn btn-primary flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary-200"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          className="input pl-12 h-12 text-base bg-white border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl focus:ring-primary-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card border-none shadow-sm">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-600 font-medium">
              Cargando catálogo...
            </p>
          </div>
        ) : (
          <>
            {/* Vista de Tabla (Desktop) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      SKU / Código
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {productData?.items.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-primary-50/10 transition-colors group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white transition-all border border-transparent group-hover:border-gray-100 shadow-sm group-hover:shadow-md">
                            <Package className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors uppercase">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                          {product.sku}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-700">
                            {product.category?.name || "---"}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 italic">
                            ID: {product.category_id || "---"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-right font-black text-gray-900">
                        $
                        {Number(product.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={clsx(
                              "text-sm font-bold",
                              product.stock <= product.min_stock
                                ? "text-red-600"
                                : "text-emerald-600",
                            )}
                          >
                            {product.stock}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            unidades
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setQuickMoveType("entry");
                              setIsQuickMoveModalOpen(true);
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Entrada"
                          >
                            <PlusCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setQuickMoveType("exit");
                              setIsQuickMoveModalOpen(true);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Salida"
                          >
                            <MinusCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(product)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handlePrintLabels(product)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Imprimir Etiquetas"
                          >
                            <Printer className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete({
                                id: product.id,
                                name: product.name,
                              });
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de Tarjetas (Móvil) */}
            <div className="lg:hidden space-y-4">
              {productData?.items.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase leading-tight">
                          {product.name}
                        </h3>
                        <p className="text-[10px] font-mono font-bold text-gray-400 mt-0.5 tracking-wider">
                          {product.sku}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900">
                        ${Number(product.price).toLocaleString()}
                      </span>
                      <div
                        className={clsx(
                          "mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block",
                          product.stock <= product.min_stock
                            ? "bg-red-50 text-red-600"
                            : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        {product.stock} UNIDADES
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        Categoría
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        {product.category?.name || "---"}
                      </span>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setQuickMoveType("entry");
                          setIsQuickMoveModalOpen(true);
                        }}
                        className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl"
                        title="Entrada"
                      >
                        <PlusCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setQuickMoveType("exit");
                          setIsQuickMoveModalOpen(true);
                        }}
                        className="p-2.5 text-amber-600 bg-amber-50 rounded-xl"
                        title="Salida"
                      >
                        <MinusCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePrintLabels(product)}
                        className="p-2.5 text-indigo-600 bg-indigo-50 rounded-xl"
                        title="Etiquetas"
                      >
                        <Printer className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openModal(product)}
                        className="p-2.5 text-primary-600 bg-primary-50 rounded-xl"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setProductToDelete({
                            id: product.id,
                            name: product.name,
                          });
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2.5 text-red-600 bg-red-50 rounded-xl"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={productData?.metadata.pages || 0}
              onPageChange={setPage}
              totalItems={productData?.metadata.total}
            />
          </>
        )}
      </div>
      {/* Modal de Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar producto?"
        message={`¿Estás seguro de que deseas eliminar el producto "${productToDelete?.name}"? Esta acción será permanente.`}
        type="danger"
      />
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
              onClick={closeModal}
            />
            <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-2xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary-600" />
                  {editingProduct
                    ? "Editar Producto"
                    : "Agregar nuevo Producto"}
                </h3>

                <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                  {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <div className="h-6 w-1 bg-primary-600 rounded-full"></div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                        1. Información General
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Nombre del Producto *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Laptop Dell XPS 13..."
                          className="input focus:ring-2 focus:ring-primary-500 shadow-sm"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          SKU / Referencia *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="AUTO-GENERADO-001"
                          className="input font-mono text-xs shadow-sm bg-gray-50/50"
                          value={formData.sku}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sku: e.target.value.toUpperCase(),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Código de Barras
                        </label>
                        <div className="relative">
                          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="750123456789..."
                            className="input pl-9 font-mono text-xs shadow-sm"
                            value={formData.barcode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                barcode: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          className="input min-h-[80px] py-3 resize-none text-sm shadow-sm"
                          placeholder="Detalles técnicos, características, etc..."
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: PRECIOS E INVENTARIO */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                        2. Precios e Inventario
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="col-span-2 lg:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Precio de Venta *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                          <input
                            type="number"
                            step="0.01"
                            required
                            className="input pl-9 font-bold text-gray-900 border-emerald-100 focus:border-emerald-500 transition-colors shadow-sm"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                price: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="col-span-2 lg:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Costo de Compra
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            className="input pl-9 text-gray-600 bg-gray-50/30 border-gray-200 shadow-sm"
                            value={formData.cost}
                            onChange={(e) =>
                              setFormData({ ...formData, cost: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                          Stock Inicial
                        </label>
                        <input
                          type="number"
                          required
                          disabled={!!editingProduct}
                          className={clsx(
                            "input text-center h-11 font-black",
                            editingProduct
                              ? "bg-gray-100 text-gray-400 border-gray-200"
                              : "bg-primary-50 border-primary-200 text-primary-700",
                          )}
                          value={formData.stock}
                          onChange={(e) =>
                            setFormData({ ...formData, stock: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                          Stock Mín.
                        </label>
                        <input
                          type="number"
                          required
                          className="input text-center h-11 border-red-100 text-red-700 font-bold focus:border-red-500"
                          value={formData.min_stock}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              min_stock: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                          Stock Máximo
                        </label>
                        <input
                          type="number"
                          placeholder="Ilimitado"
                          className="input h-11 text-center"
                          value={formData.max_stock}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              max_stock: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 3: CLASIFICACIÓN */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                        3. Clasificación y Estado
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Categoría
                        </label>
                        <div className="relative">
                          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            className="input pl-9 shadow-sm"
                            value={formData.category_id}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category_id: e.target.value,
                              })
                            }
                          >
                            <option value="">Sin Categoría</option>
                            {categories?.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Proveedor Principal
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            className="input pl-9 shadow-sm"
                            value={formData.supplier_id}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                supplier_id: e.target.value,
                              })
                            }
                          >
                            <option value="">Sin Proveedor</option>
                            {suppliers?.items.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          Estado del Producto
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          Define si el producto está disponible para
                          transacciones
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.is_active}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_active: e.target.checked,
                            })
                          }
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-gray-50">
                    <button
                      type="button"
                      className="btn btn-secondary flex-1 h-12 font-bold text-sm uppercase tracking-wider"
                      onClick={closeModal}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1 h-12 font-bold text-sm uppercase tracking-wider shadow-xl shadow-primary-100"
                      disabled={
                        createMutation.isPending || updateMutation.isPending
                      }
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Procesando..."
                        : editingProduct
                          ? "Actualizar Producto"
                          : "Crear Producto"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial (Timeline) */}
      {isHistoryModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm"
              onClick={() => setIsHistoryModalOpen(false)}
            />
            <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-8">
                <header className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <History className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Kardex de Inventario
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedProduct.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex bg-gray-50 p-3 rounded-xl border border-gray-100 mt-4 justify-between items-center">
                    <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                      {selectedProduct.sku}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">
                        Stock Actual
                      </span>
                      <span className="text-lg font-black text-primary-600">
                        {selectedProduct.stock}
                      </span>
                    </div>
                  </div>
                </header>

                {isLoadingMovements ? (
                  <div className="py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-100 before:to-transparent">
                    {movementsData?.items.map((m: any) => (
                      <div key={m.id} className="relative pl-12 group">
                        <div
                          className={clsx(
                            "absolute left-0 mt-1 h-10 w-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                            m.movement_type === "entry" &&
                              "bg-green-500 text-white",
                            m.movement_type === "exit" &&
                              "bg-red-500 text-white",
                            m.movement_type === "adjustment" &&
                              "bg-blue-500 text-white",
                          )}
                        >
                          {m.movement_type === "entry" && (
                            <ArrowUpRight className="h-5 w-5" />
                          )}
                          {m.movement_type === "exit" && (
                            <ArrowDownRight className="h-5 w-5" />
                          )}
                          {m.movement_type === "adjustment" && (
                            <History className="h-5 w-5" />
                          )}
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                              {new Date(m.created_at).toLocaleString()}
                            </span>
                            <span
                              className={clsx(
                                "text-sm font-black",
                                m.quantity > 0
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-800 capitalize">
                            {m.movement_type}
                          </p>
                          {m.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              "{m.notes}"
                            </p>
                          )}
                          <div className="mt-3 flex gap-4 text-[10px] font-bold text-gray-400 border-t pt-3 border-gray-50">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                              ANTES: {m.stock_before}
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-200"></div>
                              DESPUÉS: {m.stock_after}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {movementsData?.items.length === 0 && (
                      <div className="text-center py-12 text-gray-500 italic text-sm">
                        No hay historial registrado para este producto.
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="w-full btn btn-secondary h-12 font-bold"
                  >
                    Cerrar Historial
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Movimiento Rápido */}
      {isQuickMoveModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm"
              onClick={() => setIsQuickMoveModalOpen(false)}
            />
            <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {quickMoveType === "entry"
                    ? "Entrada de Stock"
                    : "Salida de Stock"}
                </h3>
                <div className="p-3 bg-gray-50 rounded-xl mb-4 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Package className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase">
                      {selectedProduct.sku}
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {selectedProduct.name}
                    </div>
                  </div>
                </div>
                <form onSubmit={handleQuickMoveSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="input"
                      value={quickMoveData.quantity}
                      onChange={(e) =>
                        setQuickMoveData({
                          ...quickMoveData,
                          quantity: e.target.value,
                        })
                      }
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Referencia / Folio
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={quickMoveData.reference}
                      onChange={(e) =>
                        setQuickMoveData({
                          ...quickMoveData,
                          reference: e.target.value,
                        })
                      }
                      placeholder="Ej: Factura #123"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsQuickMoveModalOpen(false)}
                      className="btn btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={clsx(
                        "btn flex-1 text-white font-bold",
                        quickMoveType === "entry"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700",
                      )}
                      disabled={quickMoveMutation.isPending}
                    >
                      {quickMoveMutation.isPending
                        ? "Procesando..."
                        : quickMoveType === "entry"
                          ? "Cargar Entrada"
                          : "Registrar Salida"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm"
              onClick={() => setIsImportModalOpen(false)}
            />
            <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-lg">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Importar Productos
                      </h3>
                      <p className="text-sm text-gray-500">
                        Carga masiva desde archivo CSV
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                  <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <FileDown className="h-4 w-4" /> Instrucciones
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                    <li>
                      El archivo debe ser formato <strong>CSV</strong> (separado
                      por comas).
                    </li>
                    <li>
                      Columnas obligatorias:{" "}
                      <strong>nombre, sku, precio, stock</strong>.
                    </li>
                    <li>
                      Columnas opcionales: barcode, descripcion, costo, minimo.
                    </li>
                    <li>Si el SKU ya existe, el producto será omitido.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={bulkImportMutation.isPending}
                    />
                    <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <div className="text-sm font-bold text-gray-600">
                      {bulkImportMutation.isPending
                        ? "Subiendo y procesando..."
                        : "Haz clic o arrastra tu archivo CSV aquí"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Límite recomendado: 100 productos por carga
                    </div>
                  </div>

                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="btn btn-secondary w-full"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Filtros (Ventana Flotante) */}
      {isFiltersVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsFiltersVisible(false)}
            />

            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div className="bg-white px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                    <Filter className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                    Filtros Avanzados
                  </h3>
                </div>
                <button
                  onClick={() => setIsFiltersVisible(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-50 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="px-6 py-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Categoría
                    </label>
                    <select
                      className="input h-12 bg-gray-50 border-gray-100 rounded-xl text-sm font-medium focus:bg-white transition-all shadow-sm"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="">Todas las categorías</option>
                      {categories?.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Proveedor
                    </label>
                    <select
                      className="input h-12 bg-gray-50 border-gray-100 rounded-xl text-sm font-medium focus:bg-white transition-all shadow-sm"
                      value={filterSupplier}
                      onChange={(e) => setFilterSupplier(e.target.value)}
                    >
                      <option value="">Todos los proveedores</option>
                      {suppliers?.items.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Estado
                    </label>
                    <select
                      className="input h-12 bg-gray-50 border-gray-100 rounded-xl text-sm font-medium focus:bg-white transition-all shadow-sm"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                      <option value="all">Todos los productos</option>
                      <option value="active">Solo Activos</option>
                      <option value="inactive">Solo Inactivos</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onChange={({ start, end }) => {
                        setStartDate(start);
                        setEndDate(end);
                      }}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
                  <button
                    onClick={handleExportExcel}
                    className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-200"
                  >
                    <FileDown className="h-5 w-5" />
                    Exportar Inventario a Excel
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setSearch("");
                        setFilterCategory("");
                        setFilterSupplier("");
                        setFilterStatus("all");
                        setStartDate("");
                        setEndDate("");
                        setIsFiltersVisible(false);
                      }}
                      className="btn border border-gray-200 text-gray-500 h-11 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 shadow-sm"
                    >
                      Limpiar Filtros
                    </button>
                    <button
                      onClick={() => setIsFiltersVisible(false)}
                      className="btn btn-primary h-11 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary-200"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impresión de Etiquetas - ESTILO CARD PREMIUM */}
      {isPrintModalOpen && productToPrint && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm"
              onClick={() => setIsPrintModalOpen(false)}
            />
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
              {/* Header idéntico al de filtros */}
              <div className="bg-white px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Printer className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                    Imprimir Etiquetas
                  </h3>
                </div>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-50 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Contenido con espaciado y estilo de etiquetas */}
              <div className="px-6 py-8 space-y-8">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-primary-500 shadow-sm border border-gray-50">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Item Seleccionado</p>
                      <p className="text-sm font-bold text-gray-900">{productToPrint.name}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">
                    Cantidad de Etiquetas
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setPrintQuantity(Math.max(1, printQuantity - 1))}
                        className="h-12 w-12 rounded-xl border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                      >
                        <MinusCircle className="h-5 w-5" />
                      </button>
                      <input 
                        type="number" 
                        className="w-24 h-12 text-center text-xl font-black bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={printQuantity}
                        onChange={(e) => setPrintQuantity(parseInt(e.target.value) || 0)}
                      />
                      <button 
                        onClick={() => setPrintQuantity(printQuantity + 1)}
                        className="h-12 w-12 rounded-xl border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                      >
                        <PlusCircle className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-2">
                      {[12, 24, 48].map((n) => (
                        <button
                          key={n}
                          onClick={() => setPrintQuantity(n)}
                          className={clsx(
                            "h-12 rounded-xl text-xs font-bold border transition-all uppercase tracking-wider",
                            printQuantity === n 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                              : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                          )}
                        >
                          {n} Und.
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer de botones estilo filtros */}
                <div className="pt-8 border-t border-gray-50 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsPrintModalOpen(false)}
                      className="btn border border-gray-200 text-gray-500 h-12 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 shadow-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={executePrint}
                      className="btn bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-200"
                    >
                      <FileDown className="h-5 w-5 mr-2" />
                      Generar PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
