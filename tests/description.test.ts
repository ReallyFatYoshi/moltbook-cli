import {
  generateRandomDescription,
  generateRandomDescriptions,
  generateRandomShortDescription,
  generateRandomTitle,
} from "../src/description";

describe("Description Generator", () => {
  describe("generateRandomDescription", () => {
    it("should generate a description string", () => {
      const description = generateRandomDescription();
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    });

    it("should generate different descriptions on multiple calls", () => {
      const desc1 = generateRandomDescription();
      const desc2 = generateRandomDescription();
      // Descriptions should be different (with very high probability)
      expect(desc1).not.toBe(desc2);
    });
  });

  describe("generateRandomDescriptions", () => {
    it("should generate specified number of descriptions", () => {
      const count = 5;
      const descriptions = generateRandomDescriptions(count);
      expect(descriptions).toHaveLength(count);
    });

    it("should generate array of non-empty strings", () => {
      const descriptions = generateRandomDescriptions(3);
      descriptions.forEach((desc) => {
        expect(typeof desc).toBe("string");
        expect(desc.length).toBeGreaterThan(0);
      });
    });
  });

  describe("generateRandomShortDescription", () => {
    it("should generate a short description string", () => {
      const description = generateRandomShortDescription();
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    });

    it("should be shorter than a full paragraph", () => {
      const shortDesc = generateRandomShortDescription();
      const longDesc = generateRandomDescription();
      // Short description should typically be shorter
      expect(shortDesc.length).toBeLessThan(longDesc.length);
    });
  });

  describe("generateRandomTitle", () => {
    it("should generate a title string", () => {
      const title = generateRandomTitle();
      expect(typeof title).toBe("string");
      expect(title.length).toBeGreaterThan(0);
    });

    it("should generate different titles on multiple calls", () => {
      const title1 = generateRandomTitle();
      const title2 = generateRandomTitle();
      expect(title1).not.toBe(title2);
    });
  });
});
