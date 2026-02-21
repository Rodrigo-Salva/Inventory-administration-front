import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/client'
import { User, Menu, Search, Bell, HelpCircle } from 'lucide-react'

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
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Menu className="h-6 w-6" />
                </button>
                
                <div className="hidden sm:flex relative items-center">
                    <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar en el inventario..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
                    <HelpCircle className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
                    <Bell className="h-5 w-5" />
                </button>
                
                <div className="h-8 w-px bg-gray-200 hidden sm:block mx-1"></div>
                
                <div 
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 pl-2 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-xl transition-all"
                >
                    <div className="flex flex-col items-end hidden md:flex">
                        <span className="text-xs font-bold text-gray-900 leading-none">{user?.email?.split('@')[0] || 'Cajero'}</span>
                        <span className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mt-1">Administrador</span>
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
