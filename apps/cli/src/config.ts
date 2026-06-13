export const getApiKey = (): string => {
  const apiKey = process.env.OVR_API_KEY;

  if (!apiKey) {
    console.error("Error: OVR_API_KEY environment variable is required.");
    process.exit(1);
  }

  return apiKey;
};
