import { useState } from 'react'

const CORRECT = import.meta.env.VITE_APP_PASSWORD
const SESSION_KEY = 'bbp_authed'

function isAuthed() {
  if (!CORRECT) return true  // no password set — gate disabled
  return sessionStorage.getItem(SESSION_KEY) === CORRECT
}

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(isAuthed)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  if (authed) return children

  const submit = (e) => {
    e.preventDefault()
    if (value === CORRECT) {
      sessionStorage.setItem(SESSION_KEY, CORRECT)
      setAuthed(true)
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-surface-container-lowest">
      <form onSubmit={submit} className="flex flex-col gap-6 w-72">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <h1 className="font-display font-bold text-on-surface text-2xl tracking-wide">BIGBADPHOTOS</h1>
          <p className="text-on-surface-variant text-sm mt-1 tracking-wider">Enter your access code</p>
        </div>

        {error && (
          <p className="text-error text-center tracking-widest" style={{ fontSize: '10px' }}>INCORRECT PASSWORD</p>
        )}

        <input
          type="password"
          value={value}
          onChange={e => { setValue(e.target.value); setError(false) }}
          placeholder="Password"
          autoFocus
          className="bg-surface-container border border-outline-variant/40 focus:border-primary text-on-surface px-4 py-3 outline-none text-center tracking-widest"
        />

        <button
          type="submit"
          className="bg-primary text-on-primary py-3 font-display font-bold tracking-widest hover:opacity-90 transition-opacity"
        >
          ENTER
        </button>
      </form>
    </div>
  )
}
