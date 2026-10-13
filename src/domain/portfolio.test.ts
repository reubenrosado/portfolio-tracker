import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSeedPortfolio } from "../data/seed";
import { buildChart } from "./chart";
import { formatPercent, formatWeight } from "./format";
import {
  addChild,
  addParent,
  applyDefaultBand,
  deleteTheme,
  moveTheme,
  setDefaultBand,
  setTargetWeight,
  setThresholdMode,
} from "./mutations";
import { absoluteChildWeight, childrenOf, parentsOf } from "./selectors";
import { bandAround } from "./thresholds";
import { validatePortfolio } from "./validation";

function close(actual: number, expected: number, epsilon = 0.001): void {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `${actual} is not within ${epsilon} of ${expected}`,
  );
}

describe("example portfolio", () => {
  it("matches the spreadsheet and balances", () => {
    const portfolio = createSeedPortfolio();
    const parents = parentsOf(portfolio);
    assert.deepEqual(
      parents.map((parent) => [parent.name, parent.targetWeight]),
      [
        ["Equities", 38],
        ["Crypto", 10],
        ["Metals", 8],
        ["Real Estate", 19],
        ["Cash", 20],
        ["Hedges", 4],
        ["Other", 1],
      ],
    );
    assert.deepEqual(
      childrenOf(portfolio, "equities").map((theme) => [theme.name, theme.targetWeight]),
      [
        ["Hodl - S&P 500", 45],
        ["Hodl - QQQ (nasdaq)", 10],
        ["Swing - QLD (nasdaq)", 15],
        ["Swing - Other", 15],
        ["Other", 15],
      ],
    );
    assert.equal(validatePortfolio(portfolio).isValid, true);
  });

  it("reports implied portfolio weights", () => {
    close(absoluteChildWeight(38, 45), 17.1);
    close(absoluteChildWeight(10, 8), 0.8);
    close(absoluteChildWeight(20, 3), 0.6);
    close(absoluteChildWeight(19, 100), 19);
    close(absoluteChildWeight(19, 0), 0);
    close(absoluteChildWeight(4, 80), 3.2);
    close(absoluteChildWeight(1, 70), 0.7);
    assert.equal(formatPercent(absoluteChildWeight(38, 45)), "17.1%");
    assert.equal(formatWeight(100), "100");
  });

  it("clamps the default 5 point band at the edges", () => {
    const portfolio = createSeedPortfolio();
    const newport = portfolio.themes.find((theme) => theme.name === "Newport house");
    const cleveland = portfolio.themes.find((theme) => theme.name === "Cleveland");
    const hedges = portfolio.themes.find((theme) => theme.id === "hedges");
    assert.equal(newport?.lowerThreshold, 95);
    assert.equal(newport?.upperThreshold, 100);
    assert.equal(cleveland?.lowerThreshold, 0);
    assert.equal(cleveland?.upperThreshold, 5);
    assert.equal(hedges?.lowerThreshold, 0);
    assert.equal(hedges?.upperThreshold, 9);
    assert.equal(portfolio.themes.every((theme) => theme.currentWeight === null), true);
  });
});

describe("thresholds", () => {
  it("builds absolute and relative bands", () => {
    assert.deepEqual(bandAround(40, "absolute_pp", 5), {
      lowerThreshold: 35,
      upperThreshold: 45,
    });
    assert.deepEqual(bandAround(40, "relative_percent", 20), {
      lowerThreshold: 32,
      upperThreshold: 48,
    });
    assert.deepEqual(bandAround(0, "relative_percent", 20), {
      lowerThreshold: 0,
      upperThreshold: 0,
    });
  });

  it("switches the default width without rewriting saved bands", () => {
    const seed = createSeedPortfolio();
    const switched = setThresholdMode(seed, "relative_percent");
    assert.equal(switched.thresholdMode, "relative_percent");
    assert.equal(switched.defaultBand, 20);
    assert.equal(switched.themes[0]?.lowerThreshold, seed.themes[0]?.lowerThreshold);

    const custom = setThresholdMode(setDefaultBand(seed, 8), "relative_percent");
    assert.equal(custom.defaultBand, 8);

    const applied = applyDefaultBand(switched);
    const equities = applied.themes.find((theme) => theme.id === "equities");
    assert.deepEqual(
      equities && {
        lowerThreshold: equities.lowerThreshold,
        upperThreshold: equities.upperThreshold,
      },
      bandAround(38, "relative_percent", 20),
    );
  });
});

