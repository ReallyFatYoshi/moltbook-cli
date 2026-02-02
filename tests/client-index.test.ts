import { getApiKey } from "../src/client";

describe("client index", () => {
  test("getApiKey returns existing key", async () => {
    const fsLike = {
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(() => '{"api_key":"abc"}'),
      writeFileSync: jest.fn(),
    } as any;

    const prompt = jest.fn();
    const registerAgent = jest.fn();

    const result = await getApiKey({
      prompt,
      registerAgent,
      fsLike,
      credentialsPath: "/tmp/creds.json",
    });

    expect(result).toEqual({ apiKey: "abc", isNew: false });
    expect(prompt).not.toHaveBeenCalled();
    expect(registerAgent).not.toHaveBeenCalled();
  });

  test("getApiKey registers when missing", async () => {
    const fsLike = {
      existsSync: jest.fn(() => false),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
    } as any;

    const prompt = jest
      .fn()
      .mockResolvedValueOnce("Agent")
      .mockResolvedValueOnce("Desc");
    const registerAgent = jest.fn(async () => ({
      api_key: "k",
      claim_url: "url",
      verification_code: "code",
    }));

    const result = await getApiKey({
      prompt,
      registerAgent,
      fsLike,
      credentialsPath: "/tmp/creds.json",
    });

    expect(result.apiKey).toBe("k");
    expect(result.isNew).toBe(true);
    expect(fsLike.writeFileSync).toHaveBeenCalledWith(
      "/tmp/creds.json",
      JSON.stringify({ api_key: "k", agent_name: "Agent" }, null, 2),
    );
  });
});
