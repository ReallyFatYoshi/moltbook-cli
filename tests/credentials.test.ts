import { loadApiKey, saveApiKey } from "../src/client/credentials";

describe("credentials", () => {
  test("loadApiKey returns null when missing", () => {
    const fsLike = {
      existsSync: jest.fn(() => false),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
    } as any;

    expect(loadApiKey(fsLike, "/tmp/creds.json")).toBeNull();
  });

  test("loadApiKey returns api_key when present", () => {
    const fsLike = {
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(() => '{"api_key":"abc"}'),
      writeFileSync: jest.fn(),
    } as any;

    expect(loadApiKey(fsLike, "/tmp/creds.json")).toBe("abc");
  });

  test("saveApiKey writes credentials", () => {
    const fsLike = {
      existsSync: jest.fn(),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
    } as any;

    saveApiKey("key-1", "Agent", fsLike, "/tmp/creds.json");

    expect(fsLike.writeFileSync).toHaveBeenCalledWith(
      "/tmp/creds.json",
      JSON.stringify({ api_key: "key-1", agent_name: "Agent" }, null, 2),
    );
  });
});
