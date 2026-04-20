import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { createDisplayUrl } from '../utils/imageResize'

const WEB_FORMATS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
const RAW_FORMATS = new Set(['raw', 'arw', 'cr2', 'cr3', 'nef', 'dng', 'orf', 'rw2', 'raf', 'tif', 'tiff'])
const HAS_DIR_PICKER = typeof window !== 'undefined' && 'showDirectoryPicker' in window

export default function LandingView() {
  const navigate = useNavigate()
  const setSourceDir = useStore(state => state.setSourceDir)
  const setDestDir = useStore(state => state.setDestDir)
  const clearPhotos = useStore(state => state.clearPhotos)
  const addPhotos = useStore(state => state.addPhotos)
  const setCurrentId = useStore(state => state.setCurrentId)
  const sourceDir = useStore(state => state.sourceDir)
  const destDir = useStore(state => state.destDir)

  const [sourcePath, setSourcePath] = useState('No folder selected')
  const [destPath, setDestPath] = useState('No folder selected')
  const [error, setError] = useState(null)
  const [iosLoading, setIosLoading] = useState(false)
  const fileInputRef = useRef(null)

  // Desktop: folder picker
  const handleSourcePicker = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker()
      clearPhotos()
      setSourceDir(dirHandle)
      setSourcePath(dirHandle.name)
      setError(null)
    } catch (err) {
      if (err.name !== 'AbortError') setError(`Error: ${err.message}`)
    }
  }

  const handleDestPicker = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      setDestDir(dirHandle)
      setDestPath(dirHandle.name)
      setError(null)
    } catch (err) {
      if (err.name !== 'AbortError') setError(`Error: ${err.message}`)
    }
  }

  // iOS: file input handler
  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setIosLoading(true)
    setError(null)
    clearPhotos()

    try {
      const eligible = files.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase()
        return WEB_FORMATS.has(ext) || RAW_FORMATS.has(ext)
      })
      eligible.sort((a, b) => a.name.localeCompare(b.name))

      const photos = await Promise.all(eligible.map(async (file) => {
        const ext = file.name.split('.').pop().toLowerCase()
        const isWeb = WEB_FORMATS.has(ext)
        return {
          id: file.name,
          filename: file.name,
          url: isWeb ? await createDisplayUrl(file) : null,
          file,
          isRaw: !isWeb,
          decision: null,
          rank: null,
          sharpness: null,
        }
      }))

      addPhotos(photos)
      // Use a mock sourceDir — name used as localStorage key, _ios flag skips directory scan
      setSourceDir({ name: `ios-${eligible.length}-photos`, _ios: true })
      if (photos.length > 0) setCurrentId(photos[0].id)
      navigate('/cull')
    } catch (err) {
      setError(`Failed to load photos: ${err.message}`)
    } finally {
      setIosLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center flex-1 px-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h2 className="font-display text-5xl font-bold text-primary mb-4">BigBadPhotos</h2>
          <p className="text-on-surface-variant text-lg">Rapid Photo Culling for Professionals</p>
        </div>

        {error && (
          <div className="bg-error bg-opacity-10 border border-error border-opacity-30 rounded-lg p-4 mb-6 text-error">{error}</div>
        )}

        <div className="space-y-8">
          {/* Source */}
          <div className="bg-surface-container rounded-lg p-8">
            <label className="block font-display font-semibold text-on-surface mb-4 uppercase tracking-wide">Source Photos</label>
            <p className="text-on-surface-variant text-sm mb-6">
              {HAS_DIR_PICKER ? 'Select the folder containing images to review' : 'Select the photos you want to review'}
            </p>

            {HAS_DIR_PICKER ? (
              <button
                onClick={handleSourcePicker}
                className={`w-full py-4 px-6 rounded-lg font-medium transition-colors ${sourceDir ? 'bg-primary bg-opacity-20 text-primary' : 'bg-primary text-surface-container'}`}
              >
                {sourceDir ? `✓ ${sourcePath}` : 'Select Source Folder'}
              </button>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,.raw,.arw,.cr2,.cr3,.nef,.dng,.orf,.rw2,.raf,.tif,.tiff"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={iosLoading}
                  className={`w-full py-4 px-6 rounded-lg font-medium transition-colors ${
                    sourceDir ? 'bg-primary bg-opacity-20 text-primary' : 'bg-primary text-surface-container'
                  } ${iosLoading ? 'opacity-60' : ''}`}
                >
                  {iosLoading ? 'Loading photos…' : sourceDir ? `✓ ${sourceDir.name}` : 'Select Photos'}
                </button>
              </>
            )}
          </div>

          {/* Destination — desktop only (iOS uses download/share on export) */}
          {HAS_DIR_PICKER && (
            <div className="bg-surface-container rounded-lg p-8">
              <label className="block font-display font-semibold text-on-surface mb-4 uppercase tracking-wide">Destination Folder</label>
              <p className="text-on-surface-variant text-sm mb-6">Select where to save approved images</p>
              <button
                onClick={handleDestPicker}
                className={`w-full py-4 px-6 rounded-lg font-medium transition-colors ${destDir ? 'bg-secondary bg-opacity-20 text-secondary' : 'bg-secondary text-surface-container'}`}
              >
                {destDir ? `✓ ${destPath}` : 'Select Destination Folder'}
              </button>
            </div>
          )}

          <button
            onClick={() => sourceDir && navigate('/cull')}
            disabled={!sourceDir || iosLoading}
            className={`w-full py-6 px-6 rounded-lg font-display font-bold text-lg uppercase tracking-wider transition-all ${sourceDir && !iosLoading ? 'bg-primary text-surface-container' : 'bg-surface-bright text-on-surface-variant opacity-50'}`}
          >
            Begin Review
          </button>
        </div>
      </div>
    </div>
  )
}
