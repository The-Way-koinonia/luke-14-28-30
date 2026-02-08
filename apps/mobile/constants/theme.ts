/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';


export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#7C3AED', // brand-purple-DEFAULT
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#7C3AED',
    brand: {
      purple: {
        light: '#A78BFA',
        DEFAULT: '#7C3AED',
        dark: '#5B21B6',
        deeper: '#4C1D95',
      },
      gold: {
        light: '#F9D67A',
        DEFAULT: '#D4AF37',
        dark: '#B8941F',
      },
    },
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#A78BFA', // brand-purple-light for dark mode contrast
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#A78BFA',
    brand: {
      purple: {
        light: '#A78BFA',
        DEFAULT: '#7C3AED',
        dark: '#5B21B6',
        deeper: '#4C1D95',
      },
      gold: {
        light: '#F9D67A',
        DEFAULT: '#D4AF37',
        dark: '#B8941F',
      },
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
