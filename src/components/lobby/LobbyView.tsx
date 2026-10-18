import React, { useState } from 'react';
import type { GameType, UserProfile } from '../../types/casino';
import { formatMoney, canClaimDailyReward, getPeerPlayer } from '../../utils/storage';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { PERSONALITY_CONFIGS } from '../../utils/crupierAI';
import { Casino3DScene } from '../common/Casino3DScene';
import {
  Trophy,
  Settings,
  Plus,
  Play,
  Users,
  Wifi,
  Coins,
  Layers,
  CircleDot,
  Music,
  Gift,
  ShieldCheck,
  Sparkles,
  Zap,
  ChevronRight,
  BarChart3,
  Award,
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

export const LobbyView: React.FC<LobbyViewProps> = ({
  profile,
  onSelectGame,
  onOpenCustomization,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenAds,
  onOpenDailyReward,
  onOpenMultiplayer,
  isMultiplayerConnected = false,
}) => {
  const [isMusicActive, setIsMusicActive] = useState(() => sound.isMusicPlaying());
  const [activeCategory, setActiveCategory] = useState<'all' | 'cards' | 'roulette' | 'multiplayer'>('all');
  const canClaimDaily = canClaimDailyReward(profile);
  const peer = getPeerPlayer();

  // Active dealer personality configuration
  const currentDealerConfig = PERSONALITY_CONFIGS[profile.crupierPersonality] || PERSONALITY_CONFIGS.burlona;

  interface CasinoGameTable {
    id: GameType;
    category: 'cards' | 'roulette';
    tableNumber: string;
    title: string;
    shortTitle: string;
    subtitle: string;
    rtp: string;
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
      id: 'futdraft',
      category: 'cards',
      tableNumber: 'ESTADIO FD-27 • EA SPORTS FC 27',
      title: 'FUTDRAFT AI & TACTICS',
      shortTitle: 'FUTDRAFT FC 27',
      subtitle: 'Auto-Battler + Batalla Táctica RPG • Ligas Reales',
      rtp: 'FC 27 DB',
      badge: 'NUEVO • E-SPORTS',
      badgeColor: 'bg-[#00e701]/20 text-[#00e701] border-[#00e701]/60',
      accentGlow: 'group-hover:border-[#00e701]/80',
      cardGradient: 'from-[#072618] via-[#071824] to-[#050911]',
      dealerName: 'DT Táctico IA',
      dealerImage: currentDealerConfig.image,
      dealerRegion: 'Champions Arena',
      minBet: 50,
      maxBet: 2000000,
      supports2P: true,
      features: ['Base de Datos FC 27', 'Siluetas Pro', 'Duelo Táctico', '1P / 2P Hermano'],
      renderIcon: () => <Trophy className="w-5 h-5 text-[#00e701]" />,
    },
    {
      id: 'blackjack',
      category: 'cards',
      tableNumber: 'MESA BJ-01 • MONTECARLO',
      title: 'BLACKJACK 21 VIP',
      shortTitle: 'BLACKJACK 21',
      subtitle: 'Zapato 6 Barajas • Regla S17 & Split',
      rtp: '99.5% RTP',
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
      tableNumber: 'MESA RL-02 • FRANCESA',
      title: 'RULETA EUROPEA 3D',
      shortTitle: 'RULETA 3D',
      subtitle: 'Física Balística 60 FPS • 37 Casillas',
      rtp: '97.3% RTP',
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
      features: ['Rueda 3D Real', 'Pleno 35:1', 'Docenas 2:1', 'Penalización Real'],
      renderIcon: () => <CircleDot className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'poker',
      category: 'cards',
      tableNumber: 'MESA PK-04 • NO LIMIT',
      title: "TEXAS HOLD'EM DUELO",
      shortTitle: "TEXAS HOLD'EM",
      subtitle: 'Mano a Mano Heads-Up • Flop, Turn & River',
      rtp: '98.8% RTP',
      badge: 'SIN LÍMITE',
      badgeColor: 'bg-[#e60012]/20 text-rose-300 border-[#e60012]/50',
      accentGlow: 'group-hover:border-rose-500/60',
      cardGradient: 'from-[#2e0913] via-[#1a060b] to-[#0a0406]',
      dealerName: 'Sarah',
      dealerImage: '/images/dealers/crupier_neutral.jpg',
      dealerRegion: 'Polanco VIP (CDMX)',
      minBet: 50,
      maxBet: 2000000,
      supports2P: false,
      features: ['Rondas Oficiales', 'Control de Turnos', 'Farol y Lectura', 'Sin Pantalla Negra'],
      renderIcon: () => <Layers className="w-5 h-5 text-rose-400" />,
    },
    {
      id: 'conquian',
      category: 'cards',
      tableNumber: 'MESA CQ-03 • TRADICIÓN',
      title: 'CONQUIÁN MEXICANO',
      shortTitle: 'CONQUIÁN MX',
      subtitle: 'Baraja Española 40 Cartas • 9 Limpias',
      rtp: '99.1% RTP',
      badge: 'TRADICIÓN MX',
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

  // Real player game stats
  const stats = profile.stats || {
    blackjack: { gamesPlayed: 0, gamesWon: 0, totalProfit: 0, bestWin: 0 },
    roulette: { gamesPlayed: 0, gamesWon: 0, totalProfit: 0, bestWin: 0 },
    poker: { gamesPlayed: 0, gamesWon: 0, totalProfit: 0, bestWin: 0 },
    conquian: { gamesPlayed: 0, gamesWon: 0, totalProfit: 0, bestWin: 0 },
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e14] overflow-y-auto overflow-x-hidden pb-24 safe-top select-none font-sans text-white">
      {/* ============================================================= */}
      {/* 1. CASINO MONTECARLO VIP TOP NAVBAR                           */}
      {/* ============================================================= */}
      <header className="px-3 sm:px-5 py-2.5 border-b border-[#2a0e16] sticky top-0 z-30 bg-[#120408]/95 backdrop-blur-xl flex items-center justify-between gap-2 shadow-lg">
        {/* Left: Montecarlo VIP Emblem + Player Profile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-amber-400/50 shadow-md shrink-0 bg-[#2b050c]">
              <img
                src="/images/casino_montecarlo_vip.jpg"
                alt="Casino Montecarlo VIP"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden xs:flex flex-col leading-none">
              <span className="text-[11px] sm:text-xs font-black tracking-tight text-white uppercase">
                MONTECARLO
              </span>
              <span className="text-[9px] font-bold text-amber-400 tracking-widest uppercase">
                CASINO VIP
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playChip();
              triggerHaptic('light');
              onOpenProfile();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#1d080f] border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer active:scale-95 min-w-0"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shrink-0">
              <div className="w-full h-full rounded-[5px] bg-[#0b0e14] overflow-hidden flex items-center justify-center text-amber-300 font-black text-xs">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-black tracking-tight text-white truncate max-w-[70px] sm:max-w-[100px]">
                {profile.name}
              </div>
              <div className="text-[8px] font-bold text-[#00e701] tracking-wider uppercase leading-none">
                VIP ORO
              </div>
            </div>
          </button>
        </div>

        {/* Center/Right: Integrated Wallet + Instant Cashier */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center bg-[#1c0810] border border-amber-500/30 rounded-xl p-1 pl-2.5 shadow-inner">
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
                  : 'bg-[#18070d] border-amber-500/20 text-slate-400 hover:text-white'
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
                  : 'bg-[#18070d] border-amber-500/20 text-slate-400 hover:text-white'
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
              className="p-2 rounded-xl bg-[#18070d] border border-amber-500/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================= */}
      {/* 2. LIVE P2P MULTIPLAYER STATUS BAR                            */}
      {/* ============================================================= */}
      <div className="bg-[#19060c] border-b border-[#2e0d16] px-3 sm:px-5 py-1.5 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00e701]/15 border border-[#00e701]/40 text-[#00e701] text-[9px] font-black uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-ping" />
            MOTOR 3D THREE.JS
          </span>
          <span className="text-slate-300 truncate text-[10px] sm:text-xs">
            Sin Login Obligatorio • Progreso Guardado en Dispositivo • Crupier:{' '}
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
          <span>{isMultiplayerConnected ? 'MESA 2P CONECTADA' : 'JUGAR CON HERMANO (2P)'}</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* 3. INTERACTIVE THREE.JS 3D HERO STAGE (MONTECARLO VIP WINE)   */}
      {/* ============================================================= */}
      <section className="px-3 sm:px-5 pt-3 pb-2">
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#2f0814] via-[#1a050b] to-[#0d0205] border border-amber-500/30 overflow-hidden shadow-2xl min-h-[195px] sm:min-h-[220px] flex flex-col justify-between p-4 sm:p-6">
          {/* Ambient Glows */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#7a0d24]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Interactive Three.js 3D WebGL Canvas */}
          <div className="absolute inset-y-0 right-0 w-[55%] sm:w-[50%] z-10">
            <Casino3DScene variant="hero" className="w-full h-full" />
            <div className="absolute bottom-2 right-3 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] text-amber-300 font-bold">
              <Sparkles className="w-2.5 h-2.5 text-[#00e701]" />
              <span>Fichas 3D Interactivas</span>
            </div>
          </div>

          {/* Left Content Column */}
          <div className="relative z-20 max-w-[65%] sm:max-w-[58%] pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/50 border border-amber-400/50 text-amber-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>CASINO MONTECARLO VIP</span>
            </div>

            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              SALÓN PRIVADO{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
                HASTA $2,000,000 MXN
              </span>
            </h1>

            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
              Blackjack 21 con S17 y Split, Texas Hold'em Heads-Up, Ruleta Francesa balística y Conquián Tradicional.
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="relative z-20 flex flex-wrap items-center gap-2 mt-4">
            <button
              onClick={() => handleEnterTable('futdraft')}
              className="px-4 py-2 rounded-xl rainbet-green-btn text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-lg"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>FUTDRAFT AI & TACTICS (FC 27)</span>
            </button>

            <button
              onClick={() => handleEnterTable('blackjack')}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Blackjack 21</span>
            </button>

            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                onOpenMultiplayer();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#260812]/90 hover:bg-[#380c1b] border border-amber-500/40 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all backdrop-blur-md"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Mesa 2P (Hermano)</span>
            </button>

            {canClaimDaily && (
              <button
                onClick={() => {
                  sound.playChip();
                  triggerHaptic('medium');
                  onOpenDailyReward();
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 font-black text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-md"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Bono Diario</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 4. CATEGORY SELECTOR TABS                                     */}
      {/* ============================================================= */}
      <section className="px-3 sm:px-5 py-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: '🔥 Todas las Mesas (4)' },
              { id: 'cards', label: '🃏 Cartas VIP' },
              { id: 'roulette', label: '🎡 Ruleta 3D' },
              { id: 'multiplayer', label: '👥 Sala 2 Jugadores' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveCategory(tab.id as typeof activeCategory);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  activeCategory === tab.id
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                    : 'bg-[#18080f] border border-[#31111d] text-slate-400 hover:text-white'
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
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18080f] border border-amber-500/30 text-amber-300 text-xs font-bold hover:border-amber-400 cursor-pointer shrink-0"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Ranking Real</span>
          </button>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 5. 3D POSTER GAME CARDS (2-COL MOBILE GRID)                   */}
      {/* ============================================================= */}
      <section className="px-3 sm:px-5 py-1.5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              onClick={() => handleEnterTable(table.id)}
              className={`rainbet-card rounded-2xl sm:rounded-3xl bg-gradient-to-b ${table.cardGradient} border border-[#31131e] ${table.accentGlow} p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all`}
            >
              {/* Top Status: RTP */}
              <div className="flex items-center justify-between gap-1 mb-2.5 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-amber-300">
                  <Award className="w-2.5 h-2.5 text-amber-400" />
                  MESA VIP
                </span>

                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${table.badgeColor}`}>
                  {table.rtp}
                </span>
              </div>

              {/* Center Visual: Dealer Avatar */}
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

              {/* Game Info */}
              <div className="mt-2 z-10">
                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
                  {table.tableNumber}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {table.renderIcon()}
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate group-hover:text-amber-300 transition-colors">
                    <span className="sm:hidden">{table.shortTitle}</span>
                    <span className="hidden sm:inline">{table.title}</span>
                  </h3>
                </div>
                <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                  {table.subtitle}
                </p>

                {/* Features */}
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

                <div className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-0.5 shadow-md shrink-0">
                  <span>Jugar</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================= */}
      {/* 6. REAL TABLE STATS & PROGRESS (CERO BOTS SIMULADOS)          */}
      {/* ============================================================= */}
      <section className="px-3 sm:px-5 pt-4 pb-6">
        <div className="rounded-2xl sm:rounded-3xl bg-[#15070d] border border-amber-500/20 overflow-hidden shadow-xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#2a0e18] flex flex-wrap items-center justify-between gap-2 bg-[#1c0812]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Récords Reales de la Mesa
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Jugador:</span>
              <strong className="text-amber-300">{profile.name}</strong>
              {peer && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400 font-bold">Hermano: {peer.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Real Statistics Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#280c16] text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 bg-[#120409]">
                  <th className="py-2.5 px-3 sm:px-4">Juego</th>
                  <th className="py-2.5 px-2 text-center">Partidas</th>
                  <th className="py-2.5 px-2 text-center">Victorias</th>
                  <th className="py-2.5 px-2 text-right">Mejor Victoria</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Beneficio Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#220a13] text-xs">
                {[
                  {
                    name: 'Blackjack 21 VIP',
                    st: stats.blackjack,
                  },
                  {
                    name: 'Ruleta Europea 3D',
                    st: stats.roulette,
                  },
                  {
                    name: "Texas Hold'em Duelo",
                    st: stats.poker,
                  },
                  {
                    name: 'Conquián Mexicano',
                    st: stats.conquian,
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 sm:px-4 font-bold text-white">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-300">
                      {row.st?.gamesPlayed || 0}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-emerald-400 font-bold">
                      {row.st?.gamesWon || 0}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-amber-300 font-bold">
                      ${formatMoney(row.st?.bestWin || 0)}
                    </td>
                    <td
                      className={`py-2.5 px-3 sm:px-4 text-right font-mono font-black ${
                        (row.st?.totalProfit || 0) >= 0 ? 'text-[#00e701]' : 'text-rose-400'
                      }`}
                    >
                      {(row.st?.totalProfit || 0) >= 0 ? '+' : ''}${formatMoney(row.st?.totalProfit || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Real Peer Status Footer */}
          <div className="px-4 py-2.5 bg-[#0e0307] border-t border-[#2a0e18] flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00e701]" />
              <span>Guardado en almacenamiento local (sin contraseñas ni login)</span>
            </div>
            <span className="font-mono text-amber-300/90">
              {isMultiplayerConnected
                ? `● Conectado con ${peer?.name || 'tu hermano'}`
                : 'Mesa 2P lista para conectar'}
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 7. MOBILE-FIRST BOTTOM NAVIGATION DOCK                        */}
      {/* ============================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 py-2 bg-[#120408]/95 backdrop-blur-xl border-t border-[#2a0e16] flex items-center justify-around safe-bottom shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            setActiveCategory('all');
          }}
          className="flex flex-col items-center gap-0.5 text-amber-400 cursor-pointer active:scale-95"
        >
          <Play className="w-5 h-5 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-wider">Mesas</span>
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

        {/* Central Elevated Cashier */}
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
          <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
        </button>
      </nav>
    </div>
  );
};
