import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import { useBoutique } from '../context/BoutiqueContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Rapports() {
    const [mouvements, setMouvements] = useState([])
    const [produits, setProduits]     = useState([])
    const [loading, setLoading]       = useState(true)
    const [periode, setPeriode]       = useState('mois')
    const { user }                    = useAuth()
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
        if (periode === 'jour')    debut.setDate(now.getDate() - 1)
        else if (periode === 'semaine') debut.setDate(now.getDate() - 7)
        else if (periode === 'mois')    debut.setMonth(now.getMonth() - 1)
        else if (periode === 'annee')   debut.setFullYear(now.getFullYear() - 1)
        return items.filter(item => new Date(item.created_at) >= debut)
    }

    const mvtFiltres = filtrerParPeriode(mouvements)
    const sorties    = mvtFiltres.filter(m => m.type === 'sortie')
    const entrees    = mvtFiltres.filter(m => m.type === 'entree')
    const pertes     = mvtFiltres.filter(m => m.type === 'perte')

    const chiffreAffaires = sorties.reduce((acc, m) => acc + ((m.produit?.prix_vente ?? 0) * m.quantite), 0)
    const coutAchats      = sorties.reduce((acc, m) => acc + ((m.produit?.prix_achat ?? 0) * m.quantite), 0)
    const beneficesBruts  = chiffreAffaires - coutAchats
    const montantPertes   = pertes.reduce((acc, m) => acc + ((m.produit?.prix_achat ?? 0) * m.quantite), 0)
    const beneficesNets   = beneficesBruts - montantPertes
    const valeurStockTotal = produits.reduce((acc, p) => acc + ((p.prix_achat ?? 0) * (p.stock?.quantite ?? 0)), 0)

    const topProduits = sorties
        .reduce((acc, m) => {
            const existing = acc.find(p => p.id === m.produit?.id)
            if (existing) {
                existing.quantite += m.quantite
                existing.ca       += (m.produit?.prix_vente ?? 0) * m.quantite
            } else if (m.produit) {
                acc.push({ id: m.produit.id, nom: m.produit.nom, quantite: m.quantite, ca: (m.produit.prix_vente ?? 0) * m.quantite })
            }
            return acc
        }, [])
        .sort((a, b) => b.ca - a.ca)
        .slice(0, 5)

    // Export PDF
    function exportPDF() {
        const doc = new jsPDF()
        const now = new Date().toLocaleDateString('fr-FR')

        // En-tête
        doc.setFillColor(88, 28, 135)
        doc.rect(0, 0, 210, 30, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text('3A STORE', 14, 15)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Rapport financier', 14, 22)
        doc.text(`Généré le ${now}`, 150, 22)

        // Boutique
        if (boutiqueActive) {
            doc.setTextColor(88, 28, 135)
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text(`Boutique : ${boutiqueActive.nom}`, 14, 42)
        }

        // Période
        const periodeLabel = {
            jour: "Aujourd'hui", semaine: 'Cette semaine',
            mois: 'Ce mois', annee: 'Cette année'
        }
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Période : ${periodeLabel[periode]}`, 14, 50)

        // Stats financières
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Résumé financier', 14, 62)

        autoTable(doc, {
            startY: 66,
            head: [['Indicateur', 'Montant (F CFA)']],
            body: [
                ['Chiffre d\'affaires',  Number(chiffreAffaires).toLocaleString()],
                ['Coût d\'achat',        Number(coutAchats).toLocaleString()],
                ['Bénéfice brut',        Number(beneficesBruts).toLocaleString()],
                ['Pertes',               `-${Number(montantPertes).toLocaleString()}`],
                ['Bénéfice net',         Number(beneficesNets).toLocaleString()],
                ['Valeur stock actuel',  Number(valeurStockTotal).toLocaleString()],
            ],
            headStyles    : { fillColor: [88, 28, 135], textColor: 255 },
            alternateRowStyles : { fillColor: [245, 240, 255] },
            styles        : { fontSize: 10 },
        })

        // Top produits
        if (topProduits.length > 0) {
            doc.setFontSize(13)
            doc.setFont('helvetica', 'bold')
            doc.text('Top 5 produits vendus', 14, doc.lastAutoTable.finalY + 16)

            autoTable(doc, {
                startY : doc.lastAutoTable.finalY + 20,
                head   : [['Produit', 'Quantité vendue', 'CA (F CFA)']],
                body   : topProduits.map((p, i) => [
                    `${i + 1}. ${p.nom}`,
                    p.quantite,
                    Number(p.ca).toLocaleString(),
                ]),
                headStyles : { fillColor: [88, 28, 135], textColor: 255 },
                alternateRowStyles : { fillColor: [245, 240, 255] },
                styles : { fontSize: 10 },
            })
        }

        // Mouvements détaillés
        if (mvtFiltres.length > 0) {
            doc.setFontSize(13)
            doc.setFont('helvetica', 'bold')
            doc.text('Détail des mouvements', 14, doc.lastAutoTable.finalY + 16)

            autoTable(doc, {
                startY : doc.lastAutoTable.finalY + 20,
                head   : [['Date', 'Produit', 'Type', 'Quantité', 'Motif']],
                body   : mvtFiltres.slice(0, 50).map(m => [
                    new Date(m.created_at).toLocaleDateString('fr-FR'),
                    m.produit?.nom ?? '—',
                    m.type,
                    m.quantite,
                    m.motif ?? '—',
                ]),
                headStyles : { fillColor: [88, 28, 135], textColor: 255 },
                alternateRowStyles : { fillColor: [245, 240, 255] },
                styles : { fontSize: 9 },
            })
        }

        // Pied de page
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(
                `3A STORE — Rapport généré le ${now} — Page ${i}/${pageCount}`,
                14, 290
            )
        }

        // Télécharger
        const nomFichier = `rapport_3astore_${boutiqueActive?.nom ?? 'global'}_${now.replace(/\//g, '-')}.pdf`
        doc.save(nomFichier)
    }

    return (
        <MainLayout title="Rapports & Finances">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-white font-semibold">Rapports & Finances</h2>
                    <p className="text-gray-500 text-xs mt-1">Analyse de votre activité</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={periode}
                        onChange={e => setPeriode(e.target.value)}
                        className="bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                    >
                        <option value="jour">Aujourd'hui</option>
                        <option value="semaine">Cette semaine</option>
                        <option value="mois">Ce mois</option>
                        <option value="annee">Cette année</option>
                    </select>
                    <button
                        onClick={exportPDF}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        📄 Exporter PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-gray-500 text-sm">Chargement...</p>
            ) : (
                <>
                    {/* Stats financières */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <p className="text-gray-400 text-xs mb-2">Chiffre d'affaires</p>
                            <p className="text-white text-xl font-bold">{Number(chiffreAffaires).toLocaleString()} F</p>
                            <p className="text-gray-500 text-xs mt-1">{sorties.length} vente(s)</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <p className="text-gray-400 text-xs mb-2">Bénéfice brut</p>
                            <p className={`text-xl font-bold ${beneficesBruts >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {Number(beneficesBruts).toLocaleString()} F
                            </p>
                            <p className="text-gray-500 text-xs mt-1">Après coût d'achat</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <p className="text-gray-400 text-xs mb-2">Pertes</p>
                            <p className="text-red-400 text-xl font-bold">-{Number(montantPertes).toLocaleString()} F</p>
                            <p className="text-gray-500 text-xs mt-1">{pertes.length} perte(s)</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <p className="text-gray-400 text-xs mb-2">Bénéfice net</p>
                            <p className={`text-xl font-bold ${beneficesNets >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {Number(beneficesNets).toLocaleString()} F
                            </p>
                            <p className="text-gray-500 text-xs mt-1">Après pertes</p>
                        </div>
                    </div>

                    {/* Valeur du stock */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs mb-1">Valeur totale du stock</p>
                                <p className="text-white text-2xl font-bold">{Number(valeurStockTotal).toLocaleString()} F CFA</p>
                                <p className="text-gray-500 text-xs mt-1">{produits.length} produit(s)</p>
                            </div>
                            <span className="text-5xl">🏭</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Top produits */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-white font-medium text-sm mb-4">🏆 Top 5 produits vendus</h3>
                            {topProduits.length === 0 ? (
                                <p className="text-gray-500 text-xs">Aucune vente sur cette période</p>
                            ) : (
                                topProduits.map((p, i) => (
                                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500 text-xs w-4">{i + 1}.</span>
                                            <span className="text-gray-300 text-xs">{p.nom}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white text-xs font-medium">{Number(p.ca).toLocaleString()} F</p>
                                            <p className="text-gray-500 text-xs">{p.quantite} unités</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Résumé mouvements */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-white font-medium text-sm mb-4">📊 Résumé des mouvements</h3>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span>📥</span>
                                        <span className="text-gray-300 text-xs">Entrées</span>
                                    </div>
                                    <span className="text-green-400 text-sm font-bold">
                                        +{entrees.reduce((acc, m) => acc + m.quantite, 0)} unités
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span>📤</span>
                                        <span className="text-gray-300 text-xs">Sorties</span>
                                    </div>
                                    <span className="text-red-400 text-sm font-bold">
                                        -{sorties.reduce((acc, m) => acc + m.quantite, 0)} unités
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span>💸</span>
                                        <span className="text-gray-300 text-xs">Pertes</span>
                                    </div>
                                    <span className="text-orange-400 text-sm font-bold">
                                        -{pertes.reduce((acc, m) => acc + m.quantite, 0)} unités
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span>📦</span>
                                        <span className="text-gray-300 text-xs">Total mouvements</span>
                                    </div>
                                    <span className="text-white text-sm font-bold">{mvtFiltres.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </MainLayout>
    )
}