import { useBoutique } from '../context/BoutiqueContext'
import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'
import { useNavigate } from 'react-router-dom'

export default function Alertes() {
    const [alertes, setAlertes] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtre, setFiltre]   = useState('')
    const navigate              = useNavigate()
    const { boutiqueActive } = useBoutique()

    useEffect(() => {
    fetchAlertes()
}, [boutiqueActive])

    async function fetchAlertes() {
    try {
        const params = {}
        if (boutiqueActive) params.boutique_id = boutiqueActive.id
        const { data } = await api.get('/stocks/alertes', { params })
        setAlertes(data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
}

    const ruptures = alertes.filter(p => p.statut === 'rupture')
    const stockBas = alertes.filter(p => p.statut === 'stock_bas')

    const filtrees = filtre === 'rupture'
        ? ruptures
        : filtre === 'stock_bas'
        ? stockBas
        : alertes

    return (
        <MainLayout title="Alertes">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Alertes stock</h2>
                    <p className="text-gray-500 text-xs mt-1">
                        {ruptures.length} rupture(s) · {stockBas.length} stock(s) bas
                    </p>
                </div>
                <select
                    value={filtre}
                    onChange={e => setFiltre(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                    <option value="">Toutes les alertes</option>
                    <option value="rupture">🚨 Ruptures</option>
                    <option value="stock_bas">⚠️ Stock bas</option>
                </select>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🚨</span>
                        <div>
                            <p className="text-red-400 text-2xl font-bold">{ruptures.length}</p>
                            <p className="text-gray-400 text-xs">Rupture(s) de stock</p>
                        </div>
                    </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚠️</span>
                        <div>
                            <p className="text-yellow-400 text-2xl font-bold">{stockBas.length}</p>
                            <p className="text-gray-400 text-xs">Stock(s) bas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste alertes */}
            {loading ? (
                <p className="text-gray-500 text-sm">Chargement...</p>
            ) : filtrees.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <p className="text-4xl mb-3">✅</p>
                    <p className="text-green-400 text-sm">Aucune alerte — tout est en ordre !</p>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Produit</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Catégorie</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Stock actuel</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Seuil alerte</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Statut</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrees.map(p => (
                                <tr key={p.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                    <td className="px-4 py-3">
                                        <p className="text-white text-xs font-medium">{p.nom}</p>
                                        <p className="text-gray-500 text-xs">{p.reference}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {p.categorie?.nom ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-sm font-bold ${p.statut === 'rupture' ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {p.stock?.quantite ?? 0}
                                        </span>
                                        <span className="text-gray-500 text-xs ml-1">{p.unite}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {p.stock_alerte} {p.unite}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${p.statut === 'rupture' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {p.statut === 'rupture' ? '🚨 Rupture' : '⚠️ Stock bas'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => navigate('/stock')}
                                            className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Réapprovisionner
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </MainLayout>
    )
}