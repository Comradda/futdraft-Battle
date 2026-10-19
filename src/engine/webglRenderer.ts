import type {
  AspectRatio,
  BlendMode,
  CanvasBackgroundConfig,
  HistogramData,
  TimelineClip,
  TimelineTrack,
} from '../types/editor'
import {
  computeRemappedSourceTime,
  DEFAULT_CHROMA_KEY,
  DEFAULT_MASK,
  evaluateSpeedAtNormalizedTime,
  getInterpolatedClipProps,
} from '../store/useEditorStore'
import {
  FRAGMENT_SHADER_300,
  getFilterPresetById,
  MASK_SHAPE_TO_INT,
  TRANSITION_TYPE_TO_INT,
  VERTEX_SHADER_300,
} from './shaders'

export const ASPECT_RATIO_DIMENSIONS: Record<
  AspectRatio,
  { width: number; height: number; label: string }
> = {
  '9:16': {
    width: 1080,
    height: 1920,
    label: 'Historias IG / WhatsApp / TikTok',
  },
  '4:5': {
    width: 1080,
    height: 1350,
    label: 'Feed IG',
  },
  '1:1': {
    width: 1080,
    height: 1080,
    label: 'Cuadrado',
  },
  '16:9': {
    width: 1920,
    height: 1080,
    label: 'Horizontal',
  },
  '2.35:1': {
    width: 1920,
    height: 816,
    label: 'Cine Anamórfico',
  },
}

export const CANVAS_GRADIENT_PRESETS: Array<{
  id: string
  name: string
  colors: [string, string]
}> = [
  { id: 'cyber_night', name: 'Cyber Night', colors: ['#09090B', '#1A103C'] },
  { id: 'sunset_glow', name: 'Sunset Glow', colors: ['#431407', '#9D174D'] },
  { id: 'ocean_teal', name: 'Ocean Teal', colors: ['#042F2E', '#0F172A'] },
  { id: 'crimson_noir', name: 'Crimson Noir', colors: ['#09090B', '#450A0A'] },
  { id: 'emerald_mist', name: 'Emerald Mist', colors: ['#022C22', '#18181B'] },
  { id: 'royal_indigo', name: 'Royal Indigo', colors: ['#1E1B4B', '#311042'] },
]

export interface RenderFrameParams {
  clips: TimelineClip[]
  tracks: TimelineTrack[]
  playheadTime: number
  isPlaying?: boolean
  aspectRatio: AspectRatio
  canvasBackground: CanvasBackgroundConfig
  extraCasBoost?: number
  renderScale?: number
}

const IDENTITY_MAT4 = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
])

function mapBlendModeToCanvasComposite(
  blendMode: BlendMode
): GlobalCompositeOperation {
  switch (blendMode) {
    case 'screen':
      return 'screen'
    case 'multiply':
      return 'multiply'
    case 'overlay':
      return 'overlay'
    case 'soft-light':
      return 'soft-light'
    case 'lighten':
      return 'lighten'
    case 'normal':
    default:
      return 'source-over'
  }
}

export class WebGLVideoRenderer {
  private targetCanvas: HTMLCanvasElement
  private targetCtx: CanvasRenderingContext2D | null

  // Internal WebGL2 processing surface
  private glCanvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext | null = null
  private program: WebGLProgram | null = null
  private vao: WebGLVertexArrayObject | null = null
  private positionBuffer: WebGLBuffer | null = null
  private uvBuffer: WebGLBuffer | null = null
  private texture: WebGLTexture | null = null
  private uniformLocations = new Map<string, WebGLUniformLocation | null>()

  // Offscreen 2D canvases for procedural generators, blur background, and histogram readback
  private sourceCanvas: HTMLCanvasElement
  private sourceCtx: CanvasRenderingContext2D | null
  private blurCanvasA: HTMLCanvasElement
  private blurCtxA: CanvasRenderingContext2D | null
  private blurCanvasB: HTMLCanvasElement
  private blurCtxB: CanvasRenderingContext2D | null
  private histCanvas: HTMLCanvasElement
  private histCtx: CanvasRenderingContext2D | null

  // Pool of HTMLVideoElements for imported real video files (.mp4, .mov, .webm)
  private videoPool = new Map<string, HTMLVideoElement>()

  constructor(targetCanvas: HTMLCanvasElement) {
    this.targetCanvas = targetCanvas
    this.targetCtx = targetCanvas.getContext('2d', { alpha: false })

    this.glCanvas = document.createElement('canvas')
    this.glCanvas.width = 960
    this.glCanvas.height = 540

    this.sourceCanvas = document.createElement('canvas')
    this.sourceCanvas.width = 960
    this.sourceCanvas.height = 540
    this.sourceCtx = this.sourceCanvas.getContext('2d', { alpha: false })

    this.blurCanvasA = document.createElement('canvas')
    this.blurCtxA = this.blurCanvasA.getContext('2d', { alpha: false })
    this.blurCanvasB = document.createElement('canvas')
    this.blurCtxB = this.blurCanvasB.getContext('2d', { alpha: false })

    this.histCanvas = document.createElement('canvas')
    this.histCanvas.width = 64
    this.histCanvas.height = 36
    this.histCtx = this.histCanvas.getContext('2d', {
      willReadFrequently: true,
    })

    this.initWebGL2()
  }

  public getCanvas(): HTMLCanvasElement {
    return this.targetCanvas
  }

