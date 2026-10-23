export const DEFAULT_EMULATOR_HOST = "127.0.0.1";
export const DEFAULT_EMULATOR_PORT = 8080;
export const MIN_PORT = 1;
export const MAX_PORT = 65535;
export const EMULATOR_HOST_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/;
export const PROJECT_ID_PATTERN = /^(?:[a-z0-9.-]{1,63}:)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
export const OAUTH_CLIENT_ID_PATTERN = /^[A-Za-z0-9.-]{1,200}\.apps\.googleusercontent\.com$/;
export const OAUTH_CLIENT_SECRET_MAX_LENGTH = 200;
