import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

export default function Forfaits() {
    const [forfaits, setForfaits] = useState([])
    const [loading, setLoading]   = useState(true)
    const [message, setMessage]   = useState('')
    const [saving, setSaving]     = useState(false)
    const { user }                = useAuth()

    useEffect(() => {
        fetchForfaits()
    }, [])

    async function fetchForfaits() {
        try {
            const { data } = await api.get('/forfaits')
            setForfaits(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSouscrire(forfait) {
        setSaving(true)
        setMessage('')
        try {
            await api.post('/abonnements', {
                forfait_id   : forfait.id,
                montant_paye : forfait.prix,
                note         : `Souscription forfait ${forfait.nom}`,
            })
            setMessage(`Demande d'abonnement ${forfait.nom} envoyée ! En attente de validation.`)
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Erreur lors de la souscription.')
        } finally {
            setSaving(false)
        }
    }

    function getTypeColor(type) {
        switch(type) {
            case 'mensuel'     : return 'border-blue-500/30 bg-blue-500/5'
            case 'trimestriel' : return 'border-green-500/30 bg-green-500/5'
            case 'semestriel'  : return 'border-purple-500/30 bg-purple-500/5'
            case 'annuel'      : return 'border-yellow-500/30 bg-yellow-500/5'
            default            : return 'border-gray-700 bg-gray-900'
        }
    }

    function getTypeIcon(type) {
        switch(type) {
            case 'mensuel'     : return '🥉'
            case 'trimestriel' : return '🥈'
            case 'semestriel'  : return '🥇'
            case 'annuel'      : return '💎'
            default            : return '📦'
        }
    }

    return (
        <MainLayout title="Forfaits">

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-white font-semibold">Forfaits 3A STORE</h2>
                <p className="text-gray-500 text-xs mt-1">
                    Choisissez le forfait adapté à votre activité
                </p>
            </div>

            {/* Message */}
            {message && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-6">
                    {message}
                </div>
                        )}
            {/* Instructions de paiement */}
            {user?.role !== 'super_admin' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-6">
                    <h3 className="text-yellow-400 font-medium text-sm mb-3">
                        💳 Comment payer votre forfait ?
                    </h3>
                    <div className="flex flex-col gap-2 text-sm text-gray-300">
                        <p>1. Choisissez votre forfait et cliquez sur <span className="text-purple-400 font-medium">Souscrire</span></p>
                        <p>2. Effectuez le paiement via <span className="text-yellow-400 font-medium">Wave</span> au numéro :</p>
                        <div className="flex items-center gap-3 bg-gray-900 rounded-lg px-4 py-3 mt-1">
                            <span className="text-2xl">📱</span>
                            <div>
                                <p className="text-white font-bold text-lg tracking-widest">+225 05 55 66 02 96</p>
                                <p className="text-gray-400 text-xs">OUATTARA ALIDOU ADAMA — Wave Côte d'Ivoire</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-xs mt-2">
                            ⚠️ Après le paiement, votre abonnement sera activé dans les 24h par l'administrateur.
                            Envoyez une capture de votre paiement à <span className="text-purple-400">admin@3astore.com</span>
                        </p>
                    </div>
                </div>
            )}
            {/* Grille forfaits */}
            {loading ? (
                <p className="text-gray-500 text-sm">Chargement...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {forfaits.map(f => (
                        <div
                            key={f.id}
                            className={`border rounded-xl p-6 flex flex-col ${getTypeColor(f.type)}`}
                        >
                            {/* Icône et nom */}
                            <div className="text-center mb-4">
                                <span className="text-4xl">{getTypeIcon(f.type)}</span>
                                <h3 className="text-white font-bold text-lg mt-2">{f.nom}</h3>
                                <p className="text-gray-400 text-xs mt-1">{f.description}</p>
                            </div>

                            {/* Prix */}
                            <div className="text-center mb-4">
                                <p className="text-white text-3xl font-bold">
                                    {Number(f.prix).toLocaleString()}
                                    <span className="text-gray-400 text-sm font-normal"> F CFA</span>
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    {f.duree_jours} jours
                                </p>
                            </div>

                            {/* Caractéristiques */}
                            <div className="flex flex-col gap-2 mb-6 flex-1">
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                    <span className="text-green-400">✓</span>
                                    {f.nb_boutiques === -1 ? 'Boutiques illimitées' : `${f.nb_boutiques} boutique(s)`}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                    <span className="text-green-400">✓</span>
                                    {f.nb_vendeurs_par_boutique} vendeurs par boutique
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                    <span className="text-green-400">✓</span>
                                    Gestion stock complète
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                    <span className="text-green-400">✓</span>
                                    Rapports & finances
                                </div>
                            </div>

                            {/* Bouton */}
                            {user?.role !== 'super_admin' && (
                                <button
                                    onClick={() => handleSouscrire(f)}
                                    disabled={saving}
                                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
                                >
                                    {saving ? 'En cours...' : 'Souscrire'}
                                </button>
                            )}

                            {user?.role === 'super_admin' && (
                                <div className="text-center text-gray-500 text-xs">
                                    Forfait actif ✓
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    )
}