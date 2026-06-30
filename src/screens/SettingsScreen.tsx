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
 * A two-option segmented control built from plain TouchableOpacity buttons.
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
    <View style={styles.segmentRow}>
      {props.options.map((opt) => {
        const selected = opt.value === props.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, selected && styles.segmentSelected]}
            onPress={() => props.onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
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
          <Text style={styles.title}>Counting Game Settings</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Target number</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={targetRaw}
              onChangeText={setTargetRaw}
              placeholder="e.g. 21"
            />
            {errors.target && (
              <Text style={styles.error}>{errors.target}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Reaching the target…</Text>
            <Segmented<TargetCondition>
              options={[
                { label: "Wins", value: "WIN" },
                { label: "Loses", value: "LOSE" },
              ]}
              value={hittingTargetMeans}
              onChange={setHittingTargetMeans}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Minimum per turn</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={minRaw}
                onChangeText={setMinRaw}
                placeholder="1"
              />
              {errors.min && <Text style={styles.error}>{errors.min}</Text>}
            </View>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Maximum per turn</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={maxRaw}
                onChangeText={setMaxRaw}
                placeholder="3"
              />
              {errors.max && <Text style={styles.error}>{errors.max}</Text>}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Who goes first?</Text>
            <Segmented<Player>
              options={[
                { label: "I go first", value: "APP_USER" },
                { label: "Opponent first", value: "OPPONENT" },
              ]}
              value={startingPlayer}
              onChange={setStartingPlayer}
            />
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            accessibilityRole="button"
          >
            <Text style={styles.startButtonText}>Start game</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
    color: "#111",
  },
  field: { marginBottom: 20 },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    backgroundColor: "#fafafa",
    color: "#111",
  },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  segmentRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  segmentSelected: { backgroundColor: "#0a84ff" },
  segmentLabel: { fontSize: 15, color: "#333", fontWeight: "500" },
  segmentLabelSelected: { color: "#fff", fontWeight: "700" },
  error: { color: "#d33", fontSize: 13, marginTop: 6 },
  startButton: {
    backgroundColor: "#0a84ff",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  startButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
