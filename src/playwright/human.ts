import type { ElementHandle, Page } from "playwright";

import { DELAY } from "../constants/constants";

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const sleepRandom = ([min, max]: readonly [
  number,
  number,
]): Promise<void> => sleep(Math.floor(Math.random() * (max - min + 1)) + min);

export const simulateReading = async (page: Page): Promise<void> => {
  await page.evaluate(() =>
    window.scrollBy(0, Math.floor(Math.random() * 300) + 200),
  );
  await sleepRandom(DELAY.afterScroll);

  await page.evaluate(() =>
    window.scrollBy(0, -Math.floor(Math.random() * 100)),
  );
  await sleepRandom(DELAY.afterScroll);
};

/** Type each character with a random delay to reduce bot-like behavior. */
export const humanType = async (
  el: ElementHandle,
  text: string,
): Promise<void> => {
  for (const char of text) {
    await el.type(char);
    await sleepRandom(DELAY.betweenKeypress);
  }
};
