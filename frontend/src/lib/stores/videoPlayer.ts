import { writable, derived } from 'svelte/store';
import type { VideoPlayerInstance, VideoPlayerState } from '$lib/types/homepage';

// Store for all video player instances
export const videoPlayers = writable<Map<string, VideoPlayerInstance>>(new Map());

// Derived store to get a specific player by ID
export const getVideoPlayer = (id: string) => derived(
  videoPlayers,
  ($players) => $players.get(id)
);

// Derived store to check if any video is playing
export const anyVideoPlaying = derived(
  videoPlayers,
  ($players) => {
    for (const player of $players.values()) {
      if (player.state.isPlaying) return true;
    }
    return false;
  }
);

// Video player actions
export const videoPlayerActions = {
  register: (id: string, element: HTMLVideoElement) => {
    videoPlayers.update(players => {
      const newInstance: VideoPlayerInstance = {
        id,
        element,
        state: {
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          volume: 1,
          isLoading: true,
          hasError: false
        }
      };
      players.set(id, newInstance);
      return players;
    });
  },
  
  unregister: (id: string) => {
    videoPlayers.update(players => {
      players.delete(id);
      return players;
    });
  },
  
  updateState: (id: string, updates: Partial<VideoPlayerState>) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player) {
        player.state = { ...player.state, ...updates };
        players.set(id, player);
      }
      return players;
    });
  },
  
  play: (id: string) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element && player.element.paused) {
        player.element.play().catch(error => {
          console.error(`Error playing video ${id}:`, error);
          player.state.hasError = true;
        });
        player.state.isPlaying = true;
        players.set(id, player);
      }
      return players;
    });
  },
  
  pause: (id: string) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element && !player.element.paused) {
        player.element.pause();
        player.state.isPlaying = false;
        players.set(id, player);
      }
      return players;
    });
  },
  
  togglePlayPause: (id: string) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element) {
        if (player.element.paused) {
          videoPlayerActions.play(id);
        } else {
          videoPlayerActions.pause(id);
        }
      }
      return players;
    });
  },
  
  seek: (id: string, time: number) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element) {
        player.element.currentTime = Math.max(0, Math.min(time, player.state.duration));
        player.state.currentTime = player.element.currentTime;
        players.set(id, player);
      }
      return players;
    });
  },
  
  setVolume: (id: string, volume: number) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        player.element.volume = clampedVolume;
        player.state.volume = clampedVolume;
        players.set(id, player);
      }
      return players;
    });
  },
  
  fullscreen: (id: string) => {
    videoPlayers.update(players => {
      const player = players.get(id);
      if (player?.element && player.element.requestFullscreen) {
        player.element.requestFullscreen().catch(error => {
          console.error(`Error entering fullscreen for video ${id}:`, error);
        });
      }
      return players;
    });
  },
  
  // Pause all other videos when one starts playing
  pauseOthers: (activeId: string) => {
    videoPlayers.update(players => {
      for (const [id, player] of players.entries()) {
        if (id !== activeId && player.state.isPlaying) {
          videoPlayerActions.pause(id);
        }
      }
      return players;
    });
  }
};
