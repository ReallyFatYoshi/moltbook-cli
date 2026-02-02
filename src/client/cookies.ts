import fs from "fs";
import fetchCookie from "fetch-cookie";
import { CookieJar } from "tough-cookie";
import { COOKIE_PATH } from "./paths";
import { FsLike, readJsonFile, writeJsonFile } from "./storage";

type CookieJarSerialized =
  ReturnType<CookieJar["serialize"]> extends Promise<infer T> ? T : never;

export function createCookieJar(
  fsLike: FsLike = fs,
  cookiePath: string = COOKIE_PATH,
) {
  if (!fsLike.existsSync(cookiePath)) {
    return new CookieJar();
  }

  const serialized = readJsonFile<CookieJarSerialized>(cookiePath, fsLike);
  return CookieJar.fromJSON(serialized as never);
}

export function createFetchWithCookies(
  fetchImpl: typeof fetch,
  jar: CookieJar,
) {
  return fetchCookie(fetchImpl, jar);
}

export async function saveCookies(
  jar: CookieJar,
  fsLike: FsLike = fs,
  cookiePath: string = COOKIE_PATH,
) {
  const serialized = await jar.serialize();
  writeJsonFile(cookiePath, serialized, fsLike);
}
