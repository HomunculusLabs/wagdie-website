'use client';

import { useState, useEffect } from 'react';

export function useWallet() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStage, setConnectionStage] = useState('');
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionStages] = useState([
    'Detecting wallet',
    'Requesting connection',
    'Verifying signature',
    'Fetching character data',
    'Complete',
  ]);

  // Mock wallet connection for demo purposes
  // In production, this would integrate with wagmi/viem
  const connectWallet = async () => {
    setIsConnecting(true);
    setConnectionStage('Detecting wallet');
    setConnectionProgress(0);

    try {
      // Stage 1: Detect wallet
      setConnectionStage('Detecting wallet');
      setConnectionProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Stage 2: Request connection
      setConnectionStage('Requesting connection');
      setConnectionProgress(40);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Stage 3: Verify signature
      setConnectionStage('Verifying signature');
      setConnectionProgress(60);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Mock wallet address (in production, get from wallet provider)
      const mockWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      setConnectedWallet(mockWalletAddress);

      // Stage 4: Fetch character data
      setConnectionStage('Fetching character data');
      setConnectionProgress(80);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Stage 5: Complete
      setConnectionStage('Complete');
      setConnectionProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('[useWallet] Connected wallet:', mockWalletAddress);
    } catch (error) {
      console.error('[useWallet] Failed to connect wallet:', error);
      setConnectionStage('Error connecting wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setConnectionStage('');
    setConnectionProgress(0);
    console.log('[useWallet] Disconnected wallet');
  };

  // Auto-connect for demo (optional)
  useEffect(() => {
    // Uncomment to auto-connect in demo
    // connectWallet();
  }, []);

  return {
    connectedWallet,
    isConnecting,
    connectionStage,
    connectionProgress,
    connectionStages,
    connectWallet,
    disconnectWallet,
  };
}
