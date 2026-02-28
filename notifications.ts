/**
 * expo-notifications: "New lines available!" and EOD results.
 */

import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleLineCheckReminder(hour: number, minute: number): Promise<string | null> {
  await requestPermissions();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Prop Vault",
      body: "New lines available!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: "default",
    },
  });
  return id;
}

export async function scheduleLineChecksET(): Promise<void> {
  // 9AM, 12PM, 3PM, 9PM ET — simplified: schedule 4 daily triggers (device local time; user in ET would set 9,12,15,21)
  const times = [{ hour: 9, minute: 0 }, { hour: 12, minute: 0 }, { hour: 15, minute: 0 }, { hour: 21, minute: 0 }];
  for (const t of times) {
    await scheduleLineCheckReminder(t.hour, t.minute);
  }
}

export async function notifyNewLines(): Promise<void> {
  await requestPermissions();
  await Notifications.scheduleNotificationAsync({
    content: { title: "Prop Vault", body: "New lines available!" },
    trigger: null,
  });
}

export async function notifyEODResults(wins: number, losses: number, winPct: number): Promise<void> {
  await requestPermissions();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Prop Vault — EOD Results",
      body: `W: ${wins} L: ${losses} — Win %: ${winPct.toFixed(1)}%`,
    },
    trigger: null,
  });
}
