import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'LIBRARY', route: '/', icon: 'grid_view' },
  { label: 'CULL', route: '/cull', icon: 'collections' },
  { label: 'COMPARE', route: '/compare', icon: 'compare' },
  { label: 'EXPORT', route: '/review', icon: 'ios_share' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className="hidden md:flex w-48 flex-col shrink-0 bg-surface-container-low border-r border-outline-variant/20">
      <div className="px-6 pt-6 pb-6">
        <h2 className="font-display font-bold text-primary tracking-widest text-sm">BIGBADPHOTOS</h2>
        <p className="text-on-surface-variant text-xs mt-1 tracking-wider">PRO OPERATOR</p>
      </div>

      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map(item => {
          const active = location.pathname === item.route
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-widest transition-colors text-left relative ${
                active
                  ? 'text-primary bg-primary/10 border-l-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-l-2 border-transparent'
              }`}
            >
              <span className={`material-symbols-outlined text-xl leading-none ${active ? 'fill-icon' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
