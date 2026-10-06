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

// Modals
import { CustomizationModal } from './components/modals/CustomizationModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { RewardedAdModal } from './components/modals/RewardedAdModal';
import { MultiplayerModal } from './components/modals/MultiplayerModal';
import { multiplayer } from './utils/multiplayer';

export function App() {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile());
  const [currentGame, setCurrentGame] = useState<GameType>('lobby');

  // Modals state
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);
  const [isMultiplayerConnected, setIsMultiplayerConnected] = useState(false);

  useEffect(() => {
    const unsub = multiplayer.onStatusChange((status) => {
      setIsMultiplayerConnected(status === 'connected');
    });
    return unsub;
  }, []);

  // Sync sound setting on load
  useEffect(() => {
    sound.setEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  // Handle profile updates & persistence
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updated };
      saveUserProfile(next);
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
    <main className="w-full h-screen h-[100dvh] overflow-hidden bg-neutral-950 font-sans text-neutral-100 flex flex-col">
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
          onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
          isMultiplayerConnected={isMultiplayerConnected}
        />
      )}

      {/* 2. Blackjack 21 Game */}
      {currentGame === 'blackjack' && (
        <BlackjackGame
          userProfile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBackToLobby={() => {
            sound.playChip();
            triggerHaptic('light');
            setCurrentGame('lobby');
          }}
          onOpenRechargeModal={() => setIsAdOpen(true)}
        />
      )}

      {/* 3. Texas Hold'em Poker Game */}
      {currentGame === 'poker' && (
        <PokerGame
          userProfile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBackToLobby={() => {
            sound.playChip();
            triggerHaptic('light');
            setCurrentGame('lobby');
          }}
          onOpenRechargeModal={() => setIsAdOpen(true)}
        />
      )}

      {/* 4. Conquian Game */}
      {currentGame === 'conquian' && (
        <ConquianGame
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBackToLobby={() => {
            sound.playChip();
            triggerHaptic('light');
            setCurrentGame('lobby');
          }}
        />
      )}

      {/* 5. European Roulette Game */}
      {currentGame === 'roulette' && (
        <RouletteGame
          userProfile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBackToLobby={() => {
            sound.playChip();
            triggerHaptic('light');
            setCurrentGame('lobby');
          }}
          onOpenRechargeModal={() => setIsAdOpen(true)}
        />
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
    </main>
  );
}

export default App;
