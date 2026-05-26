import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]       = useState('')
    const [loading, setLoading]   = useState(false)

    const { login }  = useAuth()
    const navigate   = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const user = await login(email, password)
            if (user.role === 'super_admin' || user.role === 'gerant') {
                navigate('/dashboard')
            } else {
                navigate('/stock')
            }
        } catch (err) {
            setError('Email ou mot de passe incorrect.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo 3A */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white tracking-widest">
                        3<span className="text-purple-400">A</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">Gestion de Stock</p>
                </div>

                {/* Carte connexion */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                    <h2 className="text-white text-xl font-semibold mb-6">
                        Connexion
                    </h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@3astore.com"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 text-sm transition-colors mt-2"
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </div>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Pas encore de compte ?
                    <Link to="/register" className="text-purple-400 hover:text-purple-300 ml-1">
                        Créer un compte gérant
                    </Link>
                </p>

                <p className="text-center text-gray-600 text-xs mt-2">
                    3A_STORE © 2026
                </p>
            </div>
        </div>
    )
}