import { Browser, Protocol, launch, TimeoutError } from 'puppeteer';
import { Logger } from 'pino';

import {
  actionSchema,
  AddChatItemAction,
  addChatItemActionSchema,
  liveChatResponseSchema,
} from './types';

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

let browser: Browser | undefined;

export class Recorder {
  constructor(private readonly logger: Logger) {}

  async recordChat(videoId: string) {
    this.logger.info(
      {
        videoId,
      },
      'Recording chat'
    );

    if (!!browser) {
      await browser.close();
    }

    browser = await launch({
      headless: true,
      args: ['--disable-gpu', '--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.goto(`https://www.youtube.com/live_chat?v=${videoId}`);

    // メニューがレンダリングされるまで待つ失敗したらエラーを投げる
    try {
      await page.waitForSelector('.tp-yt-paper-menu-button', { timeout: 5000 });
    } catch (e) {
      console.error(e);
      if (e instanceof TimeoutError) {
        throw new Error('Failed to load the page');
      }

      throw e;
    }

    // メニューをクリック
    await page.click('.tp-yt-paper-menu-button');

    // ドロップダウンメニューがレンダリングされるまで待つ
    await page.waitForSelector(
      '.yt-dropdown-menu:nth-child(2) > .yt-dropdown-menu'
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // チャットメニューをクリック
    await page.click('.yt-dropdown-menu:nth-child(2) > .yt-dropdown-menu');

    const session = await page.createCDPSession();

    await session.send('Network.enable');
    session.on('Network.responseReceived', async (responseReceivedEvent) => {
      if (!responseReceivedEvent) {
        return;
      }

      if (
        !responseReceivedEvent.response.url.startsWith(
          'https://www.youtube.com/youtubei/v1/live_chat/get_live_chat'
        )
      ) {
        return;
      }
      if (responseReceivedEvent.response.status !== 200) {
        return;
      }

      const onLoadingFinished = async (
        event: Protocol.Network.LoadingFinishedEvent
      ) => {
        if (!event || responseReceivedEvent.requestId !== event.requestId) {
          return;
        }

        session.off('Network.loadingFinished', onLoadingFinished);

        try {
          const respBody = await session.send('Network.getResponseBody', {
            requestId: responseReceivedEvent.requestId,
          });

          const message = liveChatResponseSchema.safeParse(
            JSON.parse(respBody.body)
          );
          if (!message.success) {
            console.error(message.error);
            return;
          }

          const rawActions =
            message.data.continuationContents?.liveChatContinuation?.actions;
          if (!rawActions) {
            return;
          }

          for (const rawAction of rawActions) {
            const actionMessage = actionSchema.safeParse(rawAction);
            if (!actionMessage.success) {
              console.error(actionMessage.error);
              continue;
            }

            const action = actionMessage.data;
            if (addChatItemActionSchema.safeParse(action)) {
              const addChatItemAction = action as AddChatItemAction;
              if (
                addChatItemAction.addChatItemAction.item
                  .liveChatTextMessageRenderer
              ) {
                const message =
                  addChatItemAction.addChatItemAction.item
                    .liveChatTextMessageRenderer;
                this.logger.info(
                  {
                    id: message.id,
                    message: message.message,
                    authorName: message.authorName,
                    authorExternalChannelId: message.authorExternalChannelId,
                    timestampUsec: message.timestampUsec,
                    videoId,
                  },
                  'textMessage'
                );
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      };

      session.on('Network.loadingFinished', onLoadingFinished);
    });
  }
}
