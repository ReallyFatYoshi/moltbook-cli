import fs from "fs";
import { DATA_DIR } from "./paths";

export type FsLike = Pick<
  typeof fs,
  "existsSync" | "mkdirSync" | "readFileSync" | "writeFileSync"
>;

export function ensureDataDir(fsLike: FsLike = fs, dataDir: string = DATA_DIR) {
  if (!fsLike.existsSync(dataDir)) {
    fsLike.mkdirSync(dataDir, { recursive: true });
  }
}

export function readJsonFile<T = unknown>(
  filePath: string,
  fsLike: FsLike = fs,
): T {
  const raw = fsLike.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export function writeJsonFile(
  filePath: string,
  data: unknown,
  fsLike: FsLike = fs,
) {
  fsLike.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
