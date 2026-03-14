import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Inventory from './pages/Inventory'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Sales from './pages/Sales'
import SalesList from './pages/SalesList'
import Credits from './pages/Credits'
import QuotesList from './pages/QuotesList'
import NewQuote from './pages/NewQuote'
import Roles from './pages/Roles'
import Customers from './pages/Customers'
import Purchases from './pages/Purchases'
import NewPurchase from './pages/NewPurchase'
import Kardex from './pages/Kardex'
import Profitability from './pages/Profitability'
import Adjustments from './pages/Adjustments'
import Expenses from './pages/Expenses'
import AIInsights from './pages/AIInsights'
import AuditLogs from './pages/AuditLogs'
import { Branches } from './pages/Branches'
import StockTransfers from './pages/StockTransfers'
import Layout from './components/layout/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token)
    return token ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Layout />
                    </PrivateRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="purchases/new" element={<NewPurchase />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="inventory/kardex/:id" element={<Kardex />} />
                <Route path="inventory/adjustments" element={<Adjustments />} />
                <Route path="inventory/transfers" element={<StockTransfers />} />
                <Route path="profitability" element={<Profitability />} />
                <Route path="ai-analysis" element={<AIInsights />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="sales" element={<Sales />} />
                <Route path="sales-history" element={<SalesList />} />
                <Route path="credits" element={<Credits />} />
                <Route path="quotes" element={<QuotesList />} />
                <Route path="quotes/new" element={<NewQuote />} />
                <Route path="users" element={<Users />} />
                <Route path="customers" element={<Customers />} />
                <Route path="roles" element={<Roles />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="branches" element={<Branches />} />
                <Route path="profile" element={<Profile />} />
            </Route>
        </Routes>
    )
}

export default App
