import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  Users,
  Copy,
  Check,
  Radio,
  Play,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { UserProfile, GameType } from '../../types/casino';
import { multiplayer } from '../../utils/multiplayer';
import type { MultiplayerStatus } from '../../utils/multiplayer';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onStartMultiplayerGame: (game: GameType) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onStartMultiplayerGame,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [status, setStatus] = useState<MultiplayerStatus>('disconnected');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<GameType>('conquian');

  useEffect(() => {
    const unsubStatus = multiplayer.onStatusChange((newStatus, details) => {
      setStatus(newStatus);
      if (details) setStatusMsg(details);
      if (newStatus === 'connected') {
        sound.playWin();
        triggerHaptic('success');
      }
    });

    const unsubMsg = multiplayer.onMessage((msg) => {
      if (msg.type === 'GAME_ACTION' && msg.payload) {
        if (msg.payload.action === 'START_GAME' && msg.payload.game) {
          sound.playCardDeal();
          triggerHaptic('success');
          onStartMultiplayerGame(msg.payload.game);
          onClose();
        } else if (msg.payload.action === 'SELECT_GAME' && msg.payload.game) {
          setSelectedGame(msg.payload.game);
        }
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, [onStartMultiplayerGame, onClose]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    sound.playChip();
    triggerHaptic('medium');
    try {
      const code = await multiplayer.createRoom({
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      });
      setRoomCode(code);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) return;
    sound.playChip();
    triggerHaptic('medium');
    try {
      await multiplayer.joinRoom(inputCode, {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    triggerHaptic('light');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    multiplayer.send({
      type: 'GAME_ACTION',
      senderId: currentUser.id,
      senderName: currentUser.name,
      payload: { action: 'START_GAME', game: selectedGame },
      timestamp: Date.now(),
    });
    onStartMultiplayerGame(selectedGame);
    onClose();
  };

  const isConnected = status === 'connected';
  const remotePlayer = multiplayer.getRemotePlayer();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-neutral-900 border border-amber-500/40 shadow-2xl p-5 text-white flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">Mesa Privada Multijugador</h3>
              <p className="text-[10px] text-amber-300 font-medium">Juega en vivo mano a mano desde dos celulares</p>
            </div>
          </div>
          <button
            onClick={() => {
              multiplayer.disconnect();
              onClose();
            }}
            className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher if not connected */}
        {!isConnected && (
          <div className="flex p-1 my-3.5 rounded-xl bg-neutral-800 border border-neutral-700/60">
            <button
              onClick={() => {
                setTab('create');
                triggerHaptic('light');
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'create' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Crear Mesa
            </button>
            <button
              onClick={() => {
                setTab('join');
                triggerHaptic('light');
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'join' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" /> Unirse a Mesa
            </button>
          </div>
        )}

        {/* Content */}
        {!isConnected ? (
          <div>
            {tab === 'create' ? (
              <div className="space-y-4 py-2">
                <div className="text-center">
                  <div className="text-xs text-neutral-300 mb-1">
                    Crea una sala y dile a tu hermano que ingrese el código desde su iPhone:
                  </div>

                  {status === 'waiting' && roomCode ? (
                    <div className="my-4 p-4 rounded-2xl bg-neutral-950 border-2 border-amber-400/60 text-center">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1">
                        CÓDIGO DE LA MESA
                      </div>
                      <div className="text-4xl font-black font-mono tracking-widest text-white mb-2">
                        {roomCode}
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={handleCopyCode}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-xs font-bold text-amber-300 flex items-center gap-1.5"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copiado' : 'Copiar Código'}
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-neutral-400 animate-pulse">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        Esperando que tu hermano se conecte...
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleCreate}
                      disabled={status === 'creating'}
                      className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 font-black text-neutral-950 text-xs tracking-wider uppercase shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 fill-current" />
                      {status === 'creating' ? 'Generando Mesa...' : 'Generar Código de Mesa'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                    Ingresa el Código de la Mesa:
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Ejemplo: 4821"
                    maxLength={6}
                    className="w-full text-center text-2xl font-mono font-black tracking-widest px-4 py-3 rounded-xl bg-neutral-950 border border-amber-500/40 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {statusMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
                    {statusMsg}
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={status === 'joining' || !inputCode.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 font-black text-neutral-950 text-xs tracking-wider uppercase shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Wifi className="w-4 h-4" />
                  {status === 'joining' ? 'Conectando con tu hermano...' : 'Entrar a la Mesa'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* CONNECTED STATE */
          <div className="py-3 space-y-4 animate-scaleUp">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-300">¡Conectados en Vivo!</div>
                  <div className="text-[11px] text-neutral-300">
                    Oponente: <b className="text-white">{remotePlayer?.name || 'Tu Hermano'}</b>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                P2P Activo
              </span>
            </div>

            {/* Game Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  {multiplayer.getIsHost() ? 'Selecciona el Juego a Jugar Juntos:' : 'Juego Seleccionado por el Anfitrión:'}
                </label>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {multiplayer.getIsHost() ? 'Eres el Anfitrión' : 'Eres Invitado'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'futdraft', name: 'FUTDRAFT FC 27', desc: 'Tácticas & Auto-Battler' },
                  { id: 'blackjack', name: 'Blackjack 21', desc: 'Misma mesa vs Crupier' },
                  { id: 'conquian', name: 'Conquián Clásico', desc: 'Mano a mano 40 cartas' },
                  { id: 'roulette', name: 'Ruleta Europea', desc: 'Mismo paño y rueda' },
                  { id: 'poker', name: 'Texas Hold\'em', desc: 'Duelo de apuestas' },
                ].map((g) => {
                  const active = selectedGame === g.id;
                  const isHost = multiplayer.getIsHost();
                  return (
                    <button
                      key={g.id}
                      disabled={!isHost}
                      onClick={() => {
                        if (!isHost) return;
                        setSelectedGame(g.id as GameType);
                        triggerHaptic('light');
                        multiplayer.send({
                          type: 'GAME_ACTION',
                          senderId: currentUser.id,
                          senderName: currentUser.name,
                          payload: { action: 'SELECT_GAME', game: g.id },
                          timestamp: Date.now(),
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-amber-400 bg-amber-500/20 text-white ring-2 ring-amber-400/40 shadow-lg'
                          : 'border-neutral-700 bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                      <div className="text-xs font-bold text-amber-300">{g.name}</div>
                      <div className="text-[10px] text-neutral-400">{g.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {multiplayer.getIsHost() ? (
              <button
                onClick={handleStartGame}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-black text-white text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Comenzar Partida Mano a Mano
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-amber-500/30 text-center animate-pulse flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
                <Radio className="w-4 h-4 text-amber-400 animate-spin" />
                Esperando que {remotePlayer?.name || 'tu hermano'} inicie la mesa...
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Conexión encriptada directa
          </span>
          <span className="font-mono text-[10px] text-neutral-500">WebRTC P2P</span>
        </div>
      </div>
    </div>
  );
};