  private initWebGL2(): void {
    const gl = this.glCanvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
    })
    if (!gl) {
      return
    }
    this.gl = gl

    const vs = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_300)
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_300)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.bindAttribLocation(program, 0, 'a_position')
    gl.bindAttribLocation(program, 1, 'a_texCoord')
    gl.linkProgram(program)

    gl.deleteShader(vs)
    gl.deleteShader(fs)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return
    }
    this.program = program

    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    this.vao = vao

    // Fullscreen quad positions (-1..1)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ])
    const posBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    this.positionBuffer = posBuf

    // Texture coordinates (flip Y so canvas/video top-left matches WebGL)
    const uvs = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      0, 0,
      1, 1,
      1, 0,
    ])
    const uvBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf)
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0)
    this.uvBuffer = uvBuf

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    this.texture = tex

    gl.bindVertexArray(null)
  }

  private compileShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  private getUniform(name: string): WebGLUniformLocation | null {
    if (!this.gl || !this.program) return null
    if (this.uniformLocations.has(name)) {
      return this.uniformLocations.get(name) ?? null
    }
    const loc = this.gl.getUniformLocation(this.program, name)
    this.uniformLocations.set(name, loc)
    return loc
  }

  /**
   * Retrieves or creates an HTMLVideoElement for real imported video clips.
   */
  private getOrCreateVideoElement(clip: TimelineClip): HTMLVideoElement {
    const existing = this.videoPool.get(clip.id)
    if (existing && existing.dataset.mediaUrl === clip.mediaUrl) {
      return existing
    }
    if (existing) {
      existing.pause()
      existing.removeAttribute('src')
      existing.load()
    }

    const video = document.createElement('video')
    video.playsInline = true
    video.setAttribute('webkit-playsinline', 'true')
    video.muted = true
    video.preload = 'auto'
    if (!clip.mediaUrl.startsWith('blob:')) {
      video.crossOrigin = 'anonymous'
    }
    video.src = clip.mediaUrl
    video.dataset.mediaUrl = clip.mediaUrl
    video.load()
    this.videoPool.set(clip.id, video)
    return video
  }

  /**
   * Returns the hardware clock timeline position from the currently playing main video clip
   * when playing a real imported video at normal speed, preventing any frame/audio seek stutter.
   */
  public getActiveVideoClock(
    clips: TimelineClip[],
    playheadTime: number
  ): number | null {
    for (const clip of clips) {
      if (clip.trackType !== 'video') continue
      if (
        clip.mediaUrl.startsWith('demo://') ||
        clip.mediaUrl.startsWith('text://') ||
        clip.mediaUrl.startsWith('adjustment://')
      ) {
        continue
      }
      if (
        playheadTime >= clip.startTime &&
        playheadTime <= clip.startTime + clip.duration &&
        !clip.isFrozen &&
        clip.speed.mode === 'normal'
      ) {
        const video = this.videoPool.get(clip.id)
        if (
          video &&
          !video.paused &&
          !video.seeking &&
          video.readyState >= 2
        ) {
          const speed = Math.max(0.1, clip.speed.normalSpeed)
          const mappedTimelineTime =
            clip.startTime + (video.currentTime - clip.sourceStartOffset) / speed
          if (
            mappedTimelineTime >= clip.startTime &&
            mappedTimelineTime <= clip.startTime + clip.duration
          ) {
            return mappedTimelineTime
          }
        }
      }
    }
    return null
  }

  /**
   * Synchronizes real video elements with timeline playhead, variable speed curves,
   * and native hardware audio playback (preventing RAM spikes on 1–10 min iPhone .mov videos).
   */
  public syncVideos(
    clips: TimelineClip[],
    playheadTime: number,
    isPlaying: boolean,
    tracks: TimelineTrack[] = []
  ): void {
    const activeIds = new Set(clips.map((c) => c.id))
    for (const [id, video] of this.videoPool.entries()) {
      if (!activeIds.has(id)) {
        video.pause()
        video.removeAttribute('src')
        video.load()
        this.videoPool.delete(id)
      }
    }

    const trackMutedMap = new Map<string, boolean>()
    for (const t of tracks) {
      trackMutedMap.set(t.id, t.muted || !t.visible)
    }

    for (const clip of clips) {
      if (clip.trackType !== 'video' && clip.trackType !== 'pip') continue
      if (
        clip.mediaUrl.startsWith('demo://') ||
        clip.mediaUrl.startsWith('text://') ||
        clip.mediaUrl.startsWith('adjustment://')
      ) {
        continue
      }

      const video = this.getOrCreateVideoElement(clip)
      const isWithinClip =
        playheadTime >= clip.startTime &&
        playheadTime < clip.startTime + clip.duration

      if (!isWithinClip) {
        if (!video.paused) video.pause()
        video.muted = true
        continue
      }

      const localTime = Math.max(0, playheadTime - clip.startTime)
      const targetSourceTime = computeRemappedSourceTime(clip, playheadTime)
      const localU =
        clip.duration > 0 ? Math.min(1, localTime / clip.duration) : 0
      const instSpeed = evaluateSpeedAtNormalizedTime(clip.speed, localU)

      // Compute native audio volume & fade envelope for this video clip
      const trackMuted = trackMutedMap.get(clip.trackId) ?? false
      let fadeGain = 1.0
      if (clip.audioFX.fadeIn > 0 && localTime < clip.audioFX.fadeIn) {
        fadeGain *= Math.max(0, localTime / clip.audioFX.fadeIn)
      }
      const remaining = clip.duration - localTime
      if (clip.audioFX.fadeOut > 0 && remaining < clip.audioFX.fadeOut) {
        fadeGain *= Math.max(0, remaining / clip.audioFX.fadeOut)
      }

      const shouldMute =
        !isPlaying ||
        clip.isFrozen ||
        trackMuted ||
        clip.audioFX.muted ||
        clip.audioFX.volume <= 0

      video.muted = shouldMute
      if (!shouldMute) {
        video.volume = Math.max(
          0,
          Math.min(1, (clip.audioFX.volume / 100) * fadeGain)
        )
      }

      if ('preservesPitch' in video) {
        video.preservesPitch = clip.speed.keepPitch
      }

      if (isPlaying && !clip.isFrozen) {
        const clampedRate = Math.max(0.25, Math.min(4.0, instSpeed))
        if (Math.abs(video.playbackRate - clampedRate) > 0.04) {
          video.playbackRate = clampedRate
        }
        // Only seek during playback if there is a major user jump (> 0.85s) so hardware decoding never stutters
        if (
          !video.seeking &&
          Math.abs(video.currentTime - targetSourceTime) > 0.85
        ) {
          try {
            video.currentTime = targetSourceTime
          } catch {
            // Ignore seek before metadata ready
          }
        }
        if (video.paused && video.readyState >= 1) {
          void video.play().catch(() => {
            // If iOS Safari blocks unmuted play before gesture, play muted first
            video.muted = true
            void video.play().catch(() => {})
          })
        }
      } else {
        if (!video.paused) {
          video.pause()
        }
        if (
          !video.seeking &&
          Math.abs(video.currentTime - targetSourceTime) > 0.04
        ) {
          try {
            video.currentTime = targetSourceTime
          } catch {
            // Ignore seek before metadata ready
          }
        }
      }
    }
  }

  /**
   * Seeks all active real video elements accurately for deterministic frame export.
   */
  public async seekAllVideosForExport(
    clips: TimelineClip[],
    playheadTime: number
  ): Promise<void> {
    const promises: Promise<void>[] = []
    for (const clip of clips) {
      if (clip.trackType !== 'video' && clip.trackType !== 'pip') continue
      if (
        clip.mediaUrl.startsWith('demo://') ||
        clip.mediaUrl.startsWith('text://') ||
        clip.mediaUrl.startsWith('adjustment://')
      ) {
        continue
      }
      if (
        playheadTime < clip.startTime ||
        playheadTime > clip.startTime + clip.duration
      ) {
        continue
      }

      const video = this.getOrCreateVideoElement(clip)
      if (!video.paused) video.pause()
      const targetTime = computeRemappedSourceTime(clip, playheadTime)
      if (Math.abs(video.currentTime - targetTime) > 0.015 && video.readyState >= 1) {
        promises.push(
          new Promise<void>((resolve) => {
            const timeout = window.setTimeout(resolve, 120)
            const onSeeked = () => {
              window.clearTimeout(timeout)
              video.removeEventListener('seeked', onSeeked)
              resolve()
            }
            video.addEventListener('seeked', onSeeked)
            try {
              video.currentTime = targetTime
            } catch {
              window.clearTimeout(timeout)
              video.removeEventListener('seeked', onSeeked)
              resolve()
            }
          })
        )
      }
    }
    if (promises.length > 0) {
      await Promise.all(promises)
    }
  }

  /**
   * Renders a rich 60fps procedural scene onto `this.sourceCanvas` for demo clips
   * so the WebGL2 shader pipeline has realistic high-contrast imagery to process.
   */
  private renderProceduralScene(
    mediaUrl: string,
    sourceTime: number,
    width: number,
    height: number
  ): void {
    const ctx = this.sourceCtx
    if (!ctx) return

    if (this.sourceCanvas.width !== width || this.sourceCanvas.height !== height) {
      this.sourceCanvas.width = width
      this.sourceCanvas.height = height
    }

    ctx.save()

    if (mediaUrl.includes('golden') || mediaUrl.includes('sunset')) {
      // =====================================================================
      // SCENE 2: GOLDEN HOUR MIAMI SUNSET & OCEAN WAVES
      // =====================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65)
      skyGrad.addColorStop(0, '#1e1b4b')
      skyGrad.addColorStop(0.28, '#701a75')
      skyGrad.addColorStop(0.58, '#ea580c')
      skyGrad.addColorStop(0.85, '#f59e0b')
      skyGrad.addColorStop(1, '#fef08a')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, width, height * 0.65)

      // Glowing Sun Disc
      const sunX = width * 0.5 + Math.sin(sourceTime * 0.35) * (width * 0.04)
      const sunY = height * 0.44 + Math.cos(sourceTime * 0.25) * (height * 0.02)
      const sunRadius = Math.min(width, height) * 0.16

      const sunGlow = ctx.createRadialGradient(
        sunX,
        sunY,
        sunRadius * 0.1,
        sunX,
        sunY,
        sunRadius * 2.8
      )
      sunGlow.addColorStop(0, 'rgba(255, 255, 240, 1)')
      sunGlow.addColorStop(0.3, 'rgba(253, 224, 71, 0.85)')
      sunGlow.addColorStop(0.65, 'rgba(249, 115, 22, 0.35)')
      sunGlow.addColorStop(1, 'rgba(249, 115, 22, 0)')
      ctx.fillStyle = sunGlow
      ctx.fillRect(0, 0, width, height)

      ctx.beginPath()
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#fffbeb'
      ctx.fill()

      // Ocean Horizon & Animated Waves
      const horizonY = height * 0.62
      const seaGrad = ctx.createLinearGradient(0, horizonY, 0, height)
      seaGrad.addColorStop(0, '#9a3412')
      seaGrad.addColorStop(0.3, '#431407')
      seaGrad.addColorStop(0.7, '#1e1b4b')
      seaGrad.addColorStop(1, '#09090b')
      ctx.fillStyle = seaGrad
      ctx.fillRect(0, horizonY, width, height - horizonY)

      // Shimmering Golden Sun Path on Water
      for (let i = 0; i < 34; i++) {
        const p = i / 34
        const y = horizonY + Math.pow(p, 1.35) * (height - horizonY)
        const waveShift = Math.sin(sourceTime * 3.8 + i * 0.75) * width * 0.04 * (0.3 + p)
        const shimmerW = width * (0.14 + p * 0.38)
        const shimmerH = Math.max(2, 2 + p * 7)
        ctx.fillStyle = `rgba(254, 240, 138, ${(0.75 - p * 0.55).toFixed(2)})`
        ctx.fillRect(
          sunX - shimmerW * 0.5 + waveShift,
          y,
          shimmerW,
          shimmerH
        )
      }

      // Distant Island Silhouette
      ctx.fillStyle = '#1c1917'
      ctx.beginPath()
      ctx.moveTo(0, horizonY)
      ctx.quadraticCurveTo(width * 0.18, horizonY - height * 0.045, width * 0.36, horizonY)
      ctx.closePath()
      ctx.fill()

      // Foreground Palm Tree Silhouette
      const trunkBaseX = width * 0.82
      const trunkBaseY = height
      const sway = Math.sin(sourceTime * 1.6) * 14
      const crownX = width * 0.72 + sway
      const crownY = height * 0.28

      ctx.strokeStyle = '#09090b'
      ctx.lineWidth = Math.max(8, width * 0.022)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(trunkBaseX, trunkBaseY)
      ctx.quadraticCurveTo(width * 0.8, height * 0.6, crownX, crownY)
      ctx.stroke()

      // Palm Fronds
      const frondAngles = [-2.6, -2.0, -1.3, -0.5, 0.2, 0.8]
      ctx.lineWidth = Math.max(4, width * 0.01)
      for (let f = 0; f < frondAngles.length; f++) {
        const ang = frondAngles[f] + Math.sin(sourceTime * 2.1 + f) * 0.06
        const len = Math.min(width, height) * 0.22
        const endX = crownX + Math.cos(ang) * len
        const endY = crownY + Math.sin(ang) * len + len * 0.25
        ctx.beginPath()
        ctx.moveTo(crownX, crownY)
        ctx.quadraticCurveTo(
          crownX + Math.cos(ang) * len * 0.55,
          crownY + Math.sin(ang) * len * 0.45 - 18,
          endX,
          endY
        )
        ctx.stroke()
      }

      // Anamorphic Lens Flare Streak
      const flareGrad = ctx.createLinearGradient(0, sunY, width, sunY)
      flareGrad.addColorStop(0, 'rgba(251, 146, 60, 0)')
      flareGrad.addColorStop(0.5, 'rgba(254, 249, 195, 0.42)')
      flareGrad.addColorStop(1, 'rgba(251, 146, 60, 0)')
      ctx.fillStyle = flareGrad
      ctx.fillRect(0, sunY - 3, width, 6)
    } else if (mediaUrl.includes('neon_grid')) {
      // =====================================================================
      // SCENE 3: CYBERNETIC SYNTHWAVE HUD & 3D PERSPECTIVE GRID
      // =====================================================================
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7
      )
      bgGrad.addColorStop(0, '#1e1b4b')
      bgGrad.addColorStop(0.6, '#09090b')
      bgGrad.addColorStop(1, '#020617')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Perspective 3D Grid
      const horizon = height * 0.52
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.48)'
      ctx.lineWidth = 2

      for (let i = -8; i <= 8; i++) {
        ctx.beginPath()
        ctx.moveTo(width * 0.5 + i * (width * 0.03), horizon)
        ctx.lineTo(width * 0.5 + i * (width * 0.18), height)
        ctx.stroke()
      }

      const scroll = (sourceTime * 1.4) % 1
      for (let row = 0; row < 10; row++) {
        const norm = (row + scroll) / 10
        const y = horizon + Math.pow(norm, 1.8) * (height - horizon)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Rotating Neon Energy Rings
      const cx = width * 0.5
      const cy = height * 0.42
      const baseR = Math.min(width, height) * 0.24

      for (let ring = 0; ring < 3; ring++) {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(sourceTime * (ring % 2 === 0 ? 1.2 : -1.5) + ring)
        ctx.strokeStyle = ring === 0 ? '#00E5FF' : ring === 1 ? '#FE2C55' : '#A855F7'
        ctx.lineWidth = 4
        ctx.setLineDash([28, 16])
        ctx.beginPath()
        ctx.arc(0, 0, baseR * (0.6 + ring * 0.25), 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    } else {
      // =====================================================================
      // SCENE 1: CYBERPUNK CITY METROPOLIS (DEFAULT DEMO)
      // =====================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.72)
      skyGrad.addColorStop(0, '#040711')
      skyGrad.addColorStop(0.45, '#0f172a')
      skyGrad.addColorStop(0.8, '#1e1b4b')
      skyGrad.addColorStop(1, '#3b0764')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, width, height)

      // Neon Cyber Moon / Halo
      const moonX = width * 0.74
      const moonY = height * 0.22
      const moonR = Math.min(width, height) * 0.12
      const moonGlow = ctx.createRadialGradient(
        moonX,
        moonY,
        moonR * 0.2,
        moonX,
        moonY,
        moonR * 2.6
      )
      moonGlow.addColorStop(0, 'rgba(0, 229, 255, 0.9)')
      moonGlow.addColorStop(0.4, 'rgba(254, 44, 85, 0.45)')
      moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = moonGlow
      ctx.fillRect(0, 0, width, height)

      // Parallax City Buildings
      const buildingDefs = [
        { x: 0.02, w: 0.16, h: 0.52, color: '#090d16', accent: '#00E5FF' },
        { x: 0.15, w: 0.18, h: 0.64, color: '#0b1120', accent: '#FE2C55' },
        { x: 0.31, w: 0.22, h: 0.72, color: '#070a12', accent: '#00E5FF' },
        { x: 0.51, w: 0.17, h: 0.58, color: '#0f172a', accent: '#F59E0B' },
        { x: 0.65, w: 0.2, h: 0.68, color: '#080c17', accent: '#EC4899' },
        { x: 0.82, w: 0.19, h: 0.56, color: '#090d16', accent: '#00E5FF' },
      ]

      const streetY = height * 0.74
      for (let b = 0; b < buildingDefs.length; b++) {
        const bld = buildingDefs[b]
        const bx = bld.x * width
        const bw = bld.w * width
        const bh = bld.h * height
        const by = streetY - bh

        ctx.fillStyle = bld.color
        ctx.fillRect(bx, by, bw, bh)

        // Glowing Neon Roof Edge
        ctx.fillStyle = bld.accent
        ctx.fillRect(bx, by, bw, 3)

        // Lit Window Matrix
        const cols = 4
        const rows = 14
        const padX = bw * 0.12
        const cellW = (bw - padX * 2) / cols
        const cellH = (bh - 24) / rows

        for (let r = 1; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const hash = Math.sin(b * 17.3 + r * 7.1 + c * 3.7)
            if (hash > -0.15) {
              const pulse = Math.sin(sourceTime * 2.5 + b + r) * 0.15 + 0.85
              ctx.fillStyle =
                hash > 0.6
                  ? `rgba(0, 229, 255, ${(0.75 * pulse).toFixed(2)})`
                  : hash > 0.25
                    ? `rgba(254, 44, 85, ${(0.7 * pulse).toFixed(2)})`
                    : `rgba(253, 224, 71, ${(0.65 * pulse).toFixed(2)})`
              ctx.fillRect(
                bx + padX + c * cellW + 2,
                by + 14 + r * cellH,
                Math.max(3, cellW - 6),
                Math.max(3, cellH * 0.55)
              )
            }
          }
        }
      }

      // Wet Asphalt Street & Neon Reflections
      const roadGrad = ctx.createLinearGradient(0, streetY, 0, height)
      roadGrad.addColorStop(0, '#09090b')
      roadGrad.addColorStop(0.5, '#111827')
      roadGrad.addColorStop(1, '#030712')
      ctx.fillStyle = roadGrad
      ctx.fillRect(0, streetY, width, height - streetY)

      // Animated Light Trails on Highway
      for (let t = 0; t < 8; t++) {
        const laneY = streetY + ((t + 0.5) / 8) * (height - streetY)
        const speed = (t % 2 === 0 ? 1 : -1) * (0.35 + (t % 3) * 0.18)
        const normX = ((sourceTime * speed + t * 0.23) % 1 + 1) % 1
        const trailW = width * (0.18 + (t % 3) * 0.08)
        const trailX = normX * (width + trailW) - trailW

        const trailGrad = ctx.createLinearGradient(
          trailX,
          laneY,
          trailX + trailW,
          laneY
        )
        const color =
          t % 2 === 0 ? 'rgba(0, 229, 255, 0.85)' : 'rgba(254, 44, 85, 0.85)'
        trailGrad.addColorStop(0, 'rgba(0,0,0,0)')
        trailGrad.addColorStop(0.5, color)
        trailGrad.addColorStop(1, 'rgba(255,255,255,0.95)')

        ctx.fillStyle = trailGrad
        ctx.fillRect(trailX, laneY, trailW, 4 + (t % 3) * 2)
      }

      // Cyber Rain Streaks
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.28)'
      ctx.lineWidth = 1.5
      for (let drop = 0; drop < 32; drop++) {
        const rx = ((drop * 97 + sourceTime * 180) % width + width) % width
        const ry = ((drop * 61 + sourceTime * 720) % height + height) % height
        ctx.beginPath()
        ctx.moveTo(rx, ry)
        ctx.lineTo(rx - 8, ry + 26)
        ctx.stroke()
      }
    }

    ctx.restore()
  }

  /**
   * Draws a real HTMLVideoElement frame onto `this.sourceCanvas` with high-quality scaling.
   */
  private drawVideoToSourceCanvas(
    video: HTMLVideoElement,
    _fallbackTime: number,
    width: number,
    height: number
  ): void {
    const ctx = this.sourceCtx
    if (!ctx) return

    if (this.sourceCanvas.width !== width || this.sourceCanvas.height !== height) {
      this.sourceCanvas.width = width
      this.sourceCanvas.height = height
    }

    if (video.readyState >= 1 && video.videoWidth > 0 && video.videoHeight > 0) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      const vw = video.videoWidth
      const vh = video.videoHeight
      const scale = Math.min(width / vw, height / vh)
      const dw = vw * scale
      const dh = vh * scale
      const dx = (width - dw) * 0.5
      const dy = (height - dh) * 0.5
      try {
        ctx.drawImage(video, dx, dy, dw, dh)
      } catch {
        // Ignore transient decode frame state on iOS Safari
      }
    }
  }

  /**
   * Checks whether a clip currently requires WebGL2 fragment shader processing.
   * If false, `sourceImage` is drawn directly at 100% native 2D canvas clarity.
   */
  private hasActiveShaderEffects(
    clip: TimelineClip,
    playheadTime: number,
    extraCasBoost: number
  ): boolean {
    if (extraCasBoost > 0.001) return true
    if (clip.qualityEnhancer?.enabled) return true
    if (clip.chromaKey?.enabled) return true
    if (clip.mask && clip.mask.shape !== 'none') return true
    if (clip.filterId && clip.filterId !== 'none' && clip.filterIntensity > 0) {
      return true
    }

    const localTime = Math.max(0, playheadTime - clip.startTime)
    if (
      clip.transitionIn &&
      clip.transitionIn.type !== 'none' &&
      clip.transitionIn.duration > 0 &&
      localTime < clip.transitionIn.duration
    ) {
      return true
    }

    const cg = clip.colorGrading
    if (
      Math.abs(cg.exposure) > 0.1 ||
      Math.abs(cg.contrast) > 0.1 ||
      Math.abs(cg.brightness) > 0.1 ||
      Math.abs(cg.highlights) > 0.1 ||
      Math.abs(cg.shadows) > 0.1 ||
      Math.abs(cg.whites) > 0.1 ||
      Math.abs(cg.blacks) > 0.1 ||
      Math.abs(cg.saturation) > 0.1 ||
      Math.abs(cg.vibrance) > 0.1 ||
      Math.abs(cg.temperature) > 0.1 ||
      Math.abs(cg.tint) > 0.1 ||
      cg.sharpness > 0.1 ||
      cg.filmGrain > 0.1 ||
      Math.abs(cg.vignette) > 0.1 ||
      cg.chromaticAberration > 0.1 ||
      cg.halation > 0.1
    ) {
      return true
    }

    return false
  }

  /**
   * Runs the WebGL2 `#version 300 es` fragment shader on `sourceImage` with the clip's
   * Quality Enhancer Pro, 16-Parameter Color Grading, 32 LUT Filter, Chroma Key,
   * Vector SDF Masks, and GLSL Transitions.
   */
  private processThroughWebGL2(
    sourceImage: HTMLCanvasElement,
    clip: TimelineClip,
    playheadTime: number,
    extraCasBoost: number
  ): HTMLCanvasElement {
    if (!this.hasActiveShaderEffects(clip, playheadTime, extraCasBoost)) {
      return sourceImage
    }

    const gl = this.gl
    const program = this.program
    if (
      !gl ||
      !program ||
      !this.vao ||
      !this.texture ||
      gl.isContextLost()
    ) {
      return sourceImage
    }

    const w = sourceImage.width
    const h = sourceImage.height
    if (this.glCanvas.width !== w || this.glCanvas.height !== h) {
      this.glCanvas.width = w
      this.glCanvas.height = h
    }

    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(program)
    gl.bindVertexArray(this.vao)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sourceImage
    )
    gl.uniform1i(this.getUniform('u_tex'), 0)

    const props = getInterpolatedClipProps(clip, playheadTime)
    const preset = getFilterPresetById(clip.filterId)
    const cg = clip.colorGrading
    const qe = clip.qualityEnhancer
    const mask = clip.mask ?? DEFAULT_MASK
    const ck = clip.chromaKey ?? DEFAULT_CHROMA_KEY

    gl.uniform2f(this.getUniform('u_resolution'), w, h)
    gl.uniform2f(this.getUniform('u_texelSize'), 1 / w, 1 / h)
    gl.uniform1f(this.getUniform('u_time'), playheadTime)
    gl.uniform1f(this.getUniform('u_opacity'), Math.max(0, Math.min(1, props.opacity / 100)))

    // Quality Enhancer Pro + WhatsApp Anti-Compression CAS boost
    const qualityEnabled = qe.enabled || extraCasBoost > 0.001 ? 1 : 0
    const casValue =
      (qe.enabled ? qe.casSharpen / 100 : 0) + Math.max(0, extraCasBoost)
    gl.uniform1i(this.getUniform('u_qualityEnabled'), qualityEnabled)
    gl.uniform1f(this.getUniform('u_casSharpen'), casValue)
    gl.uniform1f(
      this.getUniform('u_bilateralDenoise'),
      qe.enabled ? qe.bilateralDenoise / 100 : 0
    )
    gl.uniform1f(
      this.getUniform('u_debandDither'),
      qe.enabled ? qe.debandDither / 100 : 0
    )
    gl.uniform1f(
      this.getUniform('u_midtoneClarity'),
      qe.enabled ? qe.midtoneClarity / 100 : 0
    )

    // 16-Parameter Color Grading + Preset Grain/Halation
    const presetGrain = preset?.grain ?? 0
    const presetHalation = preset?.halation ?? 0
    const filterNorm = Math.max(0, Math.min(1, props.filterIntensity / 100))

    gl.uniform1f(this.getUniform('u_exposure'), cg.exposure / 100)
    gl.uniform1f(this.getUniform('u_contrast'), cg.contrast / 100)
    gl.uniform1f(this.getUniform('u_brightness'), cg.brightness / 100)
    gl.uniform1f(this.getUniform('u_highlights'), cg.highlights / 100)
    gl.uniform1f(this.getUniform('u_shadows'), cg.shadows / 100)
    gl.uniform1f(this.getUniform('u_whites'), cg.whites / 100)
    gl.uniform1f(this.getUniform('u_blacks'), cg.blacks / 100)
    gl.uniform1f(this.getUniform('u_saturation'), cg.saturation / 100)
    gl.uniform1f(this.getUniform('u_vibrance'), cg.vibrance / 100)
    gl.uniform1f(this.getUniform('u_temperature'), cg.temperature / 100)
    gl.uniform1f(this.getUniform('u_tint'), cg.tint / 100)
    gl.uniform1f(this.getUniform('u_sharpness'), cg.sharpness / 100)
    gl.uniform1f(
      this.getUniform('u_filmGrain'),
      Math.min(1, cg.filmGrain / 100 + presetGrain * filterNorm)
    )
    gl.uniform1f(this.getUniform('u_vignette'), cg.vignette / 100)
    gl.uniform1f(this.getUniform('u_chromatic'), cg.chromaticAberration / 100)
    gl.uniform1f(
      this.getUniform('u_halation'),
      Math.min(1, cg.halation / 100 + presetHalation * filterNorm)
    )

    // Filter Matrix & LGG
    if (preset && filterNorm > 0.001) {
      gl.uniform1f(this.getUniform('u_filterIntensity'), filterNorm)
      gl.uniformMatrix4fv(
        this.getUniform('u_filterMatrix'),
        false,
        new Float32Array(preset.matrix)
      )
      gl.uniform3f(
        this.getUniform('u_filterLift'),
        preset.lift[0],
        preset.lift[1],
        preset.lift[2]
      )
      gl.uniform3f(
        this.getUniform('u_filterGamma'),
        preset.gamma[0],
        preset.gamma[1],
        preset.gamma[2]
      )
      gl.uniform3f(
        this.getUniform('u_filterGain'),
        preset.gain[0],
        preset.gain[1],
        preset.gain[2]
      )
      gl.uniform1f(this.getUniform('u_filterContrast'), preset.contrast)
      gl.uniform1f(this.getUniform('u_filterSaturation'), preset.saturation)
      gl.uniform1f(this.getUniform('u_scanlines'), preset.scanlines ?? 0)
    } else {
      gl.uniform1f(this.getUniform('u_filterIntensity'), 0)
      gl.uniformMatrix4fv(this.getUniform('u_filterMatrix'), false, IDENTITY_MAT4)
      gl.uniform3f(this.getUniform('u_filterLift'), 0, 0, 0)
      gl.uniform3f(this.getUniform('u_filterGamma'), 1, 1, 1)
      gl.uniform3f(this.getUniform('u_filterGain'), 1, 1, 1)
      gl.uniform1f(this.getUniform('u_filterContrast'), 1)
      gl.uniform1f(this.getUniform('u_filterSaturation'), 1)
      gl.uniform1f(this.getUniform('u_scanlines'), 0)
    }

    // Chroma Key
    gl.uniform1i(this.getUniform('u_chromaEnabled'), ck.enabled ? 1 : 0)
    gl.uniform3f(
      this.getUniform('u_chromaKeyColor'),
      ck.keyColor[0],
      ck.keyColor[1],
      ck.keyColor[2]
    )
    gl.uniform1f(this.getUniform('u_chromaSimilarity'), ck.similarity / 100)
    gl.uniform1f(this.getUniform('u_chromaSmoothness'), ck.smoothness / 100)
    gl.uniform1f(this.getUniform('u_chromaSpill'), ck.spillSuppression / 100)

    // Interactive Vector Mask
    gl.uniform1i(
      this.getUniform('u_maskShape'),
      MASK_SHAPE_TO_INT[mask.shape] ?? 0
    )
    gl.uniform2f(this.getUniform('u_maskCenter'), mask.x, mask.y)
    gl.uniform2f(this.getUniform('u_maskScale'), mask.scaleX, mask.scaleY)
    gl.uniform1f(this.getUniform('u_maskRotation'), mask.rotation)
    gl.uniform1f(this.getUniform('u_maskFeather'), mask.feather)
    gl.uniform1i(this.getUniform('u_maskInvert'), mask.invert ? 1 : 0)
    gl.uniform1f(this.getUniform('u_maskCornerRadius'), mask.cornerRadius)

    // GLSL Entry Transition
    const localTime = Math.max(0, playheadTime - clip.startTime)
    const trans = clip.transitionIn
    if (
      trans &&
      trans.type !== 'none' &&
      trans.duration > 0 &&
      localTime < trans.duration
    ) {
      gl.uniform1i(
        this.getUniform('u_transitionType'),
        TRANSITION_TYPE_TO_INT[trans.type] ?? 0
      )
      gl.uniform1f(
        this.getUniform('u_transitionProgress'),
        Math.max(0, Math.min(1, localTime / trans.duration))
      )
    } else {
      gl.uniform1i(this.getUniform('u_transitionType'), 0)
      gl.uniform1f(this.getUniform('u_transitionProgress'), 1)
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)

    return this.glCanvas
  }

  /**
   * Renders the canvas background (Solid, Linear Gradient, or Multi-Pass Smart Blur).
   */
  private renderCanvasBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bg: CanvasBackgroundConfig,
    primaryVideoSource: HTMLCanvasElement | HTMLVideoElement | null
  ): void {
    ctx.save()
    if (bg.mode === 'solid') {
      ctx.fillStyle = bg.solidColor || '#09090B'
      ctx.fillRect(0, 0, width, height)
    } else if (bg.mode === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, bg.gradientColors[0] || '#09090B')
      grad.addColorStop(1, bg.gradientColors[1] || '#1A103C')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    } else if (bg.mode === 'blur' && primaryVideoSource && this.blurCtxA && this.blurCtxB) {
      // Multi-pass pyramid downsample blur (100% compatible with iOS Safari WebKit & Desktop)
      const downSizes: Record<1 | 2 | 3 | 4, number> = {
        1: 80,
        2: 56,
        3: 36,
        4: 20,
      }
      const smallW = downSizes[bg.blurLevel] ?? 36
      const smallH = Math.max(16, Math.round((smallW * height) / width))

      this.blurCanvasA.width = smallW
      this.blurCanvasA.height = smallH
      this.blurCanvasB.width = smallW
      this.blurCanvasB.height = smallH

      this.blurCtxA.imageSmoothingEnabled = true
      this.blurCtxB.imageSmoothingEnabled = true
      this.blurCtxA.drawImage(primaryVideoSource, 0, 0, smallW, smallH)
      this.blurCtxB.drawImage(this.blurCanvasA, 0, 0, smallW, smallH)

      ctx.imageSmoothingEnabled = true
      const expand = 1.08
      const dw = width * expand
      const dh = height * expand
      ctx.drawImage(
        this.blurCanvasB,
        (width - dw) * 0.5,
        (height - dh) * 0.5,
        dw,
        dh
      )
      ctx.fillStyle = 'rgba(9, 9, 11, 0.32)'
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.fillStyle = '#09090B'
      ctx.fillRect(0, 0, width, height)
    }
    ctx.restore()
  }

  /**
   * Draws a processed video or PIP clip onto the target 2D canvas with 2D transforms,
   * crop edges, blend modes, and keyframed animations.
   * Supports direct HTMLVideoElement for zero-copy 60 FPS hardware rendering on 4K clips.
   */
  private drawTransformedLayer(
    ctx: CanvasRenderingContext2D,
    layerSource: HTMLCanvasElement | HTMLVideoElement,
    clip: TimelineClip,
    playheadTime: number,
    canvasW: number,
    canvasH: number
  ): void {
    const props = getInterpolatedClipProps(clip, playheadTime)
    const tf = clip.transform

    const srcW =
      'videoWidth' in layerSource ? layerSource.videoWidth : layerSource.width
    const srcH =
      'videoHeight' in layerSource ? layerSource.videoHeight : layerSource.height

    if (srcW <= 0 || srcH <= 0) return

    const cropL = Math.max(0, Math.min(0.45, tf.cropLeft))
    const cropR = Math.max(0, Math.min(0.45, tf.cropRight))
    const cropT = Math.max(0, Math.min(0.45, tf.cropTop))
    const cropB = Math.max(0, Math.min(0.45, tf.cropBottom))

    const sx = cropL * srcW
    const sy = cropT * srcH
    const sw = Math.max(1, (1 - cropL - cropR) * srcW)
    const sh = Math.max(1, (1 - cropT - cropB) * srcH)

    const destX = -canvasW * 0.5 + cropL * canvasW
    const destY = -canvasH * 0.5 + cropT * canvasH
    const destW = (1 - cropL - cropR) * canvasW
    const destH = (1 - cropT - cropB) * canvasH

    ctx.save()
    ctx.globalCompositeOperation = mapBlendModeToCanvasComposite(clip.blendMode)
    ctx.globalAlpha = Math.max(0, Math.min(1, props.opacity / 100))
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'medium'

    const centerX = canvasW * 0.5 + (props.x * canvasW) * 0.5
    const centerY = canvasH * 0.5 + (props.y * canvasH) * 0.5

    ctx.translate(centerX, centerY)
    ctx.rotate((props.rotation * Math.PI) / 180)
    ctx.scale(
      props.scale * (tf.flipH ? -1 : 1),
      props.scale * (tf.flipV ? -1 : 1)
    )

    ctx.drawImage(layerSource, sx, sy, sw, sh, destX, destY, destW, destH)
    ctx.restore()
  }

  /**
   * Draws a Text or Sticker clip with keyframed transforms, stroke, shadow, and pill background.
   */
  private drawTextClip(
    ctx: CanvasRenderingContext2D,
    clip: TimelineClip,
    playheadTime: number,
    canvasW: number,
    canvasH: number
  ): void {
    const style = clip.textStyle
    if (!style || !style.text) return

    const props = getInterpolatedClipProps(clip, playheadTime)
    const tf = clip.transform
    const scaleFactor = canvasW / 1080
    const fontSize = Math.max(14, Math.round(style.fontSize * scaleFactor))

    ctx.save()
    ctx.globalAlpha = Math.max(0, Math.min(1, props.opacity / 100))
    ctx.globalCompositeOperation = mapBlendModeToCanvasComposite(clip.blendMode)

    const centerX = canvasW * 0.5 + (props.x * canvasW) * 0.5
    const centerY = canvasH * 0.5 + (props.y * canvasH) * 0.5

    ctx.translate(centerX, centerY)
    ctx.rotate((props.rotation * Math.PI) / 180)
    ctx.scale(
      props.scale * (tf.flipH ? -1 : 1),
      props.scale * (tf.flipV ? -1 : 1)
    )

    ctx.font = `800 ${fontSize}px ${style.fontFamily || 'Inter, system-ui, sans-serif'}`
    ctx.textAlign = style.align || 'center'
    ctx.textBaseline = 'middle'

    const lines = style.text.split('\n')
    const lineHeight = fontSize * 1.22
    const totalH = lines.length * lineHeight

    let maxLineW = 0
    for (const line of lines) {
      const m = ctx.measureText(line)
      if (m.width > maxLineW) maxLineW = m.width
    }

    if (
      style.backgroundColor &&
      style.backgroundColor !== 'transparent' &&
      !style.isSticker
    ) {
      const padX = fontSize * 0.48
      const padY = fontSize * 0.28
      const boxW = maxLineW + padX * 2
      const boxH = totalH + padY * 2
      const boxX =
        style.align === 'left'
          ? -padX
          : style.align === 'right'
            ? -maxLineW - padX
            : -boxW * 0.5
      const boxY = -boxH * 0.5

      ctx.fillStyle = style.backgroundColor
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, Math.min(24, fontSize * 0.35))
      ctx.fill()
    }

    if (style.shadowBlur > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
      ctx.shadowBlur = style.shadowBlur * scaleFactor
      ctx.shadowOffsetY = 3 * scaleFactor
    }

    for (let i = 0; i < lines.length; i++) {
      const ly = -totalH * 0.5 + (i + 0.5) * lineHeight
      if (
        style.strokeWidth > 0 &&
        style.strokeColor &&
        style.strokeColor !== 'transparent'
      ) {
        ctx.strokeStyle = style.strokeColor
        ctx.lineWidth = style.strokeWidth * scaleFactor * 2
        ctx.lineJoin = 'round'
        ctx.strokeText(lines[i], 0, ly)
      }
      ctx.fillStyle = style.color || '#FFFFFF'
      ctx.fillText(lines[i], 0, ly)
    }

    ctx.restore()
  }

  /**
   * Renders the complete multi-track composite at `playheadTime` onto `targetCanvas`.
   * Supports both object parameter (`RenderFrameParams`) and positional parameters.
   */
  public renderFrame(
    paramsOrClips: RenderFrameParams | TimelineClip[],
    tracksArg?: TimelineTrack[],
    playheadTimeArg?: number,
    aspectRatioArg?: AspectRatio,
    canvasBackgroundArg?: CanvasBackgroundConfig,
    isPlayingArg?: boolean,
    extraCasBoostArg?: number
  ): void {
    let params: RenderFrameParams
    if (Array.isArray(paramsOrClips)) {
      params = {
        clips: paramsOrClips,
        tracks: tracksArg ?? [],
        playheadTime: playheadTimeArg ?? 0,
        aspectRatio: aspectRatioArg ?? '9:16',
        canvasBackground: canvasBackgroundArg ?? {
          mode: 'blur',
          blurLevel: 3,
          solidColor: '#09090B',
          gradientId: 'cyber_night',
          gradientColors: ['#09090B', '#1A103C'],
        },
        isPlaying: isPlayingArg ?? false,
        extraCasBoost: extraCasBoostArg ?? 0,
      }
    } else {
      params = paramsOrClips
    }

    const {
      clips,
      tracks,
      playheadTime,
      isPlaying = false,
      aspectRatio,
      canvasBackground,
      extraCasBoost = 0,
      renderScale = 0.85,
    } = params

    const ctx = this.targetCtx
    if (!ctx) return

    const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio] ?? ASPECT_RATIO_DIMENSIONS['9:16']
    const targetW = Math.round(dims.width * renderScale)
    const targetH = Math.round(dims.height * renderScale)

    if (
      this.targetCanvas.width !== targetW ||
      this.targetCanvas.height !== targetH
    ) {
      this.targetCanvas.width = targetW
      this.targetCanvas.height = targetH
    }

    this.syncVideos(clips, playheadTime, isPlaying, tracks)

    const visibleTrackTypes = new Set<string>()
    if (tracks.length === 0) {
      visibleTrackTypes.add('video')
      visibleTrackTypes.add('pip')
      visibleTrackTypes.add('text')
      visibleTrackTypes.add('adjustment')
    } else {
      for (const t of tracks) {
        if (t.visible) visibleTrackTypes.add(t.type)
      }
    }

    const activeAtPlayhead = (c: TimelineClip) =>
      visibleTrackTypes.has(c.trackType) &&
      playheadTime >= c.startTime &&
      playheadTime <= c.startTime + c.duration

    const activeVideoClips = clips
      .filter((c) => c.trackType === 'video' && activeAtPlayhead(c))
      .sort((a, b) => a.startTime - b.startTime)

    const activePipClips = clips
      .filter((c) => c.trackType === 'pip' && activeAtPlayhead(c))
      .sort((a, b) => a.startTime - b.startTime)

    const activeTextClips = clips
      .filter((c) => c.trackType === 'text' && activeAtPlayhead(c))
      .sort((a, b) => a.startTime - b.startTime)

    const activeAdjustmentClips = clips
      .filter((c) => c.trackType === 'adjustment' && activeAtPlayhead(c))
      .sort((a, b) => a.startTime - b.startTime)

    // 1. Render Canvas Background (Blur / Solid / Gradient)
    const primaryVideoClip = activeVideoClips[activeVideoClips.length - 1] ?? null
    let primaryBgSource: HTMLCanvasElement | HTMLVideoElement | null = null

    if (primaryVideoClip && canvasBackground.mode === 'blur') {
      const isFullCoverage =
        primaryVideoClip.transform.scale >= 0.98 &&
        primaryVideoClip.transform.rotation === 0 &&
        primaryVideoClip.transform.cropLeft === 0 &&
        primaryVideoClip.transform.cropRight === 0 &&
        primaryVideoClip.transform.cropTop === 0 &&
        primaryVideoClip.transform.cropBottom === 0

      // Only prepare background blur source if the video does not completely cover the canvas
      if (!isFullCoverage) {
        if (primaryVideoClip.mediaUrl.startsWith('demo://')) {
          const remappedTime = computeRemappedSourceTime(primaryVideoClip, playheadTime)
          this.renderProceduralScene(
            primaryVideoClip.mediaUrl,
            remappedTime,
            targetW,
            targetH
          )
          primaryBgSource = this.sourceCanvas
        } else {
          primaryBgSource = this.getOrCreateVideoElement(primaryVideoClip)
        }
      }
    }

    this.renderCanvasBackground(
      ctx,
      targetW,
      targetH,
      canvasBackground,
      primaryBgSource
    )

    // 2. Render Main Video Track Clips through WebGL2 Shader Pipeline or Zero-Copy Hardware Direct Blit
    for (const vClip of activeVideoClips) {
      const remappedTime = computeRemappedSourceTime(vClip, playheadTime)
      const needsShader = this.hasActiveShaderEffects(
        vClip,
        playheadTime,
        extraCasBoost
      )

      if (vClip.mediaUrl.startsWith('demo://')) {
        this.renderProceduralScene(vClip.mediaUrl, remappedTime, targetW, targetH)
        const shaded = needsShader
          ? this.processThroughWebGL2(
              this.sourceCanvas,
              vClip,
              playheadTime,
              extraCasBoost
            )
          : this.sourceCanvas
        this.drawTransformedLayer(ctx, shaded, vClip, playheadTime, targetW, targetH)
      } else {
        const videoEl = this.getOrCreateVideoElement(vClip)
        if (needsShader) {
          this.drawVideoToSourceCanvas(videoEl, remappedTime, targetW, targetH)
          const shaded = this.processThroughWebGL2(
            this.sourceCanvas,
            vClip,
            playheadTime,
            extraCasBoost
          )
          this.drawTransformedLayer(ctx, shaded, vClip, playheadTime, targetW, targetH)
        } else {
          // Zero-Copy Hardware Direct Blit: 4K 60fps renders directly with 0 CPU copies!
          this.drawTransformedLayer(ctx, videoEl, vClip, playheadTime, targetW, targetH)
        }
      }
    }

    // 3. Render PIP / Overlay Track Clips
    for (const pipClip of activePipClips) {
      const remappedTime = computeRemappedSourceTime(pipClip, playheadTime)
      const needsShader = this.hasActiveShaderEffects(
        pipClip,
        playheadTime,
        extraCasBoost
      )

      if (pipClip.mediaUrl.startsWith('demo://')) {
        this.renderProceduralScene(pipClip.mediaUrl, remappedTime, targetW, targetH)
        const shaded = needsShader
          ? this.processThroughWebGL2(
              this.sourceCanvas,
              pipClip,
              playheadTime,
              extraCasBoost
            )
          : this.sourceCanvas
        this.drawTransformedLayer(ctx, shaded, pipClip, playheadTime, targetW, targetH)
      } else {
        const videoEl = this.getOrCreateVideoElement(pipClip)
        if (needsShader) {
          this.drawVideoToSourceCanvas(videoEl, remappedTime, targetW, targetH)
          const shaded = this.processThroughWebGL2(
            this.sourceCanvas,
            pipClip,
            playheadTime,
            extraCasBoost
          )
          this.drawTransformedLayer(ctx, shaded, pipClip, playheadTime, targetW, targetH)
        } else {
          this.drawTransformedLayer(ctx, videoEl, pipClip, playheadTime, targetW, targetH)
        }
      }
    }

    // 4. Render Text & Sticker Layers
    for (const textClip of activeTextClips) {
      this.drawTextClip(ctx, textClip, playheadTime, targetW, targetH)
    }

    // 5. Apply Adjustment Track Clips ('Capa de Ajuste') over the entire composite
    for (const adjClip of activeAdjustmentClips) {
      if (this.sourceCtx) {
        if (
          this.sourceCanvas.width !== targetW ||
          this.sourceCanvas.height !== targetH
        ) {
          this.sourceCanvas.width = targetW
          this.sourceCanvas.height = targetH
        }
        this.sourceCtx.drawImage(this.targetCanvas, 0, 0, targetW, targetH)
        const gradedComposite = this.processThroughWebGL2(
          this.sourceCanvas,
          adjClip,
          playheadTime,
          extraCasBoost
        )
        ctx.save()
        ctx.drawImage(gradedComposite, 0, 0, targetW, targetH)
        ctx.restore()
      }
    }
  }

  /**
   * Alias for `renderFrame` to support callers invoking `.render(...)`
   */
  public render(
    paramsOrClips: RenderFrameParams | TimelineClip[],
    tracksArg?: TimelineTrack[],
    playheadTimeArg?: number,
    aspectRatioArg?: AspectRatio,
    canvasBackgroundArg?: CanvasBackgroundConfig,
    isPlayingArg?: boolean,
    extraCasBoostArg?: number
  ): void {
    this.renderFrame(
      paramsOrClips,
      tracksArg,
      playheadTimeArg,
      aspectRatioArg,
      canvasBackgroundArg,
      isPlayingArg,
      extraCasBoostArg
    )
  }

  /**
   * Downsamples the rendered target canvas (64x36 readback) to compute a real-time
   * 64-bin RGB + Luma histogram, shadow/highlight clipping percentages, and average IRE.
   */
  public computeHistogram(): HistogramData {
    const rBins = new Array<number>(64).fill(0)
    const gBins = new Array<number>(64).fill(0)
    const bBins = new Array<number>(64).fill(0)
    const lumaBins = new Array<number>(64).fill(0)

    if (!this.histCtx || this.targetCanvas.width === 0 || this.targetCanvas.height === 0) {
      return {
        r: rBins,
        g: gBins,
        b: bBins,
        luma: lumaBins,
        shadowsClippedPct: 0,
        highlightsClippedPct: 0,
        avgIRE: 50,
      }
    }

    const w = this.histCanvas.width
    const h = this.histCanvas.height
    this.histCtx.drawImage(this.targetCanvas, 0, 0, w, h)
    const imgData = this.histCtx.getImageData(0, 0, w, h).data
    const totalPixels = w * h

    let shadowsClipped = 0
    let highlightsClipped = 0
    let lumaSum = 0

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i]
      const g = imgData[i + 1]
      const b = imgData[i + 2]
      const y = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)

      rBins[Math.min(63, r >> 2)]++
      gBins[Math.min(63, g >> 2)]++
      bBins[Math.min(63, b >> 2)]++
      lumaBins[Math.min(63, y >> 2)]++

      if (y <= 4) shadowsClipped++
      if (y >= 251) highlightsClipped++
      lumaSum += y
    }

    const maxCount = Math.max(
      1,
      ...rBins,
      ...gBins,
      ...bBins,
      ...lumaBins
    )

    return {
      r: rBins.map((v) => Number((v / maxCount).toFixed(3))),
      g: gBins.map((v) => Number((v / maxCount).toFixed(3))),
      b: bBins.map((v) => Number((v / maxCount).toFixed(3))),
      luma: lumaBins.map((v) => Number((v / maxCount).toFixed(3))),
      shadowsClippedPct: Number(((shadowsClipped / totalPixels) * 100).toFixed(1)),
      highlightsClippedPct: Number(
        ((highlightsClipped / totalPixels) * 100).toFixed(1)
      ),
      avgIRE: Math.round((lumaSum / (totalPixels * 255)) * 100),
    }
  }

  /**
   * Releases all WebGL2 resources and HTMLVideoElements.
   */
  public dispose(): void {
    for (const video of this.videoPool.values()) {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
    this.videoPool.clear()

    if (this.gl) {
      if (this.texture) this.gl.deleteTexture(this.texture)
      if (this.positionBuffer) this.gl.deleteBuffer(this.positionBuffer)
      if (this.uvBuffer) this.gl.deleteBuffer(this.uvBuffer)
      if (this.vao) this.gl.deleteVertexArray(this.vao)
      if (this.program) this.gl.deleteProgram(this.program)
    }

    this.texture = null
    this.positionBuffer = null
    this.uvBuffer = null
    this.vao = null
    this.program = null
    this.gl = null
    this.uniformLocations.clear()
  }
}
