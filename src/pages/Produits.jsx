import { useBoutique } from '../context/BoutiqueContext'
import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'

export default function Produits() {
    const [produits, setProduits]     = useState([])
    const [categories, setCategories] = useState([])
    const [boutiques, setBoutiques]   = useState([])
    const [loading, setLoading]       = useState(true)
    const [showForm, setShowForm]     = useState(false)
    const [editing, setEditing]       = useState(null)
    const [search, setSearch]         = useState('')
    const [errors, setErrors]         = useState({})
    const [saving, setSaving]         = useState(false)
    const [message, setMessage]       = useState('')
    const [form, setForm]             = useState({
        reference: '', nom: '', description: '',
        categorie_id: '', boutique_id: '',
        prix_achat: '', prix_vente: '',
        stock_alerte: 5, unite: 'pièce', quantite: 0,
    })
    const [images, setImages] = useState([])
    const { boutiqueActive } = useBoutique()

    useEffect(() => {
    fetchProduits()
    fetchCategories()
    fetchBoutiques()
    }, [search, boutiqueActive])

    async function fetchProduits() {
    try {
        const params = { search }
        if (boutiqueActive) params.boutique_id = boutiqueActive.id
        const { data } = await api.get('/produits', { params })
        setProduits(data.data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
    }

    async function fetchCategories() {
        const { data } = await api.get('/categories')
        setCategories(data)
    }

    async function fetchBoutiques() {
        const { data } = await api.get('/boutiques')
        setBoutiques(data)
    }

    function handleEdit(produit) {
        setEditing(produit)
        setForm({
            reference    : produit.reference,
            nom          : produit.nom,
            description  : produit.description  ?? '',
            categorie_id : produit.categorie_id,
            boutique_id  : produit.boutique_id,
            prix_achat   : produit.prix_achat,
            prix_vente   : produit.prix_vente,
            stock_alerte : produit.stock_alerte,
            unite        : produit.unite,
            quantite     : produit.stock?.quantite ?? 0,
        })
        setShowForm(true)
        setErrors({})
    }

    function handleCancel() {
    setEditing(null)
    setForm({
        reference: '', nom: '', description: '',
        categorie_id: '',
        boutique_id: boutiqueActive?.id ?? '',
        prix_achat: '', prix_vente: '',
        stock_alerte: 5, unite: 'pièce', quantite: 0,
    })
    setImages([])
    setShowForm(false)
    setErrors({})
    }

    async function handleSubmit() {
        setSaving(true)
        setErrors({})
        setMessage('')
        try {
            const formData = new FormData()
            Object.keys(form).forEach(key => formData.append(key, form[key]))
            images.forEach(img => formData.append('images[]', img))

            if (editing) {
                formData.append('_method', 'PUT')
                await api.post(`/produits/${editing.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                setMessage('Produit modifié avec succès !')
            } else {
                await api.post('/produits', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                setMessage('Produit créé avec succès !')
            }
            handleCancel()
            fetchProduits()
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors)
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id) {
        if (!confirm('Supprimer ce produit ?')) return
        await api.delete(`/produits/${id}`)
        setMessage('Produit supprimé.')
        fetchProduits()
    }

    function getStatut(produit) {
        const qty = produit.stock?.quantite ?? 0
        if (qty === 0)                   return { label: 'Rupture',   color: 'text-red-400',    bg: 'bg-red-500/10'    }
        if (qty <= produit.stock_alerte) return { label: 'Stock bas', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
        return                                  { label: 'En stock',  color: 'text-green-400',  bg: 'bg-green-500/10'  }
    }

    const marge = form.prix_achat && form.prix_vente
        ? Math.round(((form.prix_vente - form.prix_achat) / form.prix_achat) * 100)
        : null

    return (
        <MainLayout title="Produits">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Produits</h2>
                    <p className="text-gray-500 text-xs mt-1">{produits?.length ?? 0} produit(s)</p>
                </div>
                <button onClick={() => { handleCancel(); setShowForm(true) }} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ Nouveau produit</button>
            </div>

            {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">{message}</div>}

            <div className="mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou référence..." className="w-full md:w-80 bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500" />
            </div>

            {showForm && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-medium text-sm mb-4">{editing ? '✏️ Modifier le produit' : 'Nouveau produit'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Référence *</label>
                            <input value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} placeholder="ex: PRD-001" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                            {errors.reference && <p className="text-red-400 text-xs mt-1">{errors.reference[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Nom *</label>
                            <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="ex: Chemise Oxford bleue" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                            {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Catégorie *</label>
                            <select value={form.categorie_id} onChange={e => setForm({...form, categorie_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
                                <option value="">— Sélectionner —</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>)}
                            </select>
                            {errors.categorie_id && <p className="text-red-400 text-xs mt-1">{errors.categorie_id[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Boutique *</label>
                            <select value={form.boutique_id} onChange={e => setForm({...form, boutique_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
                                <option value="">— Sélectionner —</option>
                                {boutiques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
                            </select>
                            {errors.boutique_id && <p className="text-red-400 text-xs mt-1">{errors.boutique_id[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Prix d'achat (FCFA) *</label>
                            <input type="number" min="0" value={form.prix_achat} onChange={e => setForm({...form, prix_achat: e.target.value})} placeholder="0" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                            {errors.prix_achat && <p className="text-red-400 text-xs mt-1">{errors.prix_achat[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">
                                Prix de vente (FCFA) *
                                {marge !== null && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${marge >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>Marge : {marge}%</span>}
                            </label>
                            <input type="number" min="0" value={form.prix_vente} onChange={e => setForm({...form, prix_vente: e.target.value})} placeholder="0" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                            {errors.prix_vente && <p className="text-red-400 text-xs mt-1">{errors.prix_vente[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Quantité {editing ? 'actuelle' : 'initiale'} *</label>
                            <input type="number" min="0" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Seuil d'alerte</label>
                            <input type="number" min="0" value={form.stock_alerte} onChange={e => setForm({...form, stock_alerte: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Unité</label>
                            <select value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
                                <option>pièce</option>
                                <option>kg</option>
                                <option>litre</option>
                                <option>carton</option>
                                <option>sachet</option>
                                <option>mètre</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Photos</label>
                            <input type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files))} className="w-full text-gray-400 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-700 file:text-gray-300 file:text-xs" />
                            {images.length > 0 && <p className="text-purple-400 text-xs mt-1">{images.length} photo(s) sélectionnée(s)</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-gray-400 text-xs mb-1 block">Description</label>
                            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Détails du produit..." rows={3} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleSubmit} disabled={saving} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">{saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Enregistrer'}</button>
                        <button onClick={handleCancel} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Annuler</button>
                    </div>
                </div>
            )}

            {loading ? <p className="text-gray-500 text-sm">Chargement...</p> : !produits?.length ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <p className="text-4xl mb-3">📦</p>
                    <p className="text-gray-400 text-sm">Aucun produit</p>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Produit</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Catégorie</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Stock</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Prix vente</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Statut</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produits.map(p => {
                                const statut = getStatut(p)
                                return (
                                    <tr key={p.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {p.images?.length > 0 ? (
                                                    <img src={`http://localhost:8000/storage/${p.images[0]}`} className="w-8 h-8 rounded-lg object-cover" alt={p.nom} />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm">📦</div>
                                                )}
                                                <div>
                                                    <p className="text-white text-xs font-medium">{p.nom}</p>
                                                    <p className="text-gray-500 text-xs">{p.reference}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">{p.categorie?.nom}</td>
                                        <td className="px-4 py-3 text-white text-xs">{p.stock?.quantite ?? 0} {p.unite}</td>
                                        <td className="px-4 py-3 text-white text-xs">{Number(p.prix_vente).toLocaleString()} F</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${statut.bg} ${statut.color}`}>{statut.label}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(p)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-lg transition-colors">✏️</button>
                                                <button onClick={() => handleDelete(p.id)} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded-lg transition-colors">🗑️</button>
                                            </div>
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