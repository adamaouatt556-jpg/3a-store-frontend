import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function MainLayout({ title, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-gray-950">

            {/* Overlay mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed top-0 left-0 h-full z-50 transition-transform duration-300
                lg:static lg:translate-x-0 lg:block
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Contenu principal */}
            <div className="flex-1 flex flex-col min-w-0 w-full">

                {/* TopBar */}
                <TopBar
                    title={title}
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Page */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}