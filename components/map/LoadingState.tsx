'use client';

interface LoadingStateProps {
  message?: string;
  progress?: number; // 0-100
  stage?: string;
  showProgress?: boolean;
  stageList?: string[];
  currentStage?: number;
}

export function LoadingState({
  message = 'Loading WAGDIE World...',
  progress = 0,
  stage,
  showProgress = false,
  stageList = [],
  currentStage = -1,
}: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-abyss">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Enhanced WAGDIE Loading Animation */}
        <div className="mb-6 relative">
          <div className="inline-block animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-gold border-r-2 border-l-2"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-ember rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="font-display text-gold text-2xl mb-2 tracking-normal">{message}</div>

        {/* Current Stage */}
        {stage && (
          <div className="font-display text-bone text-lg mb-4 tracking-normal">{stage}</div>
        )}

        {/* Stage List */}
        {stageList.length > 0 && (
          <div className="mb-4 space-y-2">
            {stageList.map((stageName, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 justify-start text-left font-display text-sm transition-all duration-300 ${
                  index === currentStage
                    ? 'text-gold'
                    : index < currentStage
                    ? 'text-mist line-through'
                    : 'text-ash'
                }`}
              >
                {/* Stage indicator */}
                <div className="flex-shrink-0">
                  {index === currentStage ? (
                    <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                  ) : index < currentStage ? (
                    <svg className="w-4 h-4 text-poison" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 border-2 border-ash rounded-full"></div>
                  )}
                </div>
                <span className={index === currentStage ? 'font-semibold' : ''}>{stageName}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {(showProgress || progress > 0) && (
          <div className="w-full h-3 bg-midnight rounded-full mx-auto overflow-hidden border border-gold/30 mb-4">
            <div
              className="h-full bg-gradient-to-r from-gold via-ember to-gold transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
        )}

        {/* Progress Percentage */}
        {(showProgress || progress > 0) && (
          <div className="font-display text-mist text-sm mb-3">{Math.round(progress)}% complete</div>
        )}

        {/* Loading Dots */}
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

// Inline skeleton components for different parts of the UI
export function MapLoadingSkeleton() {
  return (
    <div className="w-full h-screen bg-abyss relative animate-pulse">
      {/* Layer Controls Skeleton */}
      <div className="fixed top-4 right-4 bg-shadow border-2 border-gold/30 rounded-lg p-4 shadow-2xl">
        <div className="flex flex-col gap-3">
          <div className="h-4 bg-midnight rounded w-24"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-midnight rounded"></div>
                <div className="h-4 bg-midnight rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Character Panel Skeleton */}
      <div className="fixed top-20 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-sm bg-shadow border-2 border-gold/30 rounded-lg p-4">
        <div className="mb-4">
          <div className="h-6 bg-midnight rounded w-32 mb-2"></div>
          <div className="h-4 bg-midnight rounded w-20"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-2 border-midnight rounded-lg p-3">
              <div className="flex justify-between mb-2">
                <div className="h-5 bg-midnight rounded w-32"></div>
                <div className="h-4 bg-midnight rounded w-16"></div>
              </div>
              <div className="h-4 bg-midnight rounded w-full mb-2"></div>
              <div className="h-4 bg-midnight rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gold border-r-2 border-l-2 mb-4"></div>
          <div className="font-display text-gold text-xl">Loading map...</div>
        </div>
      </div>
    </div>
  );
}
