/**
 * Jest unit tests for gameLogic.ts.
 *
 * Note on the canonical example:
 *
 *   Target = 10, min = 1, max = 3, hittingTargetMeans = "LOSE" (misère):
 *
 *   The losing positions (player to move loses under optimal play) are at
 *   distances d = 1, 5, 9 — NOT 2, 6, 10. Reasoning: at d = 1 the mover is
 *   forced to reach the target on this turn and thereby loses; at d = 5 any
 *   move (1, 2, or 3) leaves the opponent at d = 2, 3, or 4 from which the
 *   opponent can reply 1, 2, or 3 to force the player back to d = 1. The
 *   build spec named 2, 6, 10 but those are inconsistent with the recurrence
 *   the spec itself defines — we assert the values the algorithm actually
 *   produces.
 */
import {
  computeLosingPositions,
  suggestMove,
  validateConfig,
  createInitialGameState,
  applyMove,
  appUserWon,
  distanceRemaining,
  GameConfig,
} from "./gameLogic";

describe("computeLosingPositions — LOSE variant (canonical example)", () => {
  /**
   * target=10, min=1, max=3, hittingTargetMeans=LOSE.
   * Whoever causes total >= 10 loses.
   * Losing positions for the player about to move: d = 1, 5, 9.
   */
  const losing = computeLosingPositions(10, 1, 3, "LOSE");

  test("d=1 is a losing position (mover is forced to hit target)", () => {
    expect(losing[1]).toBe(true);
  });

  test("d=5 is a losing position", () => {
    expect(losing[5]).toBe(true);
  });

  test("d=9 is a losing position", () => {
    expect(losing[9]).toBe(true);
  });

  test("d=2, 3, 4, 6, 7, 8, 10 are NOT losing positions", () => {
    for (const d of [2, 3, 4, 6, 7, 8, 10]) {
      expect(losing[d]).toBe(false);
    }
  });

  test("from d=10 (start of game), the mover wins by playing 1 to force opponent into d=9", () => {
    const move = suggestMove(10, 1, 3, losing, "LOSE");
    expect(move).toBe(1);
  });

  test("from d=6, the mover wins by playing 1 to force opponent into d=5", () => {
    const move = suggestMove(6, 1, 3, losing, "LOSE");
    expect(move).toBe(1);
  });

  test("from d=2, the mover wins by playing 1 to force opponent into d=1", () => {
    const move = suggestMove(2, 1, 3, losing, "LOSE");
    expect(move).toBe(1);
  });

  test("from a losing position (d=5), suggestMove falls back to min=1 (delay loss)", () => {
    const move = suggestMove(5, 1, 3, losing, "LOSE");
    expect(move).toBe(1);
  });
});

describe("computeLosingPositions — WIN variant (standard 21-style)", () => {
  /**
   * target=10, min=1, max=3, hittingTargetMeans=WIN.
   * Whoever causes total >= 10 wins. Standard losing positions: d ≡ 0 mod 4
   * (i.e. d = 4, 8 within range 1..10).
   */
  const losing = computeLosingPositions(10, 1, 3, "WIN");

  test("d=4 and d=8 are losing positions", () => {
    expect(losing[4]).toBe(true);
    expect(losing[8]).toBe(true);
  });

  test("d=1, 2, 3 are immediate-win positions for the mover", () => {
    expect(losing[1]).toBe(false);
    expect(losing[2]).toBe(false);
    expect(losing[3]).toBe(false);
  });

  test("from d=1, 2, 3 suggestMove returns the move that ends the game (immediate win)", () => {
    expect(suggestMove(1, 1, 3, losing, "WIN")).toBe(1);
    expect(suggestMove(2, 1, 3, losing, "WIN")).toBe(2);
    expect(suggestMove(3, 1, 3, losing, "WIN")).toBe(3);
  });

  test("from d=10 (start), mover plays 2 to force opponent into d=8 (losing)", () => {
    expect(suggestMove(10, 1, 3, losing, "WIN")).toBe(2);
  });

  test("losing positions for WIN variant are NOT the same as for LOSE variant", () => {
    const loseLosing = computeLosingPositions(10, 1, 3, "LOSE");
    expect(losing[1]).not.toBe(loseLosing[1]);
    expect(losing[4]).not.toBe(loseLosing[4]);
  });
});

