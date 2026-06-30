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
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{state.currentTotal}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Target</Text>
            <Text style={styles.statValue}>{config.target}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValue}>{Math.max(distance, 0)}</Text>
          </View>
        </View>

        <Text style={styles.conditionHint}>
          Reaching the target {config.hittingTargetMeans === "WIN" ? "WINS" : "LOSES"}
          {" "}· moves {config.min}–{config.max}
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
    <View style={styles.turnPanel}>
      <Text style={styles.turnLabel}>Your turn — pick</Text>
      <Text style={styles.suggestedNumber}>{props.suggested}</Text>
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={props.onConfirm}
        accessibilityRole="button"
      >
        <Text style={styles.confirmButtonText}>I made this move</Text>
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
    <View style={styles.turnPanel}>
      <Text style={styles.turnLabel}>Opponent&apos;s turn — what did they pick?</Text>
      <View style={styles.pickRow}>
        {values.map((v) => (
          <TouchableOpacity
            key={v}
            style={styles.pickButton}
            onPress={() => props.onPick(v)}
            accessibilityRole="button"
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
    <View style={[styles.turnPanel, props.won ? styles.wonBg : styles.lostBg]}>
      <Text style={styles.resultText}>
        {props.won ? "You won!" : "You lost."}
      </Text>
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={props.onPlayAgain}
        accessibilityRole="button"
      >
        <Text style={styles.confirmButtonText}>Play again (same setup)</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={props.onChangeSettings}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryButtonText}>Change settings</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Scrolling list of every move made so far.
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
  if (props.history.length === 0) {
    return (
      <View style={styles.history}>
        <Text style={styles.historyLabel}>History</Text>
        <Text style={styles.historyEmpty}>No moves yet.</Text>
      </View>
    );
  }
  return (
    <View style={styles.history}>
      <Text style={styles.historyLabel}>History</Text>
      {props.history.map((m, i) => (
        <Text key={i} style={styles.historyItem}>
          {i + 1}. {m.player === "APP_USER" ? "You" : "Opponent"}: +{m.amount}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20, paddingBottom: 40 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 12, color: "#777", textTransform: "uppercase" },
  statValue: { fontSize: 28, fontWeight: "700", color: "#111" },
  conditionHint: {
    textAlign: "center",
    color: "#555",
    marginBottom: 24,
    fontSize: 13,
  },
  turnPanel: {
    backgroundColor: "#f5f7fb",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  wonBg: { backgroundColor: "#dff5e1" },
  lostBg: { backgroundColor: "#fde0e0" },
  turnLabel: { fontSize: 16, color: "#444", marginBottom: 12 },
  suggestedNumber: {
    fontSize: 140,
    fontWeight: "800",
    color: "#0a84ff",
    marginVertical: 8,
    lineHeight: 150,
  },
  confirmButton: {
    backgroundColor: "#0a84ff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: "stretch",
    alignItems: "center",
  },
  confirmButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#0a84ff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: "stretch",
    alignItems: "center",
  },
  secondaryButtonText: { color: "#0a84ff", fontSize: 16, fontWeight: "600" },
  pickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  pickButton: {
    minWidth: 64,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#0a84ff",
    alignItems: "center",
  },
  pickButtonText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  resultText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  history: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  historyLabel: {
    fontSize: 13,
    color: "#777",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  historyEmpty: { color: "#999", fontStyle: "italic" },
  historyItem: { fontSize: 15, color: "#222", paddingVertical: 2 },
});
