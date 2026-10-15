import React, { useState } from 'react';
import type { GameType, UserProfile } from '../../types/casino';
import { formatMoney, canClaimDailyReward } from '../../utils/storage';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { PERSONALITY_CONFIGS } from '../../utils/crupierAI';
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
  Radio,
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
  const canClaimDaily = canClaimDailyReward(profile);

  // Active dealer personality configuration
  const currentDealerConfig = PERSONALITY_CONFIGS[profile.crupierPersonality] || PERSONALITY_CONFIGS.burlona;

  interface CasinoGameTable {
    id: GameType;
    category: 'cards' | 'roulette';
    tableNumber: string;
    title: string;
    subtitle: string;
    tagline: string;
    badge: string;
    badgeStyle: string;
    dealerName: string;
    dealerImage: string;
    dealerRegion: string;
    minBet: number;
    maxBet: number;
    feltStyle: string;
    borderColor: string;
    specs: string[];
    renderIcon: () => React.ReactNode;
  }

  const tables: CasinoGameTable[] = [
    {
      id: 'blackjack',
      category: 'cards',
      tableNumber: 'MESA BJ-01',
      title: 'BLACKJACK 21 VIP',
      subtitle: 'Zapato 6 Barajas • Estándar Las Vegas',
      tagline: 'Crupier se planta en todo 17 • Azar CSPRNG Certificado',
      badge: 'PAGO 3:2',
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      dealerName: currentDealerConfig.name,
      dealerImage: currentDealerConfig.image,
      dealerRegion: currentDealerConfig.region,
      minBet: 10,
      maxBet: 1000000,
      feltStyle: 'from-[#0b1c2b] via-[#07131f] to-[#04090f]',
      borderColor: 'border-blue-500/40 hover:border-blue-400',
      specs: [
        'Regla S17: Crupier se planta en todo 17',
        'Opciones Doblar x2 y Dividir (Split)',
        'Barajado físico de 6 barajas con corte real',
        'Mesa individual o multijugador con tu hermano',
      ],
      renderIcon: () => <SpadeIcon className="w-6 h-6 text-amber-400" />,
    },
    {
      id: 'roulette',
      category: 'roulette',
      tableNumber: 'MESA RL-02',
      title: 'RULETA EUROPEA 3D',
      subtitle: 'Rueda Francesa de 37 Casillas (0-36)',
      tagline: 'Giro balístico en Canvas 60 FPS • Pleno 35:1',
      badge: 'FÍSICA 3D REAL',
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      dealerName: 'Valeria',
      dealerImage: '/images/dealers/crupier_burlona.jpg',
      dealerRegion: 'Monterrey, N.L.',
      minBet: 10,
      maxBet: 1000000,
      feltStyle: 'from-[#1a1205] via-[#100b03] to-[#050402]',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      specs: [
        'Rueda balística con rebote físico y frenado suave',
        'Apuesta a Pleno (35:1), Docenas y Columnas (2:1)',
        'Penalización real: los tiros fallidos descuentan fichas',
        'Historial de últimos 40 números con estadísticas de color',
      ],
      renderIcon: () => <CircleDot className="w-6 h-6 text-emerald-400" />,
    },
    {
      id: 'conquian',
      category: 'cards',
      tableNumber: 'MESA CQ-03',
      title: 'CONQUIÁN CLÁSICO',
      subtitle: 'Baraja Española Real (40 Cartas)',
      tagline: 'El juego tradicional mexicano • Paga directa de 9 cartas',
      badge: 'TRADICIONAL',
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      dealerName: 'Elena',
      dealerImage: '/images/dealers/crupier_amigable.jpg',
      dealerRegion: 'El Bajío / Jalisco',
      minBet: 25,
      maxBet: 500000,
      feltStyle: 'from-[#0b291a] via-[#061c12] to-[#030d08]',
      borderColor: 'border-emerald-600/40 hover:border-emerald-400',
      specs: [
        'Baraja Española oficial: Oros, Copas, Espadas y Bastos',
        'Formación de tercias y corridas con arrastre al tapiz',
        'Victoria al bajar 9 cartas limpias',
        'Multijugador en vivo en la misma mesa',
      ],
      renderIcon: () => <OroIcon className="w-6 h-6" />,
    },
    {
      id: 'poker',
      category: 'cards',
      tableNumber: 'MESA PK-04',
      title: "TEXAS HOLD'EM DUELO",
      subtitle: 'Mano a Mano Heads-Up Sin Límite',
      tagline: 'Preflop, Flop, Turn y River • Faroles y Pot Odds',
      badge: 'SIN LÍMITES',
      badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
      dealerName: 'Sarah',
      dealerImage: '/images/dealers/crupier_neutral.jpg',
      dealerRegion: 'Polanco VIP (CDMX)',
      minBet: 50,
      maxBet: 2000000,
      feltStyle: 'from-[#2b0811] via-[#1c0409] to-[#090204]',
      borderColor: 'border-rose-600/40 hover:border-rose-400',
      specs: [
        'Duelo mano a mano contra la banca de alta inteligencia',
        '5 cartas comunitarias oficiales con control de subidas',
        'Evaluador WSOP oficial de manos con desempate de kicker',
        'Motor blindado sin caídas ni pantallas negras',
      ],
      renderIcon: () => <Layers className="w-6 h-6 text-rose-400" />,
    },
  ];

  const filteredTables = tables.filter((table) => {
    if (activeCategory === 'cards') return table.category === 'cards';
    if (activeCategory === 'roulette') return table.category === 'roulette';
    if (activeCategory === 'multiplayer') return table.id === 'blackjack' || table.id === 'conquian';
    return true;
  });

  const handleEnterTable = (game: GameType) => {
    sound.playCardDeal();
    triggerHaptic('medium');
    onSelectGame(game);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#07070a] overflow-y-auto pb-24 safe-top select-none font-sans text-white">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP CASINO VIP HEADER */}
      {/* ------------------------------------------------------------- */}
      <header className="px-4 py-3 border-b border-amber-500/20 sticky top-0 z-30 bg-[#09090e]/95 backdrop-blur-xl shadow-lg flex items-center justify-between">
        {/* VIP Player Identity Card */}
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onOpenProfile();
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-neutral-900/90 border border-amber-500/30 hover:border-amber-400/60 transition-all cursor-pointer shadow-inner active:scale-95"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-neutral-950 overflow-hidden flex items-center justify-center text-amber-400 font-black text-xs">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <div className="text-left">
            <div className="text-xs font-black text-white leading-tight max-w-[95px] truncate">
              {profile.name}
            </div>
            <div className="text-[9px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1">
              <span>👑</span> SOCIO VIP
            </div>
          </div>
        </button>

        {/* Casino Cashier & Actions */}
        <div className="flex items-center gap-2">
          {/* Bankroll / Cashier Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/40 shadow-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="text-right">
              <span className="text-[9px] block text-neutral-400 uppercase font-bold leading-none">Saldo</span>
              <span className="text-xs font-black font-mono text-amber-300 leading-tight">
                {formatMoney(profile.bankroll)}
              </span>
            </div>
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                onOpenAds();
              }}
              title="Cajero / Recargar fichas"
              className="ml-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-950 font-black text-[10px] uppercase tracking-wider shadow cursor-pointer active:scale-95 transition-transform flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span className="hidden sm:inline">Cajero</span>
            </button>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1">
            {/* Daily Gift Button */}
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                onOpenDailyReward();
              }}
              title="Bono Diario"
              className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                canClaimDaily
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse'
                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              <Gift className="w-4 h-4" />
              {canClaimDaily && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-neutral-950 animate-ping" />
              )}
            </button>

            {/* Jazz Music Toggle */}
            <button
              onClick={() => {
                triggerHaptic('light');
                const active = sound.toggleCasinoMusic();
                setIsMusicActive(active);
              }}
              title={isMusicActive ? 'Silenciar música Jazz Lounge' : 'Activar música Casino Lounge'}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isMusicActive
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              <Music className={`w-4 h-4 ${isMusicActive ? 'animate-pulse' : ''}`} />
            </button>

            {/* Leaderboard */}
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('light');
                onOpenLeaderboard();
              }}
              title="Ranking de Ganadores"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('light');
                onOpenCustomization();
              }}
              title="Personalización del Casino"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. LIVE MARQUEE TICKER (CASINO ATMOSPHERE) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#0f0c05] border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] overflow-hidden">
        <div className="flex items-center gap-2 text-amber-300 font-bold whitespace-nowrap overflow-hidden">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase font-black tracking-wider">
            <Radio className="w-2.5 h-2.5 animate-pulse" /> EN DIRECTO
          </span>
          <span className="text-neutral-400 hidden sm:inline">•</span>
          <span className="text-neutral-200">
            Regla Internacional S17 • Azar CSPRNG de Mazo Completo • Crupiers con Identidad Mexicana
          </span>
        </div>

        {/* 2-Player Status Pill */}
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('medium');
            onOpenMultiplayer();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-all ${
            isMultiplayerConnected
              ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 animate-pulse'
              : 'bg-amber-500/10 border border-amber-400/40 text-amber-300 hover:bg-amber-500/20'
          }`}
        >
          <Wifi className="w-3 h-3" />
          <span>{isMultiplayerConnected ? 'Mesa 2P Conectada' : 'Jugar con Hermano (2P)'}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. VIP CLUB REWARDS BANNER */}
      {/* ------------------------------------------------------------- */}
      <section className="px-4 pt-3 pb-2">
        <div className="rounded-3xl bg-gradient-to-r from-[#17120a] via-[#120e06] to-[#0a0804] border border-amber-500/30 p-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-400 text-xs font-black tracking-widest uppercase">
                  SALÓN VIP LAS VEGAS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-[9px] font-bold text-amber-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" /> Azar Criptográfico
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Elige tu Mesa y Desafía al Crupier
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Crupier activo hoy:{' '}
                <b className="text-amber-300 font-semibold">{currentDealerConfig.name}</b> ({currentDealerConfig.region})
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playChip();
                  triggerHaptic('medium');
                  onOpenDailyReward();
                }}
                className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl border text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  canClaimDaily
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 border-amber-300 shadow-lg shadow-amber-500/20'
                    : 'bg-neutral-900 border-white/10 text-neutral-300 hover:text-white'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>{canClaimDaily ? 'Bono Disponible' : `Racha Día ${profile.dailyStreak || 1}`}</span>
              </button>

              <button
                onClick={() => {
                  sound.playChip();
                  triggerHaptic('light');
                  onOpenLeaderboard();
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-white/10 hover:border-amber-400/40 text-xs font-bold text-amber-300 cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="hidden xs:inline">Ranking</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. TABLE CATEGORY SELECTOR */}
      {/* ------------------------------------------------------------- */}
      <section className="px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveCategory('all');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900/80 border border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            Todas las Mesas (4)
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveCategory('cards');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeCategory === 'cards'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900/80 border border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            Juegos de Cartas
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveCategory('roulette');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeCategory === 'roulette'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900/80 border border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            Ruleta Francesa
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveCategory('multiplayer');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeCategory === 'multiplayer'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900/80 border border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mano a Mano (2P)</span>
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. CASINO LIVE TABLES GRID */}
      {/* ------------------------------------------------------------- */}
      <section className="px-4 py-2 space-y-3.5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className={`rounded-3xl bg-gradient-to-b ${table.feltStyle} border ${table.borderColor} shadow-2xl p-4.5 transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between relative overflow-hidden group`}
            >
              {/* Table Top Ribbon */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    MESA ABIERTA
                  </span>
                  <span className="text-white/20 text-xs">•</span>
                  <span className="text-[10px] font-mono font-bold text-neutral-400">
                    {table.tableNumber}
                  </span>
                </div>

                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${table.badgeStyle}`}>
                  {table.badge}
                </span>
              </div>

              {/* Main Table Info with Crupier Avatar */}
              <div className="flex items-start gap-3.5 mb-3">
                {/* Dealer Photo Avatar */}
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-amber-400/40 shadow-md shrink-0 bg-neutral-950">
                  <img
                    src={table.dealerImage}
                    alt={table.dealerName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm text-[8px] font-bold text-center text-amber-300 py-0.5 truncate px-1">
                    {table.dealerName}
                  </div>
                </div>

                {/* Title & Tagline */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {table.renderIcon()}
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-amber-300 transition-colors truncate">
                      {table.title}
                    </h3>
                  </div>
                  <div className="text-xs text-amber-400/90 font-medium">
                    {table.subtitle}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    {table.tagline}
                  </div>
                </div>
              </div>

              {/* Table Specifications List */}
              <div className="bg-black/30 rounded-2xl p-2.5 mb-3.5 border border-white/5 space-y-1">
                {table.specs.map((spec, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-1.5 text-[11px] text-neutral-300">
                    <span className="text-amber-400 text-xs">◆</span>
                    <span>{spec}</span>
                  </div>
                ))}
              </div>

              {/* Table Footer: Limits & Join Button */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                  <span className="text-[9px] uppercase font-bold text-neutral-400 block leading-none">
                    Límites de Apuesta
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-200">
                    ${table.minBet} - ${formatMoney(table.maxBet)}
                  </span>
                </div>

                <button
                  onClick={() => handleEnterTable(table.id)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Sentarse en Mesa</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. BOTTOM IOS CASINO DOCK NAVIGATION */}
      {/* ------------------------------------------------------------- */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 px-6 py-2 bg-[#09090e]/95 backdrop-blur-xl border-t border-amber-500/20 flex items-center justify-around safe-bottom shadow-2xl">
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
          }}
          className="flex flex-col items-center gap-0.5 text-amber-400 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-wider">Mesas</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onOpenLeaderboard();
          }}
          className="flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white cursor-pointer transition-colors"
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ranking</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('medium');
            onOpenMultiplayer();
          }}
          className="flex flex-col items-center gap-0.5 text-amber-300 hover:text-white cursor-pointer transition-colors"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-wider">2 Jugadores</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('medium');
            onOpenAds();
          }}
          className="flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white cursor-pointer transition-colors"
        >
          <Coins className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Cajero</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onOpenCustomization();
          }}
          className="flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white cursor-pointer transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
        </button>
      </nav>
    </div>
  );
};
