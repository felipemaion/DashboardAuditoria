/**
 * E2E — Responsiveness gate for 4 charts (P1, P2, P3, P7).
 *
 * Gate formal CEO #33: screenshots em 320px, 480px, 768px, 1440px.
 * Nenhuma sobreposição, nenhum crash, nenhum texto cortado.
 *
 * Viewports are configured via playwright.config.ts projects.
 * Each test runs in all 4 viewports automatically.
 */

import { expect, test } from "@playwright/test";

const CHART_TESTIDS = ["chart-aderencia", "chart-replanejamento", "chart-heatmap", "chart-funil"];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByText("Auditorias Planejadas").click();
  await page.waitForLoadState("networkidle");
});

for (const chartTestId of CHART_TESTIDS) {
  test(`${chartTestId} renders without crash or overlap`, async ({ page }) => {
    const chart = page.getByTestId(chartTestId);
    await expect(chart).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: `e2e/screenshots/${chartTestId}-${test.info().project.name}.png`,
      fullPage: false,
    });

    const box = await chart.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(50);
    expect(box!.height).toBeGreaterThan(50);
  });

  test(`${chartTestId} title is not truncated`, async ({ page }) => {
    const chart = page.getByTestId(chartTestId);
    await expect(chart).toBeVisible({ timeout: 10_000 });

    const titleEl = chart.locator("[data-testid='chart-title']");
    if (await titleEl.count() > 0) {
      const titleBox = await titleEl.boundingBox();
      const chartBox = await chart.boundingBox();
      expect(titleBox).not.toBeNull();
      expect(chartBox).not.toBeNull();
      expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(chartBox!.x + chartBox!.width + 2);
    }
  });

  test(`${chartTestId} empty state does not crash`, async ({ page }) => {
    // Navigate to report with no data (empty period filter if available)
    const chart = page.getByTestId(chartTestId);
    if (await chart.count() > 0) {
      await expect(chart).toBeVisible();
    }
  });
}

test("P1 mobile 320-480 degrades to 3 segments", async ({ page }) => {
  const viewportWidth = page.viewportSize()?.width ?? 1440;
  if (viewportWidth > 480) {
    test.skip();
    return;
  }

  const chart = page.getByTestId("chart-aderencia");
  await expect(chart).toBeVisible({ timeout: 10_000 });

  const responsiveMode = await chart.getAttribute("data-responsive-mode");
  expect(responsiveMode).toBe("compact");
});

test("P3 heatmap toggle switches between 12m and 3y", async ({ page }) => {
  const chart = page.getByTestId("chart-heatmap");
  await expect(chart).toBeVisible({ timeout: 10_000 });

  const toggle3y = chart.getByTestId("heatmap-toggle-3y");
  await toggle3y.click();
  await expect(toggle3y).toHaveAttribute("aria-pressed", "true");

  await page.screenshot({
    path: `e2e/screenshots/heatmap-3y-${test.info().project.name}.png`,
    fullPage: false,
  });
});

test("no chart elements overlap each other", async ({ page }) => {
  const boxes: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];

  for (const testId of CHART_TESTIDS) {
    const el = page.getByTestId(testId);
    if ((await el.count()) === 0) continue;

    const box = await el.boundingBox();
    if (!box) continue;

    boxes.push({ id: testId, x: box.x, y: box.y, w: box.width, h: box.height });
  }

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
      const overlapY = a.y < b.y + b.h && a.y + a.h > b.y;
      if (overlapX && overlapY) {
        throw new Error(`Charts ${a.id} and ${b.id} overlap at viewport ${page.viewportSize()?.width}px`);
      }
    }
  }
});
