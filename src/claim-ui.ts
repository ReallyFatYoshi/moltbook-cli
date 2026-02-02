import blessed from "blessed";

type ClaimUIDeps = {
  claimUrl?: string;
  verificationCode?: string;
  checkStatus: () => Promise<{ status: string } | null>;
  prompt: (question: string) => Promise<string>;
  blessedLib?: typeof blessed;
  onExit?: () => void;
};

export async function showClaimUI({
  claimUrl,
  verificationCode,
  checkStatus,
  prompt,
  blessedLib = blessed,
  onExit,
}: ClaimUIDeps): Promise<boolean> {
  if (!claimUrl || !verificationCode) {
    console.log("⚠️ No claim URL or verification code available.");
    return true; // Already claimed or not needed
  }

  const screen = blessedLib.screen({
    smartCSR: true,
    title: "Moltbook Agent Claim 🦞",
  });

  const mainBox = blessedLib.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 80,
    height: 20,
    border: "line",
    style: { border: { fg: "cyan" } },
  });

  const urlBox = blessedLib.box({
    parent: mainBox,
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    style: { fg: "green" },
    content: `{bold}📋 Claim Your Agent{/bold}

{yellow}🔗 Claim URL:{/yellow}
{cyan}${claimUrl}{/cyan}

{yellow}🧪 Verification Code:{/yellow}
{cyan}${verificationCode}{/cyan}`,
  });

  const instructionsBox = blessedLib.box({
    parent: mainBox,
    top: 8,
    left: 0,
    right: 0,
    height: 6,
    style: { fg: "white" },
    content: `{bold}Instructions:{/bold}
1. Visit the URL above in your browser
2. Enter the verification code
3. Complete the claim process
4. Press 'c' to check status or 'q' to quit`,
  });

  screen.key(["q", "C-c"], () => (onExit ? onExit() : process.exit(0)));

  let claimed = false;

  screen.key(["c"], async () => {
    const statusBox = blessedLib.box({
      parent: screen,
      top: "center",
      left: "center",
      width: 50,
      height: 5,
      border: "line",
      style: { fg: "yellow" },
      content: "{bold}Checking status...{/bold}",
    });
    screen.render();

    try {
      const status = await checkStatus();
      const agentStatus =
        status && typeof status === "object" && "status" in status
          ? (status as any).status
          : null;

      if (agentStatus === "claimed") {
        statusBox.setContent(
          "{green}{bold}✅ Agent Successfully Claimed!{/bold}{/green}\n\nPress any key to continue...",
        );
        claimed = true;
        screen.render();
        await new Promise((resolve) => screen.once("key", resolve));
        screen.destroy();
        return true;
      } else {
        statusBox.setContent(
          `{yellow}Status: ${agentStatus || "unknown"}{/yellow}\n\nStill pending. Complete the claim first.\nPress any key to retry...`,
        );
      }
    } catch (e) {
      statusBox.setContent(
        `{red}Error checking status{/red}\n\nPress any key to retry...`,
      );
    }

    screen.render();
    await new Promise((resolve) => screen.once("key", resolve));
    statusBox.destroy();
    screen.render();
  });

  screen.key(["enter"], async () => {
    const promptScreen = blessedLib.screen({
      smartCSR: true,
    });

    const answer = await prompt(
      "Press ENTER when you've completed the claim: ",
    );

    try {
      const status = await checkStatus();
      const agentStatus =
        status && typeof status === "object" && "status" in status
          ? (status as any).status
          : null;

      if (agentStatus === "claimed") {
        screen.destroy();
        return true;
      }
    } catch (e) {
      // Continue anyway
    }

    screen.render();
    return false;
  });

  screen.render();

  return new Promise((resolve) => {
    const checkPeriodically = async () => {
      try {
        const status = await checkStatus();
        const agentStatus =
          status && typeof status === "object" && "status" in status
            ? (status as any).status
            : null;

        if (agentStatus === "claimed") {
          screen.destroy();
          resolve(true);
          return;
        }
      } catch (e) {
        // Continue checking
      }

      setTimeout(checkPeriodically, 5000);
    };

    checkPeriodically();
  });
}
