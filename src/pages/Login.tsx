import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('admin@demo.com')
    const [password, setPassword] = useState('demo123')
    const [loading, setLoading] = useState(false)
    const setAuth = useAuthStore((state) => state.setAuth)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new URLSearchParams()
            formData.append('username', email)
            formData.append('password', password)

            const response = await api.post('/api/v1/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            })

            setAuth(response.data.access_token, { email })
            toast.success('¡Bienvenido!')
            navigate('/')
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail
                ? typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : 'Error de validación'
                : 'Error al iniciar sesión'
            toast.error(errorMessage)
            console.error('Login error:', error.response?.data)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-gray-900">Inventory SaaS</h2>
                    <p className="mt-2 text-sm text-gray-600">Sistema de Gestión de Inventario</p>
                </div>
                <div className="card">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="input mt-1"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@demo.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="input mt-1"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span>Iniciando sesión...</span>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    <span>Iniciar Sesión</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center text-sm text-gray-600">
                        <p>Credenciales demo:</p>
                        <p className="font-mono text-xs mt-1">admin@demo.com / demo123</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