describe("validation and edits", () => {
  it("shows how far a group is from 100", () => {
    const portfolio = setTargetWeight(createSeedPortfolio(), "equities", 50);
    const validation = validatePortfolio(portfolio);
    assert.equal(validation.parents.status, "over");
    assert.equal(validation.parents.delta, 12);
    assert.equal(validation.isValid, false);
  });

  it("adds, reorders, and deletes themes", () => {
    const addedParent = addParent(createSeedPortfolio());
    const parents = parentsOf(addedParent);
    const created = parents[parents.length - 1];
    assert.equal(created?.name, "New theme");
    assert.equal(created?.targetWeight, 0);
    assert.equal(validatePortfolio(addedParent).parents.status, "ok");
    assert.equal(created && validatePortfolio(addedParent).childrenByParent[created.id]?.status, "short");

    const withChild = addChild(addedParent, created?.id ?? "");
    const child = childrenOf(withChild, created?.id ?? "")[0];
    assert.equal(child?.targetWeight, 100);

    const moved = moveTheme(createSeedPortfolio(), "crypto", -1);
    assert.deepEqual(
      parentsOf(moved).map((parent) => parent.id),
      ["crypto", "equities", "metals", "real-estate", "cash", "hedges", "other"],
    );

    const deleted = deleteTheme(createSeedPortfolio(), "equities");
    assert.equal(
      deleted.themes.some((theme) => theme.id === "equities" || theme.parentId === "equities"),
      false,
    );
  });
});

describe("double donut alignment", () => {
  it("lines child groups up under each parent", () => {
    const portfolio = createSeedPortfolio();
    const chart = buildChart(portfolio);
    assert.equal(chart.parents.some((slice) => slice.kind === "gap"), false);
    assert.equal(chart.children.some((slice) => slice.name === "Cleveland"), false);

    let cursor = 0;
    for (const parent of chart.parents) {
      const count = childrenOf(portfolio, parent.themeId ?? "").filter((child) => child.targetWeight > 0)
        .length;
      const group = chart.children.slice(cursor, cursor + count);
      close(
        group.reduce((sum, slice) => sum + slice.value, 0),
        parent.value,
      );
      cursor += count;
    }
    assert.equal(cursor, chart.children.length);
  });

  it("keeps alignment when a parent is short or over", () => {
    const short = buildChart(setTargetWeight(createSeedPortfolio(), "equities", 20));
    const equities = short.parents.find((slice) => slice.themeId === "equities");
    const gap = short.parents.find((slice) => slice.kind === "gap");
    assert.ok(equities);
    assert.equal(gap?.value, 18);
    const equitiesChildren = short.children.filter((slice) => slice.parentName === "Equities");
    close(
      equitiesChildren.reduce((sum, slice) => sum + slice.value, 0),
      equities.value,
    );
    assert.equal(equitiesChildren[0]?.scaled, false);

    const over = buildChart(setTargetWeight(createSeedPortfolio(), "crypto-btc", 80));
    const cryptoChildren = over.children.filter((slice) => slice.parentName === "Crypto");
    const crypto = over.parents.find((slice) => slice.themeId === "crypto");
    assert.equal(cryptoChildren.every((slice) => slice.scaled), true);
    close(
      cryptoChildren.reduce((sum, slice) => sum + slice.value, 0),
      crypto?.value ?? -1,
    );
    const btc = cryptoChildren.find((slice) => slice.name === "BTC");
    close(btc?.absoluteWeight ?? -1, 8);
    close(btc?.targetWeight ?? -1, 80);
  });
});
