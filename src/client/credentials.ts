import fs from "fs";
import { CREDENTIALS_PATH } from "./paths";
import { FsLike, readJsonFile, writeJsonFile } from "./storage";

type CredentialsFile = {
  api_key?: string;
  agent_name?: string;
  claim_url?: string;
  verification_code?: string;
};

export function loadApiKey(
  fsLike: FsLike = fs,
  credentialsPath: string = CREDENTIALS_PATH,
): string | null {
  if (!fsLike.existsSync(credentialsPath)) return null;
  const json = readJsonFile<CredentialsFile>(credentialsPath, fsLike);
  return json.api_key ?? null;
}

export function loadClaimInfo(
  fsLike: FsLike = fs,
  credentialsPath: string = CREDENTIALS_PATH,
): { claimUrl?: string; verificationCode?: string } | null {
  if (!fsLike.existsSync(credentialsPath)) return null;
  const json = readJsonFile<CredentialsFile>(credentialsPath, fsLike);
  return {
    claimUrl: json.claim_url,
    verificationCode: json.verification_code,
  };
}

export function saveApiKey(
  apiKey: string,
  agentName: string,
  claimUrl?: string,
  verificationCode?: string,
  fsLike: FsLike = fs,
  credentialsPath: string = CREDENTIALS_PATH,
) {
  writeJsonFile(
    credentialsPath,
    {
      api_key: apiKey,
      agent_name: agentName,
      claim_url: claimUrl,
      verification_code: verificationCode,
    },
    fsLike,
  );
}
