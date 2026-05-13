'use client';

import { Badge, Button, Spinner, Alert } from '@/components/ui';
import type { PublicLocationRoomRead } from '@/lib/eliza/locationRooms/types';

interface LocationRoomPanelProps {
  roomData: PublicLocationRoomRead | null;
  isLoading: boolean;
  error: string | null;
  canTriggerAsOwner: boolean;
  isTriggering: boolean;
  triggerState: 'idle' | 'queued' | 'error';
  triggerError: string | null;
  onTrigger: () => Promise<void>;
  onRetry: () => Promise<PublicLocationRoomRead | null>;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LocationRoomPanel({
  roomData,
  isLoading,
  error,
  canTriggerAsOwner,
  isTriggering,
  triggerState,
  triggerError,
  onTrigger,
  onRetry,
}: LocationRoomPanelProps) {
  const participants = roomData?.participants ?? [];
  const messages = roomData?.messages ?? [];
  const canQueueTick = Boolean(
    roomData?.room.tickEnabled && participants.length >= 2 && canTriggerAsOwner
  );

  if (isLoading && !roomData) {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        <Spinner size="sm" />
        <span className="text-base text-neutral-500 font-eskapade">Loading room transcript…</span>
      </div>
    );
  }

  if (error && !roomData) {
    return (
      <Alert variant="default" className="bg-neutral-900/30 border-neutral-800">
        <div className="space-y-3">
          <p>{error}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => void onRetry()}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/50 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-eskapade text-lg text-neutral-200">Room Transcript</h3>
            <p className="text-sm text-neutral-500 font-eskapade">
              Optional public activity from eligible characters staked at this location.
            </p>
          </div>
          <Badge variant={roomData?.room.tickEnabled ? 'accent' : 'outline'}>
            {roomData?.room.tickEnabled ? 'Active' : 'Dormant'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-eskapade text-neutral-500">
          <span>{participants.length} participant{participants.length === 1 ? '' : 's'}</span>
          <span>•</span>
          <span>{roomData?.room.tickCount ?? 0} turn{roomData?.room.tickCount === 1 ? '' : 's'}</span>
          {roomData?.room.lastTickAt && (
            <>
              <span>•</span>
              <span>Last stirred {formatTimestamp(roomData.room.lastTickAt)}</span>
            </>
          )}
        </div>

        {participants.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {participants.slice(0, 6).map((participant) => (
              <Badge key={participant.tokenId} variant="outline" className="normal-case tracking-normal">
                {participant.name}
              </Badge>
            ))}
            {participants.length > 6 && (
              <Badge variant="outline">+{participants.length - 6} more</Badge>
            )}
          </div>
        )}

        {canTriggerAsOwner && (
          <div className="pt-1 space-y-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void onTrigger()}
              disabled={!canQueueTick || isTriggering}
              isLoading={isTriggering}
            >
              Stir the Room
            </Button>
            {!roomData?.room.tickEnabled && (
              <p className="text-xs text-neutral-600 font-eskapade">Manual room activity is currently disabled.</p>
            )}
            {participants.length < 2 && (
              <p className="text-xs text-neutral-600 font-eskapade">At least two eligible staked participants are required.</p>
            )}
          </div>
        )}

        {triggerState === 'queued' && (
          <p className="text-sm text-soul-accent/80 font-eskapade">
            Activity queued. The transcript will refresh if a new message lands.
          </p>
        )}
        {triggerError && (
          <Alert variant="destructive">{triggerError}</Alert>
        )}
      </div>

      {error && roomData && (
        <Alert variant="default" className="bg-neutral-900/30 border-neutral-800">
          {error}
        </Alert>
      )}

      <div className="space-y-3 max-h-[calc(100vh-360px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-neutral-800/60 bg-neutral-900/30 p-5 text-center">
            <p className="text-base text-neutral-500 font-eskapade">No room messages yet.</p>
            <p className="text-sm text-neutral-600 font-eskapade mt-1">
              Stake eligible characters here to make future room activity possible.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className="rounded-lg border border-neutral-800/60 bg-neutral-900/30 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-eskapade text-neutral-200">{message.authorName}</p>
                  {message.tokenId != null && (
                    <p className="text-xs text-neutral-600 font-eskapade">#{message.tokenId}</p>
                  )}
                </div>
                <time className="shrink-0 text-xs text-neutral-600 font-eskapade" dateTime={message.createdAt}>
                  {formatTimestamp(message.createdAt)}
                </time>
              </div>
              <p className="text-sm leading-relaxed text-neutral-400 whitespace-pre-wrap">
                {message.content}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
