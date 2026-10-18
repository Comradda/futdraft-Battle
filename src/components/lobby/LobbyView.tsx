import React, { useState, useEffect } from 'react';
import type { GameType, UserProfile } from '../../types/casino';
import { formatMoney, canClaimDailyReward } from '../../utils/storage';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { PERSONALITY_CONFIGS } from '../../utils/crupierAI';
import { Casino3DScene } from '../common/Casino3DScene';
import {
  Trophy,
  Settings,
  Plus,
  Play,
  Flame,
  Users,
  Wifi,
  Coins,
  Layers,
  CircleDot,
  Music,
  Gift,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { SpadeIcon, OroIcon } from '../common/CardView';

interface LobbyViewProps {
  profile: UserProfile;
  onSelectGame: (game: GameType) => void;
  onOpenCustomization: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenAds: () => void;
  onOpenMultiplayer: () => void;
  onOpenDailyReward: () => void;
  isMultiplayerConnected?: boolean;
}

interface LiveFeedRow {
  id: string;
  game: string;
  player: string;
  bet: number;
  multiplier: string;
  payout: number;
  isWin: boolean;
  timeAgo: string;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  profile,
  onSelectGame,
  onOpenCustomization,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenAds,
  onOpenMultiplayer,
  onOpenDailyReward,
  isMultiplayerConnected = false,
}) => {
  const [isMusicActive, setIsMusicActive] = useState(() => sound.isMusicPlaying());
  const [activeCategory, setActiveCategory] = useState<'all' | 'cards' | 'roulette' | 'multiplayer'>('all');
  const [feedTab, setFeedTab] = useState<'live' | 'high_rollers'>('live');
  const canClaimDaily = canClaimDailyReward(profile);

  // Active dealer personality configuration
  const currentDealerConfig = PERSONALITY_CONFIGS[profile.crupierPersonality] || PERSONALITY_CONFIGS.burlona;

  // Dynamic simulated + local player live feed (Rainbet style)
  const [liveBets, setLiveBets] = useState<LiveFeedRow[]>(() => [
    {
      id: 'lb-1',
      game: 'Blackjack 21 VIP',
      player: profile.name || 'Socio VIP',
      bet: 25000,
      multiplier: '2.50x',
      payout: 62500,
      isWin: true,
      timeAgo: 'Hace 4s',
    },
    {
      id: 'lb-2',
      game: 'Ruleta Europea 3D',
      player: 'Carlos_MTY',
      bet: 10000,
      multiplier: '36.00x',
      payout: 360000,
      isWin: true,
      timeAgo: 'Hace 9s',
    },
    {
      id: 'lb-3',
      game: "Texas Hold'em Duelo",
      player: 'ElPatron_GDL',
      bet: 50000,
      multiplier: '2.00x',
      payout: 100000,
      isWin: true,
      timeAgo: 'Hace 15s',
    },
    {
      id: 'lb-4',
      game: 'Conquián Clásico',
      player: 'Alex_CDMX',
      bet: 5000,
      multiplier: '0.00x',
      payout: 0,
      isWin: false,
      timeAgo: 'Hace 21s',
    },
    {
      id: 'lb-5',
      game: 'Blackjack 21 VIP',
      player: 'Valeria_HighRoller',
      bet: 250000,
      multiplier: '2.00x',
      payout: 500000,
      isWin: true,
      timeAgo: 'Hace 28s',
    },
  ]);

  useEffect(() => {
    const sampleGames = ['Blackjack 21 VIP', 'Ruleta Europea 3D', "Texas Hold'em Duelo", 'Conquián Clásico'];
    const samplePlayers = ['Diego_MX', 'Roberto_VIP', 'Sofi_GDL', 'Maverick99', 'Toro_Regio', profile.name || 'Socio VIP'];
    const sampleBets = [500, 1000, 5000, 25000, 50000, 100000, 500000];
    const sampleMults = [
      { m: '2.00x', factor: 2, win: true },
      { m: '2.50x', factor: 2.5, win: true },
      { m: '0.00x', factor: 0, win: false },
      { m: '3.00x', factor: 3, win: true },
      { m: '36.00x', factor: 36, win: true },
    ];

    const interval = setInterval(() => {
      const g = sampleGames[Math.floor(Math.random() * sampleGames.length)];
      const p = samplePlayers[Math.floor(Math.random() * samplePlayers.length)];
      const b = sampleBets[Math.floor(Math.random() * sampleBets.length)];
      const mult = sampleMults[Math.floor(Math.random() * sampleMults.length)];

      setLiveBets((prev) => [
        {
          id: `lb-${Date.now()}`,
          game: g,
          player: p,
          bet: b,
          multiplier: mult.m,
          payout: Math.round(b * mult.factor),
          isWin: mult.win,
          timeAgo: 'Ahora',
        },
        ...prev.slice(0, 5),
      ]);
    }, 5500);

    return () => clearInterval(interval);
  }, [profile.name]);

  interface CasinoGameTable {
    id: GameType;
    category: 'cards' | 'roulette';
    tableNumber: string;
    title: string;
    shortTitle: string;
    subtitle: string;
    rtp: string;
    livePlayers: number;
    badge: string;
    badgeColor: string;
    accentGlow: string;
    cardGradient: string;
    dealerName: string;
    dealerImage: string;
    dealerRegion: string;
    minBet: number;
    maxBet: number;
    supports2P: boolean;
    features: string[];
    renderIcon: () => React.ReactNode;
  }

  const tables: CasinoGameTable[] = [
    {
      id: 'blackjack',
      category: 'cards',
      tableNumber: 'ORIGINALES • BJ-01',
      title: 'BLACKJACK 21 VIP',
      shortTitle: 'BLACKJACK 21',
      subtitle: 'Zapato 6 Barajas • Regla S17 & Split',
      rtp: '99.5% RTP',
      livePlayers: 184,
      badge: 'PAGO 3:2',
      badgeColor: 'bg-[#00e701]/15 text-[#00e701] border-[#00e701]/40',
      accentGlow: 'group-hover:border-[#00e701]/60',
      cardGradient: 'from-[#0f2438] via-[#0b1622] to-[#080b11]',
      dealerName: currentDealerConfig.name,
      dealerImage: currentDealerConfig.image,
      dealerRegion: currentDealerConfig.region,
      minBet: 10,
      maxBet: 1000000,
      supports2P: true,
      features: ['S17 Oficial', 'Split & Doblar x2', 'CSPRNG Puro', 'Mesa 2P'],
      renderIcon: () => <SpadeIcon className="w-5 h-5 text-[#00e701]" />,
    },
    {
      id: 'roulette',
      category: 'roulette',
      tableNumber: 'EN VIVO • RL-02',
      title: 'RULETA EUROPEA 3D',
      shortTitle: 'RULETA 3D',
      subtitle: 'Física Balística 60 FPS • 37 Casillas',
      rtp: '97.3% RTP',
      livePlayers: 142,
      badge: 'PLENO 35:1',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      accentGlow: 'group-hover:border-amber-400/60',
      cardGradient: 'from-[#291707] via-[#170e05] to-[#090705]',
      dealerName: 'Valeria',
      dealerImage: '/images/dealers/crupier_burlona.jpg',
      dealerRegion: 'Monterrey, N.L.',
      minBet: 10,
      maxBet: 1000000,
      supports2P: false,
      features: ['Rueda 3D Real', 'Pleno 35:1', 'Docenas 2:1', 'Estadísticas'],
      renderIcon: () => <CircleDot className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'poker',
      category: 'cards',
      tableNumber: 'HIGH ROLLER • PK-04',
      title: "TEXAS HOLD'EM DUELO",
      shortTitle: "TEXAS HOLD'EM",
      subtitle: 'Heads-Up Sin Límite • WSOP Engine',
      rtp: '98.8% RTP',
      livePlayers: 96,
      badge: 'NO LIMIT',
      badgeColor: 'bg-[#e60012]/20 text-rose-300 border-[#e60012]/50',
      accentGlow: 'group-hover:border-rose-500/60',
      cardGradient: 'from-[#2e0913] via-[#1a060b] to-[#0a0406]',
      dealerName: 'Sarah',
      dealerImage: '/images/dealers/crupier_neutral.jpg',
      dealerRegion: 'Polanco VIP (CDMX)',
      minBet: 50,
      maxBet: 2000000,
      supports2P: false,
      features: ['Flop/Turn/River', 'All-In Directo', 'IA Agresiva', 'Sin Límite'],
      renderIcon: () => <Layers className="w-5 h-5 text-rose-400" />,
    },
    {
      id: 'conquian',
      category: 'cards',
      tableNumber: 'TRADICIÓN MX • CQ-03',
      title: 'CONQUIÁN MEXICANO',
      shortTitle: 'CONQUIÁN MX',
      subtitle: 'Baraja Española 40 Cartas • 9 Limpias',
      rtp: '99.1% RTP',
      livePlayers: 118,
      badge: 'CLÁSICO MX',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      accentGlow: 'group-hover:border-emerald-400/60',
      cardGradient: 'from-[#092b1c] via-[#061a11] to-[#040c08]',
      dealerName: 'Elena',
      dealerImage: '/images/dealers/crupier_amigable.jpg',
      dealerRegion: 'El Bajío / Jalisco',
      minBet: 25,
      maxBet: 500000,
      supports2P: true,
      features: ['Baraja Española', 'Tercias y Corridas', 'Arrastre 3D', 'Mesa 2P'],
      renderIcon: () => <OroIcon className="w-5 h-5" />,
    },
  ];

  const filteredTables = tables.filter((table) => {
    if (activeCategory === 'cards') return table.category === 'cards';
    if (activeCategory === 'roulette') return table.category === 'roulette';
    if (activeCategory === 'multiplayer') return table.supports2P;
    return true;
  });

  const handleEnterTable = (game: GameType) => {
    sound.playCardDeal();
    triggerHaptic('medium');
    onSelectGame(game);
  };

  const displayedFeed =
    feedTab === 'high_rollers'
      ? liveBets.filter((b) => b.bet >= 25000 || b.payout >= 100000)
      : liveBets;

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e14] overflow-y-auto overflow-x-hidden pb-24 safe-top select-none font-sans text-white">
      {/* ============================================================= */}
      {/* 1. RAINBET / CALIENTE MX STICKY TOP NAVBAR                    */}
      {/* ============================================================= */}
      <header className="px-3 sm:px-5 py-2.5 border-b border-[#1e2636] sticky top-0 z-30 bg-[#0b0e14]/95 backdrop-blur-xl flex items-center justify-between gap-2">
        {/* Left: Brand Identity + Profile Trigger */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => {
              sound.playChip();
              triggerHaptic('light');
              onOpenProfile();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#141923] border border-[#252f42] hover:border-[#00e701]/50 transition-all cursor-pointer active:scale-95 min-w-0"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e60012] via-amber-500 to-[#00e701] p-0.5 shrink-0">
              <div className="w-full h-full rounded-[6px] bg-[#0b0e14] overflow-hidden flex items-center justify-center text-amber-400 font-black text-xs">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black tracking-tight text-white truncate max-w-[78px] sm:max-w-[120px]">
                  {profile.name}
                </span>
                <span className="px-1 py-0.2 rounded bg-[#e60012] text-[8px] font-black text-white uppercase shrink-0">
                  MX
                </span>
              </div>
              <div className="text-[9px] font-bold text-[#00e701] tracking-wider uppercase leading-none">
                VIP • NIVEL ORO
              </div>
            </div>
          </button>
        </div>

        {/* Center/Right: Rainbet-style Integrated Wallet + Instant Deposit Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center bg-[#141923] border border-[#263044] rounded-xl p-1 pl-2.5 shadow-inner">
            <div className="flex items-center gap-1.5 pr-2">
              <div className="w-4 h-4 rounded-full bg-[#00e701]/20 border border-[#00e701] flex items-center justify-center text-[9px] font-black text-[#00e701]">
                $
              </div>
              <div className="text-right">
                <span className="text-[8px] block text-slate-400 uppercase font-extrabold leading-none">
                  SALDO MXN
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-white leading-tight">
                  {formatMoney(profile.bankroll)}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                onOpenAds();
              }}
              className="px-2.5 py-1.5 rounded-lg rainbet-green-btn text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Cajero</span>
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                onOpenDailyReward();
              }}
              title="Bono Diario"
              className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                canClaimDaily
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-[#141923] border-[#252f42] text-slate-400 hover:text-white'
              }`}
            >
              <Gift className="w-4 h-4" />
              {canClaimDaily && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00e701] border border-[#0b0e14] animate-ping" />
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                const active = sound.toggleCasinoMusic();
                setIsMusicActive(active);
              }}
              title="Música Casino Lounge"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isMusicActive
                  ? 'bg-[#00e701]/15 border-[#00e701]/60 text-[#00e701]'
                  : 'bg-[#141923] border-[#252f42] text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('light');
                onOpenCustomization();
              }}
              title="Ajustes de Mesa y Crupier"
              className="p-2 rounded-xl bg-[#141923] border border-[#252f42] text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================= */}
      {/* 2. TOP STATUS BAR: LIVE P2P MULTIPLAYER & PROVABLY FAIR       */}
      {/* ============================================================= */}
      <div className="bg-[#10141d] border-b border-[#1e2636] px-3 sm:px-5 py-1.5 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00e701]/15 border border-[#00e701]/40 text-[#00e701] text-[9px] font-black uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-ping" />
            3D WEBGL ACTIVO
          </span>
          <span className="text-slate-400 truncate text-[10px] sm:text-xs">
            Motor Three.js 60 FPS • Azar CSPRNG Verificado • Crupier:{' '}
            <strong className="text-amber-300">{currentDealerConfig.name}</strong>
          </span>
        </div>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('medium');
            onOpenMultiplayer();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black cursor-pointer transition-all shrink-0 ${
            isMultiplayerConnected
              ? 'bg-[#00e701]/20 border border-[#00e701] text-[#00e701]'
              : 'bg-[#e60012]/20 border border-[#e60012]/50 text-rose-300 hover:bg-[#e60012]/30'
          }`}
        >
          <Wifi className="w-3 h-3" />
          <span>{isMultiplayerConnected ? 'MESA 2P CONECTADA' : 'CONECTAR 2 JUGADORES'}</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* 3. INTERACTIVE THREE.JS 3D HERO STAGE (RAINBET x CALIENTE MX) */}
      {/* ============================================================= */}
      <section className="px-3 sm:px-5 pt-3 pb-2">
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#161f30] via-[#111722] to-[#0b0e14] border border-[#263248] overflow-hidden shadow-2xl min-h-[195px] sm:min-h-[220px] flex flex-col justify-between p-4 sm:p-6">
          {/* Ambient Neon Glows */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00e701]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 right-10 w-72 h-72 bg-[#e60012]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Interactive Three.js 3D WebGL Canvas (Right Half / Full Background) */}
          <div className="absolute inset-y-0 right-0 w-[55%] sm:w-[50%] z-10">
            <Casino3DScene variant="hero" className="w-full h-full" />
            <div className="absolute bottom-2 right-3 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] text-amber-300 font-bold">
              <Sparkles className="w-2.5 h-2.5 text-[#00e701]" />
              <span>Toca las fichas 3D</span>
            </div>
          </div>

          {/* Left Content Column */}
          <div className="relative z-20 max-w-[65%] sm:max-w-[58%] pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/50 border border-amber-400/40 text-amber-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2">
              <Zap className="w-3 h-3 text-[#00e701]" />
              <span>CASINO OFICIAL • EDICIÓN 3D</span>
            </div>

            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              APUESTA EN GRANDE HASTA{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e701] via-emerald-300 to-amber-300">
                $1,000,000 MXN
              </span>
            </h1>

            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
              Física 3D en tiempo real, Blackjack con Split y Doblar x2, Ruleta Europea balística y mesas multijugador en vivo.
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="relative z-20 flex flex-wrap items-center gap-2 mt-4">
            <button
              onClick={() => handleEnterTable('blackjack')}
              className="px-4 py-2 rounded-xl rainbet-green-btn text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Jugar Blackjack 21</span>
            </button>

            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                onOpenMultiplayer();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#18202f]/90 hover:bg-[#202a3d] border border-[#313f58] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all backdrop-blur-md"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Sala 2P</span>
            </button>

            {canClaimDaily && (
              <button
                onClick={() => {
                  sound.playChip();
                  triggerHaptic('medium');
                  onOpenDailyReward();
                }}
                className="px-3 py-2 rounded-xl caliente-accent-gradient text-white font-black text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <Gift className="w-3.5 h-3.5" />
                <span> Reclamar Bono</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 4. RAINBET CATEGORY TABS                                      */}
      {/* ============================================================= */}
      <section className="px-3 sm:px-5 py-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: '🔥 Todos los Juegos (4)' },
              { id: 'cards', label: '🃏 Cartas VIP' },
              { id: 'roulette', label: '🎡 Ruleta 3D' },
              { id: 'multiplayer', label: '👥 Multijugador 2P' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveCategory(tab.id as typeof activeCategory);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  activeCategory === tab.id
                    ? 'bg-[#00e701] text-[#051b06] shadow-[0_0_15px_rgba(0,231,1,0.3)]'
                    : 'bg-[#141923] border border-[#232c3d] text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              sound.playChip();
              triggerHaptic('light');
              onOpenLeaderboard();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141923] border border-amber-500/30 text-amber-300 text-xs font-bold hover:border-amber-400 cursor-pointer shrink-0"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Ranking Millonario</span>
          </button>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 5. 3D POSTER & LIVE STUDIO GAME CARDS (2-COL MOBILE GRID)     */}
      {/* ============================================================= */}
      <section className="px-3 sm:px-5 py-1.5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              onClick={() => handleEnterTable(table.id)}
              className={`rainbet-card rounded-2xl sm:rounded-3xl bg-gradient-to-b ${table.cardGradient} border border-[#252f42] ${table.accentGlow} p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all`}
            >
              {/* Top Status Row: RTP & Live Players */}
              <div className="flex items-center justify-between gap-1 mb-2.5 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-pulse" />
                  {table.livePlayers}
                </span>

                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${table.badgeColor}`}>
                  {table.rtp}
                </span>
              </div>

              {/* Center Visual Poster Area: 3D Dealer Avatar + Game Badge */}
              <div className="relative my-1 flex flex-col items-center justify-center py-2">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-[0_10px_25px_rgba(0,0,0,0.7)] bg-neutral-900 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={table.dealerImage}
                    alt={table.dealerName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-2 pb-0.5 text-[8px] font-black text-center text-amber-300 uppercase">
                    {table.dealerName}
                  </div>
                </div>

                {table.supports2P && (
                  <span className="mt-1.5 px-2 py-0.5 rounded-full bg-[#00e701]/15 border border-[#00e701]/40 text-[8px] font-black text-[#00e701] uppercase tracking-wider">
                    👥 MESA 1P / 2P EN VIVO
                  </span>
                )}
              </div>

              {/* Game Title & Specs */}
              <div className="mt-2 z-10">
                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
                  {table.tableNumber}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {table.renderIcon()}
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate group-hover:text-[#00e701] transition-colors">
                    <span className="sm:hidden">{table.shortTitle}</span>
                    <span className="hidden sm:inline">{table.title}</span>
                  </h3>
                </div>
                <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                  {table.subtitle}
                </p>

                {/* Feature Pills */}
                <div className="hidden sm:flex flex-wrap gap-1 mt-2">
                  {table.features.slice(0, 3).map((feat, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300 font-semibold"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Limits & Play CTA */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-1 z-10">
                <div className="min-w-0">
                  <span className="text-[8px] uppercase text-slate-400 font-bold block leading-none">
                    Límites
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono font-black text-amber-300 truncate block">
                    ${table.minBet}-${formatMoney(table.maxBet)}
                  </span>
                </div>

                <div className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#00e701] group-hover:bg-[#22ff23] text-[#041904] font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-0.5 shadow-md shrink-0">
                  <span>Jugar</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================= */}
      {/* 6. RAINBET LIVE BETS & HIGH ROLLERS FEED                      */}
      {/* ============================================================= */}
      <section className="px-3 sm:px-5 pt-4 pb-6">
        <div className="rounded-2xl sm:rounded-3xl bg-[#111620] border border-[#1f293a] overflow-hidden shadow-xl">
          {/* Feed Header & Tabs */}
          <div className="px-4 py-3 border-b border-[#1f293a] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00e701]" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Actividad del Casino en Tiempo Real
              </h3>
            </div>

            <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-xl border border-[#1f293a]">
              <button
                onClick={() => setFeedTab('live')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all ${
                  feedTab === 'live'
                    ? 'bg-[#1e2738] text-[#00e701]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Apuestas en Vivo
              </button>
              <button
                onClick={() => setFeedTab('high_rollers')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all flex items-center gap-1 ${
                  feedTab === 'high_rollers'
                    ? 'bg-[#1e2738] text-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>High Rollers</span>
              </button>
            </div>
          </div>

          {/* Feed Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1b2333] text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 bg-[#0d1119]">
                  <th className="py-2 px-3 sm:px-4">Juego</th>
                  <th className="py-2 px-2">Jugador</th>
                  <th className="py-2 px-2 text-right">Apuesta</th>
                  <th className="py-2 px-2 text-right hidden xs:table-cell">Mult.</th>
                  <th className="py-2 px-3 sm:px-4 text-right">Pago MXN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18202f] text-xs">
                {displayedFeed.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 sm:px-4 font-bold text-white truncate max-w-[115px] sm:max-w-none">
                      {row.game}
                    </td>
                    <td className="py-2.5 px-2 text-slate-300 font-medium truncate max-w-[90px]">
                      {row.player}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      ${formatMoney(row.bet)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono hidden xs:table-cell">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.isWin
                            ? 'bg-[#00e701]/15 text-[#00e701]'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {row.multiplier}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-3 sm:px-4 text-right font-mono font-black ${
                        row.isWin ? 'text-[#00e701]' : 'text-slate-500'
                      }`}
                    >
                      {row.isWin ? `+$${formatMoney(row.payout)}` : '$0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Provably Fair Footer */}
          <div className="px-4 py-2.5 bg-[#0b0e14] border-t border-[#1f293a] flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00e701]" />
              <span>Generador de Números Aleatorios Criptográfico (Web Crypto API CSPRNG)</span>
            </div>
            <span className="font-mono text-amber-400/90">100% Compatible iOS Safari & Chrome Mobile</span>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 7. MOBILE-FIRST BOTTOM CASINO DOCK                            */}
      {/* ============================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 py-2 bg-[#0b0e14]/95 backdrop-blur-xl border-t border-[#1e2636] flex items-center justify-around safe-bottom shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            setActiveCategory('all');
          }}
          className="flex flex-col items-center gap-0.5 text-[#00e701] cursor-pointer active:scale-95"
        >
          <Play className="w-5 h-5 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-wider">Casino</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('medium');
            onOpenMultiplayer();
          }}
          className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-white cursor-pointer active:scale-95 relative"
        >
          <Users className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Sala 2P</span>
          {isMultiplayerConnected && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-[#00e701]" />
          )}
        </button>

        {/* Central Elevated Cashier Button */}
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('medium');
            onOpenAds();
          }}
          className="-mt-4 px-4 py-2 rounded-2xl rainbet-green-btn flex flex-col items-center justify-center shadow-lg cursor-pointer active:scale-95"
        >
          <Coins className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Cajero</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onOpenLeaderboard();
          }}
          className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-white cursor-pointer active:scale-95"
        >
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ranking</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onOpenCustomization();
          }}
          className="flex flex-col items-center gap-0.5 text-slate-300 hover:text-white cursor-pointer active:scale-95"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Mesas</span>
        </button>
      </nav>
    </div>
  );
};
