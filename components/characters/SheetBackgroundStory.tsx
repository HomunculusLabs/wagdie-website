'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components-new/Card'
import { TextArea } from '@/components-new/TextArea'

interface SheetBackgroundStoryProps {
  story: string | null
  isEditMode: boolean
  isOwner: boolean
  onChange: (story: string) => void
}

export function SheetBackgroundStory({
  story,
  isEditMode,
  isOwner,
  onChange
}: SheetBackgroundStoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Background Story</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditMode ? (
          <div className="space-y-2">
            <TextArea
              value={story || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Write your character's story..."
              maxLength={5000}
              className="min-h-[200px]"
            />
            <p className="text-xs text-neutral-500 font-display uppercase tracking-widest">
              {(story || '').length} / 5000 characters
            </p>
          </div>
        ) : (
          <div className="text-neutral-400 font-serif whitespace-pre-wrap leading-relaxed">
            {story || (
              <p className="italic text-neutral-600">
                {isOwner
                  ? 'No story yet. Click Edit to add your character\'s background.'
                  : 'No story has been written for this character.'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
