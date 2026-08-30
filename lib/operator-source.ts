export interface AtlasPayApiConfig {
  baseUrl: string;
  token: string;
  timeoutMs: number;
}

export interface AtlasPayEnvironment {
  ATLASPAY_API_BASE_URL?: string;
  ATLASPAY_API_TOKEN?: string;
  ATLASPAY_API_TIMEOUT_MS?: string;
}

export function atlasPayApiConfigFromEnvironment(
  environment: AtlasPayEnvironment,
): AtlasPayApiConfig | null {
  const baseUrl = environment.ATLASPAY_API_BASE_URL?.trim() ?? "";
  const token = environment.ATLASPAY_API_TOKEN?.trim() ?? "";
  const timeoutText = environment.ATLASPAY_API_TIMEOUT_MS?.trim() ?? "";

  if (!baseUrl && !token && !timeoutText) return null;
  if (!baseUrl || !token) {
    throw new Error(
      "ATLASPAY_API_BASE_URL and ATLASPAY_API_TOKEN must be configured together; refusing fixture fallback",
    );
  }

  const timeoutMs = timeoutText ? Number(timeoutText) : 3000;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error("ATLASPAY_API_TIMEOUT_MS must be a positive integer");
  }

  return { baseUrl, token, timeoutMs };
}
