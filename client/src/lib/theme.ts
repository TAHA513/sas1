// Convert hex color to HSL format
export const hexToHSL = (hex: string): string => {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Parse the values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h = h * 60;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Map of font families to their CSS values
const fontFamilyMap: Record<string, string> = {
  'tajawal': 'Tajawal, sans-serif',
  'cairo': 'Cairo, sans-serif',
  'noto-sans-arabic': 'Noto Sans Arabic, sans-serif',
  'dubai': 'Dubai, sans-serif',
  'ibm-plex-sans-arabic': 'IBM Plex Sans Arabic, sans-serif',
  'aref-ruqaa': 'Aref Ruqaa, serif',
  'almarai': 'Almarai, sans-serif',
  'lateef': 'Lateef, serif',
  'scheherazade': 'Scheherazade New, serif',
  'harmattan': 'Harmattan, sans-serif',
};

// Create gradient string from two colors
export const createGradient = (color1: string, color2: string, direction: 'to right' | 'to bottom' = 'to right'): string => {
  return `linear-gradient(${direction}, ${color1}, ${color2})`;
};

// Update theme CSS variables for colors
export const updateThemeColors = (primary: string | { gradient: [string, string] }) => {
  const root = document.documentElement;

  if (typeof primary === 'string') {
    // Single color
    const hslColor = hexToHSL(primary);
    root.style.setProperty('--primary', hslColor);
    root.style.setProperty('--primary-foreground', '210 40% 98%');
    localStorage.setItem('theme-color', primary);
    localStorage.removeItem('theme-gradient');
  } else {
    // Gradient
    const [color1, color2] = primary.gradient;
    const gradient = createGradient(color1, color2);
    root.style.setProperty('--primary-gradient', gradient);
    localStorage.setItem('theme-gradient', JSON.stringify(primary.gradient));
    localStorage.removeItem('theme-color');
  }
};

// Update font settings
export const updateThemeFonts = (fontSize: string, fontFamily: string) => {
  const root = document.documentElement;
  root.style.setProperty('--font-size', fontSize);
  root.style.setProperty('--font-family', fontFamilyMap[fontFamily] || fontFamilyMap['tajawal']);

  // Save to localStorage
  localStorage.setItem('theme-font-size', fontSize);
  localStorage.setItem('theme-font-family', fontFamily);
};

// Load theme settings from localStorage
export const loadThemeSettings = () => {
  const color = localStorage.getItem('theme-color');
  const gradientStr = localStorage.getItem('theme-gradient');
  const fontSize = localStorage.getItem('theme-font-size');
  const fontFamily = localStorage.getItem('theme-font-family');

  if (color) {
    updateThemeColors(color);
  } else if (gradientStr) {
    try {
      const gradient = JSON.parse(gradientStr) as [string, string];
      updateThemeColors({ gradient });
    } catch (error) {
      console.error('Error parsing gradient:', error);
    }
  }

  if (fontSize && fontFamily) {
    updateThemeFonts(fontSize, fontFamily);
  }

  return {
    color,
    gradient: gradientStr ? JSON.parse(gradientStr) : undefined,
    fontSize,
    fontFamily,
  };
};