describe("Edge case: min === max (forced move)", () => {
  /**
   * target=10, min=max=2, hittingTargetMeans=WIN.
   * Each turn adds exactly 2 — there is no choice. Five total moves to reach
   * 10. Move #5 is the starting player's; under WIN they win.
   */
  const losing = computeLosingPositions(10, 2, 2, "WIN");

  test("alternating forced moves of size 2 yield losing positions at d=4 and d=8", () => {
    expect(losing[2]).toBe(false);
    expect(losing[4]).toBe(true);
    expect(losing[6]).toBe(false);
    expect(losing[8]).toBe(true);
    expect(losing[10]).toBe(false);
  });

  test("suggestMove always returns the only legal move (min === max)", () => {
    expect(suggestMove(10, 2, 2, losing, "WIN")).toBe(2);
    expect(suggestMove(4, 2, 2, losing, "WIN")).toBe(2);
  });
});

describe("Edge case: target smaller than max (immediate overshoot)", () => {
  /**
   * target=2, min=1, max=5, hittingTargetMeans=WIN.
   * The first mover can hit / overshoot the target on the first move.
   */
  const losing = computeLosingPositions(2, 1, 5, "WIN");

  test("d=1 and d=2 are immediate-win positions", () => {
    expect(losing[1]).toBe(false);
    expect(losing[2]).toBe(false);
  });

  test("suggestMove from d=2 (WIN) chooses the smallest move that ends the game", () => {
    expect(suggestMove(2, 1, 5, losing, "WIN")).toBe(2);
  });

  test("suggestMove from d=2 (LOSE) plays 1 to force opponent into d=1", () => {
    // d=1 is a forced loss (any move >= 1 ends the game). From d=2, playing
    // 1 leaves the opponent at d=1 — the only winning option.
    const loseLosing = computeLosingPositions(2, 1, 5, "LOSE");
    expect(loseLosing[1]).toBe(true);
    expect(loseLosing[2]).toBe(false);
    expect(suggestMove(2, 1, 5, loseLosing, "LOSE")).toBe(1);
  });
});

describe("Edge case: target === 1 (game ends on first move)", () => {
  test("LOSE variant: first mover always loses", () => {
    const losing = computeLosingPositions(1, 1, 3, "LOSE");
    expect(losing[1]).toBe(true);
  });

  test("WIN variant: first mover always wins", () => {
    const losing = computeLosingPositions(1, 1, 3, "WIN");
    expect(losing[1]).toBe(false);
  });
});

