import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * YouTube refuses to play an embed that doesn't say who is embedding it ("Error 153"), and a WebView has no
 * page address to say it with. Loading the player inside a document with this address gives it one; for an
 * app, YouTube asks for the application id.
 */
const APP_ORIGIN = 'https://com.programacion-herycam.mecabite-front';

function playerPage(videoId: string) {
  const params = `autoplay=1&playsinline=1&rel=0&origin=${encodeURIComponent(APP_ORIGIN)}`;
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; height: 100%; background: #000; }
      iframe { border: 0; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <iframe
      src="https://www.youtube-nocookie.com/embed/${videoId}?${params}"
      allow="autoplay; encrypted-media; fullscreen"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </body>
</html>`;
}

/** Plays a YouTube video in place, streamed: nothing is downloaded or bundled with the app. */
export function YouTubePlayer({ videoId }: { videoId: string }) {
  return (
    <WebView
      source={{ html: playerPage(videoId), baseUrl: APP_ORIGIN }}
      originWhitelist={['*']}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={false}
      bounces={false}
      style={styles.player}
    />
  );
}

const styles = StyleSheet.create({
  player: {
    flex: 1,
    backgroundColor: '#000',
  },
});
