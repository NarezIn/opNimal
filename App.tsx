/**
 * App root.
 *
 * Sets up the native-stack navigator with Settings as the initial route.
 * Settings is reachable on app launch; Game is only reached after the user
 * taps "Start game" with a valid configuration.
 */
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SettingsScreen } from "./src/screens/SettingsScreen";
import { GameScreen } from "./src/screens/GameScreen";
import type { RootStackParamList } from "./src/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level React component registered with Expo.
 *
 * Returns:
 *   JSX.Element: navigation container with the Settings -> Game stack.
 */
export default function App(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Settings">
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: "opNimal" }}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{ title: "Game" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
