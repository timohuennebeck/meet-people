/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          DEFAULT: '#2F7CF6',
          ink: '#1B5FCB',
          deep: '#2A4A7D',
          slate: '#2C4C80',
          tint: '#EAF1FE',
          tintAlt: '#E8F1FE',
          wash: '#E4EEFD',
          mist: '#E6F0FE',
          haze: '#DCEAFE',
          pale: '#EDF3FC',
          band: '#D6E5FC',
          rail: '#DCE6F6',
          line: '#C5D7F2',
          row: '#EAF2FE',
        },
        // Text
        ink: {
          DEFAULT: '#15181F',
          strong: '#3B3944',
          body: '#3E4553',
          muted: '#5E6676',
          soft: '#5B6373',
          dim: '#72798A',
          faint: '#7A8595',
          ghost: '#8A91A0',
          trace: '#9AA2B1',
          mute: '#A7ADBA',
        },
        // Surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          app: '#F7F9FC',
          alt: '#F4F7FD',
          sunken: '#F3F6FA',
          fill: '#F1F4F9',
          chip: '#EEF2F8',
          rail: '#EAEEF5',
          dusk: '#E6ECF7',
          tint: '#FAFAFC',
          night: '#171B22',
          camera: '#0E1219',
        },
        // Hairlines and strokes
        hair: {
          DEFAULT: '#E6EBF3',
          soft: '#F0F3F8',
          rail: '#E3E9F2',
          mid: '#DFE5EF',
          deep: '#DCE4F0',
          dash: '#C9CFD9',
          cool: '#E0E7F2',
          steel: '#C9D5E8',
          bar: '#E1E4EA',
          tag: '#E1E7F0',
          pale: '#C3CAD6',
          stone: '#D6DCE6',
          slate: '#B4BAC6',
          input: '#DFE5EF',
          dot: '#C9D0DC',
        },
        // Plan categories
        category: {
          sport: '#32C36A',
          games: '#4A5163',
          walk: '#FF8A3D',
          coffee: '#FF5C7A',
        },
        // Status
        danger: { DEFAULT: '#E14B4B', deep: '#C0483C' },
        warn: {
          DEFAULT: '#F0A22E',
          solid: '#E8942A',
          tint: '#FDF0DA',
          wash: '#FFF4E8',
          ink: '#6B4A1B',
        },
        online: '#34C759',
        // Map backdrop
        map: { top: '#FBE8CE', bottom: '#FDF4EA' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sheet: '30px',
        card: '26px',
        panel: '24px',
        tile: '22px',
        well: '20px',
        field: '18px',
        pill: '999px',
      },
      spacing: {
        // iOS frame geometry
        device: '402px',
        deviceH: '874px',
      },
    },
  },
  plugins: [],
};
