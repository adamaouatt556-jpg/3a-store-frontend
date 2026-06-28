import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'
import { useBoutique } from '../context/BoutiqueContext'

export default function Utilisateurs() {
    const [users, setUsers]         = useState([])
    const [boutiques, setBoutiques] = useState([])
    const [loading, setLoading]     = useState(true)
    const [showForm, setShowForm]   = useState(false)
    const [editing, setEditing]     = useState(null)
    const [errors, setErrors]       = useState({})
    const [saving, setSaving]       = useState(false)
    const [message, setMessage]     = useState('')
    const [form, setForm]           = useState({
        name: '', email: '', password: '', role: 'vendeur', telephone: '', boutique_id: '',
    })
    const [photo, setPhoto]         = useState(null)
    const [preview, setPreview]     = useState(null)
    const { boutiqueActive }        = useBoutique()

    useEffect(() => {
        fetchUsers()
        fetchBoutiques()
    }, [])

    async function fetchUsers() {
        try {
            const { data } = await api.get('/users')
            setUsers(data)
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

    function handleEdit(user) {
        setEditing(user)
        setForm({
            name        : user.name,
            email       : user.email,
            password    : '',
            role        : user.role,
            telephone   : user.telephone ?? '',
            boutique_id : '',
        })
        setPreview(user.photo ? `http://localhost:8000/storage/${user.photo}` : null)
        setShowForm(true)
        setErrors({})
    }

    function handleCancel() {
        setEditing(null)
        setForm({
            name: '', email: '', password: '',
            role: 'vendeur', telephone: '',
            boutique_id: boutiqueActive?.id ?? '',
        })
        setPhoto(null)
        setPreview(null)
        setShowForm(false)
        setErrors({})
    }

    function handlePhotoChange(e) {
        const file = e.target.files[0]
        if (!file) return
        setPhoto(file)
        setPreview(URL.createObjectURL(file))
    }

    async function handleSubmit() {
        setSaving(true)
        setErrors({})
        setMessage('')
        try {
            const formData = new FormData()
            Object.keys(form).forEach(key => {
                if (key === 'password' && !form[key] && editing) return
                if (form[key]) formData.append(key, form[key])
            })
            if (photo) formData.append('photo', photo)

            if (editing) {
                formData.append('_method', 'PUT')
                await api.post(`/users/${editing.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                setMessage('Utilisateur modifié avec succès !')
            } else {
                await api.post('/users', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                setMessage('Utilisateur créé et assigné à la boutique avec succès !')
            }
            handleCancel()
            fetchUsers()
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors ?? {})
                if (err.response.data.message) {
                    setMessage(err.response.data.message)
                }
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id) {
        if (!confirm('Supprimer cet utilisateur ?')) return
        await api.delete(`/users/${id}`)
        setMessage('Utilisateur supprimé.')
        fetchUsers()
    }

    async function handleAssignerBoutique(userId, boutiqueId) {
        try {
            await api.post(`/users/${userId}/assigner-boutique`, { boutique_id: boutiqueId })
            setMessage('Vendeur assigné avec succès !')
            fetchUsers()
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Erreur.')
        }
    }

    async function handleRetirerBoutique(userId, boutiqueId) {
        try {
            await api.post(`/users/${userId}/retirer-boutique`, { boutique_id: boutiqueId })
            setMessage('Vendeur retiré de la boutique.')
            fetchUsers()
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Erreur.')
        }
    }

    async function handleResetPassword(userId) {
        const tempPassword = prompt('Entrez le mot de passe temporaire pour cet utilisateur (min 6 caractères) :')
        if (!tempPassword) return
        if (tempPassword.length < 6) {
            setMessage('Le mot de passe temporaire doit contenir au moins 6 caractères.')
            return
        }
        try {
            await api.post(`/users/${userId}/reset-password`, {
                temp_password: tempPassword
            })
            setMessage(`Mot de passe réinitialisé ! L'utilisateur devra le changer à sa prochaine connexion. Mot de passe temporaire : ${tempPassword}`)
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Erreur.')
        }
    }

    function getRoleBadge(role) {
        switch(role) {
            case 'super_admin' : return 'bg-purple-500/10 text-purple-400'
            case 'gerant'      : return 'bg-blue-500/10 text-blue-400'
            case 'vendeur'     : return 'bg-green-500/10 text-green-400'
            default            : return 'bg-gray-500/10 text-gray-400'
        }
    }

    return (
        <MainLayout title="Utilisateurs">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Utilisateurs</h2>
                    <p className="text-gray-500 text-xs mt-1">{users.length} utilisateur(s)</p>
                </div>
                <button
                    onClick={() => { handleCancel(); setShowForm(true) }}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Nouvel utilisateur
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`border text-sm rounded-lg px-4 py-3 mb-4 ${
                    message.includes('succès') || message.includes('assigné')
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
                        {editing ? '✏️ Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                    </h3>

                    {/* Photo */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                            {preview
                                ? <img src={preview} className="w-full h-full object-cover" alt="preview" />
                                : <span className="text-gray-500 text-2xl">👤</span>
                            }
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Photo de profil</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="text-gray-400 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-700 file:text-gray-300 file:text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Nom complet *</label>
                            <input
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                                placeholder="ex: Kouassi Alidou"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Email *</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({...form, email: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>}
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">
                                {editing ? 'Nouveau mot de passe (vide = inchangé)' : 'Mot de passe *'}
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => setForm({...form, password: e.target.value})}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password[0]}</p>}
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
                            <label className="text-gray-400 text-xs mb-1 block">Rôle *</label>
                            <select
                                value={form.role}
                                onChange={e => setForm({...form, role: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            >
                                <option value="vendeur">Vendeur</option>
                                <option value="gerant">Gérant</option>
                            </select>
                        </div>

                        {/* Boutique — uniquement pour vendeur à la création */}
                        {!editing && form.role === 'vendeur' && (
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">
                                    Assigner à la boutique *
                                </label>
                                <select
                                    value={form.boutique_id}
                                    onChange={e => setForm({...form, boutique_id: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                >
                                    <option value="">— Sélectionner —</option>
                                    {boutiques.map(b => (
                                        <option key={b.id} value={b.id}>{b.nom}</option>
                                    ))}
                                </select>
                                {errors.boutique_id && <p className="text-red-400 text-xs mt-1">{errors.boutique_id[0]}</p>}
                            </div>
                        )}
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

            {/* Liste utilisateurs */}
            {loading ? (
                <p className="text-gray-500 text-sm">Chargement...</p>
            ) : users.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                    <p className="text-4xl mb-3">👥</p>
                    <p className="text-gray-400 text-sm">Aucun utilisateur</p>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Utilisateur</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Rôle</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Téléphone</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Statut</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Boutiques</th>
                                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {u.photo ? (
                                                <img
                                                    src={`http://localhost:8000/storage/${u.photo}`}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    alt={u.name}
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {u.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white text-xs font-medium">{u.name}</p>
                                                <p className="text-gray-500 text-xs">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadge(u.role)}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {u.telephone || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${u.actif ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {u.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.role === 'vendeur' && (
                                            <div className="flex flex-col gap-1">
                                                {/* Boutiques assignées */}
                                                {u.boutiques_assignees?.map(b => (
                                                    <div key={b.id} className="flex items-center gap-1">
                                                        <span className="text-gray-300 text-xs">🏪 {b.nom}</span>
                                                        <button
                                                            onClick={() => handleRetirerBoutique(u.id, b.id)}
                                                            className="text-red-400 hover:text-red-300 text-xs ml-1"
                                                            title="Retirer"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                {/* Assigner nouvelle boutique */}
                                                <select
                                                    onChange={e => {
                                                        if (e.target.value) {
                                                            handleAssignerBoutique(u.id, e.target.value)
                                                            e.target.value = ''
                                                        }
                                                    }}
                                                    className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none mt-1"
                                                >
                                                    <option value="">+ Assigner...</option>
                                                    {boutiques.map(b => (
                                                        <option key={b.id} value={b.id}>{b.nom}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(u)}
                                                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-lg transition-colors"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleResetPassword(u.id)}
                                                className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg transition-colors"
                                                title="Réinitialiser le mot de passe"
                                            >
                                                🔑
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded-lg transition-colors"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </MainLayout>
    )
}