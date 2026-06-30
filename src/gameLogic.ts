/**
 * Pure game logic for the configurable subtraction / counting game.
 *
 * Two players take turns adding an integer in [min, max] to a running total.
 * Whichever player causes the running total to reach or exceed `target`
 * either WINS or LOSES, depending on `hittingTargetMeans`.
 *
 * Overshoot is allowed: a move from any [min, max] value is always legal,
 * regardless of how close the total is to the target.
 *
 * This file has NO React or React Native imports so it is unit-testable
 * with plain Jest + ts-jest.
 */

/** Which side of the game a player is on, from the app user's perspective. */
export type Player = "APP_USER" | "OPPONENT";

/** Whether reaching the target on your move is a win or a loss for you. */
export type TargetCondition = "WIN" | "LOSE";

/**
 * Configuration captured on the Settings screen and reused by the Game screen.
 */
export type GameConfig = {
  /** The number that, once reached or exceeded, ends the game. */
  target: number;
  /** Whether causing the total to reach `target` wins or loses for the mover. */
  hittingTargetMeans: TargetCondition;
  /** Smallest amount a player may add on their turn (>= 1). */
  min: number;
  /** Largest amount a player may add on their turn (>= min). */
  max: number;
  /** Who moves first. */
  startingPlayer: Player;
};

/** A single recorded move in the game's history log. */
export type MoveRecord = {
  /** Which player made the move. */
  player: Player;
  /** The amount they added to the running total. */
  amount: number;
};

/**
 * Snapshot of game progress used by GameScreen.
 */
export type GameState = {
  /** Frozen config the game was started with. */
  config: GameConfig;
  /** DP table of losing-positions, indexed by distance-to-target. */
  losing: boolean[];
  /** Running total of all moves so far. Starts at 0. */
  currentTotal: number;
  /** True once a move has caused the total to reach or exceed `target`. */
  isGameOver: boolean;
  /** Which player made the final, game-ending move (null until game over). */
  lastMoverWasAppUser: boolean | null;
  /** Ordered history of all moves made so far. */
  history: MoveRecord[];
  /** Whose turn it is to move next. Undefined once isGameOver is true. */
  currentPlayer: Player;
};

/**
 * Validation result for the Settings form.
 *
 * If `ok` is false, `errors` maps field name to a human-readable message.
 */
export type ConfigValidation =
  | { ok: true }
  | { ok: false; errors: Partial<Record<keyof GameConfig, string>> };

/**
 * Validate a config from the Settings screen.
 *
 * Args:
 *   config (GameConfig): the config object built from form inputs.
 *
 * Returns:
 *   ConfigValidation: either ok=true, or ok=false with per-field error messages.
 */
