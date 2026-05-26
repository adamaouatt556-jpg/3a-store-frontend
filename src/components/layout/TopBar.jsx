import { useAuth } from '../../context/AuthContext'
import { useBoutique } from '../../context/BoutiqueContext'
import Notifications from '../ui/Notifications'

export default function TopBar({ title, onMenuClick }) {
    const { user }                                        = useAuth()
    const { boutiques, boutiqueActive, changerBoutique } = useBoutique()

    return (
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 lg:px-6">

            {/* Gauche — Hamburger + Titre */}
            <div className="flex items-center gap-3">
                {/* Bouton hamburger — visible uniquement sur mobile */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
                >
                    ☰
                </button>
                <h2 className="text-white font-medium text-sm">{title}</h2>
            </div>

            {/* Droite */}
            <div className="flex items-center gap-2 lg:gap-4">

                {/* Menu déroulant boutiques */}
                {user?.role !== 'super_admin' && boutiques.length > 0 && (
                    <select
                        value={boutiqueActive?.id ?? ''}
                        onChange={e => {
                            const b = boutiques.find(b => b.id === parseInt(e.target.value))
                            if (b) changerBoutique(b)
                        }}
                        className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500 max-w-[120px] lg:max-w-none"
                    >
                        {boutiques.map(b => (
                            <option key={b.id} value={b.id}>
                                🏪 {b.nom}
                            </option>
                        ))}
                    </select>
                )}

                {/* Super Admin — label fixe */}
                {user?.role === 'super_admin' && (
                    <div className="hidden lg:flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
                        <span className="text-purple-400 text-xs">👑</span>
                        <span className="text-gray-300 text-xs">Super Admin</span>
                    </div>
                )}

                {/* Notifications */}
                <Notifications />

                {/* Utilisateur */}
                <div className="flex items-center gap-2">
                    {user?.photo ? (
                        <img
                            src={`http://localhost:8000/storage/${user.photo}`}
                            className="w-7 h-7 rounded-full object-cover"
                            alt={user.name}
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="text-gray-400 text-xs hidden lg:block">
                        {user?.name}
                    </span>
                </div>
            </div>
        </header>
    )
}