import { useState, useEffect } from 'react';
import type { GameType, UserProfile } from './types/casino';
import { loadUserProfile, saveUserProfile } from './utils/storage';
import { sound } from './utils/audio';
import { triggerHaptic } from './utils/haptics';

// Views and Games
import { LobbyView } from './components/lobby/LobbyView';
import { BlackjackGame } from './components/games/BlackjackGame';
import { PokerGame } from './components/games/PokerGame';
import { ConquianGame } from './components/games/ConquianGame';
import { RouletteGame } from './components/games/RouletteGame';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Modals
import { CustomizationModal } from './components/modals/CustomizationModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { RewardedAdModal } from './components/modals/RewardedAdModal';
import { MultiplayerModal } from './components/modals/MultiplayerModal';
import { DailyRewardModal } from './components/modals/DailyRewardModal';
import { multiplayer } from './utils/multiplayer';

export function App() {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile());
  const [currentGame, setCurrentGame] = useState<GameType>('lobby');

  // Modals state
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);
  const [isMultiplayerConnected, setIsMultiplayerConnected] = useState(false);

  useEffect(() => {
    const unsubStatus = multiplayer.onStatusChange((status) => {
      setIsMultiplayerConnected(status === 'connected');
    });

    const unsubMsg = multiplayer.onMessage((msg) => {
      if (msg.type === 'GAME_ACTION' && msg.payload) {
        if (msg.payload.action === 'START_GAME' && msg.payload.game) {
          setCurrentGame(msg.payload.game);
          setIsMultiplayerOpen(false);
          sound.playCardDeal();
          triggerHaptic('success');
        } else if (msg.payload.action === 'LEAVE_TO_LOBBY') {
          setCurrentGame('lobby');
          sound.playChip();
          triggerHaptic('light');
        }
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, []);

  const handleBackToLobby = () => {
    sound.playChip();
    triggerHaptic('light');
    if (isMultiplayerConnected) {
      multiplayer.send({
        type: 'GAME_ACTION',
        senderId: profile.id,
        senderName: profile.name,
        payload: { action: 'LEAVE_TO_LOBBY' },
        timestamp: Date.now(),
      });
    }
    setCurrentGame('lobby');
  };

  // Sync sound setting on load
  useEffect(() => {
    sound.setEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  // Handle profile updates & persistence
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updated };
      saveUserProfile(next);
      // Synchronize with peer player in real-time
      multiplayer.syncLocalPlayer({
        name: next.name,
        photoUrl: next.photoUrl,
        bankroll: next.bankroll,
        weeklyScore: next.weeklyScore,
      });
      return next;
    });
  };

  // Claim rewarded ad chips
  const handleRewardClaimed = (amount: number) => {
    handleUpdateProfile({
      bankroll: profile.bankroll + amount,
    });
  };

  return (
    <main className="w-full h-screen h-[100dvh] overflow-hidden overflow-x-hidden max-w-full bg-neutral-950 font-sans text-neutral-100 flex flex-col">
      {/* 1. Lobby View */}
      {currentGame === 'lobby' && (
        <LobbyView
          profile={profile}
          onSelectGame={(game: GameType) => {
            setCurrentGame(game);
          }}
          onOpenCustomization={() => setIsCustomizationOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAds={() => setIsAdOpen(true)}
          onOpenDailyReward={() => setIsDailyRewardOpen(true)}
          onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
          isMultiplayerConnected={isMultiplayerConnected}
        />
      )}

      {/* 2. Blackjack 21 Game */}
      {currentGame === 'blackjack' && (
        <ErrorBoundary fallbackTitle="Mesa de Blackjack 21" onBackToLobby={handleBackToLobby}>
          <BlackjackGame
            userProfile={profile}
            onUpdateProfile={handleUpdateProfile}
            onBackToLobby={handleBackToLobby}
            onOpenRechargeModal={() => setIsAdOpen(true)}
          />
        </ErrorBoundary>
      )}

      {/* 3. Texas Hold'em Poker Game */}
      {currentGame === 'poker' && (
        <ErrorBoundary fallbackTitle="Mesa de Texas Hold'em" onBackToLobby={handleBackToLobby}>
          <PokerGame
            userProfile={profile}
            onUpdateProfile={handleUpdateProfile}
            onBackToLobby={handleBackToLobby}
            onOpenRechargeModal={() => setIsAdOpen(true)}
          />
        </ErrorBoundary>
      )}

      {/* 4. Conquian Game */}
      {currentGame === 'conquian' && (
        <ErrorBoundary fallbackTitle="Mesa de Conquián" onBackToLobby={handleBackToLobby}>
          <ConquianGame
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onBackToLobby={handleBackToLobby}
          />
        </ErrorBoundary>
      )}

      {/* 5. European Roulette Game */}
      {currentGame === 'roulette' && (
        <ErrorBoundary fallbackTitle="Mesa de Ruleta Europea" onBackToLobby={handleBackToLobby}>
          <RouletteGame
            userProfile={profile}
            onUpdateProfile={handleUpdateProfile}
            onBackToLobby={handleBackToLobby}
            onOpenRechargeModal={() => setIsAdOpen(true)}
          />
        </ErrorBoundary>
      )}

      {/* Global Modals */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={profile}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={handleUpdateProfile}
      />

      <RewardedAdModal
        isOpen={isAdOpen}
        onClose={() => setIsAdOpen(false)}
        onRewardClaimed={handleRewardClaimed}
      />

      <MultiplayerModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        currentUser={profile}
        onStartMultiplayerGame={(game: GameType) => {
          setCurrentGame(game);
        }}
      />

      <DailyRewardModal
        isOpen={isDailyRewardOpen}
        onClose={() => setIsDailyRewardOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />
    </main>
  );
}

export default App;
