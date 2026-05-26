import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'
import { useBoutique } from '../context/BoutiqueContext'

export default function Inventaire() {
    const [inventaires, setInventaires]     = useState([])
    const [inventaireActif, setInventaireActif] = useState(null)
    const [loading, setLoading]             = useState(true)
    const [saving, setSaving]               = useState(false)
    const [message, setMessage]             = useState('')
    const [msgType, setMsgType]             = useState('success')
    const [note, setNote]                   = useState('')
    const { boutiqueActive }                = useBoutique()

    useEffect(() => {
        if (boutiqueActive) fetchInventaires()
    }, [boutiqueActive])

    async function fetchInventaires() {
        setLoading(true)
        try {
            const { data } = await api.get('/inventaires', {
                params: { boutique_id: boutiqueActive?.id }
            })
            setInventaires(data)

            // Charger l'inventaire en cours si existe
            const enCours = data.find(i => i.statut === 'en_cours')
            if (enCours) {
                fetchInventaireDetail(enCours.id)
            } else {
                setInventaireActif(null)
                setLoading(false)
            }
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    async function fetchInventaireDetail(id) {
        try {
            const { data } = await api.get(`/inventaires/${id}`)
            setInventaireActif(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleDemarrer() {
        if (!boutiqueActive) return
        setSaving(true)
        setMessage('')
        try {
            const { data } = await api.post('/inventaires', {
                boutique_id : boutiqueActive.id,
                note,
            })
            setInventaireActif(data)
            setNote('')
            setMessage('Inventaire démarré avec succès !')
            setMsgType('success')
            fetchInventaires()
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Erreur lors du démarrage.')
            setMsgType('error')
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdateLigne(ligneId, stockReel, noteL) {
        if (!inventaireActif) return
        try {
            await api.put(
                `/inventaires/${inventaireActif.id}/lignes/${ligneId}`,
                { stock_reel: stockReel, note: noteL }
            )
            // Mettre à jour localement
            setInventaireActif(prev => ({
                ...prev,
                lignes: prev.lignes.map(l =>
                    l.id === ligneId
                        ? { ...l, stock_reel: stockReel, ecart: stockReel - l.stock_systeme }
                        : l
                )
            }))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleValider() {
        if (!confirm('Valider cet inventaire ? Les stocks seront ajustés automatiquement.')) return
        setSaving(true)
        try {
            await api.post(`/inventaires/${inventaireActif.id}/valider`)
            setMessage('Inventaire validé ! Les stocks ont été ajustés.')
            setMsgType('success')
            setInventaireActif(null)
            fetchInventaires()
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Erreur lors de la validation.')
            setMsgType('error')
        } finally {
            setSaving(false)
        }
    }

    async function handleAnnuler() {
        if (!confirm('Annuler cet inventaire ?')) return
        try {
            await api.post(`/inventaires/${inventaireActif.id}/annuler`)
            setMessage('Inventaire annulé.')
            setMsgType('success')
            setInventaireActif(null)
            fetchInventaires()
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Erreur.')
            setMsgType('error')
        }
    }

    function getStatutBadge(statut) {
        switch(statut) {
            case 'en_cours' : return 'bg-yellow-500/10 text-yellow-400'
            case 'valide'   : return 'bg-green-500/10 text-green-400'
            case 'annule'   : return 'bg-red-500/10 text-red-400'
            default         : return 'bg-gray-500/10 text-gray-400'
        }
    }

    const nbEcarts    = inventaireActif?.lignes?.filter(l => l.ecart !== 0).length ?? 0
    const nbPositifs  = inventaireActif?.lignes?.filter(l => l.ecart > 0).length  ?? 0
    const nbNegatifs  = inventaireActif?.lignes?.filter(l => l.ecart < 0).length  ?? 0

    return (
        <MainLayout title="Inventaire">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Inventaire</h2>
                    <p className="text-gray-500 text-xs mt-1">
                        Comptage physique et ajustement du stock
                    </p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`border text-sm rounded-lg px-4 py-3 mb-4 ${
                    msgType === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                    {message}
                </div>
            )}

            {loading ? (
                <p className="text-gray-500 text-sm">Chargement...</p>
            ) : (
                <>
                    {/* Pas d'inventaire en cours */}
                    {!inventaireActif && (
                        <>
                            {/* Démarrer un inventaire */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                                <h3 className="text-white font-medium text-sm mb-4">
                                    📋 Démarrer un nouvel inventaire
                                </h3>
                                <p className="text-gray-500 text-xs mb-4">
                                    Un inventaire va charger tous les produits de la boutique
                                    <span className="text-purple-400 font-medium"> {boutiqueActive?.nom}</span>.
                                    Vous pourrez ensuite saisir les quantités réelles constatées.
                                </p>
                                <div className="mb-4">
                                    <label className="text-gray-400 text-xs mb-1 block">Note (optionnel)</label>
                                    <input
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="ex: Inventaire mensuel Mai 2026"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <button
                                    onClick={handleDemarrer}
                                    disabled={saving || !boutiqueActive}
                                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-6 py-2 rounded-lg transition-colors"
                                >
                                    {saving ? 'Démarrage...' : '▶ Démarrer l\'inventaire'}
                                </button>
                            </div>

                            {/* Historique */}
                            {inventaires.filter(i => i.statut !== 'en_cours').length > 0 && (
                                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-800">
                                        <h3 className="text-white text-sm font-medium">Historique des inventaires</h3>
                                    </div>
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Date</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Boutique</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Produits</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Écarts</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Statut</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Par</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventaires.filter(i => i.statut !== 'en_cours').map(inv => (
                                                <tr key={inv.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                                        {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="px-4 py-3 text-white text-xs">{inv.boutique?.nom}</td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs">{inv.nb_lignes}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-xs font-medium ${inv.nb_ecarts > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                            {inv.nb_ecarts} écart(s)
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${getStatutBadge(inv.statut)}`}>
                                                            {inv.statut}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs">{inv.user?.name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* Inventaire en cours */}
                    {inventaireActif && (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                                    <p className="text-gray-400 text-xs mb-1">Total produits</p>
                                    <p className="text-white text-2xl font-bold">{inventaireActif.lignes?.length ?? 0}</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                                    <p className="text-gray-400 text-xs mb-1">Écarts détectés</p>
                                    <p className={`text-2xl font-bold ${nbEcarts > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{nbEcarts}</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                                    <p className="text-gray-400 text-xs mb-1">Surplus (+)</p>
                                    <p className="text-green-400 text-2xl font-bold">{nbPositifs}</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                                    <p className="text-gray-400 text-xs mb-1">Manquants (-)</p>
                                    <p className="text-red-400 text-2xl font-bold">{nbNegatifs}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mb-4">
                                <button
                                    onClick={handleValider}
                                    disabled={saving}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                                >
                                    ✓ Valider l'inventaire
                                </button>
                                <button
                                    onClick={handleAnnuler}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg transition-colors"
                                >
                                    ✕ Annuler
                                </button>
                                {inventaireActif.note && (
                                    <span className="text-gray-500 text-xs self-center">
                                        📝 {inventaireActif.note}
                                    </span>
                                )}
                            </div>

                            {/* Tableau des lignes */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                                    <h3 className="text-white text-sm font-medium">
                                        Saisie des stocks réels
                                    </h3>
                                    <p className="text-gray-500 text-xs">
                                        Modifiez le stock réel pour chaque produit
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Produit</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Catégorie</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Stock système</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Stock réel</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Écart</th>
                                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventaireActif.lignes?.map(ligne => (
                                                <tr key={ligne.id} className={`border-b border-gray-800 last:border-0 ${ligne.ecart !== 0 ? 'bg-yellow-500/5' : ''}`}>
                                                    <td className="px-4 py-3">
                                                        <p className="text-white text-xs font-medium">{ligne.produit?.nom}</p>
                                                        <p className="text-gray-500 text-xs">{ligne.produit?.reference}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                                        {ligne.produit?.categorie?.nom ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                                        {ligne.stock_systeme} {ligne.produit?.unite}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            defaultValue={ligne.stock_reel}
                                                            onBlur={e => handleUpdateLigne(
                                                                ligne.id,
                                                                parseInt(e.target.value) || 0,
                                                                ligne.note
                                                            )}
                                                            className="w-20 bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-xs font-bold ${
                                                            ligne.ecart > 0 ? 'text-green-400' :
                                                            ligne.ecart < 0 ? 'text-red-400' :
                                                            'text-gray-500'
                                                        }`}>
                                                            {ligne.ecart > 0 ? '+' : ''}{ligne.ecart}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            defaultValue={ligne.note ?? ''}
                                                            onBlur={e => handleUpdateLigne(
                                                                ligne.id,
                                                                ligne.stock_reel,
                                                                e.target.value
                                                            )}
                                                            placeholder="Note..."
                                                            className="w-28 bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </MainLayout>
    )
}