# opNimal

A React Native / Expo app that tells you the optimal move in a configurable
"subtraction game" (a Nim-like counting game). Two players take turns adding
a number within a chosen range to a running total; whoever causes the total to
reach or exceed the target either wins or loses, depending on how you configure
the game. The app computes optimal play and shows you what to do each turn.

## Project structure

```
opNimal/
├── App.tsx                       Root component; native-stack navigator,
│                                 Settings is the initial route.
├── src/
│   ├── gameLogic.ts              Pure-TS solver. No React imports.
│   ├── gameLogic.test.ts         Jest unit tests for the solver.
│   ├── navigation.ts             RootStackParamList + per-screen prop types.
│   └── screens/
│       ├── SettingsScreen.tsx    Configuration form (initial route).
│       └── GameScreen.tsx        Play screen — large suggested-move display.
├── jest.config.js                ts-jest preset, runs src/**/*.test.ts.
└── tsconfig.json                 Extends expo/tsconfig.base, types: ["jest"].
```

## Algorithm

`gameLogic.ts` computes a DP table `losing[d]` where `d = target - currentTotal`
is the distance remaining. `losing[d] === true` means the player about to move
loses under optimal play by both sides. `suggestMove` picks the smallest legal
move that leaves the opponent in a losing position (or, in the WIN variant,
ends the game immediately if it can).

Overshoot is allowed: any move in `[min, max]` is legal regardless of how close
the total is to the target. The game ends as soon as the total reaches or
exceeds the target, and the `hittingTargetMeans` setting decides whether that
mover wins or loses.

### Canonical example

Target = 10, min = 1, max = 3, hittingTargetMeans = "LOSE":

- Losing positions for the player about to move: `d = 1, 5, 9`.
  - At `d = 1` the mover must add ≥ 1, hitting the target, and loses.
  - At `d = 5` every move (1, 2, or 3) leaves the opponent at d = 2, 3, or 4,
    from which they reply 1, 2, or 3 to push the mover back to d = 1.
- From the start of the game (`d = 10`) the first mover wins by playing `1`,
  leaving the opponent at d = 9.

> Note: an earlier draft of the spec named losing positions as `d = 2, 6, 10`
> — those are inconsistent with the spec's own recurrence. The tests assert
> the values the algorithm actually produces (1, 5, 9), which match the
> standard misère-Nim analysis.

## Running the app locally (Windows + Expo Go)

1. Install [Expo Go](https://expo.dev/client) on your phone (iOS or Android)
   from the App Store / Play Store. Make sure your phone and laptop are on the
   same Wi-Fi network.
2. From the project root:

   ```powershell
   npm install        # only needed once
   npx expo start
   ```

3. A QR code appears in the terminal.
   - **iPhone**: open the Camera app and point it at the QR code; tap the
     "Open in Expo Go" banner.
   - **Android**: open Expo Go and tap "Scan QR code".
4. The app should open directly on the Settings screen. Configure the game and
   tap "Start game" to navigate to the Game screen.

If you have trouble with the LAN connection (corporate Wi-Fi, etc.), press
`s` in the Expo CLI to switch to "Tunnel" mode, or run
`npx expo start --tunnel` from the start.

## Tests

```powershell
npm test
```

Runs the Jest suite via `ts-jest`. All 32 unit tests exercise
`computeLosingPositions`, `suggestMove`, `validateConfig`, and the
`applyMove` / `appUserWon` state machine, including:

- The canonical target-10 LOSE example.
- The WIN variant (losing positions at `d = 4, 8` — the standard 21-game).
- Edge cases: `min === max`, `target < max` (immediate overshoot), `target = 1`.
- A full optimal-play game against a deliberately-bad opponent.

## Moving to a Mac for iOS build

The project is already configured by `create-expo-app` for an iOS build via
EAS. On the Mac:

```bash
git clone <repo-url>
cd opNimal
npm install
npx eas build --platform ios
```
