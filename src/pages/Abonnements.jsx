import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

export default function Abonnements() {
    const [abonnements, setAbonnements] = useState([])
    const [loading, setLoading]         = useState(true)
    const [message, setMessage]         = useState('')
    const { user }                      = useAuth()

    useEffect(() => {
        fetchAbonnements()
    }, [])

    async function fetchAbonnements() {
        try {
            const { data } = await api.get('/abonnements')
            setAbonnements(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleValider(id) {
        try {
            await api.post(`/abonnements/${id}/valider`)
            setMessage('Abonnement validé avec succès !')
            fetchAbonnements()
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Erreur.')
        }
    }

    async function handleSuspendre(id) {
        if (!confirm('Suspendre cet abonnement ?')) return
        try {
            await api.post(`/abonnements/${id}/suspendre`)
            setMessage('Abonnement suspendu.')
            fetchAbonnements()
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Erreur.')
        }
    }

    function getStatutBadge(statut) {
        switch(statut) {
            case 'actif'       : return 'bg-green-500/10 text-green-400'
            case 'en_attente'  : return 'bg-yellow-500/10 text-yellow-400'
            case 'expire'      : return 'bg-red-500/10 text-red-400'
            case 'suspendu'    : return 'bg-gray-500/10 text-gray-400'
            default            : return 'bg-gray-500/10 text-gray-400'
        }
    }

    function getStatutLabel(statut) {
        switch(statut) {
            case 'actif'      : return '✓ Actif'
            case 'en_attente' : return '⏳ En attente'
            case 'expire'     : return '✗ Expiré'
            case 'suspendu'   : return '⏸ Suspendu'
            default           : return statut
        }
    }

    return (
        <MainLayout title="Abonnements">

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-white font-semibold">Abonnements</h2>
                <p className="text-gray-500 text-xs mt-1">
                    {abonnements.length} abonnement(s)
                </p>
            </div>

            {/* Message */}
            {message && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
                    {message}
                </div>
            )}

            {/* Stats rapides — Super Admin uniquement */}
            {user?.role === 'super_admin' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {['actif', 'en_attente', 'expire', 'suspendu'].map(statut => (
                        <div key={statut} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-gray-400 text-xs mb-1 capitalize">{statut.replace('_', ' ')}</p>
                            <p className="text-white text-2xl font-bold">
                                {abonnements.filter(a => a.statut === statut).length}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Liste */}
            {loading ? (
                <p className="text-gray-500 text-sm">Chargement...</p>
            ) : abonnements.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <p className="text-4xl mb-3">📋</p>
                    <p className="text-gray-400 text-sm">Aucun abonnement</p>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Gérant</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Forfait</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Montant</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Début</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Fin</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Statut</th>
                                {user?.role === 'super_admin' && (
                                    <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {abonnements.map(a => (
                                <tr key={a.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                    <td className="px-4 py-3">
                                        <p className="text-white text-xs font-medium">{a.user?.name}</p>
                                        <p className="text-gray-500 text-xs">{a.user?.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-white text-xs font-medium">{a.forfait?.nom}</p>
                                        <p className="text-gray-500 text-xs">{a.forfait?.duree_jours} jours</p>
                                    </td>
                                    <td className="px-4 py-3 text-white text-xs">
                                        {Number(a.montant_paye).toLocaleString()} F
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {a.date_debut
                                            ? new Date(a.date_debut).toLocaleDateString('fr-FR')
                                            : '—'
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {a.date_fin
                                            ? new Date(a.date_fin).toLocaleDateString('fr-FR')
                                            : '—'
                                        }
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${getStatutBadge(a.statut)}`}>
                                            {getStatutLabel(a.statut)}
                                        </span>
                                    </td>
                                    {user?.role === 'super_admin' && (
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {a.statut === 'en_attente' && (
                                                    <button
                                                        onClick={() => handleValider(a.id)}
                                                        className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2 py-1 rounded-lg transition-colors"
                                                    >
                                                        Valider
                                                    </button>
                                                )}
                                                {a.statut === 'actif' && (
                                                    <button
                                                        onClick={() => handleSuspendre(a.id)}
                                                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded-lg transition-colors"
                                                    >
                                                        Suspendre
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </MainLayout>
    )
}