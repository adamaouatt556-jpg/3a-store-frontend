import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/axios'
import { useAuth } from './AuthContext'

const BoutiqueContext = createContext()

export function BoutiqueProvider({ children }) {
    const [boutiques, setBoutiques]           = useState([])
    const [boutiqueActive, setBoutiqueActive] = useState(null)
    const [loading, setLoading]               = useState(true)
    const { user }                            = useAuth()

    useEffect(() => {
        if (user) fetchBoutiques()
    }, [user])

    async function fetchBoutiques() {
        try {
            const { data } = await api.get('/boutiques')
            setBoutiques(data)

            // Charger la boutique sauvegardée ou prendre la première
            const savedId = localStorage.getItem('boutique_active_id')
            const found   = data.find(b => b.id === parseInt(savedId))
            setBoutiqueActive(found || data[0] || null)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function changerBoutique(boutique) {
        setBoutiqueActive(boutique)
        localStorage.setItem('boutique_active_id', boutique.id)
    }

    return (
        <BoutiqueContext.Provider value={{
            boutiques,
            boutiqueActive,
            changerBoutique,
            loading,
            fetchBoutiques,
        }}>
            {children}
        </BoutiqueContext.Provider>
    )
}

export function useBoutique() {
    return useContext(BoutiqueContext)
}