import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'

export default function Boutiques() {
    const [boutiques, setBoutiques] = useState([])
    const [loading, setLoading]     = useState(true)
    const [showForm, setShowForm]   = useState(false)
    const [editing, setEditing]     = useState(null)
    const [form, setForm]           = useState({
        nom: '', adresse: '', telephone: '', email: ''
    })
    const [errors, setErrors]   = useState({})
    const [saving, setSaving]   = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetchBoutiques()
    }, [])

    async function fetchBoutiques() {
        try {
            const { data } = await api.get('/boutiques')
            setBoutiques(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function handleEdit(boutique) {
        setEditing(boutique)
        setForm({
            nom       : boutique.nom,
            adresse   : boutique.adresse   ?? '',
            telephone : boutique.telephone ?? '',
            email     : boutique.email     ?? '',
        })
        setShowForm(true)
        setErrors({})
    }

    function handleCancel() {
        setEditing(null)
        setForm({ nom: '', adresse: '', telephone: '', email: '' })
        setShowForm(false)
        setErrors({})
    }

    async function handleSubmit() {
    setSaving(true)
    setErrors({})
    setMessage('')
    try {
        if (editing) {
            await api.put(`/boutiques/${editing.id}`, form)
            setMessage('Boutique modifiée avec succès !')
        } else {
            await api.post('/boutiques', form)
            setMessage('Boutique créée avec succès !')
        }
        handleCancel()
        fetchBoutiques()
         } catch (err) {
        console.error('Erreur:', err.response)
        if (err.response?.status === 422) {
            setErrors(err.response.data.errors ?? {})
            if (err.response.data.message) {
                setMessage(err.response.data.message)
            }
        } else if (err.response?.status === 403) {
            setMessage('Action non autorisée.')
        } else {
            setMessage('Une erreur est survenue — vérifiez la console.')
        }
    } finally {
        setSaving(false)
    }
    }

    async function handleDelete(id) {
        if (!confirm('Supprimer cette boutique ?')) return
        await api.delete(`/boutiques/${id}`)
        setMessage('Boutique supprimée.')
        fetchBoutiques()
    }

    return (
        <MainLayout title="Boutiques">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Mes boutiques</h2>
                    <p className="text-gray-500 text-xs mt-1">
                        {boutiques.length} boutique(s)
                    </p>
                </div>
                <button
                    onClick={() => { handleCancel(); setShowForm(true) }}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Nouvelle boutique
                </button>
            </div>

            {/* Message */}
           {message && (
            <div className={`border text-sm rounded-lg px-4 py-3 mb-4 ${
                message.includes('succès')
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
            {message}
            </div>
            )}

            {/* Formulaire */}
            {showForm && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-medium text-sm mb-4">
                        {editing ? '✏️ Modifier la boutique' : 'Nouvelle boutique'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Nom *</label>
                            <input
                                value={form.nom}
                                onChange={e => setForm({...form, nom: e.target.value})}
                                placeholder="ex: Boutique 3A Cocody"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                            {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Téléphone</label>
                            <input
                                value={form.telephone}
                                onChange={e => setForm({...form, telephone: e.target.value})}
                                placeholder="ex: 0102030405"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Email</label>
                            <input
                                value={form.email}
                                onChange={e => setForm({...form, email: e.target.value})}
                                placeholder="ex: boutique@3astore.com"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Adresse</label>
                            <input
                                value={form.adresse}
                                onChange={e => setForm({...form, adresse: e.target.value})}
                                placeholder="ex: Cocody, Abidjan"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                        >
                            {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Enregistrer'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Liste boutiques */}
            {loading ? (
                <p className="text-gray-500 text-sm">Chargement...</p>
            ) : boutiques.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <p className="text-4xl mb-3">🏪</p>
                    <p className="text-gray-400 text-sm">Aucune boutique pour le moment</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 text-purple-400 text-sm hover:text-purple-300"
                    >
                        + Créer votre première boutique
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {boutiques.map(b => (
                        <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-xl">
                                    🏪
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${b.actif ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {b.actif ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <h3 className="text-white font-medium text-sm mb-1">{b.nom}</h3>
                            {b.adresse   && <p className="text-gray-500 text-xs">📍 {b.adresse}</p>}
                            {b.telephone && <p className="text-gray-500 text-xs">📞 {b.telephone}</p>}
                            {b.email     && <p className="text-gray-500 text-xs">✉️ {b.email}</p>}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => handleEdit(b)}
                                    className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded-lg transition-colors"
                                >
                                    ✏️ Modifier
                                </button>
                                <button
                                    onClick={() => handleDelete(b.id)}
                                    className="flex-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 rounded-lg transition-colors"
                                >
                                    🗑️ Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    )
}