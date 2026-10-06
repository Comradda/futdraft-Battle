import React, { useState } from 'react';
import type { GameType, UserProfile } from '../../types/casino';
import { formatMoney } from '../../utils/storage';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import {
  Trophy,
  Settings,
  Plus,
  Sparkles,
  Play,
  Flame,
  Award,
  Users,
  Wifi,
  Coins,
  Layers,
  CircleDot,
  Music,
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
  isMultiplayerConnected = false,
}) => {
  const [isMusicActive, setIsMusicActive] = useState(() => sound.isMusicPlaying());

  const games: {
    id: GameType;
    title: string;
    subtitle: string;
    description: string;
    badge: string;
    badgeColor: string;
    gradient: string;
    border: string;
    renderIcon: () => React.ReactNode;
    minBet: number;
  }[] = [
    {
      id: 'conquian',
      title: 'Conquián Clásico',
      subtitle: 'Baraja Española Tradicional',
      description: 'El legendario juego de 40 cartas. Forma tercias y corridas hasta bajar 9 cartas y vencer al rival.',
      badge: 'Mano a Mano',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      gradient: 'from-[#0b291e] via-[#061e16] to-[#0a0a0f]',
      border: 'border-emerald-600/40 hover:border-emerald-400',
      renderIcon: () => <OroIcon className="w-8 h-8 filter drop-shadow" />,
      minBet: 25,
    },
    {
      id: 'blackjack',
      title: 'Blackjack 21 VIP',
      subtitle: 'Mesa Estilo Las Vegas',
      description: 'Supera al crupier sin exceder 21. Zapato de 6 barajas, opciones para doblar, dividir y cobro 3:2.',
      badge: 'Pago 3:2',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      gradient: 'from-[#0e1d38] via-[#091326] to-[#0a0a0f]',
      border: 'border-blue-600/40 hover:border-blue-400',
      renderIcon: () => <SpadeIcon className="w-8 h-8 text-blue-400 filter drop-shadow" />,
      minBet: 10,
    },
    {
      id: 'roulette',
      title: 'Ruleta Europea',
      subtitle: 'Rueda 37 Números (0-36)',
      description: 'Giro balístico en Canvas 3D a 60 FPS. Apuestas directas a pleno (35:1), docenas, columnas, rojo y negro.',
      badge: 'Física 3D Real',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      gradient: 'from-[#2e1d08] via-[#1c1205] to-[#0a0a0f]',
      border: 'border-amber-600/40 hover:border-amber-400',
      renderIcon: () => <CircleDot className="w-8 h-8 text-amber-400 animate-spin filter drop-shadow" />,
      minBet: 10,
    },
    {
      id: 'poker',
      title: 'Texas Hold\'em Poker',
      subtitle: 'Duelo Mano a Mano',
      description: 'Enfrentamiento de alta estrategia contra la banca. Flop, Turn y River con cálculo de pot odds y faroles.',
      badge: 'Estrategia Pura',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      gradient: 'from-[#2e0912] via-[#1c050a] to-[#0a0a0f]',
      border: 'border-rose-600/40 hover:border-rose-400',
      renderIcon: () => <Layers className="w-8 h-8 text-rose-400 filter drop-shadow" />,
      minBet: 50,
    },
  ];

  const handleGameClick = (game: GameType) => {
    sound.playCardDeal();
    triggerHaptic('medium');
    onSelectGame(game);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#07070a] overflow-y-auto pb-24 safe-top select-none">
      {/* Top iOS App Bar */}
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-30 bg-[#07070a]/90 backdrop-blur-md">
        {/* User Profile Pill */}
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onOpenProfile();
          }}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-neutral-950 font-black text-xs shadow-inner">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="text-[11px] font-bold text-white leading-tight max-w-[85px] truncate">
              {profile.name}
            </div>
            <div className="text-[9px] text-amber-400 font-semibold leading-tight">
              Socio VIP
            </div>
          </div>
        </button>

        {/* Chips Balance & Multiplayer Link */}
        <div className="flex items-center gap-1.5">
          {/* 2-Player Button */}
          <button
            onClick={() => {
              sound.playChip();
              triggerHaptic('medium');
              onOpenMultiplayer();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-black transition-all cursor-pointer shadow-md ${
              isMultiplayerConnected
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse'
                : 'bg-gradient-to-r from-amber-600/30 to-amber-500/10 border-amber-500/40 text-amber-300 hover:border-amber-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{isMultiplayerConnected ? 'Mesa 2P Activa' : '2 Jugadores'}</span>
          </button>

          {/* Chips Balance Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neutral-900 border border-amber-500/30">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-black text-xs font-mono">
              {formatMoney(profile.bankroll)}
            </span>
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                onOpenAds();
              }}
              title="Obtener fichas de cortesía"
              className="w-4.5 h-4.5 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center font-black hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </button>
          </div>

          {/* Quick Header Actions */}
          <button
            onClick={() => {
              sound.playChip();
              triggerHaptic('light');
              onOpenLeaderboard();
            }}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              const active = sound.toggleCasinoMusic();
              setIsMusicActive(active);
            }}
            title={isMusicActive ? 'Pausar música casino lounge' : 'Música VIP Lounge (Vegas / Caliente)'}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isMusicActive
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200'
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
            className="p-2 rounded-full bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Banner with Multiplayer Callout */}
      <section className="px-4 pt-3.5 pb-2">
        <div className="relative rounded-3xl p-5 bg-gradient-to-r from-[#1f1505] via-[#150e26] to-[#0c0c12] border border-amber-500/30 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Gran Casino Imperial
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Salón Principal
              </h2>
              <p className="text-xs text-neutral-300 mt-1 max-w-[240px] leading-relaxed">
                {profile.crupierPersonality === 'burlona' && '«¿Listo para jugar o vas a quedarte mirando las fichas?»'}
                {profile.crupierPersonality === 'desafiante' && '«Los grandes apostadores triunfan en mi mesa. Demuéstralo.»'}
                {profile.crupierPersonality === 'amigable' && '«¡Bienvenido de nuevo! La mesa está servida y la suerte a tu favor.»'}
                {profile.crupierPersonality === 'neutral' && '«Hagan sus apuestas, señores. Mesa lista y barajas preparadas.»'}
              </p>
            </div>

            {/* Quick 2-player badge action */}
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                onOpenMultiplayer();
              }}
              className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all shadow-lg"
            >
              <Wifi className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-tight">Mesa 2P</span>
              <span className="text-[8px] px-1 rounded bg-amber-400/20 text-amber-300 font-bold">En Vivo</span>
            </button>
          </div>

          {/* Tournament strip */}
          <div
            onClick={() => {
              sound.playChip();
              triggerHaptic('light');
              onOpenLeaderboard();
            }}
            className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-300 cursor-pointer hover:text-white"
          >
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">Torneo Semanal:</span>
              <span className="text-amber-400 font-bold">$100,000 MXN en Premios</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full">
              Ver Ranking &rarr;
            </span>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="px-4 py-2 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
          Mesas Disponibles
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {games.map(game => (
            <div
              key={game.id}
              onClick={() => handleGameClick(game.id)}
              className={`group relative rounded-3xl p-4.5 bg-gradient-to-br ${game.gradient} border ${game.border} 
                shadow-lg hover:shadow-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer overflow-hidden`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {game.renderIcon()}
                  <div>
                    <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                      {game.title}
                    </h4>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      {game.subtitle}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${game.badgeColor}`}>
                  {game.badge}
                </span>
              </div>

              <p className="text-xs text-neutral-300/80 mb-3.5 line-clamp-2 leading-relaxed">
                {game.description}
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                <span className="text-[11px] font-mono text-neutral-400">
                  Apuesta Mín: <b className="text-amber-400">${game.minBet}</b>
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                  Entrar a Mesa <Play className="w-3 h-3 fill-current" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Free chips ad callout */}
      {profile.bankroll < 200 && (
        <section className="px-4 pt-2">
          <div
            onClick={onOpenAds}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2a1b05] to-[#1a1205] border border-amber-400/50 flex items-center justify-between cursor-pointer active:scale-98 transition-transform shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <Coins className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-amber-300">Banca baja de fichas</div>
                <div className="text-[10px] text-neutral-300">
                  Mira un anuncio de 5 segundos para recibir +$500 pesos de cortesía.
                </div>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-amber-400 text-neutral-950 text-xs font-black shadow">
              Recargar
            </button>
          </div>
        </section>
      )}

      {/* Bottom iOS Floating Dock Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 px-6 py-2.5 bg-[#07070a]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around safe-bottom">
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
          }}
          className="flex flex-col items-center gap-0.5 text-amber-400 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-bold">Mesas</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onOpenLeaderboard();
          }}
          className="flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white cursor-pointer"
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-medium">Torneo</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('medium');
            onOpenMultiplayer();
          }}
          className="flex flex-col items-center gap-0.5 text-amber-300 hover:text-white cursor-pointer"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">2 Jugadores</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('medium');
            onOpenAds();
          }}
          className="flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white cursor-pointer"
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px] font-medium">Fichas</span>
        </button>

        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onOpenCustomization();
          }}
          className="flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white cursor-pointer"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Ajustes</span>
        </button>
      </nav>
    </div>
  );
};
