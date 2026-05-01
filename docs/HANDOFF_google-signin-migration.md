# HANDOFF: Migrate BigBadPhotos Auth to Google Sign-In

**Project:** BigBadPhotos
**Branch:** `bbaf/bigbadphotos-google-signin`
**Priority:** P2
**Estimated scope:** ~400 lines changed across 6 files + 2 new files

---

## 1. OBJECTIVE

Replace the current plaintext password gate (`BBP_PASSWORD` env var + `PasswordGate.jsx` localStorage check) with Google Sign-In using Google Identity Services (GIS). Only whitelisted Google accounts (configured via env var) can access the app.

**Current auth (delete):**
- Frontend: `PasswordGate.jsx` checks `VITE_APP_PASSWORD` against user input, stores in `localStorage`
- Backend: `BBP_PASSWORD` env var, HTTP Basic Auth on `/analyze` and `/rank`
- No sessions, no user identity, no token verification

**Target auth (build):**
- Frontend: Google "Sign In with Google" button via GIS JS library → receives JWT ID token
- Backend: Flask verifies Google ID token, checks email against allowlist, issues a session cookie
- All API routes require valid session cookie
- Logout endpoint clears session

---

## 2. PREREQUISITES (Robert does these)

1. **Google Cloud Console → Create OAuth 2.0 Client ID**
   - Go to: `console.cloud.google.com` → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID (type: Web application)
   - Authorized JavaScript Origins:
     - `http://localhost:5173` (Vite dev)
     - `http://localhost:8002` (Flask dev)
     - `https://bigbadphotos.up.railway.app` (or actual Railway URL)
   - Authorized Redirect URIs: same list
   - Copy the **Client ID** → this goes in env vars

2. **Set env vars** (local `.env` + Railway):
   ```
   GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   BBP_ALLOWED_EMAILS=robert@gmail.com,jessica@gmail.com
   FLASK_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
   ```

3. **Remove old env vars** after migration is verified:
   - Delete `BBP_PASSWORD` from Railway
   - Delete `VITE_APP_PASSWORD` from `frontend/.env.local`

---

## 3. ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER                                                     │
│                                                              │
│  1. Load GIS script from accounts.google.com/gsi/client      │
│  2. Render "Sign In with Google" button                      │
│  3. User clicks → Google returns JWT (credential)            │
│  4. POST /auth/google  { credential: "<JWT>" }               │
│  5. Flask verifies JWT, checks email, sets session cookie    │
│  6. All subsequent /rank, /analyze calls include cookie      │
│  7. Logout → POST /auth/logout → clears cookie              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Why session cookie over Bearer token:**
- This is a single-user personal app, not a public API
- Cookies are automatic (no client-side token management)
- Flask sessions are signed with `FLASK_SECRET_KEY` — tamper-proof
- Simpler than managing token refresh on the frontend

---

## 4. FILE-BY-FILE IMPLEMENTATION

### 4.1 `requirements.txt` — Add dependencies

```diff
 Flask==3.1.3
 flask-cors==6.0.2
 numpy==2.2.6
 opencv-python-headless==4.10.0.84
 Werkzeug==3.1.8
+google-auth==2.38.0
+requests==2.32.3
```

`google-auth` provides `google.oauth2.id_token.verify_oauth2_token()` for server-side JWT verification.

---

### 4.2 `app.py` — Replace auth system

**Delete entirely:**
- `BBP_PASSWORD` variable
- `check_auth()` function
- `enforce_auth()` before_request handler

**Add these imports at top:**
```python
from flask import Flask, request, jsonify, send_from_directory, session, redirect
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
import secrets
```

**Add config after `app = Flask(__name__)`:**
```python
app.secret_key = os.environ.get('FLASK_SECRET_KEY', secrets.token_hex(32))
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
ALLOWED_EMAILS = set(
    e.strip().lower()
    for e in os.environ.get('BBP_ALLOWED_EMAILS', '').split(',')
    if e.strip()
)
```

**Add auth routes (new `/auth` blueprint or inline):**

