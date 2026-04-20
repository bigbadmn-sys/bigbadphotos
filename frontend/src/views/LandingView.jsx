import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { createDisplayUrl } from '../utils/imageResize'

const WEB_FORMATS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
const RAW_FORMATS = new Set(['raw', 'arw', 'cr2', 'cr3', 'nef', 'dng', 'orf', 'rw2', 'raf', 'tif', 'tiff'])
const HAS_DIR_PICKER = typeof window !== 'undefined' && 'showDirectoryPicker' in window

function MetaChip({ label }) {
  return (
    <span
      className="bg-black/60 text-secondary uppercase tracking-widest backdrop-blur-sm px-2 py-0.5 block"
      style={{ fontSize: '8px', fontWeight: 700 }}
    >
      {label}
    </span>
  )
}

export default function LandingView() {
  const navigate = useNavigate()
  const setSourceDir  = useStore(state => state.setSourceDir)
  const setDestDir    = useStore(state => state.setDestDir)
  const clearPhotos   = useStore(state => state.clearPhotos)
  const addPhotos     = useStore(state => state.addPhotos)
  const setCurrentId  = useStore(state => state.setCurrentId)
  const sourceDir     = useStore(state => state.sourceDir)
  const destDir       = useStore(state => state.destDir)
  const photos        = useStore(state => state.photos)
  const order         = useStore(state => state.order)
  const scoringProgress = useStore(state => state.scoringProgress)

  const [error, setError] = useState(null)
  const [iosLoading, setIosLoading] = useState(false)
  const fileInputRef = useRef(null)

  const photoCount  = order.length
  const firstPhoto  = photoCount > 0 ? photos[order[0]] : null
  const rawCount    = Object.values(photos).filter(p => p.isRaw).length
  const fileTypeTag = rawCount > 0 ? 'RAW' : photoCount > 0 ? 'IMG' : null

  const scorePct = scoringProgress.total > 0
    ? Math.round((scoringProgress.done / scoringProgress.total) * 100)
    : null
  const workspaceLabel = scorePct != null
    ? `${scorePct}% SCORED`
    : photoCount > 0 ? 'READY' : null

  const sourceName = sourceDir
    ? (sourceDir._ios ? `${photoCount} PHOTOS LOADED` : sourceDir.name)
    : null
  const destName = destDir ? destDir.name : null

  // ── Desktop folder pickers ─────────────────────────────────────────────────
  const handleSourcePicker = async () => {
    try {
      const h = await window.showDirectoryPicker()
      clearPhotos()
      setSourceDir(h)
      setError(null)
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    }
  }

  const handleDestPicker = async () => {
    try {
      const h = await window.showDirectoryPicker({ mode: 'readwrite' })
      setDestDir(h)
      setError(null)
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    }
  }

  // ── iOS file input ─────────────────────────────────────────────────────────
  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setIosLoading(true)
    setError(null)
    clearPhotos()
    try {
      const eligible = files
        .filter(f => {
          const ext = f.name.split('.').pop().toLowerCase()
          return WEB_FORMATS.has(ext) || RAW_FORMATS.has(ext)
        })
        .sort((a, b) => a.name.localeCompare(b.name))

      const settled = await Promise.all(eligible.map(async (file) => {
        const ext   = file.name.split('.').pop().toLowerCase()
        const isWeb = WEB_FORMATS.has(ext)
        let url = null
        if (isWeb) {
          try { url = await createDisplayUrl(file) } catch { url = null }
        }
        return { id: file.name, filename: file.name, url, file, isRaw: !isWeb, decision: null, rank: null, sharpness: null }
      }))
      const loaded = settled.filter(Boolean)

      addPhotos(loaded)
      setSourceDir({ name: `ios-${eligible.length}-photos`, _ios: true })
      if (loaded.length > 0) setCurrentId(loaded[0].id)
      navigate('/cull')
    } catch (err) {
      setError(`Failed to load photos: ${err.message}`)
    } finally {
      setIosLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">

      {/* ── Mobile-only top bar ─────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-5 h-14 bg-surface-container-low shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>arrow_back</span>
          <span className="font-display font-bold text-on-surface tracking-widest" style={{ fontSize: '12px' }}>
            REVIEW &amp; EXPORT
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>settings</span>
      </div>

      {/* ── Hero image ─────────────────────────────────────────────────────── */}
      <div className="relative w-full shrink-0 bg-surface-container-low" style={{ height: '42vw', maxHeight: '240px', minHeight: '150px' }}>
        {firstPhoto?.url ? (
          <img src={firstPhoto.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/20" style={{ fontSize: '64px' }}>camera</span>
          </div>
        )}

        {/* Metadata chips — top right */}
        {firstPhoto && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
            {firstPhoto.overallScore != null && (
              <MetaChip label={`SCORE ${Math.round(firstPhoto.overallScore * 100)}`} />
            )}
            {firstPhoto.isRaw && <MetaChip label="RAW" />}
            {firstPhoto.exposure?.mean_brightness != null && (
              <MetaChip label={`EXP ${Math.round(firstPhoto.exposure.mean_brightness)}`} />
            )}
          </div>
        )}

        {/* Bottom gradient fade into surface */}
        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0e0e0e)' }}
        />
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Current selection */}
        <div className="px-5 pt-3 pb-5 border-b border-outline-variant/10">
          <p className="text-on-surface-variant uppercase tracking-widest mb-1" style={{ fontSize: '9px', fontWeight: 600 }}>
            CURRENT SELECTION
          </p>
          <p className="font-display font-bold text-on-surface truncate" style={{ fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
            {firstPhoto
              ? firstPhoto.filename.replace(/\.[^.]+$/, '').toUpperCase()
              : '— NO SOURCE LOADED —'}
          </p>
        </div>

        {/* Source path */}
        <div className="px-5 py-4 border-b border-outline-variant/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-on-surface-variant uppercase tracking-widest mb-1" style={{ fontSize: '9px', fontWeight: 600 }}>
                SOURCE PATH
              </p>
              <p className={`text-body-sm truncate ${sourceName ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>
                {sourceName ?? 'No source selected'}
              </p>
            </div>

            {HAS_DIR_PICKER ? (
              <button
                onClick={handleSourcePicker}
                className="shrink-0 w-9 h-9 bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>folder_open</span>
              </button>
            ) : (
              <>
                <input ref={fileInputRef} type="file" webkitdirectory="" className="hidden" onChange={handleFileInput} />
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={iosLoading}
                  className="shrink-0 w-9 h-9 bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>folder_open</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Export target */}
        <div className="px-5 py-4 border-b border-outline-variant/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-on-surface-variant uppercase tracking-widest mb-1" style={{ fontSize: '9px', fontWeight: 600 }}>
                EXPORT TARGET
              </p>
              <p className={`text-body-sm truncate ${destName ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>
                {HAS_DIR_PICKER
                  ? (destName ?? 'No destination selected')
                  : 'iOS Share Sheet on export'}
              </p>
            </div>

            {HAS_DIR_PICKER && (
              <button
                onClick={handleDestPicker}
                className="shrink-0 w-9 h-9 bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>drive_export</span>
              </button>
            )}
          </div>
        </div>

        {/* Detected assets + workspace load */}
        <div className="px-5 py-5 border-b border-outline-variant/10">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-display font-bold text-on-surface"
                  style={{ fontSize: '2.8rem', lineHeight: 1, letterSpacing: '-0.03em' }}
                >
                  {photoCount > 0 ? photoCount.toLocaleString() : '—'}
                </span>
                {fileTypeTag && (
                  <span
                    className="bg-surface-container-highest text-secondary uppercase tracking-widest px-2 py-0.5 font-bold"
                    style={{ fontSize: '9px' }}
                  >
                    {fileTypeTag}
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant uppercase tracking-widest mt-1" style={{ fontSize: '9px', fontWeight: 600 }}>
                DETECTED ASSETS
              </p>
            </div>

            {workspaceLabel && (
              <div className="text-right">
                <p className="text-on-surface-variant uppercase tracking-widest mb-1.5" style={{ fontSize: '9px', fontWeight: 600 }}>
                  WORKSPACE LOAD
                </p>
                <div className="bg-surface-container px-3 py-1.5">
                  <p className="font-display font-bold text-primary uppercase tracking-widest" style={{ fontSize: '9px' }}>
                    {workspaceLabel}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 bg-error/10 border border-error/20 px-4 py-3">
            <p className="text-error text-body-sm">{error}</p>
          </div>
        )}

        {/* CTA */}
        <div className="px-5 py-6">
          <button
            onClick={() => sourceDir && navigate('/cull')}
            disabled={!sourceDir || iosLoading}
            style={sourceDir && !iosLoading ? {
              background: 'linear-gradient(135deg, #69daff 0%, #00cffc 100%)',
            } : {}}
            className={`w-full py-5 font-display font-bold tracking-widest flex items-center justify-center gap-3 transition-all ${
              sourceDir && !iosLoading
                ? 'text-on-primary hover:brightness-110'
                : 'bg-surface-container text-on-surface-variant cursor-not-allowed'
            }`}
          >
            <span style={{ letterSpacing: '0.12em', fontSize: '13px' }}>
              {iosLoading ? 'LOADING…' : 'BEGIN REVIEW'}
            </span>
            {!iosLoading && (
              <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1, 'wght' 300" }}>
                play_arrow
              </span>
            )}
          </button>

          {!sourceDir && !iosLoading && (
            <p className="text-on-surface-variant/40 text-center mt-3 uppercase tracking-widest" style={{ fontSize: '9px' }}>
              SELECT A SOURCE FOLDER TO BEGIN
            </p>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
