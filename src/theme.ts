/**
 * Shared design tokens for opNimal.
 *
 * All color, spacing, radius, and typography values come from here so the
 * palette can be tweaked in one place. The look is clean, minimal, and warm —
 * muted dusty blue + muted terracotta on a slightly warm off-white.
 */

/**
 * The single source of truth for color values used across the app.
 *
 * - `primary`  / `primaryTint`: dusty/slate blue for primary actions, the
 *   suggested-move number, and the active turn indicator.
 * - `accent`   / `accentTint`:  muted terracotta for emphasis — the opponent
 *   quick-pick buttons and the game-over result banner.
 * - Backgrounds are slightly warm so the terracotta accent doesn't clash.
 */
export const colors = {
  background: "#FAF9F7",
  surface: "#FFFFFF",
  surfaceMuted: "#F2F0EC",

  text: "#2D2A26",
  textSecondary: "#6B6862",
  textInverse: "#FFFFFF",

  primary: "#6B8CAE",
  primaryTint: "#E8EEF3",

  accent: "#D08C60",
  accentTint: "#F5E6DA",

  border: "#E5E2DD",
  borderStrong: "#D8D4CD",

  error: "#B3604A",
};

/** Vertical / horizontal spacing scale used everywhere. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  xxl: 32,
};

/** Border-radius scale. */
export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
};

/** Reusable text style presets. */
export const typography = {
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  body: {
    fontSize: 15,
    color: colors.text,
  },
  helper: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
};
