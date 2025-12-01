import { NextRequest, NextResponse } from "next/server";

interface ConfigResponse {
  credentialsMode: string;
  azureAdEnabled: string;
  // adGroups: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ConfigResponse | { error: string }>> {
  try {
    const requiredEnvVars = {
      CREDENTIALS_MODE: process.env.CREDENTIALS_MODE,
      AZURE_AD_ENABLED: process.env.AZURE_AD_ENABLED,
      // AUTHORIZED_GROUPS: process.env.AUTHORIZED_GROUPS,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required environment variables: ${missingVars.join(
            ", "
          )}`,
        },
        { status: 500 }
      );
    }

    const config: ConfigResponse = {
      credentialsMode: requiredEnvVars.CREDENTIALS_MODE!,
      azureAdEnabled: requiredEnvVars.AZURE_AD_ENABLED!,
      // adGroups: requiredEnvVars.AUTHORIZED_GROUPS!,
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("Config API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
