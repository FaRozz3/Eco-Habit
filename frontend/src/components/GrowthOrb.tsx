import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../theme';

interface GrowthOrbProps {
  level: number;
  title: string;
}

export interface OrbStage {
  icon: React.ComponentType<{ size: number }>;
  glowOpacity: number;
  glowColors: string[];
}

function SeedIcon({ size }: { size: number }) {
  return (
    <View style={[ico.center, { width: size, height: size }]}>
      <View style={{ width: size * 0.45, height: size * 0.6, borderRadius: size * 0.22, backgroundColor: '#00f59f', shadowColor: '#00f59f', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 }} />
      <View style={{ position: 'absolute', top: size * 0.08, width: size * 0.12, height: size * 0.2, borderTopLeftRadius: size * 0.06, borderTopRightRadius: size * 0.06, backgroundColor: '#00f59f', opacity: 0.7 }} />
    </View>
  );
}

function SproutIcon({ size }: { size: number }) {
  return (
    <View style={[ico.center, { width: size, height: size }]}>
      <View style={{ position: 'absolute', bottom: size * 0.15, width: size * 0.06, height: size * 0.45, backgroundColor: '#00f59f', borderRadius: size * 0.03, opacity: 0.8 }} />
      <View style={{ position: 'absolute', top: size * 0.15, left: size * 0.15, width: size * 0.3, height: size * 0.22, borderTopLeftRadius: size * 0.03, borderTopRightRadius: size * 0.15, borderBottomLeftRadius: size * 0.15, borderBottomRightRadius: size * 0.03, backgroundColor: '#00f59f', transform: [{ rotate: '-30deg' }] }} />
      <View style={{ position: 'absolute', top: size * 0.15, right: size * 0.15, width: size * 0.3, height: size * 0.22, borderTopLeftRadius: size * 0.15, borderTopRightRadius: size * 0.03, borderBottomLeftRadius: size * 0.03, borderBottomRightRadius: size * 0.15, backgroundColor: '#00f59f', transform: [{ rotate: '30deg' }] }} />
    </View>
  );
}

function LeafIcon({ size }: { size: number }) {
  return (
    <View style={[ico.center, { width: size, height: size }]}>
      <View style={{ width: size * 0.7, height: size * 0.7, borderTopLeftRadius: size * 0.06, borderTopRightRadius: size * 0.35, borderBottomLeftRadius: size * 0.35, borderBottomRightRadius: size * 0.06, backgroundColor: '#00f59f', alignItems: 'center', justifyContent: 'center', shadowColor: '#00f59f', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 }}>
        <View style={{ width: size * 0.28, height: size * 0.03, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1, transform: [{ rotate: '-45deg' }] }} />
      </View>
    </View>
  );
}

function TreeIcon({ size }: { size: number }) {
  return (
    <View style={[ico.center, { width: size, height: size }]}>
      <View style={{ position: 'absolute', bottom: size * 0.05, width: size * 0.12, height: size * 0.4, backgroundColor: '#8B6914', borderRadius: size * 0.04 }} />
      <View style={{ position: 'absolute', top: size * 0.05, width: size * 0.55, height: size * 0.55, borderRadius: size * 0.275, backgroundColor: '#00f59f', shadowColor: '#00f59f', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 }} />
    </View>
  );
}

