import { waitForVerification } from "../src/verification";

describe("waitForVerification", () => {
  test("returns immediately when missing data", async () => {
    const prompt = jest.fn();
    const logger = jest.fn();

    await waitForVerification({ prompt, logger });

    expect(prompt).not.toHaveBeenCalled();
    expect(logger).not.toHaveBeenCalled();
  });

  test("repeats until user confirms", async () => {
    const prompt = jest
      .fn()
      .mockResolvedValueOnce("no")
      .mockResolvedValueOnce("done");
    const logger = jest.fn();

    await waitForVerification({
      claimUrl: "https://example.com/claim",
      verificationCode: "code",
      prompt,
      logger,
    });

    expect(prompt).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledWith("🧪 Verification code: code");
  });
});
