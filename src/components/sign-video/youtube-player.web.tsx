/** Plays a YouTube video in place. On the web the page already has an address, so a plain embed is enough. */
export function YouTubePlayer({ videoId }: { videoId: string }) {
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      style={{ border: 0, width: '100%', height: '100%' }}
      title="Video de la seña"
    />
  );
}
