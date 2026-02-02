import { faker } from "@faker-js/faker";
import {
  generateRandomDescription,
  generateRandomShortDescription,
} from "./description";

/**
 * Generate a random agent with name and description
 */
export function generateRandomAgent() {
  return {
    name: faker.person.fullName(),
    description: generateRandomShortDescription(),
  };
}

/**
 * Generate multiple random agents
 */
export function generateRandomAgents(count: number) {
  return Array.from({ length: count }, () => generateRandomAgent());
}

// Demo: Generate and display a random agent
if (require.main === module) {
  console.log("🤖 Random Agent Generator\n");

  const agent = generateRandomAgent();
  console.log("Generated Agent:");
  console.log(`  Name: ${agent.name}`);
  console.log(`  Description: ${agent.description}\n`);

  console.log("Generated 3 Random Agents:");
  const agents = generateRandomAgents(3);
  agents.forEach((a, i) => {
    console.log(`\n  ${i + 1}. ${a.name}`);
    console.log(`     ${a.description}`);
  });
}
