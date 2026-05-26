import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'
import { useBoutique } from '../../context/BoutiqueContext'

export default function Notifications() {
    const [alertes, setAlertes]     = useState([])
    const [showPanel, setShowPanel] = useState(false)
    const [loading, setLoading]     = useState(false)
    const { boutiqueActive }        = useBoutique()
    const navigate                  = useNavigate()

    useEffect(() => {
        fetchAlertes()
        // Vérifier toutes les 60 secondes
        const interval = setInterval(fetchAlertes, 60000)
        return () => clearInterval(interval)
    }, [boutiqueActive])

    async function fetchAlertes() {
        try {
            setLoading(true)
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

    const ruptures = alertes.filter(a => a.statut === 'rupture')
    const stockBas = alertes.filter(a => a.statut === 'stock_bas')
    const total    = alertes.length

    return (
        <div className="relative">

            {/* Bouton cloche */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
            >
                <span className="text-lg">🔔</span>
                {total > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {total > 9 ? '9+' : total}
                    </span>
                )}
            </button>

            {/* Panel notifications */}
            {showPanel && (
                <>
                    {/* Overlay pour fermer */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowPanel(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-10 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <h3 className="text-white text-sm font-medium">
                                🔔 Alertes stock
                            </h3>
                            <div className="flex items-center gap-2">
                                {loading && (
                                    <span className="text-gray-500 text-xs">Actualisation...</span>
                                )}
                                <button
                                    onClick={fetchAlertes}
                                    className="text-gray-500 hover:text-white text-xs transition-colors"
                                    title="Actualiser"
                                >
                                    🔄
                                </button>
                            </div>
                        </div>

                        {/* Stats rapides */}
                        {total > 0 && (
                            <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-800">
                                <div className="bg-red-500/10 rounded-lg p-2 text-center">
                                    <p className="text-red-400 text-lg font-bold">{ruptures.length}</p>
                                    <p className="text-gray-400 text-xs">Rupture(s)</p>
                                </div>
                                <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                                    <p className="text-yellow-400 text-lg font-bold">{stockBas.length}</p>
                                    <p className="text-gray-400 text-xs">Stock bas</p>
                                </div>
                            </div>
                        )}

                        {/* Liste alertes */}
                        <div className="max-h-64 overflow-y-auto">
                            {total === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-2xl mb-2">✅</p>
                                    <p className="text-green-400 text-xs">Aucune alerte — tout est OK !</p>
                                </div>
                            ) : (
                                alertes.map(p => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 cursor-pointer"
                                        onClick={() => {
                                            navigate('/alertes')
                                            setShowPanel(false)
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.statut === 'rupture' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                            <div>
                                                <p className="text-white text-xs font-medium">{p.nom}</p>
                                                <p className="text-gray-500 text-xs">
                                                    {p.stock?.quantite ?? 0} unité(s) restante(s)
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                            p.statut === 'rupture'
                                                ? 'bg-red-500/10 text-red-400'
                                                : 'bg-yellow-500/10 text-yellow-400'
                                        }`}>
                                            {p.statut === 'rupture' ? 'Rupture' : 'Stock bas'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {total > 0 && (
                            <div className="px-4 py-3 border-t border-gray-800">
                                <button
                                    onClick={() => {
                                        navigate('/alertes')
                                        setShowPanel(false)
                                    }}
                                    className="w-full text-center text-purple-400 hover:text-purple-300 text-xs transition-colors"
                                >
                                    Voir toutes les alertes →
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}