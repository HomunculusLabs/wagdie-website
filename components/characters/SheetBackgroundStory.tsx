/**
 * SheetBackgroundStory Component
 * Editable character background story (owners only)
 */

'use client'

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
    <div className="bg-midnight rounded-lg p-6">
      <h3 className="text-2xl font-bold text-bone mb-4">Background Story</h3>

      {isEditMode ? (
        <textarea
          value={story || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your character's story..."
          maxLength={5000}
          className="w-full h-64 bg-shadow text-bone border border-shadow rounded p-4 focus:border-gold focus:outline-none resize-none"
        />
      ) : (
        <div className="text-ash whitespace-pre-wrap">
          {story || (
            <p className="text-mist italic">
              {isOwner
                ? 'No story yet. Click Edit to add your character\'s background.'
                : 'No story has been written for this character.'}
            </p>
          )}
        </div>
      )}

      {isEditMode && (
        <p className="text-sm text-mist mt-2">
          {(story || '').length} / 5000 characters
        </p>
      )}
    </div>
  )
}
