import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Flame,
  Snowflake,
  BarChart2,
  X,
} from 'lucide-react';
import type {
  BetType,
  CrupierSpeech,
  RouletteHistoryItem,
  UserProfile,
} from '../../types/casino';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { formatMoney } from '../../utils/storage';
import { CrupierAvatar } from '../crupier/CrupierAvatar';
import { ChipView } from '../common/ChipView';
import {
  ROULETTE_WHEEL_SEQUENCE,
  RED_NUMBERS,
  BLACK_NUMBERS,
  getNumberColor,
  getWheelIndex,
  generateWinningNumber,
  settleRouletteBets,
  calculateHotAndColdNumbers,
  getRouletteCrupierSpeech,
} from '../../utils/rouletteLogic';
import type {
  PlacedBet,
  SpinSettlement,
  HotColdStats,
} from '../../utils/rouletteLogic';

interface RouletteGameProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBackToLobby: () => void;
  onOpenRechargeModal?: () => void;
}

// Initial mock history for realistic stats
const INITIAL_HISTORY: RouletteHistoryItem[] = [
  { number: 26, color: 'black' },
  { number: 17, color: 'black' },
  { number: 32, color: 'red' },
  { number: 0, color: 'green' },
  { number: 7, color: 'red' },
  { number: 11, color: 'black' },
  { number: 36, color: 'red' },
  { number: 19, color: 'red' },
  { number: 4, color: 'black' },
  { number: 21, color: 'red' },
  { number: 15, color: 'black' },
  { number: 22, color: 'black' },
];

