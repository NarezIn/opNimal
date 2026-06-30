/**
 * Shared React Navigation type definitions.
 *
 * Defines the param list for the root native-stack so each screen can
 * type its route params and navigation prop without circular imports.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { GameConfig } from "./gameLogic";

/**
 * Root navigator routes:
 *  - Settings: the configuration form. No params (initial route).
 *  - Game: the play screen. Receives the validated GameConfig.
 */
export type RootStackParamList = {
  Settings: undefined;
  Game: { config: GameConfig };
};

/** Props for SettingsScreen, including typed navigation + route. */
export type SettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Settings"
>;

/** Props for GameScreen, including typed navigation + route. */
export type GameScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Game"
>;
