/**
 * PhaserGame Component
 *
 * React bridge component that initializes and manages the Phaser game instance.
 * Provides refs for accessing the game and current scene from React components.
 */

'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as Phaser from 'phaser';
import { createGame } from './main';
import { EventBus, MapEvents } from './EventBus';
import type { MapScene } from './scenes/MapScene';

export interface IRefPhaserGame {
  game: Phaser.Game | null;
  scene: MapScene | null;
}

interface PhaserGameProps {
  className?: string;
  onSceneReady?: (scene: MapScene) => void;
  onMapReady?: (info: { width: number; height: number; zoom: number }) => void;
  onMarkerClick?: (marker: any) => void;
  onMarkerHover?: (marker: any) => void;
  onMarkerUnhover?: () => void;
  onCameraChange?: (info: { scrollX: number; scrollY: number; zoom: number }) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, PhaserGameProps>(
  (
    {
      className = '',
      onSceneReady,
      onMapReady,
      onMarkerClick,
      onMarkerHover,
      onMarkerUnhover,
      onCameraChange,
    },
    ref
  ) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<MapScene | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose game and scene to parent component
    useImperativeHandle(ref, () => ({
      get game() {
        return gameRef.current;
      },
      get scene() {
        return sceneRef.current;
      },
    }));

    useEffect(() => {
      // Guard against SSR
      if (typeof window === 'undefined') return;
      if (!containerRef.current) return;

      // Create game instance
      const containerId = `phaser-container-${Date.now()}`;
      containerRef.current.id = containerId;

      gameRef.current = createGame(containerId);

      // Set up event listeners
      const handleSceneReady = (scene: MapScene) => {
        sceneRef.current = scene;
        onSceneReady?.(scene);
      };

      const handleMapReady = (info: { width: number; height: number; zoom: number }) => {
        onMapReady?.(info);
      };

      const handleMarkerClick = (marker: any) => {
        onMarkerClick?.(marker);
      };

      const handleMarkerHover = (marker: any) => {
        onMarkerHover?.(marker);
      };

      const handleMarkerUnhover = () => {
        onMarkerUnhover?.();
      };

      const handleCameraChange = (info: { scrollX: number; scrollY: number; zoom: number }) => {
        onCameraChange?.(info);
      };

      EventBus.on(MapEvents.SCENE_READY, handleSceneReady);
      EventBus.on(MapEvents.MAP_READY, handleMapReady);
      EventBus.on(MapEvents.MARKER_CLICKED, handleMarkerClick);
      EventBus.on(MapEvents.MARKER_HOVERED, handleMarkerHover);
      EventBus.on(MapEvents.MARKER_UNHOVERED, handleMarkerUnhover);
      EventBus.on(MapEvents.CAMERA_CHANGED, handleCameraChange);

      // Cleanup on unmount
      return () => {
        EventBus.off(MapEvents.SCENE_READY, handleSceneReady);
        EventBus.off(MapEvents.MAP_READY, handleMapReady);
        EventBus.off(MapEvents.MARKER_CLICKED, handleMarkerClick);
        EventBus.off(MapEvents.MARKER_HOVERED, handleMarkerHover);
        EventBus.off(MapEvents.MARKER_UNHOVERED, handleMarkerUnhover);
        EventBus.off(MapEvents.CAMERA_CHANGED, handleCameraChange);

        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
          sceneRef.current = null;
        }
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
    );
  }
);

PhaserGame.displayName = 'PhaserGame';

export default PhaserGame;
