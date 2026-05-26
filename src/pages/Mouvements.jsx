import { useBoutique } from '../context/BoutiqueContext'
import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'

export default function Mouvements() {
    const [mouvements, setMouvements] = useState([])
    const [loading, setLoading]       = useState(true)
    const [filtre, setFiltre]         = useState('')
    const { boutiqueActive } = useBoutique()

    useEffect(() => {
    fetchMouvements()
}, [filtre, boutiqueActive])

    async function fetchMouvements() {
    try {
        const params = { type: filtre || undefined }
        if (boutiqueActive) params.boutique_id = boutiqueActive.id
        const { data } = await api.get('/mouvements', { params })
        setMouvements(data.data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
}

    function getTypeBadge(type) {
    switch(type) {
        case 'entree'     : return { label: '📥 Entrée',     color: 'text-green-400',  bg: 'bg-green-500/10'  }
        case 'sortie'     : return { label: '📤 Sortie',     color: 'text-red-400',    bg: 'bg-red-500/10'    }
        case 'perte'      : return { label: '💸 Perte',      color: 'text-orange-400', bg: 'bg-orange-500/10' }
        case 'ajustement' : return { label: '🔧 Ajustement', color: 'text-blue-400',   bg: 'bg-blue-500/10'   }
        case 'retour'     : return { label: '↩️ Retour',     color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
        default           : return { label: type,            color: 'text-gray-400',   bg: 'bg-gray-500/10'   }
    }
    }

    return (
        <MainLayout title="Mouvements de stock">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Historique des mouvements</h2>
                    <p className="text-gray-500 text-xs mt-1">
                        {mouvements?.length ?? 0} mouvement(s)
                    </p>
                </div>

                {/* Filtre type */}
                <select
                    value={filtre}
                    onChange={e => setFiltre(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                    <option value="">Tous les types</option>
                    <option value="entree">📥 Entrées</option>
                    <option value="sortie">📤 Sorties</option>
                    <option value="perte">💸 Pertes</option>
                    <option value="ajustement">🔧 Ajustements</option>
                    <option value="retour">↩️ Retours</option>
                </select>
            </div>

            {/* Tableau */}
            {loading ? (
                <p className="text-gray-500 text-sm">Chargement...</p>
            ) : !mouvements?.length ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <p className="text-4xl mb-3">↕️</p>
                    <p className="text-gray-400 text-sm">Aucun mouvement enregistré</p>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Date</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Produit</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Type</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Quantité</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Motif</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Par</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mouvements.map(m => {
                                const badge = getTypeBadge(m.type)
                                return (
                                    <tr key={m.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {new Date(m.created_at).toLocaleDateString('fr-FR', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-white text-xs font-medium">{m.produit?.nom}</p>
                                            <p className="text-gray-500 text-xs">{m.produit?.reference}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-white text-xs font-medium">
                                            {m.type === 'sortie' ? '-' : '+'}{m.quantite}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {m.motif || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {m.user?.name}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </MainLayout>
    )
}