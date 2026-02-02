import blessed from "blessed";
import { generateRandomAgents } from "./agent-generator";

type RegisterUIDeps = {
  registerAgent: (
    name: string,
    description: string,
  ) => Promise<{
    api_key: string;
    claim_url: string;
    verification_code: string;
  }>;
  blessedLib?: typeof blessed;
  onExit?: () => void;
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Unknown error";
};

export async function startRegistrationUI({
  registerAgent,
  blessedLib = blessed,
  onExit,
}: RegisterUIDeps): Promise<{
  api_key: string;
  claim_url: string;
  verification_code: string;
}> {
  const screen = blessedLib.screen({
    smartCSR: true,
    title: "Moltbook Registration 🦞",
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
      "{center}{bold}{cyan}🦞 MOLTBOOK - Register Your Agent{/cyan}{/bold}{/center}",
    style: { bg: "black", fg: "cyan" },
  });

  // Suggestions List
  const suggestionsBox = blessedLib.box({
    parent: screen,
    top: 3,
    left: 0,
    width: "100%",
    height: 2,
    content:
      "{bold}💡 Agent Suggestions (select one or enter custom name):{/bold}",
  });

  const suggestions = generateRandomAgents(3);
  const suggestionsList = blessedLib.list({
    parent: screen,
    top: 5,
    left: 0,
    width: "100%",
    height: "40%",
    border: "line",
    keys: true,
    mouse: true,
    style: {
      selected: { bg: "cyan", fg: "black" },
      border: { fg: "cyan" },
    },
  });

  // Map suggestions to display items
  const suggestionItems = suggestions.map(
    (agent, i) => `${i + 1}. {bold}${agent.name}{/bold} - ${agent.description}`,
  );
  suggestionsList.setItems(suggestionItems);

  // Form area
  const formBox = blessedLib.box({
    parent: screen,
    top: "45%",
    left: 0,
    width: "100%",
    height: "55%",
    border: "line",
    label: " Agent Details ",
    style: { border: { fg: "green" } },
  });

  // Name input
  const nameLabel = blessedLib.box({
    parent: formBox,
    top: 0,
    left: 0,
    width: "100%",
    height: 1,
    content: "{bold}Agent Name:{/bold}",
  });

  const nameInput = blessedLib.textbox({
    parent: formBox,
    top: 1,
    left: 0,
    right: 0,
    height: 3,
    inputOnFocus: true,
    border: "line",
    style: { focus: { bg: "green", fg: "black" } },
  });

  // Description input
  const descLabel = blessedLib.box({
    parent: formBox,
    top: 4,
    left: 0,
    width: "100%",
    height: 1,
    content: "{bold}Description:{/bold}",
  });

  const descInput = blessedLib.textbox({
    parent: formBox,
    top: 5,
    left: 0,
    right: 0,
    bottom: 4,
    inputOnFocus: true,
    border: "line",
    style: { focus: { bg: "yellow", fg: "black" } },
  });

  // Buttons
  const buttonBox = blessedLib.box({
    parent: formBox,
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    content:
      "{center}{bold}[ENTER] Register     [CTRL+C] Cancel{/bold}{/center}",
    style: { bg: "green", fg: "black" },
  });

  // Handle suggestion selection
  const selectSuggestion = (index: number) => {
    const agent = suggestions[index];
    nameInput.setValue(agent.name);
    descInput.setValue(agent.description);
    nameInput.focus();
  };

  (suggestionsList as any).on("select", () => {
    selectSuggestion((suggestionsList as any).selected);
  });

  screen.key(["q", "C-c"], () => {
    process.exit(0);
  });

  // Validation helper
  const validateInputs = (name: string, description: string): string | null => {
    if (!name) {
      nameInput.setLabel(" {red}Agent Name (required){/red} ");
      nameInput.focus();
      return "name";
    }
    if (!description) {
      descInput.setLabel(" {red}Description (required){/red} ");
      descInput.focus();
      return "description";
    }
    return null;
  };

  // Registration flow
  return new Promise((resolve, reject) => {
    nameInput.key("enter", async () => {
      descInput.focus();
    });

    descInput.key("enter", async () => {
      const name = nameInput.getValue().trim();
      const description = descInput.getValue().trim();

      const validationError = validateInputs(name, description);
      if (validationError) {
        screen.render();
        return;
      }

      // Disable inputs during registration
      (nameInput as any).disable();
      (descInput as any).disable();
      buttonBox.setContent(
        "{center}{bold}{yellow}Registering...{/yellow}{/bold}{/center}",
      );
      screen.render();

      try {
        const result = await registerAgent(name, description);
        screen.destroy();
        resolve(result);
      } catch (e) {
        buttonBox.setContent(
          `{center}{bold}{red}Registration failed: ${getErrorMessage(e)}{/red}{/bold}{/center}`,
        );
        (nameInput as any).enable();
        (descInput as any).enable();
        screen.render();
      }
    });

    suggestionsList.focus();
    screen.render();
  });
}
