'use client';

export function WalletGate() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800/50 flex items-center justify-center mb-4 shadow-lg">
        <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
      </div>
      <p className="text-base text-neutral-400 font-eskapade mb-1">Wallet not connected</p>
      <p className="text-sm text-neutral-600 font-eskapade">Browse the map freely. Connect to view and stake your characters.</p>
    </div>
  );
}

