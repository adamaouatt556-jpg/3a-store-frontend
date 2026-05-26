import { useBoutique } from '../context/BoutiqueContext'
import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'

export default function Stock() {
    const [stocks, setStocks]     = useState([])
    const [alertes, setAlertes]   = useState([])
    const [loading, setLoading]   = useState(true)
    const [showMvt, setShowMvt]   = useState(false)
    const [produits, setProduits] = useState([])
    const [form, setForm]         = useState({
        produit_id: '', type: 'entree',
        quantite: '', motif: '', note: ''
    })
    const [errors, setErrors]   = useState({})
    const [saving, setSaving]   = useState(false)
    const [message, setMessage] = useState('')
    const [msgType, setMsgType] = useState('success')
    const { boutiqueActive } = useBoutique()

    useEffect(() => {
    fetchStocks()
    fetchAlertes()
    fetchProduits()
}, [boutiqueActive])

    async function fetchStocks() {
    try {
        const params = {}
        if (boutiqueActive) params.boutique_id = boutiqueActive.id
        const { data } = await api.get('/stocks', { params })
        setStocks(data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
}

    async function fetchAlertes() {
    try {
        const params = {}
        if (boutiqueActive) params.boutique_id = boutiqueActive.id
        const { data } = await api.get('/stocks/alertes', { params })
        setAlertes(data)
    } catch (err) {
        console.error(err)
    }
}

    async function fetchProduits() {
    try {
        const params = {}
        if (boutiqueActive) params.boutique_id = boutiqueActive.id
        const { data } = await api.get('/produits', { params })
        setProduits(data.data)
    } catch (err) {
        console.error(err)
    }
}

    async function handleMouvement() {
        // Validation côté client
        if (!form.produit_id || !form.quantite) {
            setErrors({
                produit_id : !form.produit_id ? ['Veuillez sélectionner un produit.'] : undefined,
                quantite   : !form.quantite   ? ['La quantité est requise.']          : undefined,
            })
            return
        }

        setSaving(true)
        setErrors({})
        setMessage('')

        try {
            await api.post('/mouvements', form)
            setMessage('Mouvement enregistré avec succès !')
            setMsgType('success')
            setForm({
                produit_id: '', type: 'entree',
                quantite: '', motif: '', note: ''
            })
            setShowMvt(false)
            fetchStocks()
            fetchAlertes()
        } catch (err) {
            if (err.response?.status === 422) {
                const data = err.response.data
                if (data.errors) {
                    setErrors(data.errors)
                } else if (data.message) {
                    setMessage(data.message)
                    setMsgType('error')
                }
            } else {
                setMessage('Une erreur est survenue.')
                setMsgType('error')
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <MainLayout title="Stock">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Gestion du stock</h2>
                    <p className="text-gray-500 text-xs mt-1">
                        {stocks.length} produit(s) en stock
                    </p>
                </div>
                <button
                    onClick={() => setShowMvt(!showMvt)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Mouvement stock
                </button>
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

            {/* Formulaire mouvement */}
            {showMvt && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-medium text-sm mb-4">
                        Enregistrer un mouvement
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Produit *</label>
                            <select
                                value={form.produit_id}
                                onChange={e => setForm({...form, produit_id: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            >
                                <option value="">— Sélectionner —</option>
                                {produits?.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nom} (stock: {p.stock?.quantite ?? 0})
                                    </option>
                                ))}
                            </select>
                            {errors.produit_id && <p className="text-red-400 text-xs mt-1">{errors.produit_id[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Type *</label>
                            <select
                                value={form.type}
                                onChange={e => setForm({...form, type: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            >
                                <option value="entree">📥 Entrée</option>
                                <option value="sortie">📤 Sortie</option>
                                <option value="perte">💸 Perte</option>
                                <option value="ajustement">🔧 Ajustement</option>
                                <option value="retour">↩️ Retour</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Quantité *</label>
                            <input
                                type="number"
                                min="1"
                                value={form.quantite}
                                onChange={e => setForm({...form, quantite: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                            {errors.quantite && <p className="text-red-400 text-xs mt-1">{errors.quantite[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Motif</label>
                            <input
                                value={form.motif}
                                onChange={e => setForm({...form, motif: e.target.value})}
                                placeholder="ex: Livraison fournisseur"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-gray-400 text-xs mb-1 block">Note</label>
                            <textarea
                                value={form.note}
                                onChange={e => setForm({...form, note: e.target.value})}
                                placeholder="Note optionnelle..."
                                rows={2}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleMouvement}
                            disabled={saving}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                            onClick={() => {
                                setShowMvt(false)
                                setErrors({})
                                setForm({
                                    produit_id: '', type: 'entree',
                                    quantite: '', motif: '', note: ''
                                })
                            }}
                            className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Tableau stock */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-800">
                            <h3 className="text-white text-sm font-medium">État du stock</h3>
                        </div>
                        {loading ? (
                            <p className="text-gray-500 text-sm p-4">Chargement...</p>
                        ) : stocks.length === 0 ? (
                            <p className="text-gray-500 text-sm p-4">Aucun stock enregistré.</p>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800">
                                        <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Produit</th>
                                        <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Quantité</th>
                                        <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stocks.map(s => {
                                        const qty   = s.quantite
                                        const seuil = s.produit?.stock_alerte ?? 5
                                        const statut = qty === 0
                                            ? { label: 'Rupture',   color: 'text-red-400',    bg: 'bg-red-500/10'    }
                                            : qty <= seuil
                                            ? { label: 'Stock bas', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
                                            : { label: 'OK',        color: 'text-green-400',  bg: 'bg-green-500/10'  }
                                        return (
                                            <tr key={s.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                                <td className="px-4 py-3">
                                                    <p className="text-white text-xs font-medium">{s.produit?.nom}</p>
                                                    <p className="text-gray-500 text-xs">{s.produit?.reference}</p>
                                                </td>
                                                <td className="px-4 py-3 text-white text-xs">
                                                    {qty} {s.produit?.unite}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${statut.bg} ${statut.color}`}>
                                                        {statut.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Alertes */}
                <div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-800">
                            <h3 className="text-white text-sm font-medium">
                                🔔 Alertes ({alertes.length})
                            </h3>
                        </div>
                        {alertes.length === 0 ? (
                            <p className="text-gray-500 text-xs p-4">Aucune alerte ✓</p>
                        ) : (
                            alertes.map(p => (
                                <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-800 last:border-0">
                                    <div>
                                        <p className="text-white text-xs">{p.nom}</p>
                                        <p className="text-gray-500 text-xs">{p.stock?.quantite ?? 0} unités</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${p.statut === 'rupture' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                        {p.statut === 'rupture' ? 'Rupture' : 'Stock bas'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}