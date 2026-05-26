import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/axios'

export default function Register() {
    const [step, setStep]         = useState(1)
    const [forfaits, setForfaits] = useState([])
    const [form, setForm]         = useState({
        name                  : '',
        email                 : '',
        password              : '',
        password_confirmation : '',
        telephone             : '',
        forfait_id            : null,
    })
    const [photo, setPhoto]     = useState(null)
    const [preview, setPreview] = useState(null)
    const [errors, setErrors]   = useState({})
    const [saving, setSaving]   = useState(false)
    const [success, setSuccess] = useState(false)
    const navigate              = useNavigate()

    useEffect(() => {
        fetchForfaits()
    }, [])

    async function fetchForfaits() {
        try {
            const { data } = await api.get('/forfaits')
            setForfaits(data)
        } catch (err) {
            console.error(err)
        }
    }

    function handlePhotoChange(e) {
        const file = e.target.files[0]
        if (!file) return
        setPhoto(file)
        setPreview(URL.createObjectURL(file))
    }

    function getTypeColor(type) {
        switch(type) {
            case 'mensuel'     : return 'border-blue-500/50 bg-blue-500/5'
            case 'trimestriel' : return 'border-green-500/50 bg-green-500/5'
            case 'semestriel'  : return 'border-purple-500/50 bg-purple-500/5'
            case 'annuel'      : return 'border-yellow-500/50 bg-yellow-500/5'
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

    async function handleSubmit() {
        setSaving(true)
        setErrors({})

        try {
            // 1. Créer le compte
            const formData = new FormData()
            formData.append('name',                  form.name)
            formData.append('email',                 form.email)
            formData.append('password',              form.password)
            formData.append('password_confirmation', form.password_confirmation)
            formData.append('telephone',             form.telephone)
            formData.append('role',                  'gerant')
            if (photo) formData.append('photo', photo)

            const { data } = await api.post('/auth/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            // 2. Sauvegarder le token
            localStorage.setItem('token', data.token)
            localStorage.setItem('user',  JSON.stringify(data.user))

            // 3. Créer l'abonnement si forfait choisi
            if (form.forfait_id) {
                const forfait = forfaits.find(f => f.id === form.forfait_id)
                await api.post('/abonnements', {
                    forfait_id   : form.forfait_id,
                    montant_paye : forfait?.prix ?? 0,
                    note         : `Inscription — forfait ${forfait?.nom}`,
                })
            }

            setSuccess(true)

        } catch (err) {
            console.error('Erreur inscription:', err.response?.data)
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors ?? {})
                if (err.response.data.message) {
                    setErrors(prev => ({ ...prev, general: [err.response.data.message] }))
                }
                setStep(1)
            } else {
                setErrors({ general: ['Une erreur est survenue. Veuillez réessayer.'] })
            }
        } finally {
            setSaving(false)
        }
    }

    // Page de succès
    if (success) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-white text-2xl font-bold mb-2">
                        Inscription réussie !
                    </h2>
                    <p className="text-gray-400 text-sm mb-2">
                        Votre compte a été créé avec succès.
                    </p>
                    <p className="text-yellow-400 text-sm mb-6">
                        ⏳ Votre abonnement est en attente de validation par l'administrateur 3A STORE.
                        Vous serez notifié par email une fois validé.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm transition-colors"
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white tracking-widest">
                        3<span className="text-purple-400">A</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">Créez votre compte gérant</p>
                </div>

                {/* Étapes */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 text-sm ${step >= 1 ? 'text-purple-400' : 'text-gray-600'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'}`}>1</div>
                        <span className="hidden sm:block">Informations</span>
                    </div>
                    <div className={`h-px w-8 sm:w-12 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-800'}`} />
                    <div className={`flex items-center gap-2 text-sm ${step >= 2 ? 'text-purple-400' : 'text-gray-600'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'}`}>2</div>
                        <span className="hidden sm:block">Forfait</span>
                    </div>
                    <div className={`h-px w-8 sm:w-12 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-800'}`} />
                    <div className={`flex items-center gap-2 text-sm ${step >= 3 ? 'text-purple-400' : 'text-gray-600'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'}`}>3</div>
                        <span className="hidden sm:block">Confirmation</span>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">

                    {/* Erreur générale */}
                    {errors.general && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                            {errors.general[0]}
                        </div>
                    )}

                    {/* ÉTAPE 1 — Informations */}
                    {step === 1 && (
                        <>
                            <h2 className="text-white font-semibold text-lg mb-6">
                                Vos informations
                            </h2>

                            {/* Photo */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                                        placeholder="ex: kouassi@email.com"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>}
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Mot de passe *</label>
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
                                    <label className="text-gray-400 text-xs mb-1 block">Confirmer le mot de passe *</label>
                                    <input
                                        type="password"
                                        value={form.password_confirmation}
                                        onChange={e => setForm({...form, password_confirmation: e.target.value})}
                                        placeholder="••••••••"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-gray-400 text-xs mb-1 block">Téléphone</label>
                                    <input
                                        value={form.telephone}
                                        onChange={e => setForm({...form, telephone: e.target.value})}
                                        placeholder="ex: 0102030405"
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const newErrors = {}
                                    if (!form.name)     newErrors.name     = ['Le nom est requis']
                                    if (!form.email)    newErrors.email    = ['L\'email est requis']
                                    if (!form.password) newErrors.password = ['Le mot de passe est requis']
                                    if (form.password !== form.password_confirmation) {
                                        newErrors.password = ['Les mots de passe ne correspondent pas']
                                    }
                                    if (Object.keys(newErrors).length > 0) {
                                        setErrors(newErrors)
                                        return
                                    }
                                    setErrors({})
                                    setStep(2)
                                }}
                                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-sm font-medium transition-colors"
                            >
                                Suivant →
                            </button>
                        </>
                    )}

                    {/* ÉTAPE 2 — Forfait */}
                    {step === 2 && (
                        <>
                            <h2 className="text-white font-semibold text-lg mb-2">
                                Choisissez votre forfait
                            </h2>
                            <p className="text-gray-500 text-xs mb-6">
                                Vous pourrez changer de forfait à tout moment
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {forfaits.map(f => (
                                    <div
                                        key={f.id}
                                        onClick={() => setForm({...form, forfait_id: f.id})}
                                        className={`border rounded-xl p-4 cursor-pointer transition-all ${
                                            form.forfait_id === f.id
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : getTypeColor(f.type)
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{getTypeIcon(f.type)}</span>
                                                <span className="text-white font-medium text-sm">{f.nom}</span>
                                            </div>
                                            {form.forfait_id === f.id && (
                                                <span className="text-purple-400 text-lg">✓</span>
                                            )}
                                        </div>
                                        <p className="text-white text-xl font-bold mb-2">
                                            {Number(f.prix).toLocaleString()} F
                                            <span className="text-gray-400 text-xs font-normal ml-1">/ {f.duree_jours} jours</span>
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-gray-400 text-xs">✓ {f.nb_boutiques === -1 ? 'Boutiques illimitées' : `${f.nb_boutiques} boutique(s)`}</p>
                                            <p className="text-gray-400 text-xs">✓ {f.nb_vendeurs_par_boutique} vendeurs/boutique</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg text-sm transition-colors"
                                >
                                    ← Retour
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!form.forfait_id}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Suivant →
                                </button>
                            </div>
                        </>
                    )}

                    {/* ÉTAPE 3 — Confirmation */}
                    {step === 3 && (
                        <>
                            <h2 className="text-white font-semibold text-lg mb-6">
                                Confirmation
                            </h2>

                            <div className="bg-gray-800 rounded-xl p-5 mb-6">
                                <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-4">Récapitulatif</h3>

                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
                                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                                        {preview
                                            ? <img src={preview} className="w-full h-full object-cover" alt="preview" />
                                            : form.name?.charAt(0).toUpperCase()
                                        }
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{form.name}</p>
                                        <p className="text-gray-400 text-xs">{form.email}</p>
                                        {form.telephone && <p className="text-gray-400 text-xs">{form.telephone}</p>}
                                    </div>
                                </div>

                                {form.forfait_id && (() => {
                                    const forfait = forfaits.find(f => f.id === form.forfait_id)
                                    return (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-gray-400 text-xs">Forfait choisi</span>
                                                <span className="text-white text-sm font-medium">{getTypeIcon(forfait?.type)} {forfait?.nom}</span>
                                            </div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-gray-400 text-xs">Durée</span>
                                                <span className="text-white text-sm">{forfait?.duree_jours} jours</span>
                                            </div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-gray-400 text-xs">Boutiques</span>
                                                <span className="text-white text-sm">{forfait?.nb_boutiques === -1 ? 'Illimitées' : forfait?.nb_boutiques}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                                                <span className="text-gray-400 text-xs">Montant</span>
                                                <span className="text-purple-400 text-lg font-bold">{Number(forfait?.prix).toLocaleString()} F CFA</span>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>

                            <p className="text-gray-500 text-xs mb-4 text-center">
                                Après inscription, votre compte sera en attente de validation par l'équipe 3A STORE.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg text-sm transition-colors"
                                >
                                    ← Retour
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {saving ? 'Inscription...' : '✓ Confirmer l\'inscription'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Déjà un compte ?
                    <Link to="/login" className="text-purple-400 hover:text-purple-300 ml-1">
                        Se connecter
                    </Link>
                </p>
            </div>
        </div>
    )
}