const SETTINGS_KEY = "snaproom-settings";

export function getSettings() {
  const defaults = {
    facingMode: "user",
    aspect: "4:5",
    countdown: 3,
    shotCount: 4,
    interval: 1,
    mirrorSave: false,
    exportFormat: "image/jpeg",
    exportQuality: 0.82
  };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
