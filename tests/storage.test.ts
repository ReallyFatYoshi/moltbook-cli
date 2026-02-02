import {
  ensureDataDir,
  readJsonFile,
  writeJsonFile,
} from "../src/client/storage";

describe("storage", () => {
  test("ensureDataDir creates directory when missing", () => {
    const fsLike = {
      existsSync: jest.fn(() => false),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
    } as any;

    ensureDataDir(fsLike, "/tmp/data");

    expect(fsLike.existsSync).toHaveBeenCalledWith("/tmp/data");
    expect(fsLike.mkdirSync).toHaveBeenCalledWith("/tmp/data", {
      recursive: true,
    });
  });

  test("ensureDataDir does not create when existing", () => {
    const fsLike = {
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
    } as any;

    ensureDataDir(fsLike, "/tmp/data");

    expect(fsLike.mkdirSync).not.toHaveBeenCalled();
  });

  test("readJsonFile parses JSON", () => {
    const fsLike = {
      existsSync: jest.fn(),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(() => '{"ok":true}'),
      writeFileSync: jest.fn(),
    } as any;

    const result = readJsonFile<{ ok: boolean }>("/tmp/file.json", fsLike);

    expect(result).toEqual({ ok: true });
  });

  test("writeJsonFile stringifies JSON", () => {
    const fsLike = {
      existsSync: jest.fn(),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
    } as any;

    writeJsonFile("/tmp/file.json", { ok: true }, fsLike);

    expect(fsLike.writeFileSync).toHaveBeenCalledWith(
      "/tmp/file.json",
      JSON.stringify({ ok: true }, null, 2),
    );
  });
});
