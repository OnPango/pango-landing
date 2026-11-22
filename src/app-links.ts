/**
 * Links into the Pango app. `PUBLIC_APP_URL` is read at build time; without it the links go to
 * production, never back to the landing itself.
 */
const APP_URL = (import.meta.env.PUBLIC_APP_URL || "https://pango.onpango.com").replace(/\/+$/, "");

export const appLinks = {
  login: `${APP_URL}/login`,
  register: `${APP_URL}/register`,
};
