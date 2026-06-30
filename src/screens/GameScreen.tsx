/**
 * GameScreen — playing screen.
 *
 * Reads the GameConfig from route params, builds a GameState, and renders
 * the appropriate UI for the current turn. The suggested move (when it's
 * the app user's turn) is the visually dominant element on screen.
 */
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  applyMove,
  appUserWon,
  createInitialGameState,
  distanceRemaining,
  GameState,
  suggestMove,
} from "../gameLogic";
import type { GameScreenProps } from "../navigation";
import { colors, radii, spacing, typography } from "../theme";

/**
 * The Game screen.
 *
 * Args:
 *   props (GameScreenProps): React Navigation props including route.params.config.
 *
 * Returns:
 *   JSX.Element: the rendered game UI.
 */
export function GameScreen({
  route,
  navigation,
}: GameScreenProps): React.ReactElement {
  const { config } = route.params;
  const [state, setState] = useState<GameState>(() =>
    createInitialGameState(config)
  );

  const distance = distanceRemaining(state);
  /** The move the app user should make this turn (only computed when it's our turn). */
  const suggested = useMemo(() => {
    if (state.isGameOver || state.currentPlayer !== "APP_USER") return null;
    return suggestMove(
      distance,
      config.min,
      config.max,
      state.losing,
      config.hittingTargetMeans
    );
  }, [state, distance, config]);

  /**
   * Apply a move from whoever's turn it currently is.
   *
   * Args:
   *   amount (number): the move amount to record.
   */
  function makeMove(amount: number): void {
    setState((prev) => applyMove(prev, amount));
  }

  /** Reset the game with the same config — start a fresh state. */
  function playAgainSameConfig(): void {
    setState(createInitialGameState(config));
  }

  /** Return to the Settings screen to reconfigure. */
  function changeSettings(): void {
    navigation.popToTop();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StatsRow
          currentTotal={state.currentTotal}
          target={config.target}
          remaining={Math.max(distance, 0)}
        />

        <Text style={styles.conditionHint}>
          Reaching the target{" "}
          {config.hittingTargetMeans === "WIN" ? "wins" : "loses"} · moves{" "}
          {config.min}–{config.max}
        </Text>

        {state.isGameOver ? (
          <GameOverPanel
            won={appUserWon(state)}
            onPlayAgain={playAgainSameConfig}
            onChangeSettings={changeSettings}
          />
        ) : state.currentPlayer === "APP_USER" ? (
          <AppUserTurnPanel
            suggested={suggested ?? config.min}
            onConfirm={() => makeMove(suggested ?? config.min)}
          />
        ) : (
          <OpponentTurnPanel
            min={config.min}
            max={config.max}
            onPick={makeMove}
          />
        )}

        <HistoryList history={state.history} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Top stat strip showing total / target / remaining.
 *
 * Args:
 *   currentTotal (number): running total so far.
 *   target (number): configured target number.
 *   remaining (number): distance to target, floored at 0.
 *
 * Returns:
 *   JSX.Element
 */
function StatsRow(props: {
  currentTotal: number;
  target: number;
  remaining: number;
}): React.ReactElement {
  return (
    <View style={styles.statsRow}>
      <Stat label="Total" value={props.currentTotal} />
      <View style={styles.statDivider} />
      <Stat label="Target" value={props.target} />
      <View style={styles.statDivider} />
      <Stat label="Remaining" value={props.remaining} />
    </View>
  );
}

/**
 * A single stat cell — small label above a numeric value.
 *
 * Args:
 *   label (string): uppercase secondary label.
 *   value (number): the numeric value to display.
 *
 * Returns:
 *   JSX.Element
 */
function Stat(props: { label: string; value: number }): React.ReactElement {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{props.label}</Text>
      <Text style={styles.statValue}>{props.value}</Text>
    </View>
  );
}

/**
 * Panel shown when it's the app user's turn — the suggested move is huge.
 *
 * Args:
 *   suggested (number): recommended move amount.
 *   onConfirm (() => void): called when the user taps "I made this move".
 *
 * Returns:
 *   JSX.Element
 */
function AppUserTurnPanel(props: {
  suggested: number;
  onConfirm: () => void;
}): React.ReactElement {
  return (
    <View style={styles.userTurnPanel}>
      <Text style={styles.turnLabel}>Your turn — pick</Text>
      <Text style={styles.suggestedNumber}>{props.suggested}</Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={props.onConfirm}
        accessibilityRole="button"
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>I picked this</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Panel shown when it's the opponent's turn — quick-pick buttons for each
 * legal move value, so the user can log what the opponent said.
 *
 * Args:
 *   min (number): smallest legal move.
 *   max (number): largest legal move.
 *   onPick ((amount: number) => void): handler when a value is tapped.
 *
 * Returns:
 *   JSX.Element
 */
function OpponentTurnPanel(props: {
  min: number;
  max: number;
  onPick: (amount: number) => void;
}): React.ReactElement {
  const values: number[] = [];
  for (let k = props.min; k <= props.max; k++) values.push(k);
  return (
    <View style={styles.opponentTurnPanel}>
      <Text style={styles.turnLabel}>Opponent&apos;s turn</Text>
      <Text style={styles.turnSubLabel}>What did they pick?</Text>
      <View style={styles.pickRow}>
        {values.map((v) => (
          <TouchableOpacity
            key={v}
            style={styles.pickButton}
            onPress={() => props.onPick(v)}
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <Text style={styles.pickButtonText}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/**
 * Final-state panel shown when the game has ended.
 *
 * Args:
 *   won (boolean): whether the app user is the winner.
 *   onPlayAgain (() => void): restart with the same config.
 *   onChangeSettings (() => void): return to Settings screen.
 *
 * Returns:
 *   JSX.Element
 */
function GameOverPanel(props: {
  won: boolean;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}): React.ReactElement {
  return (
    <View style={styles.resultPanel}>
      <Text style={styles.resultLabel}>
        {props.won ? "You won" : "You lost"}
      </Text>
      <Text style={styles.resultSubLabel}>
        {props.won ? "Nice play." : "Better luck next round."}
      </Text>
      <TouchableOpacity
        style={[styles.primaryButton, styles.resultPrimaryButton]}
        onPress={props.onPlayAgain}
        accessibilityRole="button"
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Play again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={props.onChangeSettings}
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Text style={styles.secondaryButtonText}>Change settings</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Scrolling list of every move made so far, with a running total shown
 * after each entry.
 *
 * Args:
 *   history (GameState["history"]): ordered move list.
 *
 * Returns:
 *   JSX.Element
 */
function HistoryList(props: {
  history: GameState["history"];
}): React.ReactElement {
  // Compute the running total after each move on the fly. Storing the running
  // total in state would also work, but this keeps GameState a pure log of
  // raw moves and avoids two ways to derive the same number.
  let runningTotal = 0;
  const rows = props.history.map((m, i) => {
    runningTotal += m.amount;
    return { ...m, runningTotal, index: i };
  });

  return (
    <View style={styles.history}>
      <Text style={styles.historyLabel}>History</Text>
      {rows.length === 0 ? (
        <Text style={styles.historyEmpty}>No moves yet.</Text>
      ) : (
        rows.map((m, i) => (
          <View
            key={m.index}
            style={[
              styles.historyRow,
              i < rows.length - 1 && styles.historyRowDivider,
            ]}
          >
            <Text style={styles.historyText}>
              {m.player === "APP_USER" ? "You" : "Opponent"} picked{" "}
              <Text style={styles.historyAmount}>{m.amount}</Text>{" "}
              <Text style={styles.historyArrow}>→</Text> total:{" "}
              <Text style={styles.historyAmount}>{m.runningTotal}</Text>
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  stat: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  statLabel: {
    ...typography.sectionLabel,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  conditionHint: {
    ...typography.helper,
    textAlign: "center",
    marginBottom: spacing.xl,
  },

  userTurnPanel: {
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  opponentTurnPanel: {
    backgroundColor: colors.accentTint,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  turnLabel: {
    ...typography.sectionLabel,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  turnSubLabel: {
    ...typography.helper,
    marginBottom: spacing.lg,
  },
  suggestedNumber: {
    fontSize: 160,
    fontWeight: "800",
    color: colors.primary,
    lineHeight: 170,
    letterSpacing: -4,
    marginVertical: spacing.sm,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  primaryButtonText: {
    ...typography.buttonLabel,
    color: colors.textInverse,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: spacing.sm,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    ...typography.buttonLabel,
    color: colors.textSecondary,
  },

  pickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  pickButton: {
    minWidth: 72,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  pickButtonText: {
    color: colors.textInverse,
    fontSize: 26,
    fontWeight: "700",
  },

  resultPanel: {
    backgroundColor: colors.accentTint,
    borderRadius: radii.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  resultLabel: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  resultSubLabel: {
    ...typography.helper,
    marginBottom: spacing.sm,
  },
  resultPrimaryButton: { marginTop: spacing.lg },

  history: {
    marginTop: spacing.sm,
  },
  historyLabel: {
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
  },
  historyEmpty: {
    ...typography.helper,
    fontStyle: "italic",
    paddingVertical: spacing.sm,
  },
  historyRow: {
    paddingVertical: spacing.sm,
  },
  historyRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyText: {
    ...typography.body,
    color: colors.text,
  },
  historyAmount: {
    fontWeight: "700",
    color: colors.text,
  },
  historyArrow: {
    color: colors.textSecondary,
  },
});
