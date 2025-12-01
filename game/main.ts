/**
 * Phaser Game Configuration
 *
 * Main entry point for the Phaser game instance.
 * Configures the game canvas, scenes, and rendering options.
 */

import * as Phaser from 'phaser';
import { MapScene } from './scenes/MapScene';

// Game configuration
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Auto-detect WebGL or Canvas
  parent: 'phaser-container',
  backgroundColor: '#0a0a0a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MapScene],
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  input: {
    mouse: {
      preventDefaultWheel: true,
    },
    touch: {
      capture: true,
    },
  },
};

/**
 * Create a new Phaser game instance
 */
export function createGame(containerId?: string): Phaser.Game {
  const config = { ...gameConfig };
  if (containerId) {
    config.parent = containerId;
  }
  return new Phaser.Game(config);
}
