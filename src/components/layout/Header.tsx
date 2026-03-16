import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/client'
import { User, Menu, Search, Bell, HelpCircle, Command } from 'lucide-react'

export interface HeaderProps {
    onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 text-gray-500 hover:bg-white rounded-lg transition-colors"
                >
                    <Menu className="h-6 w-6" />
                </button>
                
                <div className="hidden sm:flex relative items-center">
                    <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        readOnly
                        placeholder="Buscar... (Ctrl+K)"
                        className="pl-10 pr-12 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm w-64 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-all"
                        onClick={() => {
                            // Trigger Ctrl+K programmatically if possible or just show hint
                            const event = new KeyboardEvent('keydown', {
                                key: 'k',
                                ctrlKey: true,
                                bubbles: true,
                                metaKey: true
                            });
                            document.dispatchEvent(event);
                        }}
                    />
                    <div className="absolute right-3 flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-black text-slate-400 uppercase">
                        <Command className="h-2 w-2" /> K
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-colors">
                    <HelpCircle className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-colors">
                    <Bell className="h-5 w-5" />
                </button>
                
                <div className="h-8 w-px bg-gray-200 hidden sm:block mx-1"></div>
                
                <div 
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 pl-2 cursor-pointer group hover:bg-white p-1.5 rounded-xl transition-all"
                >
                    <div className="flex flex-col items-end hidden md:flex">
                        <span className="text-xs font-bold text-gray-900 leading-none">{user?.first_name || user?.email?.split('@')[0] || 'Usuario'}</span>
                        <span className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mt-1">
                            {user?.role === 'SUPERADMIN' && 'Super Admin'}
                            {user?.role === 'ADMIN' && 'Administrador'}
                            {user?.role === 'MANAGER' && 'Manager'}
                            {user?.role === 'SELLER' && 'Vendedor'}
                            {!user?.role && (user?.is_admin ? 'Admin' : 'Operador')}
                        </span>
                    </div>
                    <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary-100 group-hover:bg-primary-200 transition-colors overflow-hidden">
                        {user?.avatar_url ? (
                            <img 
                                src={user.avatar_url.startsWith('http') ? user.avatar_url : `${api.defaults.baseURL}${user.avatar_url}`} 
                                alt="Profile" 
                                className="h-full w-full object-cover" 
                            />
                        ) : (
                            <User className="h-5 w-5 text-primary-600" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
