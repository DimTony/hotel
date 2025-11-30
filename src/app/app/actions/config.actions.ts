"use server";

interface ConfigResponse {
  credentialsMode: string;
  azureAdEnabled: string;
  adGroups: string;
}

export async function getConfig(): Promise<
  { success: true; data: ConfigResponse } | { success: false; error: string }
> {
  try {
    const requiredEnvVars = {
      CREDENTIALS_MODE: process.env.CREDENTIALS_MODE,
      AZURE_AD_ENABLED: process.env.AZURE_AD_ENABLED,
      AUTHORIZED_GROUPS: process.env.AUTHORIZED_GROUPS,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingVars.length > 0) {
      return {
        success: false,
        error: `Missing required environment variables: ${missingVars.join(
          ", "
        )}`,
      };
    }

    const config: ConfigResponse = {
      credentialsMode: requiredEnvVars.CREDENTIALS_MODE!,
      azureAdEnabled: requiredEnvVars.AZURE_AD_ENABLED!,
      adGroups: requiredEnvVars.AUTHORIZED_GROUPS!,
    };

    return { success: true, data: config };
  } catch (error) {
    console.error("Config action error:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}
