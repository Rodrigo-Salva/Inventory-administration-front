import { create } from 'zustand'
import { CashSession } from '@/types'
import api from '@/api/client'

interface POSState {
    activeSession: CashSession | null
    isLoading: boolean
    checkActiveSession: () => Promise<void>
    setActiveSession: (session: CashSession | null) => void
    openSession: (openingBalance: number, notes?: string) => Promise<void>
    closeSession: (closingBalance: number) => Promise<void>
}

export const usePOSStore = create<POSState>((set) => ({
    activeSession: null,
    isLoading: false,

    checkActiveSession: async () => {
        set({ isLoading: true })
        try {
            const response = await api.get('/api/v1/pos/current-session')
            set({ activeSession: response.data })
        } catch (error) {
            console.error('Error checking active session:', error)
            set({ activeSession: null })
        } finally {
            set({ isLoading: false })
        }
    },

    setActiveSession: (session) => set({ activeSession: session }),

    openSession: async (openingBalance, notes) => {
        set({ isLoading: true })
        try {
            const response = await api.post('/api/v1/pos/open-session', {
                opening_balance: openingBalance,
                notes
            })
            set({ activeSession: response.data })
        } catch (error) {
            console.error('Error opening session:', error)
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    closeSession: async (closingBalance) => {
        set({ isLoading: true })
        try {
            await api.post('/api/v1/pos/close-session', {
                closing_balance: closingBalance
            })
            set({ activeSession: null })
        } catch (error) {
            console.error('Error closing session:', error)
            throw error
        } finally {
            set({ isLoading: false })
        }
    }
}))
