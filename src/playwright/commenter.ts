import type { Page } from "playwright";

import { AUTH_FAILURE_PATTERNS, DELAY, TIMEOUT } from "../constants/constants";
import { getMessages } from "../constants/messages";
import {
  closeBrowserHandle,
  createBrowserHandle,
  type BrowserHandle,
} from "./browser";
import { humanType, simulateReading, sleepRandom } from "./human";
import { log } from "../utils/logger";
import { Locale } from "../types/config";
import type { CommentJob, CommentResult } from "../types/types";
import { captureScreenshot } from "../utils/screenshot";

const isAuthFailure = (url: string): boolean =>
  AUTH_FAILURE_PATTERNS.some((pattern) => url.includes(pattern));

const findCommentBox = async (
  page: Page,
  selectors: readonly string[],
  messages: ReturnType<typeof getMessages>,
) => {
  for (const selector of selectors) {
    try {
      const element = await page.waitForSelector(selector, {
        timeout: TIMEOUT.comment,
      });
      if (element) {
        log.ok(messages.commenter.foundCommentBox(selector));
        return element;
      }
    } catch {
      // Ignore and continue with the next selector.
    }
  }
  return null;
};

const verifyCommentPosted = async (
  page: Page,
  comment: string,
): Promise<boolean> => {
  try {
    await page.waitForFunction(
      (text: string) => document.body.innerText.includes(text),
      comment,
      { timeout: TIMEOUT.verification },
    );
    return true;
  } catch {
    return false;
  }
};

/**
 * Posts a comment (and optionally tags a user) on a Facebook post.
 *
 * All behaviour is driven by the `job` object — no hardcoded values remain
 * inside this function. `job.screenshotDir` and `job.cookiesPath` come
 * from the user's ResolvedConfig via the bot layer.
 */
export const postCommentOnFacebook = async (
  job: CommentJob,
  cookiesPath: string,
  locale: Locale,
): Promise<CommentResult> => {
  const messages = getMessages(locale);
  let handle: BrowserHandle | null = null;

  try {
    handle = await createBrowserHandle(cookiesPath, locale);
    const page: Page = await handle.context.newPage();

    log.step(messages.commenter.opening(job.fbLink));
    await page.goto(job.fbLink, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT.navigation,
    });
    await sleepRandom(DELAY.afterLoad);

    if (isAuthFailure(page.url())) {
      return {
        success: false,
        screenshotPath: null,
        error: messages.commenter.cookieExpired,
      };
    }

    await simulateReading(page);

    const commentBox = await findCommentBox(
      page,
      messages.facebook.commentBoxSelectors,
      messages,
    );
    if (!commentBox) {
      const screenshotPath = job.screenshotDir
        ? await captureScreenshot(page, "err_no_comment_box", job.screenshotDir)
        : null;

      return {
        success: false,
        screenshotPath,
        error: messages.commenter.noCommentBox,
      };
    }

    await commentBox.scrollIntoViewIfNeeded();
    await sleepRandom(DELAY.beforeClick);
    await commentBox.click();
    await sleepRandom(DELAY.afterClick);

    if (job.comment) {
      log.step(messages.commenter.typingComment);
      await humanType(commentBox, job.comment);
      await sleepRandom(DELAY.beforeSubmit);
    }

    if (job.tagUser?.uidOrName) {
      const targetName = job.tagUser.uidOrName;
      log.step(messages.commenter.taggingAccount(targetName));

      if (job.comment) {
        await commentBox.type(" ");
        await sleepRandom([200, 400]);
      }

      await commentBox.type("@");
      await sleepRandom([400, 700]);
      await humanType(commentBox, targetName);
      await page.waitForTimeout(2500);

      try {
        const targetOption = page
          .locator('[role="option"]')
          .filter({ hasText: targetName })
          .first();

        if (await targetOption.isVisible()) {
          await targetOption.click();
          log.ok(messages.commenter.tagSelected(targetName));
        } else {
          await commentBox.press("Tab");
          log.warn(messages.commenter.tagFallback);
        }
      } catch (tagError) {
        log.error(messages.commenter.tagFailed(String(tagError)));
        await commentBox.press("Tab");
      }

      await sleepRandom([1_000, 1_800]);
    }

    await commentBox.press("Enter");
    log.step(messages.commenter.submitted);
    await sleepRandom(DELAY.afterSubmit);

    const verified = job.comment
      ? await verifyCommentPosted(page, job.comment)
      : false;

    if (verified) {
      log.ok(messages.commenter.verifiedSuccess);
    } else {
      log.warn(messages.commenter.verifiedWarn);
    }

    const screenshotPath = job.screenshotDir
      ? await captureScreenshot(
          page,
          verified ? "success" : "warn_unverified",
          job.screenshotDir,
        )
      : null;

    return { success: true, screenshotPath };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    log.error(messages.commenter.unexpectedError(error));
    return { success: false, screenshotPath: null, error };
  } finally {
    if (handle) await closeBrowserHandle(handle);
    log.info(messages.commenter.browserClosed);
  }
};