```python
@app.post('/auth/google')
def auth_google():
    """Verify Google ID token, create session if email is allowed."""
    data = request.get_json(silent=True) or {}
    credential = data.get('credential')
    if not credential:
        return jsonify({'error': 'missing_credential'}), 400

    try:
        idinfo = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as e:
        return jsonify({'error': 'invalid_token', 'detail': str(e)}), 401

    email = idinfo.get('email', '').lower()
    if email not in ALLOWED_EMAILS:
        return jsonify({'error': 'unauthorized_email', 'email': email}), 403

    # Set session
    session['user'] = {
        'email': email,
        'name': idinfo.get('name', ''),
        'picture': idinfo.get('picture', ''),
        'sub': idinfo.get('sub', ''),   # stable Google user ID
    }
    return jsonify({'ok': True, 'user': session['user']})


@app.post('/auth/logout')
def auth_logout():
    session.clear()
    return jsonify({'ok': True})


@app.get('/auth/me')
def auth_me():
    """Check current session. Frontend calls this on load."""
    user = session.get('user')
    if not user:
        return jsonify({'authenticated': False}), 401
    return jsonify({'authenticated': True, 'user': user})
```

**Replace `enforce_auth` with:**
```python
# Routes that don't require auth
PUBLIC_ROUTES = {'/auth/google', '/auth/logout', '/auth/me', '/health'}

@app.before_request
def enforce_auth():
    # Let static frontend files through
    if request.path not in API_ROUTES and not request.path.startswith('/auth'):
        return
    if request.path in PUBLIC_ROUTES:
        return
    if not session.get('user'):
        return jsonify({'error': 'not_authenticated'}), 401
```

**Update `API_ROUTES`:**
```python
API_ROUTES = {'/analyze', '/rank'}
```

**Add Vite proxy for auth routes** — see section 4.5.

---

### 4.3 `frontend/src/components/PasswordGate.jsx` — Full rewrite → `GoogleGate.jsx`

**Delete `PasswordGate.jsx` entirely.**

**Create `frontend/src/components/GoogleGate.jsx`:**

```jsx
import { useState, useEffect, useCallback } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function GoogleGate({ children }) {
  const [user, setUser] = useState(null)          // null = loading, false = not authed
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState(null)

  // Check existing session on mount
  useEffect(() => {
    fetch('/auth/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => setUser(false))
      .finally(() => setChecking(false))
  }, [])

  // Initialize GIS when not authenticated
  useEffect(() => {
    if (user !== false || !CLIENT_ID) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,      // attempt One Tap auto-sign-in
        use_fedcm_for_prompt: true,
      })
      window.google.accounts.id.renderButton(
        document.getElementById('g_signin_btn'),
        {
          type: 'standard',
          theme: 'filled_black',   // matches Obsidian Lens aesthetic
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 280,
        }
      )
      // Also show One Tap prompt
      window.google.accounts.id.prompt()
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup: revoke One Tap on unmount
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [user])

  const handleCredentialResponse = useCallback(async (response) => {
    setError(null)
    try {
      const res = await fetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data.user)
      } else if (res.status === 403) {
        setError('This Google account is not authorized.')
      } else {
        setError(data.detail || 'Sign-in failed.')
      }
    } catch {
      setError('Network error. Is the backend running?')
    }
  }, [])

  // Loading state
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-container-lowest">
        <div className="text-center">
          <h1 className="font-display font-bold text-on-surface text-2xl tracking-wide">
            BIGBADPHOTOS
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 tracking-wider">
            AUTHENTICATING…
          </p>
        </div>
      </div>
    )
  }

  // Authenticated — render app
  if (user) return children

  // Sign-in screen
  return (
    <div className="flex h-screen items-center justify-center bg-surface-container-lowest">
      <div className="flex flex-col items-center gap-6 w-72">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
          </div>
          <h1 className="font-display font-bold text-on-surface text-2xl tracking-wide">
            BIGBADPHOTOS
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 tracking-wider">
            Sign in to continue
          </p>
        </div>

        {error && (
          <p className="text-error text-center tracking-widest" style={{ fontSize: '10px' }}>
            {error}
          </p>
        )}

        {/* GIS renders the button into this div */}
        <div id="g_signin_btn" />
      </div>
    </div>
  )
}
```

---

