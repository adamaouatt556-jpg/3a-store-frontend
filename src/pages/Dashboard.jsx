import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import { useBoutique } from '../context/BoutiqueContext'

function StatCard({ label, value, icon, color, loading }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-xs">{label}</span>
                <span className="text-xl">{icon}</span>
            </div>
            {loading ? (
                <div className="h-8 w-16 bg-gray-800 rounded animate-pulse" />
            ) : (
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            )}
        </div>
    )
}

export default function Dashboard() {
    const [stats, setStats]         = useState({ totalProduits: 0, valeurStock: 0, ruptures: 0, stockBas: 0 })
    const [alertes, setAlertes]     = useState([])
    const [mouvements, setMouvements] = useState([])
    const [loading, setLoading]     = useState(true)
    const { user }                  = useAuth()
    const { boutiqueActive }        = useBoutique()

    useEffect(() => {
        if (user?.role === 'super_admin' || boutiqueActive) {
            fetchDashboard()
        }
    }, [boutiqueActive])

    async function fetchDashboard() {
        setLoading(true)
        try {
            const params = user?.role !== 'super_admin' && boutiqueActive
                ? { boutique_id: boutiqueActive.id }
                : {}

            const [produitsRes, alertesRes, mouvementsRes] = await Promise.all([
                api.get('/produits',   { params: { ...params, per_page: 1000 } }),
                api.get('/stocks/alertes', { params }),
                api.get('/mouvements', { params: { ...params, per_page: 10 } }),
            ])

            const produits = produitsRes.data.data   ?? []
            const alertes  = alertesRes.data          ?? []
            const mvts     = mouvementsRes.data.data  ?? []

            const valeurStock = produits.reduce((acc, p) => {
                return acc + ((p.prix_vente ?? 0) * (p.stock?.quantite ?? 0))
            }, 0)

            setStats({
                totalProduits : produits.length,
                valeurStock,
                ruptures      : alertes.filter(p => p.statut === 'rupture').length,
                stockBas      : alertes.filter(p => p.statut === 'stock_bas').length,
            })
            setAlertes(alertes.slice(0, 5))
            setMouvements(mvts.slice(0, 5))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function getTypeBadge(type) {
        switch(type) {
            case 'entree'     : return { label: '+', color: 'text-green-400'  }
            case 'sortie'     : return { label: '-', color: 'text-red-400'    }
            case 'perte'      : return { label: '💸', color: 'text-orange-400' }
            case 'ajustement' : return { label: '~', color: 'text-blue-400'   }
            case 'retour'     : return { label: '↩', color: 'text-yellow-400' }
            default           : return { label: '?', color: 'text-gray-400'   }
        }
    }

    return (
        <MainLayout title="Tableau de bord">

            {/* Boutique active */}
            {user?.role !== 'super_admin' && boutiqueActive && (
                <div className="mb-4 px-4 py-2 bg-purple-600/10 border border-purple-500/20 rounded-lg">
                    <p className="text-purple-400 text-xs">
                        🏪 Affichage : <span className="font-medium">{boutiqueActive.nom}</span>
                    </p>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Produits"       value={stats.totalProduits}                          icon="📦" color="text-white"        loading={loading} />
                <StatCard label="Valeur du stock" value={`${Number(stats.valeurStock).toLocaleString()} F`} icon="💰" color="text-green-400"  loading={loading} />
                <StatCard label="Stock bas"       value={stats.stockBas}                               icon="⚠️" color="text-yellow-400" loading={loading} />
                <StatCard label="Ruptures"        value={stats.ruptures}                               icon="🚨" color="text-red-400"    loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Alertes */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-white font-medium text-sm mb-4">🔔 Alertes stock</h3>
                    {loading ? (
                        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />)}</div>
                    ) : alertes.length === 0 ? (
                        <p className="text-green-400 text-xs">✓ Aucune alerte</p>
                    ) : (
                        alertes.map((p, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${p.statut === 'rupture' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                    <span className="text-gray-300 text-xs">{p.nom}</span>
                                </div>
                                <span className={`text-xs font-medium ${p.statut === 'rupture' ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {p.stock?.quantite === 0 ? 'Rupture' : `${p.stock?.quantite} unités`}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* Derniers mouvements */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-white font-medium text-sm mb-4">↕️ Derniers mouvements</h3>
                    {loading ? (
                        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />)}</div>
                    ) : mouvements.length === 0 ? (
                        <p className="text-gray-500 text-xs">Aucun mouvement</p>
                    ) : (
                        mouvements.map((m, i) => {
                            const badge = getTypeBadge(m.type)
                            return (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${m.type === 'entree' ? 'bg-green-500' : m.type === 'sortie' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                        <span className="text-gray-300 text-xs">{m.produit?.nom}</span>
                                    </div>
                                    <span className={`text-xs font-medium ${badge.color}`}>
                                        {badge.label}{m.quantite}
                                    </span>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </MainLayout>
    )
}