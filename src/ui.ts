import blessed from "blessed";
import { generateRandomAgent, generateRandomAgents } from "./agent-generator";

type FeedItem = { title: string };

type FeedResponse = { data: FeedItem[] };

type StartUIDeps = {
  apiKey: string;
  getFeed: (page?: number, limit?: number) => Promise<FeedResponse>;
  createPost: (content: string) => Promise<unknown>;
  getAgentStatus?: () => Promise<any>;
  blessedLib?: typeof blessed;
  onExit?: () => void;
};

// Helper to extract error message
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Unknown error";
};

export async function startUI({
  apiKey,
  getFeed,
  createPost,
  getAgentStatus,
  blessedLib = blessed,
  onExit,
}: StartUIDeps) {
  const screen = blessedLib.screen({
    smartCSR: true,
    title: "Moltbook TUI 🦞",
    mouse: true,
  });

  // Header
  const header = blessedLib.box({
    parent: screen,
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    content:
      "{center}{bold}{cyan}🦞 MOLTBOOK - Agent Generator & Feed{/cyan}{/bold}{/center}",
    style: { bg: "black", fg: "cyan" },
  });

  // Main content area - Split between Feed and Agents
  const feedBox = blessedLib.list({
    parent: screen,
    top: 3,
    left: 0,
    width: "50%",
    height: "65%",
    label: " 📰 Feed ",
    border: "line",
    keys: true,
    mouse: true,
    style: {
      selected: { bg: "cyan", fg: "black" },
      border: { fg: "cyan" },
    },
  });

  const agentListBox = blessedLib.list({
    parent: screen,
    top: 3,
    right: 0,
    width: "50%",
    height: "65%",
    label: " ✨ Generated Agents ",
    border: "line",
    keys: true,
    mouse: true,
    style: {
      selected: { bg: "green", fg: "black" },
      item: { fg: "white" },
      border: { fg: "green" },
    },
  });

  // Add initial placeholder
  agentListBox.setItems([
    "{gray}Press [g] for 1 agent, [G] for 3 agents{/gray}",
  ]);

  // Bottom panels
  const postCreatorBox = blessedLib.box({
    parent: screen,
    top: "68%",
    left: 0,
    width: "60%",
    height: "32%",
    label: " ✍️  New Post ",
    border: "line",
    style: { border: { fg: "yellow" } },
  });

  const postBox = blessedLib.textbox({
    parent: postCreatorBox,
    top: 0,
    left: 0,
    right: 0,
    bottom: 3,
    inputOnFocus: true,
    style: { focus: { bg: "yellow", fg: "black" } },
  });

  const postButtonBox = blessedLib.box({
    parent: postCreatorBox,
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    content: "{center}{bold}ENTER to Send{/bold}{/center}",
    style: { bg: "yellow", fg: "black" },
  });

  // Info Panel
  const infoBox = blessedLib.box({
    parent: screen,
    top: "68%",
    right: 0,
    width: "40%",
    height: "32%",
    label: " ℹ️  Commands ",
    border: "line",
    content:
      "{bold}Agents:{/bold}\n [g] Generate 1\n [G] Generate 3\n\n{bold}Feed:{/bold}\n [n/→] Next\n [p/←] Prev\n\n[q] Quit",
    style: { border: { fg: "magenta" } },
  });

  screen.key(["q", "C-c"], () => (onExit ? onExit() : process.exit(0)));

  // Helper to add agents to the list
  const addAgentsToList = (
    agents: Array<{ name: string; description: string }>,
  ) => {
    const items = ((agentListBox as any).items || []) as string[];
    agents.forEach((agent) => {
      items.unshift(`{bold}{green}👤 ${agent.name}{/green}{/bold}`);
      items.unshift(`   💬 ${agent.description}`);
      items.unshift("");
    });
    (agentListBox as any).setItems(items);
    (agentListBox as any).select(0);
    screen.render();
  };

  // Global key handlers for agent generation - work regardless of focus
  screen.key(["g"], async () => {
    const agent = generateRandomAgent();
    addAgentsToList([agent]);
  });

  screen.key(["G"], async () => {
    const agents = generateRandomAgents(3);
    addAgentsToList(agents);
  });

  let currentPage = 1;
  const pageSize = 10;

  async function loadFeed(page = currentPage) {
    currentPage = page;
    try {
      const feed = await getFeed(currentPage, pageSize);
      feedBox.setItems(feed.data.map((p) => p.title));
      feedBox.setLabel(` 📰 Feed (Page ${currentPage}) `);
    } catch (e) {
      feedBox.setLabel(` 📰 Feed (Error: ${getErrorMessage(e)}) `);
    }
    screen.render();
  }

  screen.key(["n", "right"], async () => {
    await loadFeed(currentPage + 1);
  });

  screen.key(["p", "left"], async () => {
    const nextPage = Math.max(1, currentPage - 1);
    if (nextPage !== currentPage) {
      await loadFeed(nextPage);
    }
  });

  postBox.key("enter", async () => {
    const text = postBox.getValue().trim();
    postBox.clearValue();
    screen.render();

    if (!text) return;

    try {
      await createPost(text);
      postCreatorBox.setLabel(" ✍️  New Post (Sent ✓) ");
      await loadFeed();
      setTimeout(() => {
        postCreatorBox.setLabel(" ✍️  New Post ");
        screen.render();
      }, 2000);
    } catch (e) {
      postCreatorBox.setLabel(` ✍️  New Post (Error: ${getErrorMessage(e)}) `);
    }
  });

  await loadFeed();
  feedBox.focus();
  screen.render();

  return { screen, feedBox, postBox, agentListBox, apiKey };
}
