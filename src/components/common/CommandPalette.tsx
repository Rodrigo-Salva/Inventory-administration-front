import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    Search, LayoutDashboard, Package, FolderTree, 
    ShoppingCart, History, Settings, Command, Plus, 
    Zap, Receipt, MessageSquare, Webhook
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import clsx from 'clsx'

interface CommandItem {
    id: string
    title: string
    description?: string
    href?: string
    action?: () => void
    icon: any
    category: string
    permission?: string
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const navigate = useNavigate()
    const { hasPermission } = usePermissions()

    const allItems: CommandItem[] = useMemo(() => [
        // Navigation
        { id: 'nav-dashboard', title: 'Dashboard', description: 'Vista general del negocio', href: '/', icon: LayoutDashboard, category: 'Navegación', permission: 'dashboard:view' },
        { id: 'nav-products', title: 'Productos', description: 'Gestionar inventario de productos', href: '/products', icon: Package, category: 'Navegación', permission: 'products:view' },
        { id: 'nav-categories', title: 'Categorías', description: 'Organizar catálogo', href: '/categories', icon: FolderTree, category: 'Navegación', permission: 'categories:view' },
        { id: 'nav-sales', title: 'POS (Ventas)', description: 'Punto de venta directo', href: '/sales', icon: ShoppingCart, category: 'Navegación', permission: 'sales:create' },
        { id: 'nav-history', title: 'Historial de Ventas', description: 'Consultar transacciones pasadas', href: '/sales-history', icon: History, category: 'Navegación', permission: 'sales:view' },
        { id: 'nav-settings', title: 'Configuración', description: 'Ajustes de la empresa y sistema', href: '/settings', icon: Settings, category: 'Navegación', permission: 'settings:manage' },
        
        // Fast Actions
        { id: 'act-new-product', title: 'Nuevo Producto', description: 'Crear SKU en catálogo', href: '/products', icon: Plus, category: 'Acciones Rápidas', permission: 'products:create' },
        { id: 'act-pos', title: 'Nueva Venta', description: 'Abrir terminal de punto de venta', href: '/sales', icon: Zap, category: 'Acciones Rápidas', permission: 'sales:create' },
        { id: 'act-webhook', title: 'Webhooks', description: 'Gestionar integraciones externas', href: '/webhooks', icon: Webhook, category: 'Acciones Rápidas', permission: 'webhooks:view' },
        { id: 'act-expenses', title: 'Registrar Gasto', description: 'Añadir nuevo egreso', href: '/expenses', icon: Receipt, category: 'Acciones Rápidas', permission: 'expenses:create' },
        
        // Help & Support
        { id: 'help-support', title: 'Soporte Técnico', description: 'Contactar con asistencia', action: () => window.open('https://support.example.com', '_blank'), icon: MessageSquare, category: 'Ayuda' },
    ], [navigate])

    const filteredItems = useMemo(() => {
        const query = search.toLowerCase()
        return allItems
            .filter(item => (!item.permission || hasPermission(item.permission)))
            .filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.category.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query)
            )
    }, [search, allItems, hasPermission])

    const toggle = useCallback(() => setIsOpen(open => !open), [])

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                toggle()
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [toggle])

    useEffect(() => {
        setSelectedIndex(0)
    }, [search])

    const onSelect = (item: CommandItem) => {
        if (item.href) navigate(item.href)
        else if (item.action) item.action()
        setIsOpen(false)
        setSearch('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(i => (i + 1) % filteredItems.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(i => (i - 1 + filteredItems.length) % filteredItems.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (filteredItems[selectedIndex]) onSelect(filteredItems[selectedIndex])
        } else if (e.key === 'Escape') {
            setIsOpen(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 md:p-20 pt-[10vh]">
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsOpen(false)}
            />
            
            <div className="relative mx-auto max-w-2xl transform divide-y divide-slate-100 overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/5 transition-all">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-6 top-6 h-6 w-6 text-slate-400" />
                    <input
                        autoFocus
                        type="text"
                        className="h-20 w-full border-0 bg-transparent pl-16 pr-20 text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-none"
                        placeholder="Buscar comando, página o acción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="absolute right-6 top-6 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase">ESC</span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                    {filteredItems.length === 0 ? (
                        <div className="py-14 px-6 text-center">
                            <Command className="mx-auto h-10 w-10 text-slate-300 mb-4" />
                            <p className="text-sm font-bold text-slate-900">No se encontraron resultados</p>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Intenta con otros términos como "ventas" o "configuración"</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(
                                filteredItems.reduce((acc, item) => {
                                    if (!acc[item.category]) acc[item.category] = []
                                    acc[item.category].push(item)
                                    return acc
                                }, {} as Record<string, CommandItem[]>)
                            ).map(([category, items]) => (
                                <div key={category}>
                                    <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                        {category}
                                    </h3>
                                    <div className="space-y-1">
                                        {items.map((item) => {
                                            const globalIndex = filteredItems.indexOf(item)
                                            const active = selectedIndex === globalIndex
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={clsx(
                                                        "group flex cursor-pointer items-center gap-4 rounded-2xl px-4 py-3 transition-all",
                                                        active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "hover:bg-slate-50 text-slate-700"
                                                    )}
                                                    onClick={() => onSelect(item)}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                >
                                                    <div className={clsx(
                                                        "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                                                        active ? "bg-white/20" : "bg-slate-100 group-hover:bg-white"
                                                    )}>
                                                        <item.icon className={clsx("h-5 w-5", active ? "text-white" : "text-slate-500")} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black">{item.title}</p>
                                                        <p className={clsx("text-[10px] font-medium truncate", active ? "text-indigo-100" : "text-slate-400")}>
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                    {active && (
                                                        <div className="text-[10px] font-black uppercase tracking-tight opacity-50">
                                                            ENTER
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <kbd className="h-5 w-5 flex items-center justify-center rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-500">↑</kbd>
                            <kbd className="h-5 w-5 flex items-center justify-center rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-500">↓</kbd>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navegar</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <kbd className="h-8 w-12 flex items-center justify-center rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-500">ENTER</kbd>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seleccionar</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                        Inventory Control v2.0
                    </div>
                </div>
            </div>
        </div>
    )
}
