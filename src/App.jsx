import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Boutiques from './pages/Boutiques'
import Categories from './pages/Categories'
import Produits from './pages/Produits'
import Stock from './pages/Stock'
import Mouvements from './pages/Mouvements'
import Alertes from './pages/Alertes'
import Utilisateurs from './pages/Utilisateurs'
import Forfaits from './pages/Forfaits'
import Abonnements from './pages/Abonnements'
import Rapports from './pages/Rapports'
import Statistiques from './pages/Statistiques'
import Inventaire from './pages/Inventaire'

// Route protégée
function PrivateRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <p className="text-white">Chargement...</p>
        </div>
    )
    return user ? children : <Navigate to="/login" />
}

export default function App() {
    return (
        <Routes>
            <Route path="/login"    element={<Login />}    />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
                <PrivateRoute><Dashboard /></PrivateRoute>
            } />
            <Route path="/boutiques" element={
                <PrivateRoute><Boutiques /></PrivateRoute>
            } />
            <Route path="/categories" element={
                <PrivateRoute><Categories /></PrivateRoute>
            } />
            <Route path="/produits" element={
                <PrivateRoute><Produits /></PrivateRoute>
            } />
            <Route path="/stock" element={
                <PrivateRoute><Stock /></PrivateRoute>
            } />
            <Route path="/mouvements" element={
                <PrivateRoute><Mouvements /></PrivateRoute>
            } />
            <Route path="/alertes" element={
                <PrivateRoute><Alertes /></PrivateRoute>
            } />
            <Route path="/utilisateurs" element={
                <PrivateRoute><Utilisateurs /></PrivateRoute>
            } />
            <Route path="/forfaits" element={
                <PrivateRoute><Forfaits /></PrivateRoute>
            } />
            <Route path="/abonnements" element={
                <PrivateRoute><Abonnements /></PrivateRoute>
            } />
            <Route path="/rapports" element={
                <PrivateRoute><Rapports /></PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/login" />} />
            <Route path="/statistiques" element={
                <PrivateRoute><Statistiques /></PrivateRoute>
            } />

            <Route path="/inventaire" element={
                <PrivateRoute><Inventaire /></PrivateRoute>
            } />

        </Routes>
    )
}