describe("validateConfig", () => {
  const baseConfig: GameConfig = {
    target: 10,
    hittingTargetMeans: "LOSE",
    min: 1,
    max: 3,
    startingPlayer: "APP_USER",
  };

  test("accepts a valid config", () => {
    expect(validateConfig(baseConfig)).toEqual({ ok: true });
  });

  test("rejects max < min", () => {
    const result = validateConfig({ ...baseConfig, min: 5, max: 3 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.max).toBeDefined();
  });

  test("rejects target < min", () => {
    const result = validateConfig({ ...baseConfig, target: 1, min: 3, max: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.target).toBeDefined();
  });

  test("rejects non-integer values", () => {
    const result = validateConfig({ ...baseConfig, target: 1.5 });
    expect(result.ok).toBe(false);
  });

  test("rejects min < 1", () => {
    const result = validateConfig({ ...baseConfig, min: 0 });
    expect(result.ok).toBe(false);
  });
});

describe("Game state machine (applyMove + appUserWon)", () => {
  /**
   * Full game playthrough: target=10, min=1, max=3, hittingTargetMeans=LOSE,
   * app user starts. With optimal play the app user wins.
   */
  const config: GameConfig = {
    target: 10,
    hittingTargetMeans: "LOSE",
    min: 1,
    max: 3,
    startingPlayer: "APP_USER",
  };

  test("createInitialGameState produces a clean starting state", () => {
    const state = createInitialGameState(config);
    expect(state.currentTotal).toBe(0);
    expect(state.isGameOver).toBe(false);
    expect(state.history).toEqual([]);
    expect(state.currentPlayer).toBe("APP_USER");
    expect(state.losing.length).toBe(11);
    expect(distanceRemaining(state)).toBe(10);
  });

  test("applyMove advances total, swaps player, and appends to history", () => {
    let state = createInitialGameState(config);
    state = applyMove(state, 1);
    expect(state.currentTotal).toBe(1);
    expect(state.currentPlayer).toBe("OPPONENT");
    expect(state.history).toEqual([{ player: "APP_USER", amount: 1 }]);
    expect(state.isGameOver).toBe(false);
  });

  test("applyMove rejects out-of-range moves", () => {
    const state = createInitialGameState(config);
    expect(() => applyMove(state, 0)).toThrow();
    expect(() => applyMove(state, 4)).toThrow();
  });

  test("applyMove sets game-over when total reaches target", () => {
    let state = createInitialGameState(config);
    state = applyMove(state, 3); // total=3, opp's turn
    state = applyMove(state, 3); // total=6
    state = applyMove(state, 3); // total=9
    state = applyMove(state, 1); // total=10, game over
    expect(state.isGameOver).toBe(true);
    expect(state.currentTotal).toBe(10);
    // The 4th move was made by the APP_USER (turns: U, O, U, O — so the
    // 4th mover is OPPONENT). Under LOSE, the opponent loses, so app user wins.
    expect(state.lastMoverWasAppUser).toBe(false);
    expect(appUserWon(state)).toBe(true);
  });

  test("applyMove on a game-over state throws", () => {
    let state = createInitialGameState(config);
    state = applyMove(state, 3);
    state = applyMove(state, 3);
    state = applyMove(state, 3);
    state = applyMove(state, 1); // game over
    expect(() => applyMove(state, 1)).toThrow();
  });

  test("overshoot ends game on the over-shooting player", () => {
    // From total=8 (d=2), play 3 → total=11 ends the game on this mover.
    const overshootConfig: GameConfig = { ...config };
    let state = createInitialGameState(overshootConfig);
    state = applyMove(state, 3); // 3 (opp)
    state = applyMove(state, 3); // 6
    state = applyMove(state, 2); // 8
    state = applyMove(state, 3); // 11, overshoot
    expect(state.isGameOver).toBe(true);
    expect(state.currentTotal).toBe(11);
  });

  test("optimal play from the start: app user goes first and wins", () => {
    let state = createInitialGameState(config);
    // App user plays the suggested move each turn; opponent plays max=3
    // (a deliberately bad strategy to demonstrate the suggester forces a win).
    while (!state.isGameOver) {
      const d = distanceRemaining(state);
      const move =
        state.currentPlayer === "APP_USER"
          ? suggestMove(d, config.min, config.max, state.losing, config.hittingTargetMeans)
          : Math.min(config.max, Math.max(config.min, 3));
      state = applyMove(state, move);
    }
    expect(appUserWon(state)).toBe(true);
  });
});

describe("First-turn range — no special restriction on move 1", () => {
  /**
   * Lock in: on a fresh game (history empty, currentTotal === 0) the legal
   * move range is the full [min, max] for whichever side moves first. There
   * is no code path that restricts the first move to 1 or to any other
   * single value.
   */

  test("applyMove accepts every value in [min, max] on a fresh state (min=1)", () => {
    const config: GameConfig = {
      target: 10,
      hittingTargetMeans: "LOSE",
      min: 1,
      max: 3,
      startingPlayer: "APP_USER",
    };
    for (const k of [1, 2, 3]) {
      const state = createInitialGameState(config);
      expect(state.history.length).toBe(0);
      expect(state.currentTotal).toBe(0);
      expect(() => applyMove(state, k)).not.toThrow();
    }
  });

  test("applyMove accepts every value in [min, max] on a fresh state (min > 1)", () => {
    const config: GameConfig = {
      target: 20,
      hittingTargetMeans: "WIN",
      min: 2,
      max: 5,
      startingPlayer: "OPPONENT",
    };
    for (const k of [2, 3, 4, 5]) {
      const state = createInitialGameState(config);
      expect(() => applyMove(state, k)).not.toThrow();
    }
    // Out-of-range values still throw, even on turn one.
    expect(() => applyMove(createInitialGameState(config), 1)).toThrow();
    expect(() => applyMove(createInitialGameState(config), 6)).toThrow();
  });

  test("suggestMove on turn one returns a value within [min, max]", () => {
    // For LOSE variant the canonical first move is 1; for WIN variant it is
    // 2 (forcing opp into d=8). Together these show suggestMove is not
    // hardcoded to a single value on the first turn.
    const loseLosing = computeLosingPositions(10, 1, 3, "LOSE");
    expect(suggestMove(10, 1, 3, loseLosing, "LOSE")).toBe(1);

    const winLosing = computeLosingPositions(10, 1, 3, "WIN");
    expect(suggestMove(10, 1, 3, winLosing, "WIN")).toBe(2);
  });
});
