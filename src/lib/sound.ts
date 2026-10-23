import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { log } from './log';

export type SoundKind = 'key' | 'success' | 'error';

const SOURCES: Record<SoundKind, number> = {
  key: require('../../assets/sounds/key.wav'),
  success: require('../../assets/sounds/success.wav'),
  error: require('../../assets/sounds/error.wav'),
};

const players: Partial<Record<SoundKind, AudioPlayer>> = {};
let configured = false;

/**
 * Fire-and-forget UI sounds. Players are reused; failures are silent so a
 * missing audio route never blocks a guess.
 */
export function playSound(kind: SoundKind): void {
  try {
    if (!configured) {
      configured = true;
      setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(
        () => {}
      );
    }

    let player = players[kind];
    if (!player) {
      player = createAudioPlayer(SOURCES[kind]);
      players[kind] = player;
    }

    void player
      .seekTo(0)
      .then(() => player?.play())
      .catch(() => {});
  } catch (error) {
    log.warn('Sound', 'Could not play sound:', error);
  }
}
