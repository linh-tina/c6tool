import type { Page } from "playwright";

import {
  AUTH_FAILURE_PATTERNS,
  COMMENT_BOX_SELECTORS,
  DELAY,
  TIMEOUT,
} from "../constants/constants";
import {
  closeBrowserHandle,
  createBrowserHandle,
  type BrowserHandle,
} from "./browser";
import { humanType, simulateReading, sleepRandom } from "./human";
import { log } from "../utils/logger";
import type { CommentJob, CommentResult } from "../types/types";
import { captureScreenshot } from "../utils/screenshot";

// ─── Auth Check ───────────────────────────────────────────────────────────────

const isAuthFailure = (url: string): boolean =>
  AUTH_FAILURE_PATTERNS.some((pattern) => url.includes(pattern));

// ─── Comment Box ──────────────────────────────────────────────────────────────

const findCommentBox = async (page: Page) => {
  for (const selector of COMMENT_BOX_SELECTORS) {
    try {
      const element = await page.waitForSelector(selector, {
        timeout: TIMEOUT.comment,
      });
      if (element) {
        log.ok(`Tìm thấy ô bình luận: ${selector}`);
        return element;
      }
    } catch {
      // Try the next selector.
    }
  }
  return null;
};

// ─── Verify ───────────────────────────────────────────────────────────────────

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

// ─── Core ─────────────────────────────────────────────────────────────────────

export const postCommentOnFacebook = async (
  job: CommentJob,
): Promise<CommentResult> => {
  let handle: BrowserHandle | null = null;

  try {
    // 1. Initialize the browser and inject cookies.
    handle = await createBrowserHandle();
    const page: Page = await handle.context.newPage();

    // 2. Navigate to the post.
    log.step(`Đang mở: ${job.fbLink}`);
    await page.goto(job.fbLink, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT.navigation,
    });
    await sleepRandom(DELAY.afterLoad);

    // 3. Check whether the cookies are still valid.
    if (isAuthFailure(page.url())) {
      return {
        success: false,
        screenshotPath: null,
        error: "Cookie hết hạn hoặc tài khoản bị checkpoint.",
      };
    }

    // 4. Scroll the page to simulate reading behavior.
    await simulateReading(page);

    // 5. Find the comment input box.
    const commentBox = await findCommentBox(page);
    if (!commentBox) {
      const screenshotPath = await captureScreenshot(
        page,
        "err_no_comment_box",
      );
      return {
        success: false,
        screenshotPath,
        error: "Không tìm thấy ô nhập bình luận.",
      };
    }

    // 6. Scroll into view and click to focus.
    await commentBox.scrollIntoViewIfNeeded();
    await sleepRandom(DELAY.beforeClick);
    await commentBox.click();
    await sleepRandom(DELAY.afterClick);

    // 7. Type the main comment text first.
    if (job.comment) {
      log.step("Đang nhập nội dung bình luận...");
      await humanType(commentBox, job.comment);
      await sleepRandom(DELAY.beforeSubmit);
    }

    // 8. Handle the tagged account (for example: "TINA.nailroom").
    if (job.tagUser?.uidOrName) {
      const targetName = job.tagUser.uidOrName;
      log.step(`Mô phỏng tag tài khoản: @${targetName}`);

      // Add a separating space if there is already text before it.
      if (job.comment) {
        await commentBox.type(" ");
        await sleepRandom([200, 400]);
      }

      // Type @ to open the suggestion list.
      await commentBox.type("@");
      await sleepRandom([400, 700]);

      // Type the target name using human-like input.
      await humanType(commentBox, targetName);

      // Wait briefly for Facebook to render the suggestion list.
      await page.waitForTimeout(2500);

      try {
        // Locate the item containing the target text in Facebook's popup menu.
        const targetOption = page
          .locator('[role="option"]')
          .filter({ hasText: targetName })
          .first();

        if (await targetOption.isVisible()) {
          await targetOption.click();
          log.ok(`Đã tìm thấy và click chọn tag: ${targetName}`);
        } else {
          // Fallback: if no element is found, press Tab to select the highlighted option.
          await commentBox.press("Tab");
          log.warn("Không bắt được element, nhấn Tab dự phòng để chọn tag.");
        }
      } catch (tagError) {
        log.error(`Thao tác chọn thẻ tag thất bại: ${String(tagError)}`);
        // Last resort: press Tab.
        await commentBox.press("Tab");
      }

      // Add a short randomized delay after selecting the tag.
      await sleepRandom([1_000, 1_800]);
    }

    // 9. Submit the comment.
    await commentBox.press("Enter");
    log.step("Đã gửi bình luận, đang chờ xác nhận...");
    await sleepRandom(DELAY.afterSubmit);

    // 10. Confirm the comment appears in the DOM.
    const verified = await verifyCommentPosted(page, job.comment);

    if (verified) {
      log.ok("Bình luận đã được đăng thành công.");
    } else {
      log.warn("Đã gửi nhưng chưa xác nhận được bình luận trên trang.");
    }

    // 11. Capture a screenshot of the result.
    const screenshotPath = await captureScreenshot(
      page,
      verified ? "success" : "warn_unverified",
    );

    return { success: true, screenshotPath };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    log.error(`Lỗi không mong đợi: ${error}`);
    return { success: false, screenshotPath: null, error };
  } finally {
    if (handle) {
      await closeBrowserHandle(handle);
    }
    log.info("Trình duyệt đã đóng.");
  }
};
