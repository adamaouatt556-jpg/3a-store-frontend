import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const menuItems = [
    {
        section: 'Principal',
        items: [
            { path: '/dashboard',  label: 'Tableau de bord', icon: '▦',  roles: ['super_admin', 'gerant', 'vendeur'] },
            { path: '/boutiques',  label: 'Boutiques',        icon: '🏪', roles: ['super_admin', 'gerant']           },
            { path: '/produits',   label: 'Produits',         icon: '📦', roles: ['super_admin', 'gerant', 'vendeur'] },
            { path: '/stock',      label: 'Stock',            icon: '🗃️', roles: ['super_admin', 'gerant', 'vendeur'] },
        ]
    },
    {
        section: 'Gestion',
        items: [
            { path: '/categories',   label: 'Catégories',   icon: '🏷️', roles: ['super_admin', 'gerant']           },
            { path: '/mouvements',   label: 'Mouvements',   icon: '↕️',  roles: ['super_admin', 'gerant', 'vendeur'] },
            { path: '/alertes',      label: 'Alertes',      icon: '🔔', roles: ['super_admin', 'gerant', 'vendeur'] },
            { path: '/utilisateurs', label: 'Utilisateurs', icon: '👥', roles: ['super_admin', 'gerant']           },
            { path: '/inventaire', label: 'Inventaire', icon: '📋', roles: ['super_admin', 'gerant', 'vendeur'] },
        ]
    },
    {
        section: 'Finance',
        items: [
            { path: '/rapports',      label: 'Rapports',      icon: '📊', roles: ['super_admin', 'gerant'] },
            { path: '/statistiques',  label: 'Statistiques',  icon: '📈', roles: ['super_admin', 'gerant'] },
        ]
    },
    {
        section: 'Administration',
        items: [
            { path: '/forfaits',    label: 'Forfaits',    icon: '💎', roles: ['super_admin']           },
            { path: '/abonnements', label: 'Abonnements', icon: '📋', roles: ['super_admin', 'gerant'] },
        ]
    },
]

export default function Sidebar({ onClose }) {
    const { user, logout } = useAuth()
    const navigate         = useNavigate()

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    function handleNavClick() {
        // Fermer la sidebar sur mobile après navigation
        if (onClose) onClose()
    }

    return (
        <aside className="w-56 h-full bg-gray-900 border-r border-gray-800 flex flex-col">

            {/* Logo 3A + bouton fermer mobile */}
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-widest text-white">
                        3<span className="text-purple-400">A</span>
                        <span className="text-gray-500 text-sm font-normal ml-2">STORE</span>
                    </h1>
                    <p className="text-gray-600 text-xs mt-1">Gestion de stock</p>
                </div>
                {/* Bouton fermer — visible uniquement sur mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {menuItems.map((group) => {
                    const items = group.items.filter(item =>
                        item.roles.includes(user?.role)
                    )
                    if (items.length === 0) return null
                    return (
                        <div key={group.section} className="mb-6">
                            <p className="text-gray-600 text-xs font-medium uppercase tracking-widest px-3 mb-2">
                                {group.section}
                            </p>
                            {items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={handleNavClick}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                                            isActive
                                                ? 'bg-purple-600/20 text-purple-400 font-medium'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`
                                    }
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    )
                })}
            </nav>

            {/* Utilisateur connecté */}
            <div className="px-4 py-4 border-t border-gray-800">
                <div className="flex items-center gap-3 mb-3">
                    {user?.photo ? (
                        <img
                            src={`http://localhost:8000/storage/${user.photo}`}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            alt={user.name}
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                        <p className="text-gray-500 text-xs truncate">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full text-left text-xs text-gray-500 hover:text-red-400 transition-colors px-1"
                >
                    → Déconnexion
                </button>
            </div>
        </aside>
    )
}