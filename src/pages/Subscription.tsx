import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Check, Shield, Zap, Sparkles, CreditCard, Star, Clock, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { usePermissions } from '@/hooks/usePermissions'
import type { Tenant } from '@/types'

const PLANS = [
    {
        name: 'Basic',
        id: 'free',
        price: 0,
        description: 'Ideal para pequeños negocios empezando su camino digital.',
        features: [
            'Hasta 50 productos',
            'Gestión de inventario básica',
            'Ventas POS (Online)',
            'Reportes básicos de ventas',
            '1 Sucursal',
        ],
        buttonText: 'Plan Actual',
        recommended: false,
        color: 'slate'
    },
    {
        name: 'Premium',
        id: 'premium',
        price: 29.99,
        description: 'La solución completa para potenciar y escalar tu negocio.',
        features: [
            'Productos ilimitados',
            'Soporte Offline POS completo',
            'Alertas de stock inteligentes',
            'Red de fidelización de clientes',
            'Múltiples sucursales',
            'Análisis con Inteligencia Artificial',
            'Webhooks y API de integración',
            'Soporte prioritario 24/7',
        ],
        buttonText: 'Mejorar a Premium',
        recommended: true,
        color: 'primary'
    }
]

export default function Subscription() {
    const { hasPermission } = usePermissions()
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    const { data: tenant, isLoading: isLoadingTenant } = useQuery<Tenant>({
        queryKey: ['tenant-me'],
        queryFn: async () => {
            const response = await api.get('/api/v1/tenant/me')
            return response.data
        },
    })

    const checkoutMutation = useMutation({
        mutationFn: async (plan: typeof PLANS[0]) => {
            const response = await api.post('/api/v1/payments/checkout', {
                plan: plan.id,
                price: plan.price
            })
            return response.data
        },
        onSuccess: (data) => {
            // Redirigir a Mercado Pago
            window.location.href = data.init_point
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Error al iniciar el pago')
            setIsProcessing(null)
        }
    })

    if (!hasPermission('subscriptions:manage')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para gestionar la suscripción.</p>
            </div>
        )
    }

    const handleUpgrade = (plan: typeof PLANS[0]) => {
        if (plan.id === tenant?.plan) return
        if (plan.price === 0) return
        
        setIsProcessing(plan.id)
        checkoutMutation.mutate(plan)
    }

    if (isLoadingTenant) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">Planes y Precios</h2>
                <p className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl">
                    Impulsa tu negocio al <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">siguiente nivel</span>
                </p>
                <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                    Elige el plan que mejor se adapte a tus necesidades. Sube a Premium y desbloquea el poder del POS Offline y la IA.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className={clsx(
                            "relative flex flex-col rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02]",
                            plan.recommended 
                                ? "bg-slate-900 text-white shadow-2xl shadow-primary-500/20 ring-4 ring-primary-600/50" 
                                : "bg-white text-gray-900 border border-gray-100 shadow-xl"
                        )}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 right-8 -translate-y-1/2 flex items-center gap-1.5 bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-white shadow-lg">
                                <Sparkles className="h-3 w-3" />
                                Más Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className={clsx(
                                "text-2xl font-bold",
                                plan.recommended ? "text-white" : "text-gray-900"
                            )}>{plan.name}</h3>
                            <p className={clsx(
                                "mt-4 text-sm",
                                plan.recommended ? "text-slate-400" : "text-gray-500"
                            )}>{plan.description}</p>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                                <span className={clsx(
                                    "text-sm font-semibold",
                                    plan.recommended ? "text-slate-400" : "text-gray-500"
                                )}>/mes</span>
                            </div>
                        </div>

                        <ul className="flex-1 space-y-4 mb-10">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-sm">
                                    <div className={clsx(
                                        "mt-1 shrink-0 rounded-full p-0.5",
                                        plan.recommended ? "bg-primary-500/20 text-primary-400" : "bg-green-100 text-green-600"
                                    )}>
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                    <span className={plan.recommended ? "text-slate-300" : "text-gray-600"}>
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleUpgrade(plan)}
                            disabled={tenant?.plan === plan.id || isProcessing !== null}
                            className={clsx(
                                "group relative w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all duration-300",
                                tenant?.plan === plan.id
                                    ? "bg-slate-800 text-slate-400 cursor-default"
                                    : plan.recommended
                                        ? "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50"
                                        : "bg-gray-900 hover:bg-black text-white"
                            )}
                        >
                            {isProcessing === plan.id ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {tenant?.plan === plan.id ? (
                                        <>
                                            <Shield className="h-5 w-5" />
                                            {plan.buttonText}
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-5 w-5" />
                                            {plan.buttonText}
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Beneficios Extra */}
            <div className="mt-20 border-t border-gray-100 pt-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                <div className="space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 mb-2">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Pagos Seguros</h4>
                    <p className="text-sm text-gray-500">Procesamos tus pagos de forma segura a través de Mercado Pago, la plataforma líder en Latam.</p>
                </div>
                <div className="space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-2">
                        <Star className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Soporte VIP</h4>
                    <p className="text-sm text-gray-500">Nuestro equipo está listo para ayudarte en cada paso del crecimiento de tu negocio.</p>
                </div>
                <div className="space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 mb-2">
                        <Clock className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Sin Compromisos</h4>
                    <p className="text-sm text-gray-500">Cancela o cambia de plan en cualquier momento desde tu panel de configuración.</p>
                </div>
            </div>
        </div>
    )
}
