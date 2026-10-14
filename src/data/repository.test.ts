import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePortfolio } from "./parse-portfolio";
import { createSeedPortfolio } from "./seed";

describe("parsePortfolio", () => {
  it("round trips the versioned envelope", () => {
    const portfolio = createSeedPortfolio();
    const parsed = parsePortfolio({ version: 1, portfolio });
    assert.deepEqual(parsed, portfolio);
  });

  it("drops orphan positions and rejects empty documents", () => {
    const portfolio = createSeedPortfolio();
    const parsed = parsePortfolio({
      ...portfolio,
      themes: [
        ...portfolio.themes,
        {
          id: "orphan",
          parentId: "missing",
          name: "Nope",
          targetWeight: 10,
          lowerThreshold: 0,
          upperThreshold: 10,
          currentWeight: null,
          sortOrder: 0,
          color: null,
        },
      ],
    });
    assert.equal(parsed?.themes.some((theme) => theme.id === "orphan"), false);
    assert.equal(parsePortfolio({ nope: true }), null);
  });
});
