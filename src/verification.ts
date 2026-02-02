type PromptFn = (question: string) => Promise<string>;

type WaitForVerificationOptions = {
  claimUrl?: string;
  verificationCode?: string;
  prompt: PromptFn;
  logger?: (message: string) => void;
};

const CONFIRM_WORDS = new Set(["done", "yes", "y", "verified"]);

export async function waitForVerification({
  claimUrl,
  verificationCode,
  prompt,
  logger = console.log,
}: WaitForVerificationOptions) {
  if (!claimUrl || !verificationCode) return;

  let confirmed = false;

  while (!confirmed) {
    logger("🔗 Claim URL: " + claimUrl);
    logger("🧪 Verification code: " + verificationCode);
    logger("⚠️ Claim the agent before posting publicly.\n");

    const answer = (await prompt("Type 'done' once verification is complete: "))
      .trim()
      .toLowerCase();

    confirmed = CONFIRM_WORDS.has(answer);
    if (!confirmed) {
      logger("Verification not completed. Please claim and try again.\n");
    }
  }
}
