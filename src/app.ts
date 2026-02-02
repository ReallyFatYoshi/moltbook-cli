#!/usr/bin/env node

import { createApiClient, getApiKey } from "./client";
import { prompt } from "./prompt";
import { startUI } from "./ui";

// Helper to extract agent status
const extractAgentStatus = (status: unknown): string | null => {
  return status && typeof status === "object" && "status" in status
    ? (status as any).status
    : null;
};

/* ───────────── Start ───────────── */

(async () => {
  const client = createApiClient();
  const apiKeyResult = await getApiKey({
    prompt,
    registerAgent: client.registerAgent,
  });

  const authedClient = client.withApiKey(apiKeyResult.apiKey);

  // Check claim status
  let isClaimed = false;
  try {
    const status = await authedClient.getAgentStatus();
    isClaimed = extractAgentStatus(status) === "claimed";
  } catch (e) {
    // Continue anyway
  }

  // Show claim info if not claimed
  if (!isClaimed) {
    console.log("\n🦞 Agent Not Yet Claimed\n");

    if (apiKeyResult.claimUrl) {
      console.log("🔗 Claim URL:");
      console.log(`   ${apiKeyResult.claimUrl}\n`);
    }

    if (apiKeyResult.verificationCode) {
      console.log("🧪 Verification Code:");
      console.log(`   ${apiKeyResult.verificationCode}\n`);
    }

    console.log(
      "⚠️ Visit the URL above and enter the verification code to claim your agent.",
    );
    console.log("Press ENTER to check status or wait for automatic check...\n");

    // Wait for user to claim
    let claimed = false;
    const checkInterval = setInterval(async () => {
      try {
        const status = await authedClient.getAgentStatus();
        if (extractAgentStatus(status) === "claimed") {
          claimed = true;
          clearInterval(checkInterval);
          console.log("✅ Agent claimed! Starting TUI...\n");
        }
      } catch (e) {
        // Continue checking
      }
    }, 3000);

    // Allow manual check with Enter
    await new Promise((resolve) => {
      process.stdin.once("data", async () => {
        clearInterval(checkInterval);
        try {
          const status = await authedClient.getAgentStatus();
          if (extractAgentStatus(status) === "claimed") {
            console.log("✅ Agent claimed!\n");
          } else {
            console.log("⏳ Still pending claim. Continuing anyway...\n");
          }
        } catch (e) {
          console.log("⏳ Could not verify, but continuing...\n");
        }
        resolve(null);
      });
    });
  }

  await startUI({
    apiKey: apiKeyResult.apiKey,
    getFeed: authedClient.getFeed,
    createPost: authedClient.createPost,
    getAgentStatus: authedClient.getAgentStatus,
  });
})();
