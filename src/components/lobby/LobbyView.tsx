import React from 'react';
import type { GameType, UserProfile } from '../../types/casino';
import { formatMoney } from '../../utils/storage';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { Trophy, Settings, Plus, Sparkles, Play, Flame, Award } from 'lucide-react';

interface LobbyViewProps {
  profile: UserProfile;
  onSelectGame: (game: GameType) => void;
  onOpenCustomization: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenAds: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  profile,
  onSelectGame,
  onOpenCustomization,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenAds,
}) => {
  const games: {
    id: GameType;
    title: string;
    subtitle: string;
    description: string;
    badge: string;
    badgeColor: string;
    gradient: string;
    border: string;
    icon: string;
    minBet: number;
  }[] = [
    {
      id: 'conquian',
      title: 'Conquián Clásico',
      subtitle: 'Baraja Española Tradicional',
      description: 'El auténtico juego mexicano de 40 cartas. Forma tercias y corridas hasta bajar 9 cartas.',
      badge: '🇲🇽 Más Popular',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      gradient: 'from-emerald-950 via-teal-950 to-neutral-900',
      border: 'border-emerald-600/40 hover:border-emerald-400',
      icon: '🎴',
      minBet: 25,
    },
    {
      id: 'blackjack',
      title: 'Blackjack 21 VIP',
      subtitle: 'Mesa Estilo Las Vegas',
      description: 'Supera la mano del Crupier sin pasarte de 21. El Crupier pide en 16 y se planta en 17.',
      badge: '⚡ Pago 3:2',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      gradient: 'from-blue-950 via-indigo-950 to-neutral-900',
      border: 'border-blue-600/40 hover:border-blue-400',
      icon: '♠️',
      minBet: 10,
    },
    {
      id: 'roulette',
      title: 'Ruleta Europea',
      subtitle: 'Rueda 37 Números (0-36)',
      description: 'Gira la bola con física 3D en tiempo real. Apuesta a pleno, cuadro, docenas, rojo o negro.',
      badge: '🎡 Clásico VIP',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      gradient: 'from-amber-950 via-yellow-950 to-neutral-900',
      border: 'border-amber-600/40 hover:border-amber-400',
      icon: '🎰',
      minBet: 10,
    },
    {
      id: 'poker',
      title: 'Texas Hold\'em Poker',
      subtitle: 'Mano a Mano Heads-Up',
      description: 'Duelo cara a cara contra el Crupier. Ronda de Flop, Turn y River con cálculo de faroles.',
      badge: '🔥 Alta Tensión',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      gradient: 'from-rose-950 via-red-950 to-neutral-900',
      border: 'border-rose-600/40 hover:border-rose-400',
      icon: '🃏',
      minBet: 50,
    },
  ];

  const handleGameClick = (game: GameType) => {
    sound.playCardDeal();
    triggerHaptic('medium');
    onSelectGame(game);
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 overflow-y-auto pb-24 safe-top">
      {/* Top iOS App Bar */}
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md">
        {/* User Profile Pill */}
        <button
          onClick={() => {
            sound.playChip();
            triggerHaptic('light');
            onOpenProfile();
          }}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
        >
          <span className="text-xl leading-none">{profile.avatar}</span>
          <div className="text-left">
            <div className="text-[11px] font-bold text-white leading-tight max-w-[85px] truncate">
              {profile.name}
            </div>
            <div className="text-[9px] text-amber-400 font-semibold leading-tight">
              Torneo #{profile.weeklyScore > 20000 ? 'Top 3' : 'En Juego'}
            </div>
          </div>
        </button>

        {/* Chips Balance Pill */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            <span className="text-amber-400 font-black text-xs font-mono">
              {formatMoney(profile.bankroll)}
            </span>
            <button
              onClick={() => {
                sound.playChip();
                triggerHaptic('medium');
                onOpenAds();
              }}
              title="Obtener más fichas gratis"
              className="w-5 h-5 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center font-black hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
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

      {/* Hero Banner / Greeting */}
      <section className="px-4 pt-4 pb-2">
        <div className="relative rounded-3xl p-5 bg-gradient-to-r from-amber-900/40 via-purple-900/30 to-neutral-900 border border-amber-500/30 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Gran Casino Imperial
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Mesa del Crupier VIP
              </h2>
              <p className="text-xs text-neutral-300 mt-1 max-w-[220px]">
                {profile.crupierPersonality === 'burlona' && '«¿Listo para perder o vas a demostrar que tienes agallas hoy?»'}
                {profile.crupierPersonality === 'desafiante' && '«Solo los grandes apostadores triunfan en mi mesa. Pruébalo.»'}
                {profile.crupierPersonality === 'amigable' && '«¡Qué gusto verte de nuevo! Hoy la suerte está de tu lado.»'}
                {profile.crupierPersonality === 'neutral' && '«Hagan sus apuestas, señores. Mesa lista y barajas preparadas.»'}
              </p>
            </div>

            <div className="text-4xl animate-bounce">
              {profile.crupierPersonality === 'burlona' && '😏'}
              {profile.crupierPersonality === 'desafiante' && '😈'}
              {profile.crupierPersonality === 'amigable' && '🤝'}
              {profile.crupierPersonality === 'neutral' && '🎩'}
            </div>
          </div>

          {/* Quick tournament banner */}
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
              <span className="font-semibold">Mini-Torneo Semanal:</span>
              <span className="text-amber-400 font-bold">$100,000 en Premios</span>
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
          Selecciona una Mesa
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
                <div className="flex items-center gap-2">
                  <span className="text-3xl filter drop-shadow">{game.icon}</span>
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
            className="p-3.5 rounded-2xl bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border border-amber-400/50 flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-xs font-bold text-amber-300">¡Banca baja de fichas!</div>
                <div className="text-[10px] text-neutral-300">
                  Mira un video de 5 segundos para recibir +$500 pesos gratis.
                </div>
              </div>
            </div>
            <button className="px-2.5 py-1 rounded-lg bg-amber-400 text-neutral-950 text-xs font-bold shadow">
              Recargar
            </button>
          </div>
        </section>
      )}

      {/* Bottom iOS Floating Dock Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 px-6 py-2.5 bg-neutral-950/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around safe-bottom">
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
            onOpenAds();
          }}
          className="flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white cursor-pointer"
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px] font-medium">Fichas Gratis</span>
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