### 4.4 `frontend/src/App.jsx` — Swap gate component

```diff
-import PasswordGate from './components/PasswordGate'
+import GoogleGate from './components/GoogleGate'

 export default function App() {
   return (
-    <PasswordGate>
+    <GoogleGate>
       <Router>
         <AppContent />
       </Router>
-    </PasswordGate>
+    </GoogleGate>
   )
 }
```

---

### 4.5 `frontend/vite.config.js` — Add auth proxy routes

```diff
   server: {
     port: 5173,
     host: true,
     proxy: {
       '/health':  'http://localhost:8002',
       '/analyze': 'http://localhost:8002',
       '/rank':    'http://localhost:8002',
+      '/auth':    'http://localhost:8002',
     },
   },
```

---

### 4.6 `frontend/.env.local` — Replace password with client ID

```diff
-VITE_APP_PASSWORD=bigbadphotos071070
+VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

---

### 4.7 `frontend/index.html` — Add GIS script preconnect (optional perf)

Add to `<head>`:
```html
<link rel="preconnect" href="https://accounts.google.com" />
```

---

## 5. OPTIONAL: ADD LOGOUT BUTTON

Add to `TopAppBar.jsx` or `Sidebar.jsx`:

```jsx
const handleLogout = async () => {
  await fetch('/auth/logout', { method: 'POST' })
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect()
  }
  window.location.reload()
}

// Render as:
<button onClick={handleLogout} title="Sign out">
  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
</button>
```

---

## 6. WHAT TO DELETE

| File/Code | Action |
|---|---|
| `frontend/src/components/PasswordGate.jsx` | **Delete file** |
| `app.py` → `BBP_PASSWORD` variable | **Delete** |
| `app.py` → `check_auth()` function | **Delete** |
| `app.py` → old `enforce_auth()` | **Replace** with new version |
| `.env` → `BBP_PASSWORD` | **Remove** after deploy verified |
| `frontend/.env.local` → `VITE_APP_PASSWORD` | **Replace** with `VITE_GOOGLE_CLIENT_ID` |

---

## 7. ENV VAR SUMMARY

| Variable | Where | Value |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Flask `.env` + Railway | From Google Cloud Console |
| `VITE_GOOGLE_CLIENT_ID` | `frontend/.env.local` | Same Client ID |
| `BBP_ALLOWED_EMAILS` | Flask `.env` + Railway | Comma-separated emails |
| `FLASK_SECRET_KEY` | Flask `.env` + Railway | `python -c "import secrets; print(secrets.token_hex(32))"` |

---

## 8. DEPLOYMENT NOTES (Railway)

- `nixpacks.toml` — no changes needed (Python + Node build stays the same)
- `Procfile` — no changes needed
- Add all 3 new env vars in Railway dashboard **before** deploying
- The GIS script loads from `accounts.google.com` — no CSP changes needed for Railway's default config
- Flask sessions use signed cookies — no database or Redis needed

---

## 9. TESTING CHECKLIST

- [ ] Fresh load with no session → shows Google Sign-In button
- [ ] Sign in with allowed email → enters app, session persists on refresh
- [ ] Sign in with non-allowed email → shows "not authorized" error
- [ ] `/auth/me` returns user info when authenticated, 401 when not
- [ ] `/rank` and `/analyze` return 401 without session cookie
- [ ] `/rank` and `/analyze` work normally with valid session
- [ ] Logout clears session, redirects to sign-in screen
- [ ] One Tap auto-sign-in works on Chrome (FedCM-compatible)
- [ ] iOS Safari: button-based sign-in works (One Tap may not appear)
- [ ] Railway deployment: all origins are in Google Cloud Console allowlist

---

## 10. SECURITY NOTES

- **Always verify the ID token server-side** using `google.oauth2.id_token.verify_oauth2_token()` — never trust the client
- Use the `sub` claim (not email) as the stable user identifier if you ever add a user database
- `FLASK_SECRET_KEY` must be a strong random value in production — it signs session cookies
- Email allowlist is the access control layer — keep it in env vars, not code
- FedCM is now mandatory for GIS as of Aug 2025 — the implementation above enables it via `use_fedcm_for_prompt: true`
