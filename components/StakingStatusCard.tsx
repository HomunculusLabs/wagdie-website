'use client'

import React from 'react';
import { useStakingStatus } from '@/hooks/useStaking'
import { shortenAddress } from '@/lib/utils/blockchain'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'

interface StakingStatusCardProps {
  tokenId: number
  className?: string
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-black/30 border border-neutral-800 p-3">
      <p className="text-[10px] font-display  tracking-widest text-neutral-500 mb-1">{label}</p>
      <p className={`text-sm text-neutral-200 ${mono ? 'font-mono' : 'font-display  tracking-wider'}`}>
        {value}
      </p>
    </div>
  )
}

export function StakingStatusCard({ tokenId, className = '' }: StakingStatusCardProps) {
  const { status, isLoading, error, refetch } = useStakingStatus(tokenId)

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Staking Status</CardTitle>
        <Button
          variant="secondary"
          onClick={refetch}
          disabled={isLoading}
          className="h-8 px-3 text-xs"
        >
          {isLoading ? <Spinner size="sm" /> : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Spinner size="md" />
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive">{error.message}</Alert>
        )}

        {!isLoading && !error && status && (
          <div className="space-y-3">
            {status.isStaked ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-emerald-900/20 border border-emerald-800/50 text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-display  tracking-wider text-neutral-200">Staked</p>
                      <Badge variant="accent">Active</Badge>
                    </div>
                    <p className="text-[10px] font-display  tracking-widest text-neutral-500">Character is currently staked</p>
                  </div>
                </div>

                {status.locationName && (
                  <InfoRow
                    label="Location"
                    value={status.locationId ? `${status.locationName} (#${status.locationId})` : status.locationName}
                  />
                )}

                {status.locationOwner && (
                  <InfoRow label="Location Owner" value={shortenAddress(status.locationOwner)} mono />
                )}

                {status.nftsLocked && (
                  <Alert variant="warning">NFTs are locked at this location</Alert>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <p className="text-sm font-display  tracking-wider text-neutral-400">Not Staked</p>
                  <p className="text-[10px] font-display  tracking-widest text-neutral-600">Character is in your wallet</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
