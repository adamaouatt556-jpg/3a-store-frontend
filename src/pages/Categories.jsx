import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'
import { useBoutique } from '../context/BoutiqueContext'

export default function Categories() {
    const [categories, setCategories] = useState([])
    const [boutiques, setBoutiques]   = useState([])
    const [loading, setLoading]       = useState(true)
    const [showForm, setShowForm]     = useState(false)
    const [editing, setEditing]       = useState(null)
    const [form, setForm]             = useState({
        nom: '', description: '', icone: '', boutique_id: ''
    })
    const [errors, setErrors]   = useState({})
    const [saving, setSaving]   = useState(false)
    const [message, setMessage] = useState('')
    const [showImport, setShowImport] = useState(false)
    const [csvFile, setCsvFile]       = useState(null)
    const [importing, setImporting]   = useState(false)
    const [importMsg, setImportMsg]   = useState('')
    const { boutiqueActive } = useBoutique()

    useEffect(() => {
        fetchCategories()
        fetchBoutiques()
    }, [boutiqueActive])

    async function fetchCategories() {
    try {
        const params = {}
        if (boutiqueActive) params.boutique_id = boutiqueActive.id
        const { data } = await api.get('/categories', { params })
        setCategories(data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
    }

    async function fetchBoutiques() {
        const { data } = await api.get('/boutiques')
        setBoutiques(data)
    }

    function handleEdit(categorie) {
        setEditing(categorie)
        setForm({
            nom         : categorie.nom,
            description : categorie.description ?? '',
            icone       : categorie.icone       ?? '',
            boutique_id : categorie.boutique_id,
        })
        setShowForm(true)
        setErrors({})
    }

    function handleCancel() {
        setEditing(null)
        setForm({
            nom: '', description: '', icone: '',
            boutique_id: boutiqueActive?.id ?? ''
        })
        setShowForm(false)
        setErrors({})
    }

    async function handleSubmit() {
        setSaving(true)
        setErrors({})
        setMessage('')
        try {
            if (editing) {
                await api.put(`/categories/${editing.id}`, form)
                setMessage('Catégorie modifiée avec succès !')
            } else {
                await api.post('/categories', form)
                setMessage('Catégorie créée avec succès !')
            }
            handleCancel()
            fetchCategories()
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors)
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id) {
        if (!confirm('Supprimer cette catégorie ?')) return
        await api.delete(`/categories/${id}`)
        setMessage('Catégorie supprimée.')
        fetchCategories()
    }

    async function handleImport() {
        if (!csvFile) return
        setImporting(true)
        setImportMsg('')
        const formData = new FormData()
        formData.append('fichier', csvFile)
        formData.append('boutique_id', form.boutique_id || boutiques[0]?.id)
        try {
            const { data } = await api.post('/categories/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setImportMsg(data.message)
            fetchCategories()
        } catch (err) {
            setImportMsg('Erreur lors de l\'import.')
        } finally {
            setImporting(false)
        }
    }

    return (
        <MainLayout title="Catégories">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Catégories</h2>
                    <p className="text-gray-500 text-xs mt-1">{categories.length} catégorie(s)</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowImport(!showImport)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">📥 Importer CSV</button>
                    <button onClick={() => { handleCancel(); setShowForm(true) }} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ Nouvelle catégorie</button>
                </div>
            </div>

            {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">{message}</div>}

            {showImport && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-medium text-sm mb-2">Importer via CSV</h3>
                    <p className="text-gray-500 text-xs mb-4">Format : nom, description, icone</p>
                    <div className="flex items-center gap-3">
                        <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="text-gray-400 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-700 file:text-gray-300 file:text-xs" />
                        <button onClick={handleImport} disabled={importing || !csvFile} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">{importing ? 'Import...' : 'Importer'}</button>
                    </div>
                    {importMsg && <p className="text-green-400 text-xs mt-3">{importMsg}</p>}
                </div>
            )}

            {showForm && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-medium text-sm mb-4">{editing ? '✏️ Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Nom *</label>
                            <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="ex: Vêtements" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                            {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Icône</label>
                            <input value={form.icone} onChange={e => setForm({...form, icone: e.target.value})} placeholder="ex: 👗" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
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
                            <label className="text-gray-400 text-xs mb-1 block">Description</label>
                            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="ex: Habits et accessoires" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleSubmit} disabled={saving} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">{saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Enregistrer'}</button>
                        <button onClick={handleCancel} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Annuler</button>
                    </div>
                </div>
            )}

            {loading ? <p className="text-gray-500 text-sm">Chargement...</p> : categories.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <p className="text-4xl mb-3">🏷️</p>
                    <p className="text-gray-400 text-sm">Aucune catégorie</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map(c => (
                        <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <div className="text-3xl mb-2">{c.icone || '🏷️'}</div>
                            <h3 className="text-white font-medium text-sm">{c.nom}</h3>
                            {c.description && <p className="text-gray-500 text-xs mt-1">{c.description}</p>}
                            <p className="text-purple-400 text-xs mt-2">{c.boutique?.nom}</p>
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => handleEdit(c)} className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded-lg transition-colors">✏️ Modifier</button>
                                <button onClick={() => handleDelete(c.id)} className="flex-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 rounded-lg transition-colors">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    )
}