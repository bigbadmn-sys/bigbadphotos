import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'

const DECISION_COLOR = {
  keep: 'text-secondary border-secondary/40',
  maybe: 'text-tertiary border-tertiary/30',
  reject: 'text-error border-error/40',
}

function MetadataHUD({ photo }) {
  return (
    <div
      className="absolute top-4 left-4 p-3 border border-outline-variant/15 pointer-events-none z-10"
      style={{ background: 'rgba(38,38,38,0.7)', backdropFilter: 'blur(16px)' }}
    >
      <p className="text-on-surface-variant tracking-widest font-bold mb-2" style={{ fontSize: '9px' }}>METADATA</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-on-surface-variant" style={{ fontSize: '10px' }}>File</span>
        <span className="text-on-surface font-mono truncate max-w-24" style={{ fontSize: '10px' }}>{photo.filename}</span>
        {photo.sharpness != null && <>
          <span className="text-on-surface-variant" style={{ fontSize: '10px' }}>AI Score</span>
          <span className="text-primary font-bold" style={{ fontSize: '10px' }}>{Math.round(photo.sharpness * 100)}</span>
        </>}
      </div>
    </div>
  )
}

function DecisionBadge({ decision }) {
  if (!decision) return null
  const labels = { keep: 'KEPT', maybe: 'MAYBE', reject: 'REJECTED' }
  return (
    <div className={`absolute top-4 right-4 px-2 py-1 border text-xs font-bold tracking-widest z-10 ${DECISION_COLOR[decision]}`}
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      {labels[decision]}
    </div>
  )
}

