import { faker } from "@faker-js/faker";

/**
 * Generate a random description using faker
 * @returns A random description string
 */
export function generateRandomDescription(): string {
  return faker.lorem.paragraph();
}

/**
 * Generate multiple random descriptions
 * @param count Number of descriptions to generate
 * @returns Array of random descriptions
 */
export function generateRandomDescriptions(count: number): string[] {
  return Array.from({ length: count }, () => generateRandomDescription());
}

/**
 * Generate a random short description (1-2 sentences)
 * @returns A random short description string
 */
export function generateRandomShortDescription(): string {
  return faker.lorem.sentences({ min: 1, max: 2 });
}

/**
 * Generate a random title-like description
 * @returns A random title string
 */
export function generateRandomTitle(): string {
  return faker.commerce.productName();
}