export function validateConfig(config: GameConfig): ConfigValidation {
  const errors: Partial<Record<keyof GameConfig, string>> = {};

  if (!Number.isInteger(config.target) || config.target < 1) {
    errors.target = "Target must be a positive whole number.";
  }
  if (!Number.isInteger(config.min) || config.min < 1) {
    errors.min = "Minimum must be a whole number >= 1.";
  }
  if (!Number.isInteger(config.max) || config.max < 1) {
    errors.max = "Maximum must be a whole number >= 1.";
  }
  if (
    Number.isInteger(config.min) &&
    Number.isInteger(config.max) &&
    config.max < config.min
  ) {
    errors.max = "Maximum must be greater than or equal to minimum.";
  }
  if (
    Number.isInteger(config.target) &&
    Number.isInteger(config.min) &&
    config.target < config.min
  ) {
    errors.target = "Target must be at least as large as the minimum move.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true };
}

/**
 * Compute the DP table of losing positions for the player about to move.
 *
 * losing[d] === true means: with d remaining before reaching the target,
 * the player whose turn it is loses under optimal play by both sides.
 *
 * Args:
 *   target (number): the target number.
 *   min (number): minimum move size (>= 1).
 *   max (number): maximum move size (>= min).
 *   hittingTargetMeans (TargetCondition): whether reaching target wins or loses.
 *
 * Returns:
 *   boolean[]: array of length target + 1; index 0 is an unused placeholder.
 */
export function computeLosingPositions(
  target: number,
  min: number,
  max: number,
  hittingTargetMeans: TargetCondition
): boolean[] {
  const losing: boolean[] = new Array(target + 1).fill(false);

  for (let d = 1; d <= target; d++) {
    let canForceWin = false;
    for (let k = min; k <= max; k++) {
      const nextD = d - k;
      if (nextD <= 0) {
        // This move ends the game.
        if (hittingTargetMeans === "WIN") {
          canForceWin = true;
          break;
        }
        // hittingTargetMeans === "LOSE": this k self-destructs; try the next one.
        continue;
      }
      if (losing[nextD]) {
        canForceWin = true;
        break;
      }
    }
    losing[d] = !canForceWin;
  }

  return losing;
}

/**
 * Choose the best move for the player about to move at distance d.
 *
 * Strategy:
 *   1. If hittingTargetMeans === "WIN" and we can end the game now, do so.
 *   2. Otherwise, look for a k in [min, max] that leaves the opponent in a
 *      losing position (losing[nextD] === true).
 *   3. If no forcing move exists we are in a losing position regardless;
 *      fall back to playing `min` so the game lasts longer and the opponent
 *      has more chances to err.
 *
 * Args:
 *   d (number): current distance-to-target (target - currentTotal).
 *   min (number): minimum move size.
 *   max (number): maximum move size.
 *   losing (boolean[]): DP table from computeLosingPositions.
 *   hittingTargetMeans (TargetCondition): win/lose condition on reaching target.
 *
 * Returns:
 *   number: the recommended move amount, always in [min, max].
 */
export function suggestMove(
  d: number,
  min: number,
  max: number,
  losing: boolean[],
  hittingTargetMeans: TargetCondition
): number {
  if (hittingTargetMeans === "WIN") {
    for (let k = min; k <= max; k++) {
      if (d - k <= 0) return k;
    }
  }
  for (let k = min; k <= max; k++) {
    const nextD = d - k;
    if (nextD <= 0) {
      if (hittingTargetMeans === "LOSE") continue;
      return k;
    }
    if (losing[nextD]) return k;
  }
  return min;
}

/**
 * Build a fresh GameState from a validated config.
 *
 * Args:
 *   config (GameConfig): validated configuration.
 *
 * Returns:
 *   GameState: starting state with running total 0 and full losing-table.
 */
export function createInitialGameState(config: GameConfig): GameState {
  const losing = computeLosingPositions(
    config.target,
    config.min,
    config.max,
    config.hittingTargetMeans
  );
  return {
    config,
    losing,
    currentTotal: 0,
    isGameOver: false,
    lastMoverWasAppUser: null,
    history: [],
    currentPlayer: config.startingPlayer,
  };
}

/**
 * Apply a move from the player whose turn it currently is.
 *
 * Returns a new GameState (this function is pure — state in / state out).
 *
 * Args:
 *   state (GameState): current game state. Must not be game-over.
 *   amount (number): move amount; must be in [config.min, config.max].
 *
 * Returns:
 *   GameState: updated state with the move appended, turn advanced, and
 *     isGameOver/lastMoverWasAppUser set if this move reached the target.
 */
export function applyMove(state: GameState, amount: number): GameState {
  if (state.isGameOver) {
    throw new Error("Cannot apply a move after the game is over.");
  }
  if (amount < state.config.min || amount > state.config.max) {
    throw new Error(
      `Move ${amount} out of range [${state.config.min}, ${state.config.max}].`
    );
  }
  const newTotal = state.currentTotal + amount;
  const mover = state.currentPlayer;
  const reachedTarget = newTotal >= state.config.target;
  return {
    ...state,
    currentTotal: newTotal,
    history: [...state.history, { player: mover, amount }],
    isGameOver: reachedTarget,
    lastMoverWasAppUser: reachedTarget ? mover === "APP_USER" : null,
    currentPlayer: mover === "APP_USER" ? "OPPONENT" : "APP_USER",
  };
}

/**
 * Determine whether the app user won, given an ended game state.
 *
 * Args:
 *   state (GameState): a game state with isGameOver === true.
 *
 * Returns:
 *   boolean: true if the app user won under the configured condition.
 */
export function appUserWon(state: GameState): boolean {
  if (!state.isGameOver || state.lastMoverWasAppUser === null) {
    throw new Error("appUserWon called on a game that is not yet over.");
  }
  const appUserMadeFinalMove = state.lastMoverWasAppUser;
  if (state.config.hittingTargetMeans === "WIN") {
    return appUserMadeFinalMove;
  }
  return !appUserMadeFinalMove;
}

/**
 * Convenience: distance remaining before reaching the target.
 *
 * Args:
 *   state (GameState): current game state.
 *
 * Returns:
 *   number: target - currentTotal. May be <= 0 if the game has ended.
 */
export function distanceRemaining(state: GameState): number {
  return state.config.target - state.currentTotal;
}
