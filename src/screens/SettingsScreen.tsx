/**
 * SettingsScreen — initial route.
 *
 * Form for configuring the counting game. On "Start game" we validate and,
 * if valid, push the Game route with the chosen config.
 */
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  GameConfig,
  Player,
  TargetCondition,
  validateConfig,
} from "../gameLogic";
import type { SettingsScreenProps } from "../navigation";
import { colors, radii, spacing, typography } from "../theme";

/**
 * Parse a numeric form input into an integer (or NaN if blank/garbage).
 *
 * Args:
 *   raw (string): the raw TextInput value.
 *
 * Returns:
 *   number: parsed integer; NaN signals invalid input for validation.
 */
function parseIntegerInput(raw: string): number {
  if (raw.trim() === "") return NaN;
  const n = Number(raw);
  if (!Number.isFinite(n)) return NaN;
  return Math.trunc(n);
}

/**
 * A two-option segmented control rendered as a unified rounded track with a
 * floating, blue-filled selected segment.
 *
 * Args:
 *   options ({ label, value }[]): the two choices.
 *   value (T): currently selected value.
 *   onChange ((v: T) => void): change handler.
 *
 * Returns:
 *   JSX.Element: rendered segmented control.
 */
function Segmented<T extends string>(props: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}): React.ReactElement {
  return (
    <View style={styles.segmentTrack}>
      {props.options.map((opt) => {
        const selected = opt.value === props.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, selected && styles.segmentSelected]}
            onPress={() => props.onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentLabel,
                selected && styles.segmentLabelSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * The Settings screen — initial route of the app.
 *
 * Args:
 *   props (SettingsScreenProps): React Navigation props with navigation handle.
 *
 * Returns:
 *   JSX.Element: rendered settings form.
 */
export function SettingsScreen({
  navigation,
}: SettingsScreenProps): React.ReactElement {
  const [targetRaw, setTargetRaw] = useState("10");
  const [minRaw, setMinRaw] = useState("1");
  const [maxRaw, setMaxRaw] = useState("3");
  const [hittingTargetMeans, setHittingTargetMeans] =
    useState<TargetCondition>("LOSE");
  const [startingPlayer, setStartingPlayer] = useState<Player>("APP_USER");
  const [errors, setErrors] = useState<
    Partial<Record<keyof GameConfig, string>>
  >({});

  /**
   * Read current form values, validate, and on success navigate to the Game
   * screen with the assembled GameConfig.
   */
  function handleStart(): void {
    const config: GameConfig = {
      target: parseIntegerInput(targetRaw),
      min: parseIntegerInput(minRaw),
      max: parseIntegerInput(maxRaw),
      hittingTargetMeans,
      startingPlayer,
    };
    const result = validateConfig(config);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    navigation.navigate("Game", { config });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Counting game</Text>
          <Text style={styles.subtitle}>
            Configure the rules, then tap start to play.
          </Text>

          <View style={styles.section}>
            <Text style={styles.label}>Target number</Text>
            <TextInput
              style={[styles.input, errors.target && styles.inputError]}
              keyboardType="number-pad"
              value={targetRaw}
              onChangeText={setTargetRaw}
              placeholder="e.g. 21"
              placeholderTextColor={colors.textSecondary}
            />
            {errors.target && (
              <Text style={styles.error}>{errors.target}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Reaching the target</Text>
            <Segmented<TargetCondition>
              options={[
                { label: "Wins", value: "WIN" },
                { label: "Loses", value: "LOSE" },
              ]}
              value={hittingTargetMeans}
              onChange={setHittingTargetMeans}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Range per turn</Text>
            <View style={styles.row}>
              <View style={[styles.half]}>
                <Text style={styles.subLabel}>Minimum</Text>
                <TextInput
                  style={[styles.input, errors.min && styles.inputError]}
                  keyboardType="number-pad"
                  value={minRaw}
                  onChangeText={setMinRaw}
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                />
                {errors.min && (
                  <Text style={styles.error}>{errors.min}</Text>
                )}
              </View>
              <View style={[styles.half]}>
                <Text style={styles.subLabel}>Maximum</Text>
                <TextInput
                  style={[styles.input, errors.max && styles.inputError]}
                  keyboardType="number-pad"
                  value={maxRaw}
                  onChangeText={setMaxRaw}
                  placeholder="3"
                  placeholderTextColor={colors.textSecondary}
                />
                {errors.max && (
                  <Text style={styles.error}>{errors.max}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Who goes first</Text>
            <Segmented<Player>
              options={[
                { label: "I do", value: "APP_USER" },
                { label: "Opponent", value: "OPPONENT" },
              ]}
              value={startingPlayer}
              onChange={setStartingPlayer}
            />
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>Start game</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.helper,
    marginBottom: spacing.xxl,
  },
  section: { marginBottom: spacing.xl },
  label: {
    ...typography.sectionLabel,
    marginBottom: spacing.md,
  },
  subLabel: {
    ...typography.helper,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
  },
  inputError: { borderColor: colors.error },
  row: { flexDirection: "row", gap: spacing.md },
  half: { flex: 1 },
  segmentTrack: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: radii.md,
    backgroundColor: "transparent",
  },
  segmentSelected: { backgroundColor: colors.primary },
  segmentLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  segmentLabelSelected: { color: colors.textInverse, fontWeight: "600" },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  startButtonText: {
    ...typography.buttonLabel,
    color: colors.textInverse,
    fontSize: 17,
  },
});
