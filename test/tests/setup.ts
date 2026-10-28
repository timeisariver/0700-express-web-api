import { apiBaseUrl, setupMessage } from "./config";

beforeAll(async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    await fetch(`${apiBaseUrl}/users/me`, {
      headers: {
        Authorization: "Bearer invalid-token"
      },
      signal: controller.signal
    });
  } catch {
    throw new Error(setupMessage);
  } finally {
    clearTimeout(timeoutId);
  }
});
