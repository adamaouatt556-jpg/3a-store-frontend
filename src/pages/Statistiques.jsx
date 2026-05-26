import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'
import { useBoutique } from '../context/BoutiqueContext'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts'

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']

export default function Statistiques() {
    const [mouvements, setMouvements] = useState([])
    const [produits, setProduits]     = useState([])
    const [loading, setLoading]       = useState(true)
    const [periode, setPeriode]       = useState('mois')
    const { boutiqueActive }          = useBoutique()

    useEffect(() => {
        fetchData()
    }, [periode, boutiqueActive])

    async function fetchData() {
        setLoading(true)
        try {
            const params = {}
            if (boutiqueActive) params.boutique_id = boutiqueActive.id

            const [mvtRes, prodRes] = await Promise.all([
                api.get('/mouvements', { params: { ...params, per_page: 1000 } }),
                api.get('/produits',   { params: { ...params, per_page: 1000 } }),
            ])
            setMouvements(mvtRes.data.data ?? [])
            setProduits(prodRes.data.data   ?? [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Filtrer par période
    function filtrerParPeriode(items) {
        const now   = new Date()
        const debut = new Date()
        if (periode === 'semaine')  debut.setDate(now.getDate() - 7)
        else if (periode === 'mois')  debut.setMonth(now.getMonth() - 1)
        else if (periode === 'annee') debut.setFullYear(now.getFullYear() - 1)
        return items.filter(item => new Date(item.created_at) >= debut)
    }

    const mvtFiltres = filtrerParPeriode(mouvements)

    // 1. Données évolution stock par jour
    function getEvolutionData() {
        const grouped = {}
        mvtFiltres.forEach(m => {
            const date = new Date(m.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit'
            })
            if (!grouped[date]) grouped[date] = { date, entrees: 0, sorties: 0, pertes: 0 }
            if (m.type === 'entree')     grouped[date].entrees += m.quantite
            if (m.type === 'sortie')     grouped[date].sorties += m.quantite
            if (m.type === 'perte')      grouped[date].pertes  += m.quantite
        })
        return Object.values(grouped).slice(-15)
    }

    // 2. Chiffre d'affaires par jour
    function getCAData() {
        const grouped = {}
        mvtFiltres
            .filter(m => m.type === 'sortie')
            .forEach(m => {
                const date = new Date(m.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: '2-digit'
                })
                if (!grouped[date]) grouped[date] = { date, ca: 0, benefice: 0 }
                grouped[date].ca       += (m.produit?.prix_vente ?? 0) * m.quantite
                grouped[date].benefice += ((m.produit?.prix_vente ?? 0) - (m.produit?.prix_achat ?? 0)) * m.quantite
            })
        return Object.values(grouped).slice(-15)
    }

    // 3. Répartition par catégorie
    function getCategorieData() {
        const grouped = {}
        produits.forEach(p => {
            const cat = p.categorie?.nom ?? 'Sans catégorie'
            if (!grouped[cat]) grouped[cat] = { name: cat, value: 0, stock: 0 }
            grouped[cat].value += 1
            grouped[cat].stock += p.stock?.quantite ?? 0
        })
        return Object.values(grouped)
    }

    // 4. Top produits vendus
    function getTopProduitsData() {
        const grouped = {}
        mvtFiltres
            .filter(m => m.type === 'sortie')
            .forEach(m => {
                const nom = m.produit?.nom ?? 'Inconnu'
                if (!grouped[nom]) grouped[nom] = { name: nom, quantite: 0, ca: 0 }
                grouped[nom].quantite += m.quantite
                grouped[nom].ca       += (m.produit?.prix_vente ?? 0) * m.quantite
            })
        return Object.values(grouped)
            .sort((a, b) => b.ca - a.ca)
            .slice(0, 6)
    }

    // 5. Répartition des types de mouvements
    function getTypesData() {
        const types = { entree: 0, sortie: 0, perte: 0, retour: 0, ajustement: 0 }
        mvtFiltres.forEach(m => {
            if (types[m.type] !== undefined) types[m.type] += m.quantite
        })
        return [
            { name: 'Entrées',      value: types.entree,     color: '#10b981' },
            { name: 'Sorties',      value: types.sortie,     color: '#ef4444' },
            { name: 'Pertes',       value: types.perte,      color: '#f59e0b' },
            { name: 'Retours',      value: types.retour,     color: '#3b82f6' },
            { name: 'Ajustements',  value: types.ajustement, color: '#8b5cf6' },
        ].filter(t => t.value > 0)
    }

    // Stats résumé
    const sorties          = mvtFiltres.filter(m => m.type === 'sortie')
    const chiffreAffaires  = sorties.reduce((acc, m) => acc + ((m.produit?.prix_vente ?? 0) * m.quantite), 0)
    const beneficeNet      = sorties.reduce((acc, m) => acc + (((m.produit?.prix_vente ?? 0) - (m.produit?.prix_achat ?? 0)) * m.quantite), 0)

    const evolutionData  = getEvolutionData()
    const caData         = getCAData()
    const categorieData  = getCategorieData()
    const topProduits    = getTopProduitsData()
    const typesData      = getTypesData()

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs">
                    <p className="text-gray-400 mb-1">{label}</p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ color: p.color }}>
                            {p.name} : {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <MainLayout title="Statistiques">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Statistiques</h2>
                    <p className="text-gray-500 text-xs mt-1">
                        Analyse graphique de votre activité
                    </p>
                </div>
                <select
                    value={periode}
                    onChange={e => setPeriode(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                    <option value="semaine">Cette semaine</option>
                    <option value="mois">Ce mois</option>
                    <option value="annee">Cette année</option>
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 text-sm">Chargement des données...</p>
                </div>
            ) : (
                <>
                    {/* Stats résumé */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-gray-400 text-xs mb-1">Total produits</p>
                            <p className="text-white text-2xl font-bold">{produits.length}</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-gray-400 text-xs mb-1">Mouvements</p>
                            <p className="text-purple-400 text-2xl font-bold">{mvtFiltres.length}</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-gray-400 text-xs mb-1">Chiffre d'affaires</p>
                            <p className="text-green-400 text-2xl font-bold">{Number(chiffreAffaires).toLocaleString()} F</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-gray-400 text-xs mb-1">Bénéfice net</p>
                            <p className={`text-2xl font-bold ${beneficeNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {Number(beneficeNet).toLocaleString()} F
                            </p>
                        </div>
                    </div>

                    {/* Graphique 1 — Évolution des mouvements */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
                        <h3 className="text-white font-medium text-sm mb-4">
                            📈 Évolution des mouvements
                        </h3>
                        {evolutionData.length === 0 ? (
                            <p className="text-gray-500 text-xs text-center py-8">Aucune donnée sur cette période</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={evolutionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                                    <Line type="monotone" dataKey="entrees"  name="Entrées"  stroke="#10b981" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="sorties"  name="Sorties"  stroke="#ef4444" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="pertes"   name="Pertes"   stroke="#f59e0b" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Graphique 2 — CA et Bénéfice */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
                        <h3 className="text-white font-medium text-sm mb-4">
                            💰 Chiffre d'affaires & Bénéfice
                        </h3>
                        {caData.length === 0 ? (
                            <p className="text-gray-500 text-xs text-center py-8">Aucune vente sur cette période</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={caData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                                    <Bar dataKey="ca"       name="CA (F)"       fill="#8b5cf6" radius={[4,4,0,0]} />
                                    <Bar dataKey="benefice" name="Bénéfice (F)" fill="#10b981" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

                        {/* Graphique 3 — Répartition par catégorie */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-white font-medium text-sm mb-4">
                                🏷️ Produits par catégorie
                            </h3>
                            {categorieData.length === 0 ? (
                                <p className="text-gray-500 text-xs text-center py-8">Aucune donnée</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={categorieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, value }) => `${name} (${value})`}
                                            labelLine={false}
                                        >
                                            {categorieData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Graphique 4 — Types de mouvements */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-white font-medium text-sm mb-4">
                                ↕️ Types de mouvements
                            </h3>
                            {typesData.length === 0 ? (
                                <p className="text-gray-500 text-xs text-center py-8">Aucun mouvement sur cette période</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={typesData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, value }) => `${name} (${value})`}
                                        >
                                            {typesData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Graphique 5 — Top produits */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-white font-medium text-sm mb-4">
                            🏆 Top produits vendus
                        </h3>
                        {topProduits.length === 0 ? (
                            <p className="text-gray-500 text-xs text-center py-8">Aucune vente sur cette période</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={topProduits} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={120} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                                    <Bar dataKey="quantite" name="Quantité" fill="#8b5cf6" radius={[0,4,4,0]} />
                                    <Bar dataKey="ca"       name="CA (F)"   fill="#10b981" radius={[0,4,4,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </>
            )}
        </MainLayout>
    )
}