import React, { useEffect } from 'react'
import { TopBar } from './components/TopBar'
import { PreviewCanvasWithGizmos } from './components/PreviewCanvasWithGizmos'
import { MagneticTimeline } from './components/MagneticTimeline'
import { ContextualBottomDock } from './components/ContextualBottomDock'
import { SpeedCurveDrawer } from './components/SpeedCurveDrawer'
import { FilterGalleryDrawer } from './components/FilterGalleryDrawer'
import { QualityProDrawer } from './components/QualityProDrawer'
import { AudioExtractorModal } from './components/AudioExtractorModal'
import { ExportModal } from './components/ExportModal'
import { ProjectsModal } from './components/ProjectsModal'
import {
  restoreProjectFromStorage,
  flushProjectSaveSync,
  useEditorStore,
} from './store/useEditorStore'
import { unlockAudioContext } from './engine/audioEngine'

export function App(): React.ReactElement {
  const togglePlay = useEditorStore((s) => s.togglePlay)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const splitSelectedClip = useEditorStore((s) => s.splitSelectedClip)
  const deleteSelectedClip = useEditorStore((s) => s.deleteSelectedClip)
  const toggleKeyframeAtPlayhead = useEditorStore(
    (s) => s.toggleKeyframeAtPlayhead
  )
  const freezeSelectedClip = useEditorStore((s) => s.freezeSelectedClip)
  const setAudioUnlocked = useEditorStore((s) => s.setAudioUnlocked)

  // Auto-restore project and media blobs after reload or browser restart
  useEffect(() => {
    void restoreProjectFromStorage()
  }, [])

  // Immediate synchronous flush to disk on iOS Safari tab switch, app backgrounding, or tab close
  useEffect(() => {
    const handleFlush = () => {
      flushProjectSaveSync()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushProjectSaveSync()
      }
    }

    window.addEventListener('pagehide', handleFlush)
    window.addEventListener('beforeunload', handleFlush)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', handleFlush)
      window.removeEventListener('beforeunload', handleFlush)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])


  // Global iOS Safari WebKit First-Touch AudioContext Unlocker
  useEffect(() => {
    const handleFirstInteraction = async () => {
      const ok = await unlockAudioContext()
      if (ok) {
        setAudioUnlocked(true)
      }
    }

    window.addEventListener('touchstart', handleFirstInteraction, {
      passive: true,
      once: true,
    })
    window.addEventListener('pointerdown', handleFirstInteraction, {
      passive: true,
      once: true,
    })
    window.addEventListener('keydown', handleFirstInteraction, {
      passive: true,
      once: true,
    })

    return () => {
      window.removeEventListener('touchstart', handleFirstInteraction)
      window.removeEventListener('pointerdown', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [setAudioUnlocked])

  // Pro Desktop & iPad Keyboard Shortcuts (Space, Undo/Redo, Split, Delete, Keyframe, Freeze)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        void unlockAudioContext().then((ok) => {
          if (ok) setAudioUnlocked(true)
        })
        togglePlay()
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') ||
        (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 's')
      ) {
        e.preventDefault()
        splitSelectedClip()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelectedClip()
      } else if (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleKeyframeAtPlayhead()
      } else if (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        freezeSelectedClip()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    togglePlay,
    undo,
    redo,
    splitSelectedClip,
    deleteSelectedClip,
    toggleKeyframeAtPlayhead,
    freezeSelectedClip,
    setAudioUnlocked,
  ])

  return (
    <div className="relative flex flex-col w-full h-[100dvh] max-h-[100dvh] bg-[#09090B] text-[#F4F4F6] overflow-hidden select-none overscroll-none safe-top">
      {/* 1. Top Header Bar (44px) */}
      <TopBar />

      {/* 2 & 3. Interactive WebGL2 Preview Viewport (42% height) + Playback Strip (36px) */}
      <PreviewCanvasWithGizmos />

      {/* 4. Multi-Track Magnetic Timeline (32% height) */}
      <MagneticTimeline />

      {/* 5. CapCut Contextual Bottom Dock + Floating Slide-Up Drawers */}
      <div className="relative w-full shrink-0 z-30">
        <div className="
          absolute bottom-full left-0 right-0 z-40
          max-h-[46dvh] overflow-y-auto
          shadow-[0_-12px_32px_rgba(0,0,0,0.82)]
        ">
          <SpeedCurveDrawer />
          <FilterGalleryDrawer />
          <QualityProDrawer />
        </div>
        <ContextualBottomDock />
      </div>

      {/* Dedicated Pro Modals (Projects Manager + Extract Audio <1s + Export with WhatsApp Anti-Compression & Story Slicer) */}
      <ProjectsModal />
      <AudioExtractorModal />
      <ExportModal />
    </div>

  )
}

export default App
