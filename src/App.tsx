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
                <Route path="inventory" element={<Inventory />} />
                <Route path="users" element={<Users />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
            </Route>
        </Routes>
    )
}

export default App
