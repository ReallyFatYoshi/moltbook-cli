import fs from "fs";
import fetch, { Headers } from "node-fetch";
import type { RequestInit } from "node-fetch";
import { BASE, COOKIE_PATH, DATA_DIR } from "./paths";
import {
  createCookieJar,
  createFetchWithCookies,
  saveCookies,
} from "./cookies";
import { ensureDataDir, FsLike, writeJsonFile } from "./storage";

type FetchResponse = { ok: boolean; json: () => Promise<any> };

type HeadersInput = RequestInit["headers"];

function normalizeHeaders(headers: HeadersInput): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

export type ApiClientOptions = {
  fetchImpl?: typeof fetch;
  fetchWithCookies?: typeof fetch;
  fsLike?: FsLike;
  baseUrl?: string;
  cookiePath?: string;
  dataDir?: string;
  jar?: { serialize: () => Promise<unknown> };
};

export function createApiClient({
  fetchImpl = fetch,
  fetchWithCookies,
  fsLike = fs,
  baseUrl = BASE,
  cookiePath = COOKIE_PATH,
  dataDir = DATA_DIR,
  jar = createCookieJar(fsLike, cookiePath),
}: ApiClientOptions = {}) {
  ensureDataDir(fsLike, dataDir);

  const fetchCookies =
    fetchWithCookies ??
    (createFetchWithCookies(fetchImpl as any, jar as never) as any);

  async function request(
    apiKey: string,
    path: string,
    options: RequestInit = {},
  ) {
    const { headers: optionHeaders, ...restOptions } = options;
    const extraHeaders = normalizeHeaders(optionHeaders);
    const mergedHeaders: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    };

    const hasContentType =
      "Content-Type" in mergedHeaders || "content-type" in mergedHeaders;
    if (!hasContentType) {
      mergedHeaders["Content-Type"] = "application/json";
    }

    const res = (await (fetchCookies as any)(`${baseUrl}${path}`, {
      headers: mergedHeaders,
      ...restOptions,
    })) as unknown as FetchResponse;

    const json = await res.json();
    await saveCookies(jar as never, fsLike, cookiePath);

    if (json && typeof json === "object" && "success" in json) {
      const success = (json as { success?: boolean }).success;
      if (success === false) {
        const error = (json as { error?: string }).error;
        throw new Error(error || "Request failed");
      }
      return json;
    }

    if (!res.ok) throw new Error(json?.error || "Request failed");

    return json;
  }

  async function getFeed(apiKey: string, page = 1, limit = 10) {
    const query = new URLSearchParams({
      sort: "new",
      limit: String(limit),
      page: String(page),
    });
    const response = await request(apiKey, `/feed?${query.toString()}`);

    // Extract data from success wrapper if present
    let feedData: any = response;
    if (
      response &&
      typeof response === "object" &&
      "success" in response &&
      "data" in response
    ) {
      feedData = response.data;
    }

    // Ensure feedData has data array
    if (!feedData || typeof feedData !== "object" || !("data" in feedData)) {
      feedData = { data: Array.isArray(feedData) ? feedData : [] };
    }

    writeJsonFile(`${dataDir}/feed.json`, feedData, fsLike);
    return feedData as { data: { title: string }[] };
  }

  type CreatePostPayload = {
    submolt: string;
    title: string;
    content?: string;
    url?: string;
  };

  function buildPostPayload(
    input: string | CreatePostPayload,
  ): CreatePostPayload {
    if (typeof input === "string") {
      return {
        submolt: "general",
        title: "Posted from TUI",
        content: input,
      };
    }
    return input;
  }

  async function createPost(
    apiKey: string,
    payload: string | CreatePostPayload,
  ) {
    const data = await request(apiKey, "/posts", {
      method: "POST",
      body: JSON.stringify(buildPostPayload(payload)),
    });
    writeJsonFile(`${dataDir}/posts.json`, data, fsLike);
    return data;
  }

  async function getPosts(
    apiKey: string,
    {
      sort = "new",
      limit = 10,
      page = 1,
    }: { sort?: string; limit?: number; page?: number } = {},
  ) {
    const query = new URLSearchParams({
      sort,
      limit: String(limit),
      page: String(page),
    });
    return request(apiKey, `/posts?${query.toString()}`);
  }

  async function getSubmoltFeed(
    apiKey: string,
    name: string,
    {
      sort = "new",
      limit = 10,
      page = 1,
    }: { sort?: string; limit?: number; page?: number } = {},
  ) {
    const query = new URLSearchParams({
      sort,
      limit: String(limit),
      page: String(page),
    });
    return request(apiKey, `/submolts/${name}/feed?${query.toString()}`);
  }

  async function getPost(apiKey: string, postId: string) {
    return request(apiKey, `/posts/${postId}`);
  }

  async function deletePost(apiKey: string, postId: string) {
    return request(apiKey, `/posts/${postId}`, { method: "DELETE" });
  }

  async function addComment(
    apiKey: string,
    postId: string,
    content: string,
    parentId?: string,
  ) {
    return request(apiKey, `/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(
        parentId ? { content, parent_id: parentId } : { content },
      ),
    });
  }

  async function getComments(
    apiKey: string,
    postId: string,
    sort: "top" | "new" | "controversial" = "top",
  ) {
    const query = new URLSearchParams({ sort });
    return request(apiKey, `/posts/${postId}/comments?${query.toString()}`);
  }

  async function upvotePost(apiKey: string, postId: string) {
    return request(apiKey, `/posts/${postId}/upvote`, { method: "POST" });
  }

  async function downvotePost(apiKey: string, postId: string) {
    return request(apiKey, `/posts/${postId}/downvote`, { method: "POST" });
  }

  async function upvoteComment(apiKey: string, commentId: string) {
    return request(apiKey, `/comments/${commentId}/upvote`, { method: "POST" });
  }

  async function followAgent(apiKey: string, agentName: string) {
    return request(apiKey, `/agents/${agentName}/follow`, { method: "POST" });
  }

  async function unfollowAgent(apiKey: string, agentName: string) {
    return request(apiKey, `/agents/${agentName}/follow`, { method: "DELETE" });
  }

  async function createSubmolt(
    apiKey: string,
    payload: { name: string; display_name: string; description: string },
  ) {
    return request(apiKey, "/submolts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function listSubmolts(apiKey: string) {
    return request(apiKey, "/submolts");
  }

  async function getSubmolt(apiKey: string, name: string) {
    return request(apiKey, `/submolts/${name}`);
  }

  async function subscribeSubmolt(apiKey: string, name: string) {
    return request(apiKey, `/submolts/${name}/subscribe`, { method: "POST" });
  }

  async function unsubscribeSubmolt(apiKey: string, name: string) {
    return request(apiKey, `/submolts/${name}/subscribe`, {
      method: "DELETE",
    });
  }

  async function updateSubmoltSettings(
    apiKey: string,
    name: string,
    payload: {
      description?: string;
      banner_color?: string;
      theme_color?: string;
    },
  ) {
    return request(apiKey, `/submolts/${name}/settings`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async function uploadSubmoltMedia(
    apiKey: string,
    name: string,
    formData: unknown,
    headers?: HeadersInput,
  ) {
    return request(apiKey, `/submolts/${name}/settings`, {
      method: "POST",
      body: formData as any,
      headers,
    });
  }

  async function addModerator(
    apiKey: string,
    name: string,
    payload: { agent_name: string; role: string },
  ) {
    return request(apiKey, `/submolts/${name}/moderators`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function removeModerator(
    apiKey: string,
    name: string,
    payload: { agent_name: string },
  ) {
    return request(apiKey, `/submolts/${name}/moderators`, {
      method: "DELETE",
      body: JSON.stringify(payload),
    });
  }

  async function listModerators(apiKey: string, name: string) {
    return request(apiKey, `/submolts/${name}/moderators`);
  }

  async function search(
    apiKey: string,
    q: string,
    { type = "all", limit = 20 }: { type?: string; limit?: number } = {},
  ) {
    const query = new URLSearchParams({
      q,
      type,
      limit: String(limit),
    });
    return request(apiKey, `/search?${query.toString()}`);
  }

  async function getAgentMe(apiKey: string) {
    return request(apiKey, "/agents/me");
  }

  async function getAgentStatus(apiKey: string) {
    return request(apiKey, "/agents/status");
  }

  async function updateAgent(
    apiKey: string,
    payload: { description?: string; metadata?: Record<string, unknown> },
  ) {
    return request(apiKey, "/agents/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async function uploadAgentAvatar(
    apiKey: string,
    formData: unknown,
    headers?: HeadersInput,
  ) {
    return request(apiKey, "/agents/me/avatar", {
      method: "POST",
      body: formData as any,
      headers,
    });
  }

  async function deleteAgentAvatar(apiKey: string) {
    return request(apiKey, "/agents/me/avatar", { method: "DELETE" });
  }

  async function getAgentProfile(apiKey: string, name: string) {
    return request(apiKey, `/agents/profile?name=${encodeURIComponent(name)}`);
  }

  async function registerAgent(name: string, description: string) {
    const res = (await fetchImpl(`${baseUrl}/agents/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    })) as unknown as FetchResponse;

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Registration failed");
    return json.agent as {
      api_key: string;
      claim_url: string;
      verification_code: string;
    };
  }

  function withApiKey(apiKey: string) {
    return {
      request: (path: string, options?: RequestInit) =>
        request(apiKey, path, options),
      getFeed: (page?: number, limit?: number) => getFeed(apiKey, page, limit),
      createPost: (payload: string | CreatePostPayload) =>
        createPost(apiKey, payload),
      getPosts: (options?: { sort?: string; limit?: number; page?: number }) =>
        getPosts(apiKey, options),
      getSubmoltFeed: (
        name: string,
        options?: { sort?: string; limit?: number; page?: number },
      ) => getSubmoltFeed(apiKey, name, options),
      getPost: (postId: string) => getPost(apiKey, postId),
      deletePost: (postId: string) => deletePost(apiKey, postId),
      addComment: (postId: string, content: string, parentId?: string) =>
        addComment(apiKey, postId, content, parentId),
      getComments: (postId: string, sort?: "top" | "new" | "controversial") =>
        getComments(apiKey, postId, sort),
      upvotePost: (postId: string) => upvotePost(apiKey, postId),
      downvotePost: (postId: string) => downvotePost(apiKey, postId),
      upvoteComment: (commentId: string) => upvoteComment(apiKey, commentId),
      followAgent: (agentName: string) => followAgent(apiKey, agentName),
      unfollowAgent: (agentName: string) => unfollowAgent(apiKey, agentName),
      createSubmolt: (payload: {
        name: string;
        display_name: string;
        description: string;
      }) => createSubmolt(apiKey, payload),
      listSubmolts: () => listSubmolts(apiKey),
      getSubmolt: (name: string) => getSubmolt(apiKey, name),
      subscribeSubmolt: (name: string) => subscribeSubmolt(apiKey, name),
      unsubscribeSubmolt: (name: string) => unsubscribeSubmolt(apiKey, name),
      updateSubmoltSettings: (
        name: string,
        payload: {
          description?: string;
          banner_color?: string;
          theme_color?: string;
        },
      ) => updateSubmoltSettings(apiKey, name, payload),
      uploadSubmoltMedia: (
        name: string,
        formData: unknown,
        headers?: HeadersInput,
      ) => uploadSubmoltMedia(apiKey, name, formData, headers),
      addModerator: (
        name: string,
        payload: { agent_name: string; role: string },
      ) => addModerator(apiKey, name, payload),
      removeModerator: (name: string, payload: { agent_name: string }) =>
        removeModerator(apiKey, name, payload),
      listModerators: (name: string) => listModerators(apiKey, name),
      search: (q: string, options?: { type?: string; limit?: number }) =>
        search(apiKey, q, options),
      getAgentMe: () => getAgentMe(apiKey),
      getAgentStatus: () => getAgentStatus(apiKey),
      updateAgent: (payload: {
        description?: string;
        metadata?: Record<string, unknown>;
      }) => updateAgent(apiKey, payload),
      uploadAgentAvatar: (formData: unknown, headers?: HeadersInput) =>
        uploadAgentAvatar(apiKey, formData, headers),
      deleteAgentAvatar: () => deleteAgentAvatar(apiKey),
      getAgentProfile: (name: string) => getAgentProfile(apiKey, name),
    };
  }

  return {
    request,
    getFeed,
    createPost,
    getPosts,
    getSubmoltFeed,
    getPost,
    deletePost,
    addComment,
    getComments,
    upvotePost,
    downvotePost,
    upvoteComment,
    followAgent,
    unfollowAgent,
    createSubmolt,
    listSubmolts,
    getSubmolt,
    subscribeSubmolt,
    unsubscribeSubmolt,
    updateSubmoltSettings,
    uploadSubmoltMedia,
    addModerator,
    removeModerator,
    listModerators,
    search,
    getAgentMe,
    getAgentStatus,
    updateAgent,
    uploadAgentAvatar,
    deleteAgentAvatar,
    getAgentProfile,
    registerAgent,
    withApiKey,
  };
}
