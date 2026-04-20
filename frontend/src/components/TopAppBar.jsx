import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'LIBRARY', route: '/' },
  { label: 'CULL', route: '/cull' },
  { label: 'COMPARE', route: '/compare' },
  { label: 'EXPORT', route: '/review' },
]

export default function TopAppBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="h-16 shrink-0 bg-surface border-b border-outline-variant/20 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full border border-primary/60 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
        <span className="font-display font-bold text-primary tracking-widest text-sm">BIGBADPHOTOS</span>
      </div>

      <nav className="hidden md:flex items-center gap-6">
        {navItems.map(item => {
          const active = location.pathname === item.route
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className={`text-xs font-medium tracking-widest transition-colors pb-0.5 ${
                active
                  ? 'text-primary border-b border-primary'
                  : 'text-on-surface-variant hover:text-on-surface border-b border-transparent'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center overflow-hidden">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>person</span>
      </div>
    </header>
  )
}
