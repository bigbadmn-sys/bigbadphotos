// Relative URLs — works on localhost (proxied by Vite) and on the Tailscale HTTPS hostname.
export async function checkHealth() {
  const res = await fetch('/health')
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return res.json()
}

export async function rankPhotos(photos) {
  const formData = new FormData()
  formData.append('manifest', JSON.stringify(photos.map(p => ({ id: p.id, filename: p.filename }))))
  for (const photo of photos) {
    formData.append(photo.id, photo.file, photo.filename)
  }

  const res = await fetch('/rank', { method: 'POST', body: formData })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try { detail = (await res.json()).detail || detail } catch {}
    throw new Error(detail)
  }
  return (await res.json()).results
}
