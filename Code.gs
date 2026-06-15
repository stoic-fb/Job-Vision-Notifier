const scriptProperties = PropertiesService.getScriptProperties();

const CONFIG = Object.freeze({
  BOT_TOKEN: scriptProperties.getProperty("BOT_TOKEN"),
  CHAT_ID: scriptProperties.getProperty("CHAT_ID"),
  JOBVISION_TOKEN: scriptProperties.getProperty("JOBVISION_TOKEN"),
});

// Validate config once at startup
(function validateConfig() {
  for (const [key, value] of Object.entries(CONFIG)) {
    if (!value) {
      throw new Error(`Missing Script Property: ${key}`);
    }
  }
})();

const API_URL =
  "https://candidateapi.jobvision.ir/api/v1/Notifications/GetListOfNotifications";

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 4000;
const MAX_STORED_IDS = 500;

/* ------------------------- MAIN FUNCTION ------------------------- */

function checkNotifications() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = fetchNotifications();

      const notifications = normalizeNotifications(result);

      const knownIds = loadKnownIds();
      const newNotifications = notifications.filter(
        (n) => !knownIds.includes(n.id)
      );

      if (newNotifications.length > 0) {
        newNotifications.reverse();

        for (const notification of newNotifications) {
          const message = formatNotification(notification);
          safeSendTelegram(message);

          Utilities.sleep(800);
        }
      }

      updateKnownIds(notifications.map((n) => n.id));

      Logger.log("checkNotifications success");
      return;
    } catch (err) {
      Logger.log(`Attempt ${attempt} failed: ${err.message}`);

      if (attempt < MAX_RETRIES) {
        Utilities.sleep(BACKOFF_BASE_MS * attempt);
      } else {
        handleFatalError(err);
        throw err;
      }
    }
  }
}

/* ------------------------- API CALL ------------------------- */

function fetchNotifications() {
  const payload = {
    page: 1,
    pageSize: 10,
    status: 0,
  };

  const response = UrlFetchApp.fetch(API_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${CONFIG.JOBVISION_TOKEN}`,
      "ngsw-bypass": "true",
      "web-app-version": "19.0.134",
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code !== 200) {
    throw new Error(`HTTP ${code}: ${truncate(body)}`);
  }

  let json;
  try {
    json = JSON.parse(body);
  } catch (e) {
    throw new Error("Invalid JSON response from API");
  }

  if (!json || json.isSuccess !== true) {
    throw new Error(`API failure: ${truncate(body)}`);
  }

  return json;
}

/* ------------------------- NORMALIZATION ------------------------- */

function normalizeNotifications(result) {
  const data = result?.data?.data;

  if (!Array.isArray(data)) {
    throw new Error("Invalid notification structure");
  }

  return data;
}

/* ------------------------- STORAGE ------------------------- */

function loadKnownIds() {
  const raw = scriptProperties.getProperty("KNOWN_NOTIFICATION_IDS");
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function updateKnownIds(ids) {
  const existing = loadKnownIds();

  const merged = [...new Set([...existing, ...ids])];

  const trimmed = merged.slice(-MAX_STORED_IDS);

  scriptProperties.setProperty(
    "KNOWN_NOTIFICATION_IDS",
    JSON.stringify(trimmed)
  );
}

/* ------------------------- TELEGRAM ------------------------- */

function safeSendTelegram(text) {
  for (let i = 1; i <= 2; i++) {
    try {
      sendTelegram(text);
      return;
    } catch (err) {
      Logger.log(`Telegram attempt ${i} failed: ${err.message}`);
      Utilities.sleep(1500 * i);
    }
  }

  Logger.log("Telegram failed permanently");
}

function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`;

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: CONFIG.CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  if (code !== 200) {
    throw new Error(`Telegram HTTP ${code}: ${truncate(res.getContentText())}`);
  }
}

/* ------------------------- ERROR HANDLING ------------------------- */

function handleFatalError(error) {
  try {
    safeSendTelegram(
      `🚨 JobVision Bot Failed\n\n` +
        `Time: ${new Date().toISOString()}\n\n` +
        `Error:\n${error.message}`
    );
  } catch (e) {
    Logger.log("Failed to send fatal error to Telegram");
  }
}

/* ------------------------- UTIL ------------------------- */

function formatNotification(n) {
  // Determine emoji based on title content
  let emoji = "🔔"; // default
  
  if (n.title.includes("رد شد")) {
    emoji = "❌"; // rejected
  } else if (n.title.includes("اولویت برسی")) {
    emoji = "✅"; // approved
  } else if (n.title.includes("تایید")) {
    emoji = "✅"; // approved
  }
  
  return (
    `${emoji} ${n.title}\n\n` +
    `📅 ${n.createdAt}\n` +
    `📂 Category: ${n.categoryId}\n` +
    `🔗 ${n.link || "No link"}`
  );
}

function truncate(str, max = 300) {
  return str && str.length > max ? str.slice(0, max) + "..." : str;
}

/* ------------------------- DEBUG ------------------------- */

function resetNotificationsCache() {
  scriptProperties.deleteProperty("KNOWN_NOTIFICATION_IDS");
}

function testTelegram() {
  safeSendTelegram("✅ Bot is working correctly");
}
