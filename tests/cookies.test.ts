import { CookieJar } from "tough-cookie";
import { createCookieJar, saveCookies } from "../src/client/cookies";

describe("cookies", () => {
  test("createCookieJar returns jar", () => {
    const fsLike = {
      existsSync: jest.fn(() => false),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
    } as any;

    const jar = createCookieJar(fsLike, "/tmp/cookie.json");

    expect(jar).toBeInstanceOf(CookieJar);
  });

  test("saveCookies writes serialized jar", async () => {
    const fsLike = {
      existsSync: jest.fn(),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
    } as any;

    const jar = {
      serialize: jest.fn(async () => ({ version: "tough-cookie" })),
    } as any;

    await saveCookies(jar, fsLike, "/tmp/cookie.json");

    expect(fsLike.writeFileSync).toHaveBeenCalledWith(
      "/tmp/cookie.json",
      JSON.stringify({ version: "tough-cookie" }, null, 2),
    );
  });
});