function ForestIcon({ size }: { size: number }) {
  return (
    <View style={[ico.center, { width: size, height: size }]}>
      <View style={{ position: 'absolute', bottom: size * 0.05, left: size * 0.18, width: size * 0.08, height: size * 0.3, backgroundColor: '#8B6914', borderRadius: size * 0.03 }} />
      <View style={{ position: 'absolute', top: size * 0.2, left: size * 0.06, width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16, backgroundColor: '#00f59f', opacity: 0.85 }} />
      <View style={{ position: 'absolute', bottom: size * 0.02, width: size * 0.1, height: size * 0.38, backgroundColor: '#8B6914', borderRadius: size * 0.04 }} />
      <View style={{ position: 'absolute', top: size * 0.05, width: size * 0.45, height: size * 0.45, borderRadius: size * 0.225, backgroundColor: '#00f59f', shadowColor: '#00f59f', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 }} />
      <View style={{ position: 'absolute', bottom: size * 0.05, right: size * 0.18, width: size * 0.08, height: size * 0.3, backgroundColor: '#8B6914', borderRadius: size * 0.03 }} />
      <View style={{ position: 'absolute', top: size * 0.2, right: size * 0.06, width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16, backgroundColor: '#00f59f', opacity: 0.85 }} />
    </View>
  );
}

function PlanetIcon({ size }: { size: number }) {
  return (
    <View style={[ico.center, { width: size, height: size }]}>
      <View style={{ width: size * 0.65, height: size * 0.65, borderRadius: size * 0.325, backgroundColor: '#00f59f', shadowColor: '#00f59f', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 }} />
      <View style={{ position: 'absolute', width: size * 0.9, height: size * 0.22, borderRadius: size * 0.11, borderWidth: size * 0.035, borderColor: '#BB86FC', backgroundColor: 'transparent', transform: [{ rotateX: '60deg' }, { rotateZ: '-15deg' }] }} />
    </View>
  );
}

const ico = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });

export function getOrbStage(level: number): OrbStage {
  if (level >= 50) return { icon: PlanetIcon, glowOpacity: 0.7, glowColors: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'] };
  if (level >= 35) return { icon: ForestIcon, glowOpacity: 0.6, glowColors: ['#00f59f', '#BB86FC', '#FFD700'] };
  if (level >= 20) return { icon: TreeIcon, glowOpacity: 0.5, glowColors: ['#00f59f', '#FFD700'] };
  if (level >= 10) return { icon: LeafIcon, glowOpacity: 0.4, glowColors: ['#00f59f', '#BB86FC'] };
  if (level >= 5) return { icon: SproutIcon, glowOpacity: 0.3, glowColors: ['#00f59f'] };
  return { icon: SeedIcon, glowOpacity: 0.2, glowColors: ['#00f59f'] };
}

function getLevelRange(level: number): string {
  if (level >= 50) return '50+';
  if (level >= 35) return '35-49';
  if (level >= 20) return '20-34';
  if (level >= 10) return '10-19';
  if (level >= 5) return '5-9';
  return '1-4';
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ORB = 140;
const ICON_SIZE = 48;

export default function GrowthOrb({ level, title }: GrowthOrbProps) {
  const stage = getOrbStage(level);
  const IconComponent = stage.icon;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevRangeRef = useRef(getLevelRange(level));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const current = getLevelRange(level);
    if (current !== prevRangeRef.current) {
      prevRangeRef.current = current;
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [level, fadeAnim]);

  const primaryGlow = stage.glowColors[0];

  return (
    <View style={styles.container}>
      {stage.glowColors.map((color, i) => (
        <View key={color + i} style={[styles.glowLayer, { shadowColor: color, shadowOpacity: stage.glowOpacity, shadowRadius: 40, backgroundColor: hexToRgba(color, stage.glowOpacity * 0.15), transform: [{ scale: 1 + i * 0.08 }] }]} />
      ))}
      <Animated.View style={[styles.orb, { transform: [{ scale: pulseAnim }], opacity: fadeAnim }]}>
        <View style={{ shadowColor: primaryGlow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 }}>
          <IconComponent size={ICON_SIZE} />
        </View>
      </Animated.View>
      <Text style={styles.title}>Growth Orb</Text>
      <Text style={styles.subtitle}>Level {level} {'\u2022'} {title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  glowLayer: { position: 'absolute', top: 0, width: 200, height: 200, borderRadius: 100, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  orb: { width: ORB, height: ORB, borderRadius: ORB / 2, backgroundColor: 'rgba(120, 160, 180, 0.18)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 16 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
});
