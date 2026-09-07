import { type ApiKeyPresetSchema } from "@ovr/api/contracts/apiKeys";

export const API_KEY_PRESET_LABELS: Record<ApiKeyPresetSchema, string> = {
  ci_upload: "ci upload",
  agent_read: "agent · read only",
  agent_review: "agent · read & review",
};

export const CUSTOM_API_KEY_PRESET_LABEL = "custom";

export const formatApiKeyPreset = (preset: ApiKeyPresetSchema | null): string =>
  preset ? API_KEY_PRESET_LABELS[preset] : CUSTOM_API_KEY_PRESET_LABEL;
