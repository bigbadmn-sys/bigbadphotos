import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Library', route: '/', icon: 'grid_view' },
  { label: 'Cull', route: '/cull', icon: 'collections' },
  { label: 'Compare', route: '/compare', icon: 'compare' },
  { label: 'Export', route: '/review', icon: 'ios_share' },
]

export default function BottomNavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="md:hidden h-20 shrink-0 bg-surface-container-low/80 backdrop-blur-xl border-t border-outline-variant/20 flex items-center justify-around px-4">
      {navItems.map(item => {
        const active = location.pathname === item.route
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.route)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '22px',
                fontVariationSettings: active ? "'FILL' 1, 'wght' 200" : "'FILL' 0, 'wght' 200",
              }}
            >
              {item.icon}
            </span>
            <span className="text-xs font-medium tracking-tight">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