function PhotoPanel({ photo, side, isBestMatch, onKeep, onReject }) {
  if (!photo) {
    return (
      <section className="relative flex-1 bg-surface-container-lowest flex items-center justify-center">
        <span className="text-on-surface-variant/30 tracking-widest text-xs">NO PHOTO</span>
      </section>
    )
  }

  return (
    <section className="relative flex-1 bg-black overflow-hidden group">
      {/* Photo */}
      {photo.url ? (
        <img
          src={photo.url}
          alt={photo.filename}
          className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-200"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant/30" style={{ fontSize: '48px' }}>photo</span>
          <p className="text-on-surface-variant text-xs tracking-wider">{photo.filename}</p>
        </div>
      )}

      {/* Label (A / B) */}
      <div className="absolute top-4 left-16 z-10">
        <span className="text-on-surface-variant/60 font-display font-bold tracking-widest" style={{ fontSize: '10px' }}>
          {side === 'left' ? 'A' : 'B'}
        </span>
      </div>

      <MetadataHUD photo={photo} />
      <DecisionBadge decision={photo.decision} />

      {/* Best match badge */}
      {isBestMatch && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 border border-primary/30 z-10"
          style={{ background: 'rgba(105,218,255,0.15)', backdropFilter: 'blur(12px)' }}
        >
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span className="text-primary tracking-widest font-bold" style={{ fontSize: '9px' }}>BEST MATCH</span>
        </div>
      )}

      {/* Hover-reveal action bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 border border-outline-variant/15 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-10 whitespace-nowrap"
        style={{ background: 'rgba(38,38,38,0.85)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={onKeep}
          className="flex items-center gap-2 px-4 py-2 bg-secondary/15 text-secondary hover:bg-secondary/30 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="text-xs font-bold tracking-widest">KEEP</span>
        </button>
        <button
          onClick={onReject}
          className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error hover:bg-error/20 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cancel</span>
          <span className="text-xs font-bold tracking-widest">REJECT</span>
        </button>
      </div>
    </section>
  )
}

function FilmstripThumb({ photo, isInPair, isLeft, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex-shrink-0 w-20 h-16 overflow-hidden cursor-pointer transition-all relative ${
        isInPair
          ? `border-2 ${isLeft ? 'border-primary' : 'border-primary/60'}`
          : 'border border-outline-variant/15 opacity-50 hover:opacity-100 hover:border-primary/40'
      }`}
    >
      {photo?.url ? (
        <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant/30" style={{ fontSize: '18px' }}>photo</span>
        </div>
      )}
      {photo?.decision && (
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${
          photo.decision === 'keep' ? 'bg-secondary' :
          photo.decision === 'reject' ? 'bg-error' : 'bg-tertiary'
        }`} />
      )}
    </div>
  )
}

export default function CompareView() {
  const photos = useStore(state => state.photos)
  const order = useStore(state => state.order)
  const makeDecision = useStore(state => state.makeDecision)

  // Each pair is (pairIndex*2, pairIndex*2+1) — non-overlapping
  const [pairIndex, setPairIndex] = useState(0)
  const pairCount = Math.max(1, Math.floor(order.length / 2))

  const leftId = order[pairIndex * 2]
  const rightId = order[pairIndex * 2 + 1]
  const leftPhoto = photos[leftId]
  const rightPhoto = photos[rightId]

  const isBestMatch = useCallback((side) => {
    if (!leftPhoto?.sharpness || !rightPhoto?.sharpness) return false
    return side === 'left'
      ? leftPhoto.sharpness >= rightPhoto.sharpness
      : rightPhoto.sharpness > leftPhoto.sharpness
  }, [leftPhoto, rightPhoto])

  const goNext = useCallback(() => setPairIndex(i => Math.min(i + 1, pairCount - 1)), [pairCount])
  const goPrev = useCallback(() => setPairIndex(i => Math.max(i - 1, 0)), [])

  const decide = useCallback((id, decision) => {
    if (id) makeDecision(id, decision)
  }, [makeDecision])

  const pickWinner = useCallback((winnerId, loserId) => {
    if (winnerId) makeDecision(winnerId, 'keep')
    if (loserId) makeDecision(loserId, 'reject')
    goNext()
  }, [makeDecision, goNext])

  useEffect(() => {
    const handle = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === '1') pickWinner(leftId, rightId)
      else if (e.key === '2') pickWinner(rightId, leftId)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [goNext, goPrev, pickWinner, leftId, rightId])

  if (order.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 bg-surface-container-lowest">
        <span className="material-symbols-outlined text-on-surface-variant/30" style={{ fontSize: '64px' }}>compare</span>
        <p className="text-on-surface-variant text-sm tracking-wider">No photos loaded</p>
        <p className="text-on-surface-variant/40 text-xs">Load photos in Cull first</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest">

      {/* Control HUD */}
      <div
        className="shrink-0 border-b border-outline-variant/20 px-6 py-3 flex items-center justify-between z-10"
        style={{ background: 'rgba(19,19,19,0.85)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
            <span className="tracking-wider" style={{ fontSize: '10px' }}>SYNCHRONIZED PAN &amp; ZOOM</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant tracking-wider" style={{ fontSize: '9px' }}>Keyboard:</span>
            <span className="text-on-surface-variant/60 tracking-wider" style={{ fontSize: '9px' }}>
              [1] Pick Left · [2] Pick Right · [←/→] Navigate
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-on-surface-variant tracking-widest px-3 py-1 bg-surface-container" style={{ fontSize: '10px' }}>
            PAIR {pairIndex + 1} / {pairCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={goPrev}
              disabled={pairIndex === 0}
              className="p-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
            </button>
            <button
              onClick={goNext}
              disabled={pairIndex >= pairCount - 1}
              className="p-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
            </button>
          </div>

          {/* Pick winner shortcut */}
          <button
            onClick={() => {
              const winnerId = isBestMatch('left') ? leftId : rightId
              const loserId = isBestMatch('left') ? rightId : leftId
              pickWinner(winnerId, loserId)
            }}
            disabled={!leftId || !rightId}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-on-primary font-bold tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-on-primary-container transition-colors"
            style={{ fontSize: '10px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            PICK WINNER
          </button>
        </div>
      </div>

      {/* Side-by-side photos */}
      <div className="flex flex-1 min-h-0 gap-px bg-surface-container-low">
        <PhotoPanel
          photo={leftPhoto}
          side="left"
          isBestMatch={isBestMatch('left')}
          onKeep={() => decide(leftId, 'keep')}
          onReject={() => decide(leftId, 'reject')}
        />
        <PhotoPanel
          photo={rightPhoto}
          side="right"
          isBestMatch={isBestMatch('right')}
          onKeep={() => decide(rightId, 'keep')}
          onReject={() => decide(rightId, 'reject')}
        />
      </div>

      {/* Filmstrip */}
      <div className="shrink-0 h-24 border-t border-outline-variant/20 bg-surface-container-low flex items-center gap-2 px-4 overflow-x-auto no-scrollbar">
        {order.map((id, i) => {
          const pairOf = Math.floor(i / 2)
          const isLeft = i % 2 === 0
          return (
            <FilmstripThumb
              key={id}
              photo={photos[id]}
              isInPair={pairOf === pairIndex}
              isLeft={isLeft}
              onClick={() => setPairIndex(pairOf)}
            />
          )
        })}
      </div>
    </div>
  )
}
