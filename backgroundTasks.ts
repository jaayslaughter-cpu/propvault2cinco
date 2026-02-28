/**
 * expo-task-manager: background fetch for new lines.
 * When task runs: fetch today's props, store last checked time, notify.
 */

import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTodaysGames } from "./espn";
import { generateMockPropsForGame } from "./propsModel";
import { notifyNewLines } from "./notifications";

const TASK_NAME = "PROP_VAULT_FETCH";
const LAST_CHECK_KEY = "prop_vault_last_check";

export async function registerBackgroundFetch(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 60, // 1 hour
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // not supported on this device
  }
}

export function defineBackgroundTask(): void {
  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      const games = await getTodaysGames("nba");
      let count = 0;
      for (const g of games) {
        const props = generateMockPropsForGame(
          g.gameId,
          g.name ?? g.shortName ?? "",
          "Away",
          "Home"
        );
        count += props.length;
      }
      await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
      if (count > 0) {
        await notifyNewLines();
      }
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export async function getLastChecked(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_CHECK_KEY);
}

export async function setLastChecked(): Promise<void> {
  await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
}
