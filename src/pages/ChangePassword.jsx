import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'

export default function ChangePassword() {
    const [form, setForm]       = useState({ password: '', password_confirmation: '' })
    const [errors, setErrors]   = useState({})
    const [saving, setSaving]   = useState(false)
    const [message, setMessage] = useState('')
    const navigate              = useNavigate()

    async function handleSubmit() {
        setErrors({})
        setMessage('')

        // Validation locale
        if (!form.password) {
            setErrors({ password: ['Le mot de passe est requis'] })
            return
        }
        if (form.password.length < 8) {
            setErrors({ password: ['Le mot de passe doit contenir au moins 8 caractères'] })
            return
        }
        if (form.password !== form.password_confirmation) {
            setErrors({ password_confirmation: ['Les mots de passe ne correspondent pas'] })
            return
        }

        setSaving(true)
        try {
            await api.post('/auth/change-password', {
                password              : form.password,
                password_confirmation : form.password_confirmation,
            })

            // Mettre à jour le user local
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            user.must_change_password = false
            localStorage.setItem('user', JSON.stringify(user))

            setMessage('Mot de passe changé avec succès !')
            setTimeout(() => navigate('/dashboard'), 1500)
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors ?? {})
            } else {
                setMessage('Une erreur est survenue.')
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white tracking-widest">
                        3<span className="text-purple-400">A</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">Gestion de Stock</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                    <div className="text-center mb-6">
                        <span className="text-4xl">🔐</span>
                        <h2 className="text-white text-xl font-semibold mt-3">
                            Changement de mot de passe requis
                        </h2>
                        <p className="text-gray-400 text-sm mt-2">
                            Votre mot de passe a été réinitialisé par l'administrateur.
                            Veuillez créer un nouveau mot de passe sécurisé.
                        </p>
                    </div>

                    {/* Message succès */}
                    {message && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
                            {message}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">
                                Nouveau mot de passe *
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => setForm({...form, password: e.target.value})}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
                            />
                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1">{errors.password[0]}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">
                                Confirmer le mot de passe *
                            </label>
                            <input
                                type="password"
                                value={form.password_confirmation}
                                onChange={e => setForm({...form, password_confirmation: e.target.value})}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
                            />
                            {errors.password_confirmation && (
                                <p className="text-red-400 text-xs mt-1">{errors.password_confirmation[0]}</p>
                            )}
                        </div>

                        {/* Critères */}
                        <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-gray-400 text-xs mb-2">Le mot de passe doit contenir :</p>
                            <p className={`text-xs ${form.password.length >= 8 ? 'text-green-400' : 'text-gray-500'}`}>
                                {form.password.length >= 8 ? '✓' : '○'} Au moins 8 caractères
                            </p>
                            <p className={`text-xs ${form.password && form.password === form.password_confirmation ? 'text-green-400' : 'text-gray-500'}`}>
                                {form.password && form.password === form.password_confirmation ? '✓' : '○'} Les deux mots de passe correspondent
                            </p>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg py-3 text-sm transition-colors mt-2"
                        >
                            {saving ? 'Enregistrement...' : 'Changer mon mot de passe'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}