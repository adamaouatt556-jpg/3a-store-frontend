import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Récupérer l'utilisateur depuis localStorage au démarrage
        const savedUser  = localStorage.getItem('user')
        const savedToken = localStorage.getItem('token')

        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser))
        }
        setLoading(false)
    }, [])

    // Connexion
    async function login(email, password) {
        const { data } = await api.post('/auth/login', { email, password })
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    // Déconnexion
    async function logout() {
        try {
            await api.post('/auth/logout')
        } finally {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
        }
    }

    // Vérifier le rôle
    function isSuperAdmin() { return user?.role === 'super_admin' }
    function isGerant()     { return user?.role === 'gerant'      }
    function isVendeur()    { return user?.role === 'vendeur'     }

    return (
        <AuthContext.Provider value={{
            user, loading,
            login, logout,
            isSuperAdmin, isGerant, isVendeur
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}