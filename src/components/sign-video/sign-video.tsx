import { Image } from 'expo-image';
import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { SignIcon } from '@/components/sign-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Sena } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

import { YouTubePlayer } from './youtube-player';

type SignVideoProps = {
  /** A sign that has a `video`. */
  sena: Sena & { video: string };
};

/**
 * The sign's video from the INDISCAPACIDAD CDMX glossary. Shows its cover until it is tapped, so the player
 * and its network traffic only start when the person asks for them.
 */
export function SignVideo({ sena }: SignVideoProps) {
  const theme = useTheme();
  const [playing, setPlaying] = useState(false);

  return (
    <View style={styles.container}>
      <View style={[styles.frame, { backgroundColor: theme.primarySoft }]}>
        {playing ? (
          <YouTubePlayer videoId={sena.video} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reproducir el video de ${sena.tipo.toLowerCase()} ${sena.etiqueta}`}
            onPress={() => setPlaying(true)}
            style={styles.cover}>
            {/* Without a connection the cover doesn't load and the drawing stays visible. */}
            <SignIcon sena={sena} size={140} />
            <Image
              source={`https://img.youtube.com/vi/${sena.video}/hqdefault.jpg`}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessible={false}
            />
            <View style={[styles.play, { backgroundColor: theme.backgroundElement }]}>
              <Icon name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={28} color={theme.primary} />
            </View>
          </Pressable>
        )}
      </View>

      <Pressable
        accessibilityRole="link"
        hitSlop={8}
        onPress={() => openBrowserAsync(`https://www.youtube.com/watch?v=${sena.video}`)}>
        <ThemedText type="small" themeColor="textSecondary">
          Video: Glosario de LSM, INDISCAPACIDAD CDMX ·{' '}
          <ThemedText type="small" style={{ color: theme.primary }}>
            Abrir en YouTube
          </ThemedText>
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  frame: {
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.95,
  },
});
