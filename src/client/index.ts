import fs from "fs";
import path from "path";
import { loadApiKey, loadClaimInfo, saveApiKey } from "./credentials";
import { CREDENTIALS_PATH, DATA_DIR } from "./paths";
import { FsLike, readJsonFile } from "./storage";
import { createApiClient } from "./api";
import { startRegistrationUI } from "../registration-ui";

export { createApiClient };

type PromptFn = (question: string) => Promise<string>;

type RegisterAgentFn = (
  name: string,
  description: string,
) => Promise<{ api_key: string; claim_url: string; verification_code: string }>;

export type ApiKeyResult = {
  apiKey: string;
  claimUrl?: string;
  verificationCode?: string;
  isNew: boolean;
};

export async function getApiKey({
  prompt,
  registerAgent,
  fsLike = fs,
  credentialsPath = CREDENTIALS_PATH,
}: {
  prompt: PromptFn;
  registerAgent: RegisterAgentFn;
  fsLike?: FsLike;
  credentialsPath?: string;
}): Promise<ApiKeyResult> {
  const existing = loadApiKey(fsLike, credentialsPath);
  if (existing) {
    let claimInfo = loadClaimInfo(fsLike, credentialsPath);

    // If claim info not in credentials, try loading from registration.json
    if (!claimInfo?.claimUrl) {
      try {
        const registrationPath = path.join(DATA_DIR, "registration.json");
        const registration = readJsonFile<{
          claimUrl?: string;
          verificationCode?: string;
        }>(registrationPath, fsLike);
        if (registration.claimUrl || registration.verificationCode) {
          claimInfo = {
            claimUrl: registration.claimUrl,
            verificationCode: registration.verificationCode,
          };
        }
      } catch (e) {
        // registration.json doesn't exist or couldn't be read
      }
    }

    return {
      apiKey: existing,
      claimUrl: claimInfo?.claimUrl,
      verificationCode: claimInfo?.verificationCode,
      isNew: false,
    };
  }

  console.log("🦞 No API key found. Registering agent…\n");

  // Use TUI for registration
  const agent = await startRegistrationUI({
    registerAgent,
  });

  saveApiKey(
    agent.api_key,
    "", // name will be set during TUI registration
    agent.claim_url,
    agent.verification_code,
    fsLike,
    credentialsPath,
  );

  return {
    apiKey: agent.api_key,
    claimUrl: agent.claim_url,
    verificationCode: agent.verification_code,
    isNew: true,
  };
}
