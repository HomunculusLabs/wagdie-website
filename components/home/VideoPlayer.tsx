/**
 * VideoPlayer Component
 * Native HTML5 video player with poster preview
 */

'use client'

interface VideoPlayerProps {
  videoSrc: string
  posterSrc: string
  autoplay?: boolean
  className?: string
}

export function VideoPlayer({
  videoSrc,
  posterSrc,
  autoplay = false,
  className = ''
}: VideoPlayerProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <video
        poster={posterSrc}
        controls
        autoPlay={autoplay}
        muted={autoplay} // Autoplay requires muted
        preload="metadata"
        className="w-full rounded-lg shadow-lg"
      >
        <source src={videoSrc} type="video/mp4" />
        <source src={videoSrc.replace('.mp4', '.webm')} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
