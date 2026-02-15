import { useAuthStore } from '@/store/authStore'
import { User } from 'lucide-react'

export default function Header() {
    const user = useAuthStore((state) => state.user)

    return (
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex flex-1"></div>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <div className="flex items-center gap-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                            <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{user?.email || 'Usuario'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
