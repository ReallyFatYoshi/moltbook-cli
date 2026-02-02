import { createApiClient } from "../src/client/api";

describe("api client", () => {
  function createClient(fetchWithCookies: jest.Mock, fetchImpl?: jest.Mock) {
    return createApiClient({
      fetchWithCookies: fetchWithCookies as any,
      fetchImpl: (fetchImpl ?? fetchWithCookies) as any,
      fsLike: {
        existsSync: jest.fn(() => true),
        mkdirSync: jest.fn(),
        readFileSync: jest.fn(() => "{}"),
        writeFileSync: jest.fn(),
      } as any,
      jar: { serialize: jest.fn(async () => ({})) } as any,
      baseUrl: "https://example.com",
      dataDir: "/tmp/data",
      cookiePath: "/tmp/cookie.json",
    });
  }

  test("request adds auth header and saves cookies", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const fsLike = {
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(() => "{}"),
      writeFileSync: jest.fn(),
    } as any;

    const jar = {
      serialize: jest.fn(async () => ({ cookie: "jar" })),
    } as any;

    const client = createApiClient({
      fetchWithCookies: fetchWithCookies as any,
      fsLike,
      jar,
      baseUrl: "https://example.com",
      dataDir: "/tmp/data",
      cookiePath: "/tmp/cookie.json",
    });

    const result = await client.request("token", "/path");

    expect(fetchWithCookies).toHaveBeenCalledWith("https://example.com/path", {
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "application/json",
      },
    });
    expect(result).toEqual({ ok: true });
    expect(fsLike.writeFileSync).toHaveBeenCalledWith(
      "/tmp/cookie.json",
      JSON.stringify({ cookie: "jar" }, null, 2),
    );
  });

  test("request throws on error", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: false,
      json: async () => ({ error: "Bad" }),
    }));

    const client = createApiClient({
      fetchWithCookies: fetchWithCookies as any,
      fsLike: {
        existsSync: jest.fn(() => true),
        mkdirSync: jest.fn(),
        readFileSync: jest.fn(() => "{}"),
        writeFileSync: jest.fn(),
      } as any,
      jar: { serialize: jest.fn(async () => ({})) } as any,
      baseUrl: "https://example.com",
      dataDir: "/tmp/data",
    });

    await expect(client.request("token", "/path")).rejects.toThrow("Bad");
  });

  test("request unwraps success wrapper", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: { ok: true } }),
    }));

    const client = createApiClient({
      fetchWithCookies: fetchWithCookies as any,
      fsLike: {
        existsSync: jest.fn(() => true),
        mkdirSync: jest.fn(),
        readFileSync: jest.fn(() => "{}"),
        writeFileSync: jest.fn(),
      } as any,
      jar: { serialize: jest.fn(async () => ({})) } as any,
      baseUrl: "https://example.com",
      dataDir: "/tmp/data",
    });

    const result = await client.request("token", "/path");

    expect(result).toEqual({ success: true, data: { ok: true } });
  });

  test("request merges headers", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const client = createClient(fetchWithCookies);

    await client.request("token", "/path", {
      headers: { "Content-Type": "multipart/form-data" },
    });

    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/path",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "multipart/form-data",
        }),
      }),
    );
  });

  test("getFeed writes feed data with pagination", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: true,
      json: async () => ({ data: [{ title: "A" }] }),
    }));

    const fsLike = {
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(() => "{}"),
      writeFileSync: jest.fn(),
    } as any;

    const client = createApiClient({
      fetchWithCookies: fetchWithCookies as any,
      fsLike,
      jar: { serialize: jest.fn(async () => ({})) } as any,
      baseUrl: "https://example.com",
      dataDir: "/tmp/data",
    });

    const data = await client.getFeed("token", 2, 10);

    expect(data.data[0].title).toBe("A");
    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/feed?sort=new&limit=10&page=2",
      expect.any(Object),
    );
    expect(fsLike.writeFileSync).toHaveBeenCalledWith(
      "/tmp/data/feed.json",
      JSON.stringify({ data: [{ title: "A" }] }, null, 2),
    );
  });

  test("createPost writes post data", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const fsLike = {
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
      readFileSync: jest.fn(() => "{}"),
      writeFileSync: jest.fn(),
    } as any;

    const client = createApiClient({
      fetchWithCookies: fetchWithCookies as any,
      fsLike,
      jar: { serialize: jest.fn(async () => ({})) } as any,
      baseUrl: "https://example.com",
      dataDir: "/tmp/data",
    });

    await client.createPost("token", "Hello");

    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/posts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          submolt: "general",
          title: "Posted from TUI",
          content: "Hello",
        }),
      }),
    );

    expect(fsLike.writeFileSync).toHaveBeenCalledWith(
      "/tmp/data/posts.json",
      JSON.stringify({ ok: true }, null, 2),
    );
  });

  test("createPost supports link payload", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const client = createClient(fetchWithCookies);

    await client.createPost("token", {
      submolt: "general",
      title: "Link",
      url: "https://example.com",
    });

    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/posts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          submolt: "general",
          title: "Link",
          url: "https://example.com",
        }),
      }),
    );
  });

  test("getPosts hits posts list", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const client = createClient(fetchWithCookies);

    await client.getPosts("token", { sort: "hot", limit: 5, page: 2 });

    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/posts?sort=hot&limit=5&page=2",
      expect.any(Object),
    );
  });

  test("getSubmoltFeed hits submolt feed", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const client = createClient(fetchWithCookies);

    await client.getSubmoltFeed("token", "news", { sort: "new" });

    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/submolts/news/feed?sort=new&limit=10&page=1",
      expect.any(Object),
    );
  });

  test("getPost and deletePost", async () => {
    const fetchWithCookies = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    const client = createClient(fetchWithCookies);

    await client.getPost("token", "p1");
    await client.deletePost("token", "p1");

    expect(fetchWithCookies).toHaveBeenNthCalledWith(
      1,
      "https://example.com/posts/p1",
      expect.any(Object),
    );
    expect(fetchWithCookies).toHaveBeenNthCalledWith(
      2,
      "https://example.com/posts/p1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  test("addComment and getComments", async () => {
    const fetchWithCookies = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    const client = createClient(fetchWithCookies);

    await client.addComment("token", "p1", "Nice", "c1");
    await client.getComments("token", "p1", "new");

    expect(fetchWithCookies).toHaveBeenNthCalledWith(
      1,
      "https://example.com/posts/p1/comments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "Nice", parent_id: "c1" }),
      }),
    );
    expect(fetchWithCookies).toHaveBeenNthCalledWith(
      2,
      "https://example.com/posts/p1/comments?sort=new",
      expect.any(Object),
    );
  });

  test("voting endpoints", async () => {
    const fetchWithCookies = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    const client = createClient(fetchWithCookies);

    await client.upvotePost("token", "p1");
    await client.downvotePost("token", "p1");
    await client.upvoteComment("token", "c1");

    expect(fetchWithCookies).toHaveBeenNthCalledWith(
      1,
      "https://example.com/posts/p1/upvote",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchWithCookies).toHaveBeenNthCalledWith(
      2,
      "https://example.com/posts/p1/downvote",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchWithCookies).toHaveBeenNthCalledWith(
      3,
      "https://example.com/comments/c1/upvote",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("follow endpoints", async () => {
    const fetchWithCookies = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    const client = createClient(fetchWithCookies);

    await client.followAgent("token", "Molty");
    await client.unfollowAgent("token", "Molty");

    expect(fetchWithCookies).toHaveBeenNthCalledWith(
      1,
      "https://example.com/agents/Molty/follow",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchWithCookies).toHaveBeenNthCalledWith(
      2,
      "https://example.com/agents/Molty/follow",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  test("submolt endpoints", async () => {
    const fetchWithCookies = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    const client = createClient(fetchWithCookies);

    await client.createSubmolt("token", {
      name: "aithoughts",
      display_name: "AI Thoughts",
      description: "desc",
    });
    await client.listSubmolts("token");
    await client.getSubmolt("token", "aithoughts");
    await client.subscribeSubmolt("token", "aithoughts");
    await client.unsubscribeSubmolt("token", "aithoughts");
    await client.updateSubmoltSettings("token", "aithoughts", {
      description: "new",
    });
    await client.uploadSubmoltMedia("token", "aithoughts", "form", {
      "Content-Type": "multipart/form-data",
    });
    await client.addModerator("token", "aithoughts", {
      agent_name: "Molty",
      role: "moderator",
    });
    await client.removeModerator("token", "aithoughts", {
      agent_name: "Molty",
    });
    await client.listModerators("token", "aithoughts");

    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/submolts",
      expect.any(Object),
    );
    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/submolts/aithoughts",
      expect.any(Object),
    );
    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/submolts/aithoughts/subscribe",
      expect.any(Object),
    );
    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/submolts/aithoughts/settings",
      expect.any(Object),
    );
    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/submolts/aithoughts/moderators",
      expect.any(Object),
    );
  });

  test("search endpoint", async () => {
    const fetchWithCookies = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    const client = createClient(fetchWithCookies);

    await client.search("token", "hello", { type: "posts", limit: 5 });

    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/search?q=hello&type=posts&limit=5",
      expect.any(Object),
    );
  });

  test("agent endpoints", async () => {
    const fetchWithCookies = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    const client = createClient(fetchWithCookies);

    await client.getAgentMe("token");
    await client.getAgentStatus("token");
    await client.updateAgent("token", { description: "new" });
    await client.uploadAgentAvatar("token", "form", {
      "Content-Type": "multipart/form-data",
    });
    await client.deleteAgentAvatar("token");
    await client.getAgentProfile("token", "Molty");

    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/agents/me",
      expect.any(Object),
    );
    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/agents/status",
      expect.any(Object),
    );
    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/agents/me/avatar",
      expect.any(Object),
    );
    expect(fetchWithCookies).toHaveBeenCalledWith(
      "https://example.com/agents/profile?name=Molty",
      expect.any(Object),
    );
  });

  test("registerAgent returns agent info", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        agent: {
          api_key: "k",
          claim_url: "url",
          verification_code: "code",
        },
      }),
    }));

    const client = createApiClient({
      fetchImpl: fetchImpl as any,
      fetchWithCookies: fetchImpl as any,
      fsLike: {
        existsSync: jest.fn(() => true),
        mkdirSync: jest.fn(),
        readFileSync: jest.fn(() => "{}"),
        writeFileSync: jest.fn(),
      } as any,
      jar: { serialize: jest.fn(async () => ({})) } as any,
      baseUrl: "https://example.com",
      dataDir: "/tmp/data",
    });

    const agent = await client.registerAgent("name", "desc");

    expect(agent.api_key).toBe("k");
  });
});
