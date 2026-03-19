import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, RadialGradient as SvgRadialGradient, Stop, Circle, G } from 'react-native-svg';
import { useWelcome } from '../contexts/WelcomeContext';
import { useI18n } from '../contexts/I18nContext';
import { colors, spacing, radius, fontFamilies } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

let MaskedView: any = null;
try {
  if (Platform.OS !== 'web') {
    MaskedView = require('@react-native-masked-view/masked-view').default;
  }
} catch {}

const { width, height } = Dimensions.get('window');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function NameScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { setUserName, resetOnboarding } = useWelcome();
  const { t } = useI18n();

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Entrance fade
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [floatAnim, fadeAnim]);

  useEffect(() => {
    Animated.timing(inputBorderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('name.error'));
      return;
    }
    setError('');
    await setUserName(trimmed);
  };

  const inputBorderWidth = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Mesh */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.background, colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.meshGradient, { top: -100, left: -100, backgroundColor: 'rgba(187, 134, 252, 0.12)' }]} />
        <View style={[styles.meshGradient, { bottom: -100, right: -100, backgroundColor: 'rgba(0, 245, 160, 0.08)' }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={async () => await resetOnboarding()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#64748b" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerTitle}>ECOHABIT</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={[styles.main, { opacity: fadeAnim }]}>
          {/* Central Leaf Icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ translateY: floatAnim }] }]}>
            <View style={styles.glowCircle}>
              {/* No nested innerCircle with shadows to avoid square bleed on web */}
              <View style={styles.leafWrapper}>
                <Svg width="120" height="120" viewBox="0 0 40 40" fill="none" style={{ backgroundColor: 'transparent' }}>
                  {/* Clean Dark Circular Background */}
                  <Circle cx="20" cy="20" r="18" fill="rgba(15, 17, 21, 0.8)" />
                  
                  {/* Clean Stylized Leaf - Perfectly Centered (Final fine-tune) */}
                  <G transform="translate(5.8, 8) scale(1.1)">
                    <Path
                      d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.2A7 7 0 0 1 11 20Z"
                      stroke={colors.primary}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M11 20c0-3 .5-6 2-9"
                      stroke={colors.primary}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </G>
                </Svg>
              </View>
            </View>
            <View style={styles.orbitingParticle} />
          </Animated.View>

          {/* Heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.headingText}>
              ¿Cómo te <Text style={styles.gradientTextPlaceholder}>llamas?</Text>
            </Text>
            <View style={styles.gradientTextAbsolute}>
                 <LinearGradient 
                    colors={[colors.primary, colors.purple]} 
                    start={{x: 0, y: 0}} 
                    end={{x: 1, y: 0}}
                    style={styles.textGradient}
                 >
                    <Text style={[styles.headingText, { color: 'transparent' }]}>¿Cómo te llamas?</Text>
                 </LinearGradient>
            </View>
            <Text style={styles.subheadingText}>Tu viaje hacia el equilibrio comienza aquí</Text>
          </View>

          {/* Minimal Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Tu nombre"
                placeholderTextColor="#334155"
                value={name}
                onChangeText={(t_) => { setName(t_); if (error) setError(''); }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus
                selectionColor={colors.purple}
                // @ts-ignore - web only property
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' }]}
              />
              <View style={styles.inputUnderline} />
              <Animated.View style={[styles.inputUnderlineActive, { width: inputBorderWidth }]} />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Comenzar</Text>
              <MaterialCommunityIcons name="arrow-right" size={24} color={colors.background} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Status Indicator */}
          <View style={styles.statusIndicator}>
            <Text style={styles.statusText}>
              DIGITAL ZEN • <Text style={{ color: colors.primary }}>ONLINE</Text>
            </Text>
          </View>
        </Animated.View>

        {/* Decorative Gradients */}
        <View style={styles.bottomBlur} />
        <View style={styles.topRightBlur} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  meshGradient: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    opacity: 0.4,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: '#94a3b8',
    letterSpacing: 2,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(15, 17, 21, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  orbitingParticle: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.purple,
    opacity: 0.4,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  headingText: {
    fontFamily: fontFamilies.bold,
    fontSize: 38,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
  },
  gradientTextPlaceholder: {
    color: colors.primary, // Fallback
  },
  gradientTextAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  textGradient: {
    // This is a bit tricky in RN without MaskedView working perfectly on all platforms
    // For now we'll just use primary color for the last word via style if MaskedView is not used
    // But since I'm aiming for "exact" visual, I'll try to simulate it
    opacity: 0, 
  },
  subheadingText: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 48,
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    fontFamily: fontFamilies.medium,
    fontSize: 28,
    color: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  inputUnderline: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#1e293b',
  },
  inputUnderlineActive: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: colors.purple,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
  },
  button: {
    width: '100%',
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    color: '#0F1115',
  },
  statusIndicator: {
    marginTop: 40,
  },
  statusText: {
    fontFamily: fontFamilies.bold,
    fontSize: 10,
    color: '#475569',
    letterSpacing: 3,
  },
  bottomBlur: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(187, 134, 252, 0.05)',
  },
  topRightBlur: {
    position: 'absolute',
    top: '25%',
    right: -80,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(0, 245, 160, 0.05)',
  },
});