export const RouletteGame: React.FC<RouletteGameProps> = ({
  userProfile,
  onUpdateProfile,
  onBackToLobby,
  onOpenRechargeModal,
}) => {
  // Game states
  const [selectedChipValue, setSelectedChipValue] = useState<number>(25);
  const [placedBets, setPlacedBets] = useState<PlacedBet[]>([]);
  const [betHistoryStack, setBetHistoryStack] = useState<PlacedBet[][]>([]);
  const [previousRoundBets, setPreviousRoundBets] = useState<PlacedBet[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinHistory, setSpinHistory] = useState<RouletteHistoryItem[]>(INITIAL_HISTORY);
  const [lastSettlement, setLastSettlement] = useState<SpinSettlement | null>(null);
  const [showResultBanner, setShowResultBanner] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showSpecialBets, setShowSpecialBets] = useState<boolean>(false);
  const [activeSpecialCategory, setActiveSpecialCategory] = useState<'splits' | 'streets' | 'corners' | 'lines'>('splits');

  // Crupier dialogue state
  const [crupierSpeech, setCrupierSpeech] = useState<CrupierSpeech>({
    text: '¡Hagan sus apuestas, señores! La ruleta europea está lista.',
    mood: 'neutral',
  });
  const [isCrupierSpeaking, setIsCrupierSpeaking] = useState<boolean>(false);

  // Canvas ref for wheel
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Wheel animation states
  const wheelAngleRef = useRef<number>(0);
  const ballAngleRef = useRef<number>(0);
  const ballRadiusRef = useRef<number>(140);
  const lastTickAngleRef = useRef<number>(0);

  // Total current bet calculation
  const totalBetAmount = placedBets.reduce((sum, b) => sum + b.amount, 0);

  // Trigger Crupier voice and speech bubble
  const speakCrupier = useCallback(
    (speech: CrupierSpeech) => {
      setCrupierSpeech(speech);
      setIsCrupierSpeaking(true);

      // Attractive voice synthesis
      sound.speakDealer(speech.text, userProfile.crupierPersonality);

      if (speech.mood === 'laughing' || (userProfile.crupierPersonality === 'burlona' && speech.mood === 'smirk')) {
        setTimeout(() => {
          sound.playDealerLaugh(userProfile.crupierPersonality !== 'desafiante');
        }, 350);
      }

      setTimeout(() => {
        setIsCrupierSpeaking(false);
      }, 4500);
    },
    [userProfile.crupierPersonality]
  );

  // -------------------------------------------------------------
  // CANVAS ROULETTE WHEEL RENDERING ENGINE (60 FPS)
  // -------------------------------------------------------------
  const drawWheel = useCallback(
    (
      wheelAngle: number,
      ballAngle: number,
      ballRadius: number,
      winningNumberHighlight?: number
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(cx, cy) - 6;

      ctx.clearRect(0, 0, width, height);

      // 1. Outer Mahogany / Wood Bezel Rim
      const woodGrad = ctx.createRadialGradient(cx, cy, maxR * 0.78, cx, cy, maxR);
      woodGrad.addColorStop(0, '#2d1408');
      woodGrad.addColorStop(0.5, '#451c0d');
      woodGrad.addColorStop(0.85, '#200e05');
      woodGrad.addColorStop(1, '#0f0502');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fillStyle = woodGrad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fill();
      ctx.restore();

      // Outer Gold / Brass Trim Ring
      ctx.beginPath();
      ctx.arc(cx, cy, maxR - 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 2. Ball Track Ring (Dark Gunmetal Stator)
      const statorR = maxR * 0.88;
      const statorInnerR = maxR * 0.75;
      const trackGrad = ctx.createRadialGradient(cx, cy, statorInnerR, cx, cy, statorR);
      trackGrad.addColorStop(0, '#1c1917');
      trackGrad.addColorStop(0.7, '#292524');
      trackGrad.addColorStop(1, '#0c0a09');

      ctx.beginPath();
      ctx.arc(cx, cy, statorR, 0, Math.PI * 2);
      ctx.fillStyle = trackGrad;
      ctx.fill();

      // 8 Brass Ball Deflectors (Diamonds / Canoes) around the outer track
      for (let i = 0; i < 8; i++) {
        const deflAngle = (i * Math.PI) / 4;
        const deflR = (statorR + statorInnerR) / 2;
        const dx = cx + Math.cos(deflAngle) * deflR;
        const dy = cy + Math.sin(deflAngle) * deflR;

        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(deflAngle);
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(0, -3.5);
        ctx.lineTo(5, 0);
        ctx.lineTo(0, 3.5);
        ctx.closePath();
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 3;
        ctx.fill();
        ctx.restore();
      }

      // 3. Rotating Rotor (Number Pockets Ring)
      const pocketOuterR = statorInnerR;
      const pocketInnerR = maxR * 0.52;
      const sliceAngle = (Math.PI * 2) / 37;

      ctx.save();
      // Translate to center and rotate wheel
      ctx.translate(cx, cy);
      ctx.rotate(wheelAngle);

      for (let i = 0; i < 37; i++) {
        const num = ROULETTE_WHEEL_SEQUENCE[i];
        const color = getNumberColor(num);
        const startA = i * sliceAngle - Math.PI / 2;
        const endA = startA + sliceAngle;
        const midA = startA + sliceAngle / 2;

        // Pocket Background
        ctx.beginPath();
        ctx.arc(0, 0, pocketOuterR, startA, endA);
        ctx.arc(0, 0, pocketInnerR, endA, startA, true);
        ctx.closePath();

        if (winningNumberHighlight === num) {
          ctx.fillStyle = '#fbbf24'; // Golden glow for winner
        } else if (color === 'green') {
          ctx.fillStyle = '#059669'; // Emerald 0
        } else if (color === 'red') {
          ctx.fillStyle = '#dc2626'; // Vibrant Red
        } else {
          ctx.fillStyle = '#171717'; // Deep Obsidian Black
        }
        ctx.fill();

        // Metallic Pocket Divider (Fret)
        ctx.beginPath();
        ctx.moveTo(Math.cos(startA) * pocketInnerR, Math.sin(startA) * pocketInnerR);
        ctx.lineTo(Math.cos(startA) * pocketOuterR, Math.sin(startA) * pocketOuterR);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Pocket Number Text (Facing towards center)
        ctx.save();
        const textR = (pocketOuterR + pocketInnerR) / 2;
        ctx.rotate(midA + Math.PI / 2);
        ctx.translate(0, -textR);

        ctx.fillStyle = winningNumberHighlight === num ? '#000000' : '#ffffff';
        ctx.font = `bold ${Math.max(9, Math.round(maxR * 0.058))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num.toString(), 0, 0);
        ctx.restore();
      }

      // Inner Pocket Separator Ring
      ctx.beginPath();
      ctx.arc(0, 0, pocketInnerR, 0, Math.PI * 2);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Central Cone / Brass Bowl
      const coneR = pocketInnerR;
      const coneGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coneR);
      coneGrad.addColorStop(0, '#fef08a');
      coneGrad.addColorStop(0.3, '#d97706');
      coneGrad.addColorStop(0.7, '#78350f');
      coneGrad.addColorStop(1, '#451a03');

      ctx.beginPath();
      ctx.arc(0, 0, coneR, 0, Math.PI * 2);
      ctx.fillStyle = coneGrad;
      ctx.fill();

      // 5. Classic 4-Prong Brass Turret / Spinner Cross
      const turretHandleR = coneR * 0.72;
      for (let arm = 0; arm < 4; arm++) {
        const armAngle = (arm * Math.PI) / 2;
        ctx.save();
        ctx.rotate(armAngle);
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-1.5, turretHandleR);
        ctx.lineTo(1.5, turretHandleR);
        ctx.lineTo(3, 0);
        ctx.closePath();
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fill();

        // Tip Knob
        ctx.beginPath();
        ctx.arc(0, turretHandleR, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#d97706';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, turretHandleR, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      // Central Spindle Top Dome
      const centerDomeR = coneR * 0.32;
      const domeGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, centerDomeR);
      domeGrad.addColorStop(0, '#ffffff');
      domeGrad.addColorStop(0.2, '#fde047');
      domeGrad.addColorStop(0.6, '#b45309');
      domeGrad.addColorStop(1, '#451a03');

      ctx.beginPath();
      ctx.arc(0, 0, centerDomeR, 0, Math.PI * 2);
      ctx.fillStyle = domeGrad;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.fill();

      ctx.restore(); // Restore wheel rotation transform

      // 6. The Ivory / Ceramic Ball (Rendered in World Coordinates)
      if (ballRadius > 10) {
        const bx = cx + Math.cos(ballAngle) * ballRadius;
        const by = cy + Math.sin(ballAngle) * ballRadius;
        const ballSize = Math.max(4.5, maxR * 0.038);

        // Soft Ball Cast Shadow
        ctx.beginPath();
        ctx.arc(bx + 2.5, by + 3.5, ballSize * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.filter = 'blur(1.5px)';
        ctx.fill();
        ctx.filter = 'none';

        // Ball Body with 3D Specular Highlight
        const bGrad = ctx.createRadialGradient(
          bx - ballSize * 0.35,
          by - ballSize * 0.35,
          ballSize * 0.1,
          bx,
          by,
          ballSize
        );
        bGrad.addColorStop(0, '#ffffff');
        bGrad.addColorStop(0.25, '#f8fafc');
        bGrad.addColorStop(0.7, '#cbd5e1');
        bGrad.addColorStop(1, '#64748b');

        ctx.beginPath();
        ctx.arc(bx, by, ballSize, 0, Math.PI * 2);
        ctx.fillStyle = bGrad;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 4;
        ctx.fill();

        // Pinpoint Glistening Highlight
        ctx.beginPath();
        ctx.arc(bx - ballSize * 0.32, by - ballSize * 0.32, ballSize * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    },
    []
  );

  // Redraw initial wheel when mounted
  useEffect(() => {
    drawWheel(0, 0, 105);
  }, [drawWheel]);

  // -------------------------------------------------------------
  // SPIN WHEEL ANIMATION & PHYSICS
  // -------------------------------------------------------------
  const handleSpin = () => {
    if (isSpinning) return;
    if (placedBets.length === 0) {
      sound.playChip();
      triggerHaptic('warning');
      speakCrupier({
        text: '¡Coloca al menos una ficha en el tapiz antes de hacer girar la rueda!',
        mood: 'thinking',
      });
      return;
    }

    // Check bankroll
    if (userProfile.bankroll < totalBetAmount) {
      triggerHaptic('warning');
      if (onOpenRechargeModal) onOpenRechargeModal();
      return;
    }

    // Deduct bet from bankroll immediately
    const updatedBankroll = userProfile.bankroll - totalBetAmount;
    onUpdateProfile({ bankroll: updatedBankroll });

    // Save previous bets for Repeat Bet button
    setPreviousRoundBets(placedBets);

    // Save state
    setIsSpinning(true);
    setShowResultBanner(false);
    setLastSettlement(null);

    // Generate outcome
    const winningNum = generateWinningNumber();
    const winningPocketIndex = getWheelIndex(winningNum);

    // Crupier call: "Rien ne va plus! / ¡No va más!"
    speakCrupier({
      text: '¡No va más! (Rien ne va plus). La bola está en juego...',
      mood: 'neutral',
    });
    triggerHaptic('medium');

    // Canvas size setup
    const canvas = canvasRef.current;
    const maxR = canvas ? Math.min(canvas.width, canvas.height) / 2 - 6 : 140;
    const outerTrackR = maxR * 0.82;
    const pocketTrackR = maxR * 0.63;

    // Animation Timing
    const startTime = performance.now();
    const duration = 5200; // 5.2 seconds

    // Mathematical targets:
    // Wheel rotates clockwise by 3 full turns + landing offset
    const wheelRotations = 3;
    const finalWheelAngle = wheelRotations * Math.PI * 2 + Math.random() * 0.5;

    // Center angle of winning pocket relative to wheel coordinate system:
    // Pocket i in sequence has midpoint: (i * sliceAngle) - PI/2 + sliceAngle/2
    const sliceAngle = (Math.PI * 2) / 37;
    const pocketRelAngle = winningPocketIndex * sliceAngle - Math.PI / 2 + sliceAngle / 2;

    // Ball orbits counter-clockwise by 6 full revolutions, and ends at exact world angle:
    // worldAngle = finalWheelAngle + pocketRelAngle
    const ballRevolutions = 6;
    const finalBallAngle = finalWheelAngle + pocketRelAngle;
    const startBallAngle = finalBallAngle + ballRevolutions * Math.PI * 2;

    lastTickAngleRef.current = startBallAngle;

    const animateFrame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Smooth Quintic Ease-Out for deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4.2);

      // Current wheel rotation
      const currentWheelAngle = finalWheelAngle * easeOut;
      wheelAngleRef.current = currentWheelAngle;

      // Current ball angle (decelerating counter-clockwise)
      const currentBallAngle = startBallAngle - (startBallAngle - finalBallAngle) * easeOut;
      ballAngleRef.current = currentBallAngle;

      // Audio Ticking calculation:
      // When the ball angle passes a fret threshold relative to wheel, fire tick!
      const relativeAngle = (currentBallAngle - currentWheelAngle) / sliceAngle;
      if (Math.abs(relativeAngle - lastTickAngleRef.current) >= 0.85) {
        lastTickAngleRef.current = relativeAngle;
        const speed = Math.max(0.6, 1.8 * (1 - progress));
        sound.playRouletteTick(speed);
        if (progress > 0.65) {
          triggerHaptic('light');
        }
      }

      // Ball Radius Physics:
      // Phase 1 (0 to 65%): Smoothly rides on outer track
      // Phase 2 (65% to 88%): Drops down the cone with damping fret bounces
      // Phase 3 (88% to 100%): Settles solidly into the target pocket
      let currentBallR = outerTrackR;
      if (progress < 0.65) {
        // High-speed outer rim with subtle centrifugal wobble
        currentBallR = outerTrackR + Math.sin(elapsed * 0.03) * 0.8;
      } else if (progress < 0.88) {
        // Spiral inward with bounce decay
        const dropT = (progress - 0.65) / 0.23;
        const bounce = Math.sin(dropT * Math.PI * 5) * (1 - dropT) * 7;
        currentBallR = outerTrackR - (outerTrackR - pocketTrackR) * dropT + bounce;
      } else {
        // Final pocket settling with minuscule residual vibration
        const settleT = (progress - 0.88) / 0.12;
        const microBounce = Math.sin(settleT * Math.PI * 3) * (1 - settleT) * 1.5;
        currentBallR = pocketTrackR + microBounce;
      }
      ballRadiusRef.current = currentBallR;

      // Draw the frame
      drawWheel(currentWheelAngle, currentBallAngle, currentBallR);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateFrame);
      } else {
        // Spin finished! Lock precisely into winning pocket
        drawWheel(finalWheelAngle, finalBallAngle, pocketTrackR, winningNum);
        handleSpinEnd(winningNum);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFrame);
  };

  // Cleanup anim frame
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------
  // SPIN COMPLETE & SETTLEMENT LOGIC
  // -------------------------------------------------------------
  const handleSpinEnd = (winningNum: number) => {
    setIsSpinning(false);
    const winColor = getNumberColor(winningNum);

    // Update spin history
    const newHistoryItem: RouletteHistoryItem = { number: winningNum, color: winColor };
    const updatedHistory = [newHistoryItem, ...spinHistory].slice(0, 40);
    setSpinHistory(updatedHistory);

    // Settle bets
    const settlement = settleRouletteBets(placedBets, winningNum);
    setLastSettlement(settlement);
    setShowResultBanner(true);

    // Crupier speech reaction
    const speech = getRouletteCrupierSpeech(userProfile.crupierPersonality, settlement);
    speakCrupier(speech);

    // Bankroll & Stats update
    const finalBankroll = userProfile.bankroll + settlement.totalPayout;
    const currentRouletteStats = userProfile.stats.roulette;
    const updatedStats = {
      ...userProfile.stats,
      roulette: {
        gamesPlayed: currentRouletteStats.gamesPlayed + 1,
        gamesWon: currentRouletteStats.gamesWon + (settlement.isWin ? 1 : 0),
        totalProfit: currentRouletteStats.totalProfit + settlement.netProfit,
        bestWin: Math.max(currentRouletteStats.bestWin, settlement.netProfit),
      },
    };

    onUpdateProfile({
      bankroll: finalBankroll,
      weeklyScore: userProfile.weeklyScore + Math.max(0, settlement.netProfit),
      stats: updatedStats,
    });

    // Audio & Haptic celebration
    if (settlement.isWin) {
      sound.playWin();
      sound.playCashRegister();
      triggerHaptic('success');
      if (settlement.isBigWin) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      sound.playLose();
      sound.playDealerLaugh(userProfile.crupierPersonality !== 'desafiante');
      triggerHaptic('heavy');
    }

    // Clear placed bets after round
    setPlacedBets([]);
    setBetHistoryStack([]);
  };

  // -------------------------------------------------------------
  // BETTING CONTROLS
  // -------------------------------------------------------------
  const placeBet = (type: BetType, numbers: number[], positionKey: string) => {
    if (isSpinning) return;

    if (userProfile.bankroll < totalBetAmount + selectedChipValue) {
      sound.playChip();
      triggerHaptic('warning');
      if (onOpenRechargeModal) onOpenRechargeModal();
      return;
    }

    sound.playChip();
    triggerHaptic('light');

    setPlacedBets((prev) => {
      // Save for Undo
      setBetHistoryStack((stack) => [...stack, prev]);

      const existingIndex = prev.findIndex((b) => b.positionKey === positionKey);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          amount: existing.amount + selectedChipValue,
          chipStack: [...existing.chipStack, selectedChipValue],
        };
        return updated;
      } else {
        const newBet: PlacedBet = {
          id: `bet_${Date.now()}_${Math.random()}`,
          type,
          numbers,
          amount: selectedChipValue,
          chipStack: [selectedChipValue],
          positionKey,
        };
        return [...prev, newBet];
      }
    });
  };

  // Undo last bet
  const handleUndoBet = () => {
    if (isSpinning || betHistoryStack.length === 0) return;
    sound.playChip();
    triggerHaptic('light');
    const previousState = betHistoryStack[betHistoryStack.length - 1];
    setPlacedBets(previousState);
    setBetHistoryStack((stack) => stack.slice(0, stack.length - 1));
  };

  // Clear all bets
  const handleClearBets = () => {
    if (isSpinning || placedBets.length === 0) return;
    sound.playChip();
    triggerHaptic('medium');
    setBetHistoryStack((stack) => [...stack, placedBets]);
    setPlacedBets([]);
  };

  // Double all bets
  const handleDoubleBets = () => {
    if (isSpinning || placedBets.length === 0) return;
    const additionalCost = totalBetAmount;
    if (userProfile.bankroll < totalBetAmount + additionalCost) {
      triggerHaptic('warning');
      return;
    }

    sound.playChip();
    triggerHaptic('medium');
    setBetHistoryStack((stack) => [...stack, placedBets]);
    setPlacedBets((prev) =>
      prev.map((b) => ({
        ...b,
        amount: b.amount * 2,
        chipStack: [...b.chipStack, ...b.chipStack],
      }))
    );
  };

  // Repeat previous round bets
  const handleRepeatBets = () => {
    if (isSpinning || previousRoundBets.length === 0) return;
    const needed = previousRoundBets.reduce((sum, b) => sum + b.amount, 0);
    if (userProfile.bankroll < needed) {
      triggerHaptic('warning');
      return;
    }

    sound.playChip();
    triggerHaptic('medium');
    setBetHistoryStack((stack) => [...stack, placedBets]);
    setPlacedBets(previousRoundBets);
  };

  // Quick helper to check if a spot has bets
  const getBetOnPosition = (posKey: string): PlacedBet | undefined => {
    return placedBets.find((b) => b.positionKey === posKey);
  };

  // Hot and cold stats
  const hotColdStats: HotColdStats = calculateHotAndColdNumbers(spinHistory);

  return (
    <div
      className={`relative w-full max-w-full h-full flex flex-col justify-between overflow-hidden overflow-x-hidden table-felt-${userProfile.tableTheme} safe-top safe-bottom text-white select-none`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER APP BAR */}
      {/* ------------------------------------------------------------- */}
      <header className="px-3 py-2 flex items-center justify-between z-20 border-b border-white/10 bg-black/40 backdrop-blur-md">
        {/* Back Button */}
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onBackToLobby();
          }}
          disabled={isSpinning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold text-white cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lobby</span>
        </button>

        {/* Bankroll & Current Bet Balance Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-amber-500/30">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">Banca:</span>
            <span className="text-xs font-mono font-black text-amber-400">
              {formatMoney(userProfile.bankroll)}
            </span>
          </div>

          {totalBetAmount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-xs font-black text-amber-300 animate-pulse">
              <span>Apuesta:</span>
              <span className="font-mono">${totalBetAmount}</span>
            </div>
          )}
        </div>

        {/* Stats & Audio Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sound.playChip();
              triggerHaptic('light');
              setShowStatsModal(true);
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-amber-400 cursor-pointer"
            title="Estadísticas Calientes & Fríos"
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const next = !userProfile.soundEnabled;
              sound.setEnabled(next);
              if (next) sound.playChip();
              triggerHaptic('light');
              onUpdateProfile({ soundEnabled: next });
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 cursor-pointer"
          >
            {userProfile.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            )}
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. HISTORY BAR & CRUPIER SPEECH BAR */}
      {/* ------------------------------------------------------------- */}
      <section className="px-3 py-1.5 flex items-center justify-between gap-2 bg-black/30 border-b border-white/5 z-10">
        {/* Crupier Avatar & Live Dialogue Bubble */}
        <div className="flex items-center gap-2 max-w-[62%] sm:max-w-[70%]">
          <CrupierAvatar
            mood={crupierSpeech.mood}
            isSpeaking={isCrupierSpeaking}
            personality={userProfile.crupierPersonality}
            size={38}
          />
          <div className="px-2.5 py-1 rounded-xl bg-neutral-900/90 border border-white/15 text-[11px] font-medium leading-tight text-neutral-200 line-clamp-2 shadow-sm">
            {crupierSpeech.text}
          </div>
        </div>

        {/* Recent Winning Numbers Strip */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {spinHistory.slice(0, 7).map((item, idx) => (
            <div
              key={idx}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow ${
                item.color === 'red'
                  ? 'bg-red-600 text-white border border-red-400'
                  : item.color === 'green'
                  ? 'bg-emerald-600 text-white border border-emerald-400'
                  : 'bg-neutral-900 text-white border border-neutral-700'
              }`}
            >
              {item.number}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. CENTER: 60FPS CANVAS ROULETTE WHEEL + RESULT OVERLAY */}
      {/* ------------------------------------------------------------- */}
      <main className="relative flex-1 flex flex-col items-center justify-center min-h-[190px] max-h-[300px] sm:max-h-[340px] px-2 py-1">
        {/* Canvas Wheel */}
        <div className="relative w-[210px] h-[210px] sm:w-[260px] sm:h-[260px] flex items-center justify-center drop-shadow-2xl">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="w-full h-full transform transition-transform"
          />

          {/* Winning Spotlight Pointer at top */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-amber-400 drop-shadow" />
          </div>
        </div>

        {/* Result Banner Overlay on Ball Landed */}
        {showResultBanner && lastSettlement && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="p-4 rounded-2xl bg-neutral-950/95 border-2 border-amber-400 shadow-2xl flex flex-col items-center max-w-xs text-center animate-scaleUp">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                Resultado de la Rueda
              </span>

              {/* Number Badge */}
              <div
                className={`w-16 h-16 my-2 rounded-full flex items-center justify-center text-3xl font-black shadow-xl border-2 ${
                  lastSettlement.color === 'red'
                    ? 'bg-red-600 text-white border-red-300'
                    : lastSettlement.color === 'green'
                    ? 'bg-emerald-600 text-white border-emerald-300'
                    : 'bg-neutral-900 text-white border-neutral-600'
                }`}
              >
                {lastSettlement.winningNumber}
              </div>

              <span className="text-xs font-bold text-neutral-300 uppercase">
                {lastSettlement.winningNumber === 0
                  ? 'Cero Verde'
                  : lastSettlement.color === 'red'
                  ? 'Rojo'
                  : 'Negro'}{' '}
                {lastSettlement.winningNumber > 0 &&
                  (lastSettlement.winningNumber % 2 === 0 ? '• Par' : '• Impar')}
              </span>

              {/* Payout Announcement */}
              <div className="mt-2.5">
                {lastSettlement.isWin ? (
                  <div className="text-emerald-400 font-extrabold text-sm flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4 fill-current" />
                    ¡Ganaste ${lastSettlement.totalPayout.toLocaleString('es-MX')} MXN!
                  </div>
                ) : (
                  <div className="text-neutral-400 text-xs font-semibold">
                    {lastSettlement.isNearMiss
                      ? '¡Rozó tu número por un pelito de rana!'
                      : 'Suerte en el siguiente tiro'}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowResultBanner(false)}
                className="mt-3 px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shadow active:scale-95 transition-all cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 4. TOUCH-OPTIMIZED iOS BETTING CLOTH (TAPIZ DE RULETA) */}
      {/* ------------------------------------------------------------- */}
      <section className="px-2 pb-1 z-10 flex flex-col items-center w-full max-w-lg mx-auto">
        {/* Special Bets Selector Toggle */}
        <div className="w-full flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Tapiz:</span>
            <button
              onClick={() => {
                sound.playChip();
                setShowSpecialBets(false);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                !showSpecialBets
                  ? 'bg-amber-400 text-neutral-950 shadow'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/20'
              }`}
            >
              Plenos & Suertes
            </button>
            <button
              onClick={() => {
                sound.playChip();
                setShowSpecialBets(true);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                showSpecialBets
                  ? 'bg-amber-400 text-neutral-950 shadow'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/20'
              }`}
            >
              Combinadas (17:1 / 11:1 / 8:1)
            </button>
          </div>

          <span className="text-[9px] font-mono text-amber-300/80">Pleno 35 a 1</span>
        </div>

        {!showSpecialBets ? (
          /* STANDARD EUROPEAN CLOTH */
          <div className="w-full bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md">
            {/* Zero (0) - Spans across the 3 columns */}
            <div className="mb-1">
              {(() => {
                const bet = getBetOnPosition('straight_0');
                return (
                  <button
                    type="button"
                    onClick={() => placeBet('straight', [0], 'straight_0')}
                    className="relative w-full h-7 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:scale-95 border border-emerald-400/80 flex items-center justify-center font-black text-sm text-white shadow transition-all cursor-pointer"
                  >
                    <span>0</span>
                    {bet && (
                      <span className="absolute right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-black shadow">
                        ${bet.amount}
                      </span>
                    )}
                  </button>
                );
              })()}
            </div>

            {/* 12 Rows x 3 Columns Number Grid */}
            <div className="grid grid-cols-3 gap-1 mb-1.5">
              {Array.from({ length: 12 }).map((_, rowIdx) => {
                const n1 = rowIdx * 3 + 1;
                const n2 = rowIdx * 3 + 2;
                const n3 = rowIdx * 3 + 3;

                return [n1, n2, n3].map((num) => {
                  const color = getNumberColor(num);
                  const posKey = `straight_${num}`;
                  const bet = getBetOnPosition(posKey);

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => placeBet('straight', [num], posKey)}
                      className={`relative h-6 sm:h-7 rounded-md flex items-center justify-center text-xs font-black shadow border transition-all active:scale-90 cursor-pointer ${
                        color === 'red'
                          ? 'bg-red-700 hover:bg-red-600 text-white border-red-500/60'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-700'
                      }`}
                    >
                      <span>{num}</span>
                      {bet && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="px-1 py-0.2 rounded-full bg-amber-400 text-neutral-950 text-[9px] font-black shadow ring-1 ring-amber-300">
                            ${bet.amount}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                });
              })}
            </div>

            {/* Columns (2 to 1) */}
            <div className="grid grid-cols-3 gap-1 mb-1.5">
              {[
                { type: 'col1' as BetType, label: '2 a 1 (Col 1)', pos: 'col1', nums: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34] },
                { type: 'col2' as BetType, label: '2 a 1 (Col 2)', pos: 'col2', nums: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35] },
                { type: 'col3' as BetType, label: '2 a 1 (Col 3)', pos: 'col3', nums: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36] },
              ].map((col) => {
                const bet = getBetOnPosition(col.pos);
                return (
                  <button
                    key={col.pos}
                    type="button"
                    onClick={() => placeBet(col.type, col.nums, col.pos)}
                    className="relative h-6 rounded-md bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-400/50 flex items-center justify-center text-[10px] font-bold text-amber-300 shadow active:scale-95 cursor-pointer"
                  >
                    <span>{col.label}</span>
                    {bet && (
                      <span className="absolute right-1 px-1 rounded-full bg-amber-400 text-neutral-950 text-[8px] font-black">
                        ${bet.amount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dozens (1st 12, 2nd 12, 3rd 12) */}
            <div className="grid grid-cols-3 gap-1 mb-1.5">
              {[
                { type: 'dozen1' as BetType, label: '1ª Docena (1-12)', pos: 'dozen1', nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
                { type: 'dozen2' as BetType, label: '2ª Docena (13-24)', pos: 'dozen2', nums: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] },
                { type: 'dozen3' as BetType, label: '3ª Docena (25-36)', pos: 'dozen3', nums: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36] },
              ].map((dz) => {
                const bet = getBetOnPosition(dz.pos);
                return (
                  <button
                    key={dz.pos}
                    type="button"
                    onClick={() => placeBet(dz.type, dz.nums, dz.pos)}
                    className="relative h-6 rounded-md bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-400/50 flex items-center justify-center text-[9px] font-bold text-white shadow active:scale-95 cursor-pointer"
                  >
                    <span>{dz.label}</span>
                    {bet && (
                      <span className="absolute right-1 px-1 rounded-full bg-amber-400 text-neutral-950 text-[8px] font-black">
                        ${bet.amount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Even Money Bets (1-18, PAR, ROJO, NEGRO, IMPAR, 19-36) */}
            <div className="grid grid-cols-6 gap-1">
              {[
                { type: 'low' as BetType, label: '1-18', pos: 'low', nums: Array.from({ length: 18 }, (_, i) => i + 1), bg: 'bg-emerald-900/80' },
                { type: 'even' as BetType, label: 'PAR', pos: 'even', nums: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36], bg: 'bg-emerald-900/80' },
                { type: 'red' as BetType, label: 'ROJO', pos: 'red', nums: [...RED_NUMBERS], bg: 'bg-red-700 border-red-500' },
                { type: 'black' as BetType, label: 'NEGRO', pos: 'black', nums: [...BLACK_NUMBERS], bg: 'bg-neutral-900 border-neutral-700' },
                { type: 'odd' as BetType, label: 'IMPAR', pos: 'odd', nums: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35], bg: 'bg-emerald-900/80' },
                { type: 'high' as BetType, label: '19-36', pos: 'high', nums: Array.from({ length: 18 }, (_, i) => i + 19), bg: 'bg-emerald-900/80' },
              ].map((ev) => {
                const bet = getBetOnPosition(ev.pos);
                return (
                  <button
                    key={ev.pos}
                    type="button"
                    onClick={() => placeBet(ev.type, ev.nums, ev.pos)}
                    className={`relative h-6 sm:h-7 rounded-md ${ev.bg} hover:brightness-110 border border-white/20 flex items-center justify-center text-[10px] font-extrabold text-white shadow active:scale-95 cursor-pointer`}
                  >
                    <span>{ev.label}</span>
                    {bet && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="px-1 py-0.2 rounded-full bg-amber-400 text-neutral-950 text-[8px] font-black ring-1 ring-black">
                          ${bet.amount}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* SPECIAL COMBINATION BETS (SPLITS 17:1, STREETS 11:1, CORNERS 8:1, LINES 5:1) */
          <div className="w-full bg-neutral-950/80 border border-amber-500/40 rounded-2xl p-2 shadow-2xl backdrop-blur-md">
            {/* Category tabs */}
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10 text-xs">
              <button
                onClick={() => setActiveSpecialCategory('splits')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  activeSpecialCategory === 'splits'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Caballos (17:1)
              </button>
              <button
                onClick={() => setActiveSpecialCategory('streets')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  activeSpecialCategory === 'streets'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Calles (11:1)
              </button>
              <button
                onClick={() => setActiveSpecialCategory('corners')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  activeSpecialCategory === 'corners'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Cuadros (8:1)
              </button>
              <button
                onClick={() => setActiveSpecialCategory('lines')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  activeSpecialCategory === 'lines'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Seisenas (5:1)
              </button>
            </div>

            {/* Category Content List */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {activeSpecialCategory === 'splits' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    [1, 2], [2, 3], [4, 5], [5, 6], [7, 8], [8, 9],
                    [10, 11], [11, 12], [13, 14], [14, 15], [16, 17], [17, 18],
                    [19, 20], [20, 21], [22, 23], [23, 24], [25, 26], [26, 27],
                    [28, 29], [29, 30], [31, 32], [32, 33], [34, 35], [35, 36],
                  ].map(([a, b]) => {
                    const posKey = `split_${a}_${b}`;
                    const bet = getBetOnPosition(posKey);
                    return (
                      <button
                        key={posKey}
                        type="button"
                        onClick={() => placeBet('split', [a, b], posKey)}
                        className="relative p-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-400 flex items-center justify-between text-xs font-bold active:scale-95 transition-all"
                      >
                        <span className="text-amber-300">{a} / {b}</span>
                        {bet ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-black text-[10px]">
                            ${bet.amount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500">17:1</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeSpecialCategory === 'streets' && (
                <div className="grid grid-cols-2 gap-1.5">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const n1 = idx * 3 + 1;
                    const n2 = idx * 3 + 2;
                    const n3 = idx * 3 + 3;
                    const posKey = `street_${n1}_${n2}_${n3}`;
                    const bet = getBetOnPosition(posKey);
                    return (
                      <button
                        key={posKey}
                        type="button"
                        onClick={() => placeBet('street', [n1, n2, n3], posKey)}
                        className="relative p-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-400 flex items-center justify-between text-xs font-bold active:scale-95 transition-all"
                      >
                        <span className="text-amber-300">Calle {n1}-{n2}-{n3}</span>
                        {bet ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-black text-[10px]">
                            ${bet.amount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500">11:1</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeSpecialCategory === 'corners' && (
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    [1, 2, 4, 5], [2, 3, 5, 6], [4, 5, 7, 8], [5, 6, 8, 9],
                    [7, 8, 10, 11], [8, 9, 11, 12], [10, 11, 13, 14], [11, 12, 14, 15],
                    [13, 14, 16, 17], [14, 15, 17, 18], [16, 17, 19, 20], [17, 18, 20, 21],
                    [19, 20, 22, 23], [20, 21, 23, 24], [22, 23, 25, 26], [23, 24, 26, 27],
                    [25, 26, 28, 29], [26, 27, 29, 30], [28, 29, 31, 32], [29, 30, 32, 33],
                    [31, 32, 34, 35], [32, 33, 35, 36],
                  ].map((corner) => {
                    const posKey = `corner_${corner.join('_')}`;
                    const bet = getBetOnPosition(posKey);
                    return (
                      <button
                        key={posKey}
                        type="button"
                        onClick={() => placeBet('corner', corner, posKey)}
                        className="relative p-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-400 flex items-center justify-between text-xs font-bold active:scale-95 transition-all"
                      >
                        <span className="text-amber-300">Cuadro {corner[0]}-{corner[3]}</span>
                        {bet ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-black text-[10px]">
                            ${bet.amount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500">8:1</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeSpecialCategory === 'lines' && (
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    [1, 2, 3, 4, 5, 6],
                    [4, 5, 6, 7, 8, 9],
                    [7, 8, 9, 10, 11, 12],
                    [10, 11, 12, 13, 14, 15],
                    [13, 14, 15, 16, 17, 18],
                    [16, 17, 18, 19, 20, 21],
                    [19, 20, 21, 22, 23, 24],
                    [22, 23, 24, 25, 26, 27],
                    [25, 26, 27, 28, 29, 30],
                    [28, 29, 30, 31, 32, 33],
                    [31, 32, 33, 34, 35, 36],
                  ].map((lineNums) => {
                    const posKey = `line_${lineNums[0]}_${lineNums[5]}`;
                    const bet = getBetOnPosition(posKey);
                    return (
                      <button
                        key={posKey}
                        type="button"
                        onClick={() => placeBet('line', lineNums, posKey)}
                        className="relative p-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-400 flex items-center justify-between text-xs font-bold active:scale-95 transition-all"
                      >
                        <span className="text-amber-300">Seisena {lineNums[0]}-{lineNums[5]}</span>
                        {bet ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-black text-[10px]">
                            ${bet.amount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500">5:1</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. BOTTOM BAR: CHIP SELECTOR & ACTION BUTTONS */}
      {/* ------------------------------------------------------------- */}
      <footer className="px-3 py-2 bg-neutral-950/90 border-t border-white/10 z-20 flex flex-col gap-2">
        {/* Chip Selector Row */}
        <div className="flex items-center justify-center gap-3">
          {[10, 25, 50, 100, 500].map((val) => (
            <ChipView
              key={val}
              value={val}
              size="sm"
              isSelected={selectedChipValue === val}
              onClick={() => setSelectedChipValue(val)}
            />
          ))}
        </div>

        {/* Action Controls (Clear, Undo, Double, Spin) */}
        <div className="flex items-center justify-between gap-2">
          {/* Clear & Undo Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearBets}
              disabled={isSpinning || placedBets.length === 0}
              className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 disabled:opacity-40 text-neutral-300 text-xs font-bold transition-all cursor-pointer"
            >
              Borrar
            </button>
            <button
              onClick={handleUndoBet}
              disabled={isSpinning || betHistoryStack.length === 0}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 disabled:opacity-40 text-neutral-300 transition-all cursor-pointer"
              title="Deshacer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {previousRoundBets.length > 0 && placedBets.length === 0 && (
              <button
                onClick={handleRepeatBets}
                disabled={isSpinning}
                className="px-2.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                Repetir
              </button>
            )}
            {placedBets.length > 0 && (
              <button
                onClick={handleDoubleBets}
                disabled={isSpinning || userProfile.bankroll < totalBetAmount * 2}
                className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 disabled:opacity-40 text-amber-400 text-xs font-bold transition-all cursor-pointer"
              >
                x2 Doble
              </button>
            )}
          </div>

          {/* Main Action: Spin (Girar) */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`flex-1 py-2.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-95 ${
              isSpinning
                ? 'bg-neutral-800 text-neutral-500'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-neutral-950 hover:brightness-110 shadow-amber-500/30'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Girando...' : 'Girar Ruleta'}</span>
          </button>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 6. HOT & COLD STATS MODAL DRAWER */}
      {/* ------------------------------------------------------------- */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-neutral-900 border border-amber-500/30 shadow-2xl p-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Estadísticas de la Ruleta</h3>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1 rounded-full bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-4">
              {/* Hot Numbers */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 mb-2">
                  <Flame className="w-4 h-4 fill-current" />
                  <span>Números Calientes (Frecuentes)</span>
                </div>
                <div className="flex items-center gap-2">
                  {hotColdStats.hot.map((item) => (
                    <button
                      key={item.number}
                      type="button"
                      onClick={() => {
                        setShowStatsModal(false);
                        placeBet('straight', [item.number], `straight_${item.number}`);
                      }}
                      className="flex-1 p-2 rounded-xl bg-neutral-800/80 border border-neutral-700 hover:border-red-500 flex flex-col items-center cursor-pointer transition-all active:scale-95"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          item.color === 'red'
                            ? 'bg-red-600'
                            : item.color === 'green'
                            ? 'bg-emerald-600'
                            : 'bg-neutral-900 border border-neutral-600'
                        }`}
                      >
                        {item.number}
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1">{item.count}x</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cold Numbers */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mb-2">
                  <Snowflake className="w-4 h-4" />
                  <span>Números Fríos (Atrasados)</span>
                </div>
                <div className="flex items-center gap-2">
                  {hotColdStats.cold.map((item) => (
                    <button
                      key={item.number}
                      type="button"
                      onClick={() => {
                        setShowStatsModal(false);
                        placeBet('straight', [item.number], `straight_${item.number}`);
                      }}
                      className="flex-1 p-2 rounded-xl bg-neutral-800/80 border border-neutral-700 hover:border-sky-500 flex flex-col items-center cursor-pointer transition-all active:scale-95"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          item.color === 'red'
                            ? 'bg-red-600'
                            : item.color === 'green'
                            ? 'bg-emerald-600'
                            : 'bg-neutral-900 border border-neutral-600'
                        }`}
                      >
                        {item.number}
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1">{item.count}x</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Distribution Percentages */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  Distribución (Últimas {hotColdStats.totalSpins} Tiradas)
                </span>

                {/* Red / Black bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-red-400">Rojo {hotColdStats.redPercentage}%</span>
                    <span className="text-emerald-400">0: {hotColdStats.greenPercentage}%</span>
                    <span className="text-neutral-300">Negro {hotColdStats.blackPercentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-800">
                    <div className="bg-red-600" style={{ width: `${hotColdStats.redPercentage}%` }} />
                    <div className="bg-emerald-500" style={{ width: `${hotColdStats.greenPercentage}%` }} />
                    <div className="bg-neutral-700" style={{ width: `${hotColdStats.blackPercentage}%` }} />
                  </div>
                </div>

                {/* Even / Odd bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-amber-400">Par {hotColdStats.evenPercentage}%</span>
                    <span className="text-amber-200">Impar {hotColdStats.oddPercentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-800">
                    <div className="bg-amber-500" style={{ width: `${hotColdStats.evenPercentage}%` }} />
                    <div className="bg-amber-700" style={{ width: `${hotColdStats.oddPercentage}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStatsModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 font-bold text-xs text-neutral-950 shadow active:scale-95 transition-all"
            >
              Cerrar Estadísticas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
