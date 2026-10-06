import React, { useEffect, useState } from 'react';
import type { CrupierMood, PersonalityType } from '../../types/casino';

interface CrupierAvatarProps {
  mood?: CrupierMood;
  isSpeaking?: boolean;
  personality?: PersonalityType;
  showSunglasses?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const CrupierAvatar: React.FC<CrupierAvatarProps> = ({
  mood = 'neutral',
  isSpeaking = false,
  personality = 'neutral',
  showSunglasses = false,
  size = 72,
  className = '',
  onClick,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);

  // Natural eye blinking timer
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    let nextBlinkTimeout: ReturnType<typeof setTimeout>;

    const scheduleNextBlink = () => {
      const delay = Math.random() * 3200 + 2500; // 2.5s - 5.7s
      nextBlinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        blinkTimeout = setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 140);
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(nextBlinkTimeout);
    };
  }, []);

  // Mouth animation when speaking
  useEffect(() => {
    if (!isSpeaking) return;

    const interval = setInterval(() => {
      setMouthFrame((prev) => (prev + 1) % 4);
    }, 115);

    return () => {
      clearInterval(interval);
    };
  }, [isSpeaking]);

  // Personality-specific accents
  const getBowtieColor = () => {
    switch (personality) {
      case 'burlona':
        return '#f59e0b'; // Amber / Gold
      case 'desafiante':
        return '#dc2626'; // Crimson red
      case 'amigable':
        return '#10b981'; // Emerald green
      case 'neutral':
      default:
        return '#3b82f6'; // Royal sapphire blue
    }
  };

  const getAuraColor = () => {
    switch (personality) {
      case 'burlona':
        return 'rgba(245, 158, 11, 0.35)';
      case 'desafiante':
        return 'rgba(239, 68, 68, 0.4)';
      case 'amigable':
        return 'rgba(16, 185, 129, 0.35)';
      case 'neutral':
      default:
        return 'rgba(99, 102, 241, 0.35)';
    }
  };

  // Render Eyebrows based on mood
  const renderEyebrows = () => {
    switch (mood) {
      case 'smirk':
        // Left eyebrow high arch, right eyebrow skeptically flat/low
        return (
          <g stroke="#3e2723" strokeWidth="2.8" strokeLinecap="round" fill="none">
            <path d="M 38 41 Q 48 33 58 41" />
            <path d="M 74 46 Q 84 48 94 48" />
          </g>
        );
      case 'laughing':
        // Both eyebrows arched joyfully high
        return (
          <g stroke="#3e2723" strokeWidth="2.8" strokeLinecap="round" fill="none">
            <path d="M 38 39 Q 48 32 58 39" />
            <path d="M 74 39 Q 84 32 94 39" />
          </g>
        );
      case 'challenging':
        // Fierce downward slant towards center
        return (
          <g stroke="#2a1a17" strokeWidth="3.2" strokeLinecap="round" fill="none">
            <path d="M 37 42 L 58 48" />
            <path d="M 74 48 L 95 42" />
          </g>
        );
      case 'impressed':
        // Raised very high
        return (
          <g stroke="#3e2723" strokeWidth="2.8" strokeLinecap="round" fill="none">
            <path d="M 37 38 Q 48 31 58 38" />
            <path d="M 74 38 Q 84 31 94 38" />
          </g>
        );
      case 'thinking':
        // One raised, one furrowed
        return (
          <g stroke="#3e2723" strokeWidth="2.8" strokeLinecap="round" fill="none">
            <path d="M 38 38 Q 48 32 58 38" />
            <path d="M 74 46 Q 84 45 94 44" />
          </g>
        );
      case 'celebrating':
        // High animated curved eyebrows
        return (
          <g stroke="#3e2723" strokeWidth="2.8" strokeLinecap="round" fill="none">
            <path d="M 37 38 Q 48 30 58 37" />
            <path d="M 74 37 Q 84 30 95 38" />
          </g>
        );
      case 'neutral':
      default:
        // Elegant balanced gentleman arch
        return (
          <g stroke="#3e2723" strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M 38 43 Q 48 38 58 42" />
            <path d="M 74 42 Q 84 38 94 43" />
          </g>
        );
    }
  };

  // Render Eyes based on mood & blinking
  const renderEyes = () => {
    // If blinking or laughing with joyful squint
    if (isBlinking) {
      return (
        <g stroke="#2c1a14" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M 40 54 Q 48 57 56 54" />
          <path d="M 76 54 Q 84 57 92 54" />
        </g>
      );
    }

    if (mood === 'laughing') {
      return (
        <g stroke="#2c1a14" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M 40 55 Q 48 49 56 55" />
          <path d="M 76 55 Q 84 49 92 55" />
        </g>
      );
    }

    // Challenging squinted eyes
    const eyeHeight = mood === 'challenging' ? 5.5 : 7.5;
    const pupilShiftX = mood === 'thinking' ? 1.5 : mood === 'smirk' ? 1.2 : 0;
    const pupilShiftY = mood === 'thinking' ? -1 : 0;

    return (
      <g>
        {/* Left Eye */}
        <ellipse cx="48" cy="53" rx="8" ry={eyeHeight} fill="#ffffff" />
        {/* Iris */}
        <circle cx={48 + pupilShiftX} cy={53 + pupilShiftY} r="4.2" fill="#451a03" />
        {/* Pupil */}
        <circle cx={48 + pupilShiftX} cy={53 + pupilShiftY} r="2.2" fill="#0f0704" />
        {/* Highlight sparkle */}
        <circle cx={46.5 + pupilShiftX} cy={51.5 + pupilShiftY} r="1.3" fill="#ffffff" />
        {mood === 'celebrating' && (
          <circle cx={49.5 + pupilShiftX} cy={54 + pupilShiftY} r="0.8" fill="#ffffff" />
        )}
        {/* Upper eyelid contour */}
        <path
          d={`M 39 53 Q 48 ${53 - eyeHeight} 57 53`}
          fill="none"
          stroke="#2c1a14"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Right Eye */}
        <ellipse cx="84" cy="53" rx="8" ry={eyeHeight} fill="#ffffff" />
        {/* Iris */}
        <circle cx={84 + pupilShiftX} cy={53 + pupilShiftY} r="4.2" fill="#451a03" />
        {/* Pupil */}
        <circle cx={84 + pupilShiftX} cy={53 + pupilShiftY} r="2.2" fill="#0f0704" />
        {/* Highlight sparkle */}
        <circle cx={82.5 + pupilShiftX} cy={51.5 + pupilShiftY} r="1.3" fill="#ffffff" />
        {mood === 'celebrating' && (
          <circle cx={85.5 + pupilShiftX} cy={54 + pupilShiftY} r="0.8" fill="#ffffff" />
        )}
        {/* Upper eyelid contour */}
        <path
          d={`M 75 53 Q 84 ${53 - eyeHeight} 93 53`}
          fill="none"
          stroke="#2c1a14"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    );
  };

  // Render Mouth based on speaking animation or mood
  const renderMouth = () => {
    if (isSpeaking) {
      switch (mouthFrame) {
        case 1:
          // Slightly open mouth
          return (
            <path
              d="M 59 74 Q 66 79 73 74 Q 66 76 59 74 Z"
              fill="#831843"
              stroke="#500724"
              strokeWidth="1.4"
            />
          );
        case 2:
          // Open talking vowel
          return (
            <path
              d="M 58 73 Q 66 82 74 73 Q 66 70 58 73 Z"
              fill="#831843"
              stroke="#500724"
              strokeWidth="1.4"
            />
          );
        case 3:
          // Wide talking syllable showing teeth
          return (
            <g>
              <ellipse cx="66" cy="74" rx="8.5" ry="5.5" fill="#831843" stroke="#500724" strokeWidth="1.4" />
              <path d="M 60 72 Q 66 74 72 72" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </g>
          );
        case 0:
        default:
          return (
            <path
              d="M 60 74 Q 66 77 72 74"
              fill="none"
              stroke="#500724"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          );
      }
    }

    // Static mood mouths
    switch (mood) {
      case 'smirk':
        // Cocky asymmetric smirk curling high on right
        return (
          <g>
            <path
              d="M 58 74 Q 66 76 74 70"
              fill="none"
              stroke="#500724"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Dimple accent on right */}
            <path d="M 74 69 Q 76 68 76 71" fill="none" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );
      case 'laughing':
        // Big joyful open laughing mouth
        return (
          <g>
            <path
              d="M 56 72 Q 66 84 76 72 Q 66 71 56 72 Z"
              fill="#9d174d"
              stroke="#500724"
              strokeWidth="1.5"
            />
            {/* Upper teeth row */}
            <path d="M 58 72.5 Q 66 75.5 74 72.5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        );
      case 'challenging':
        // Tight, determined grin / smirk
        return (
          <path
            d="M 59 73 Q 66 73 73 71"
            fill="none"
            stroke="#4a044e"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        );
      case 'impressed':
        // Small astonished 'O' mouth
        return (
          <ellipse
            cx="66"
            cy="74"
            rx="4.5"
            ry="6"
            fill="#831843"
            stroke="#500724"
            strokeWidth="1.5"
          />
        );
      case 'thinking':
        // Pursed lips shifted to the side
        return (
          <path
            d="M 60 74 Q 66 72 71 73"
            fill="none"
            stroke="#500724"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        );
      case 'celebrating':
        // Bright open smile
        return (
          <g>
            <path
              d="M 57 72 Q 66 82 75 72 Z"
              fill="#be185d"
              stroke="#500724"
              strokeWidth="1.5"
            />
            <path d="M 59 73 Q 66 76 73 73" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        );
      case 'neutral':
      default:
        // Elegant subtle closed smile
        return (
          <path
            d="M 59 73 Q 66 76 73 73"
            fill="none"
            stroke="#500724"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        );
    }
  };

  const isDesafianteOrGlasses = showSunglasses || (personality === 'desafiante' && mood === 'challenging');

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`relative inline-block cursor-pointer select-none transition-transform duration-200 active:scale-95 ${className}`}
      style={{ width: size, height: size }}
      title="Crupier Casino Royale"
    >
      {/* Background Aura Glow */}
      <div
        className="absolute inset-0 rounded-full blur-md transition-all duration-500 pointer-events-none"
        style={{
          backgroundColor: getAuraColor(),
          transform: isSpeaking ? 'scale(1.18)' : 'scale(1.0)',
          opacity: isSpeaking ? 0.95 : 0.6,
        }}
      />

      <svg
        viewBox="0 0 132 132"
        width={size}
        height={size}
        className="relative z-10 drop-shadow-xl overflow-visible"
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="faceGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#fcd3b2" />
            <stop offset="70%" stopColor="#f6ad7b" />
            <stop offset="100%" stopColor="#e8935c" />
          </radialGradient>

          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3d231d" />
            <stop offset="40%" stopColor="#251410" />
            <stop offset="100%" stopColor="#140a08" />
          </linearGradient>

          <linearGradient id="tuxedoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e222d" />
            <stop offset="60%" stopColor="#111319" />
            <stop offset="100%" stopColor="#090a0d" />
          </linearGradient>

          <linearGradient id="lapelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2e3444" />
            <stop offset="100%" stopColor="#161821" />
          </linearGradient>

          <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="sunglassesLens" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>

        {/* --- LUXURY CASINO SUIT & SHOULDERS --- */}
        <g id="tuxedo">
          {/* Main Tuxedo body */}
          <path
            d="M 12 130 C 18 96, 38 88, 66 88 C 94 88, 114 96, 120 130 Z"
            fill="url(#tuxedoGrad)"
            stroke="#0a0c10"
            strokeWidth="1.5"
          />

          {/* Crisp White Wingtip Shirt Collar */}
          <polygon points="56,88 66,104 76,88" fill="#f8fafc" />
          <polygon points="46,88 56,98 56,88" fill="#e2e8f0" />
          <polygon points="86,88 76,98 76,88" fill="#e2e8f0" />

          {/* Left Lapel with Gold Piping */}
          <path
            d="M 28 130 L 48 88 L 66 112 L 40 130 Z"
            fill="url(#lapelGrad)"
            stroke="url(#goldTrim)"
            strokeWidth="1.2"
          />

          {/* Right Lapel with Gold Piping */}
          <path
            d="M 104 130 L 84 88 L 66 112 L 92 130 Z"
            fill="url(#lapelGrad)"
            stroke="url(#goldTrim)"
            strokeWidth="1.2"
          />

          {/* Golden Casino Royale Dealer Badge */}
          <rect x="33" y="102" width="14" height="7" rx="1.5" fill="url(#goldTrim)" />
          <circle cx="40" cy="105.5" r="1.8" fill="#451a03" />

          {/* Silk Bowtie with Center Jewel */}
          <g id="bowtie">
            {/* Left Wing */}
            <polygon
              points="66,97 53,92 52,102"
              fill={getBowtieColor()}
              stroke="#000000"
              strokeWidth="0.8"
            />
            {/* Right Wing */}
            <polygon
              points="66,97 79,92 80,102"
              fill={getBowtieColor()}
              stroke="#000000"
              strokeWidth="0.8"
            />
            {/* Center Knot Pin */}
            <rect
              x="63.5"
              y="94.5"
              width="5"
              height="5"
              rx="1.5"
              fill="#fbbf24"
              stroke="#78350f"
              strokeWidth="0.8"
            />
            {/* Shimmer reflection */}
            <circle cx="65" cy="96" r="0.8" fill="#ffffff" />
          </g>
        </g>

        {/* --- NECK & EARS --- */}
        <g id="neck">
          <path d="M 55 74 L 55 90 Q 66 94 77 90 L 77 74 Z" fill="#d97745" />
          {/* Shadow below chin */}
          <path d="M 55 74 Q 66 84 77 74 Q 66 79 55 74 Z" fill="#b95d31" opacity="0.75" />
        </g>

        {/* Ears with Dealer Comms Earpiece */}
        <g id="ears">
          {/* Left Ear */}
          <ellipse cx="32" cy="56" rx="5" ry="8" fill="#f6ad7b" stroke="#d97745" strokeWidth="1" />
          {/* Right Ear + Gold/Silver Dealer Earpiece */}
          <ellipse cx="100" cy="56" rx="5" ry="8" fill="#f6ad7b" stroke="#d97745" strokeWidth="1" />
          <circle cx="101" cy="57" r="2.2" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.8" />
          <path d="M 101 59 Q 99 66 95 72" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="1.5 1.5" />
        </g>

        {/* --- HEAD & FACE --- */}
        <ellipse cx="66" cy="57" rx="34" ry="32" fill="url(#faceGrad)" />

        {/* Cheeks Blush */}
        <circle cx="43" cy="62" r="5" fill="#f43f5e" opacity="0.18" />
        <circle cx="89" cy="62" r="5" fill="#f43f5e" opacity="0.18" />

        {/* Nose */}
        <path
          d="M 66 52 L 64 63 Q 66 65 68 63 Z"
          fill="#d97745"
          opacity="0.8"
        />

        {/* Dynamic Eyebrows */}
        {renderEyebrows()}

        {/* Dynamic Eyes (or Sunglasses) */}
        {!isDesafianteOrGlasses ? (
          renderEyes()
        ) : (
          /* Sleek High-Roller Aviator Sunglasses */
          <g id="sunglasses">
            {/* Bridge */}
            <path d="M 61 51 Q 66 48 71 51" stroke="url(#goldTrim)" strokeWidth="2" fill="none" />
            <line x1="58" y1="48" x2="74" y2="48" stroke="url(#goldTrim)" strokeWidth="1.2" />

            {/* Left Lens */}
            <path
              d="M 38 49 C 38 45, 60 45, 60 49 C 60 61, 41 62, 38 49 Z"
              fill="url(#sunglassesLens)"
              stroke="url(#goldTrim)"
              strokeWidth="1.8"
            />
            {/* Left Lens Glare */}
            <path d="M 42 48 L 52 58" stroke="#ffffff" strokeWidth="1.4" opacity="0.4" strokeLinecap="round" />
            <path d="M 45 47 L 55 57" stroke="#ffffff" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />

            {/* Right Lens */}
            <path
              d="M 72 49 C 72 45, 94 45, 94 49 C 94 61, 75 62, 72 49 Z"
              fill="url(#sunglassesLens)"
              stroke="url(#goldTrim)"
              strokeWidth="1.8"
            />
            {/* Right Lens Glare */}
            <path d="M 76 48 L 86 58" stroke="#ffffff" strokeWidth="1.4" opacity="0.4" strokeLinecap="round" />
            <path d="M 79 47 L 89 57" stroke="#ffffff" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
          </g>
        )}

        {/* Dynamic Mouth */}
        {renderMouth()}

        {/* --- SLEEK STYLED HAIR --- */}
        <g id="hair">
          {/* Hair back volume */}
          <path
            d="M 31 52 C 28 32, 42 16, 66 16 C 90 16, 104 32, 101 52 C 95 44, 91 38, 86 36 C 76 32, 56 32, 46 36 C 41 38, 37 44, 31 52 Z"
            fill="url(#hairGrad)"
          />
          {/* Pompadour sweep with highlights */}
          <path
            d="M 36 40 C 44 22, 60 20, 78 22 C 92 24, 96 32, 95 38 C 88 30, 76 26, 62 26 C 48 26, 40 32, 36 40 Z"
            fill="#57342b"
            opacity="0.9"
          />
          {/* Fine golden-amber comb lines */}
          <path
            d="M 48 27 Q 64 24 82 28"
            stroke="#a16207"
            strokeWidth="1.2"
            fill="none"
            opacity="0.65"
          />
          <path
            d="M 43 33 Q 60 29 76 33"
            stroke="#a16207"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          {/* Sideburns */}
          <polygon points="31,48 35,58 37,56 35,46" fill="#251410" />
          <polygon points="101,48 97,58 95,56 97,46" fill="#251410" />
        </g>
      </svg>
    </div>
  );
};
