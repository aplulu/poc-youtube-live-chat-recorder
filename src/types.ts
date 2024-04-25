import { z } from 'zod';

export const thumbnailsSchema = z.object({
  thumbnails: z.array(
    z.object({
      url: z.string(),
      width: z.number(),
      height: z.number(),
    })
  ),
  accessibility: z
    .object({
      accessibilityData: z.object({
        label: z.string(),
      }),
    })
    .optional(),
});

export const runsObjectSchema = z.object({
  runs: z.array(
    z.object({
      text: z.string().optional(),
      emoji: z
        .object({
          emojiId: z.string().optional(),
          image: z.object({
            thumbnails: z.array(
              z.object({
                url: z.string(),
              })
            ),
          }),
        })
        .optional(),
    })
  ),
});

export const simpleTextObjectSchema = z.object({
  simpleText: z.string(),
});

export const authorBadgeSchema = z.object({
  liveChatAuthorBadgeRenderer: z.object({
    customThumbnail: thumbnailsSchema.optional(),
    icon: thumbnailsSchema.optional(),
    tooltip: z.string(),
    accessibility: z
      .object({
        accessibilityData: z.object({
          label: z.string(),
        }),
      })
      .optional(),
  }),
});

export const liveChatTextMessageRendererSchema = z.object({
  id: z.string(),
  message: runsObjectSchema.optional(),

  authorExternalChannelId: z.string(),
  authorName: simpleTextObjectSchema.optional(),
  authorPhoto: thumbnailsSchema.optional(),
  authorBadges: z.array(authorBadgeSchema).optional(),
  timestampUsec: z.string(),
});

export const liveChatPaidMessageRendererSchema = z.object({
  id: z.string(),
  message: runsObjectSchema.optional(),

  authorExternalChannelId: z.string(),
  authorName: simpleTextObjectSchema.optional(),
  authorPhoto: thumbnailsSchema.optional(),
  authorBadges: z.array(authorBadgeSchema).optional(),

  timestampUsec: z.string(),

  purchaseAmountText: simpleTextObjectSchema,
  authorNameTextColor: z.number(),
  headerBackgroundColor: z.number(),
  headerTextColor: z.number(),
  bodyBackgroundColor: z.number(),
  bodyTextColor: z.number(),
});

export const liveChatPaidStickerRendererSchema = z.object({
  id: z.string(),
  message: runsObjectSchema.optional(),

  authorExternalChannelId: z.string(),
  authorName: simpleTextObjectSchema.optional(),
  timestampUsec: z.string(),

  purchaseAmountText: simpleTextObjectSchema,
  authorNameTextColor: z.number(),
  sticker: thumbnailsSchema,
  moneyChipBackgroundColor: z.number(),
  moneyChipTextColor: z.number(),
});

export const addChatItemActionSchema = z.object({
  addChatItemAction: z.object({
    item: z.object({
      liveChatTextMessageRenderer: liveChatTextMessageRendererSchema.optional(),
      liveChatPaidMessageRenderer: liveChatPaidMessageRendererSchema.optional(),
      liveChatPaidStickerRenderer: liveChatPaidStickerRendererSchema.optional(),
    }),
  }),
});
export type AddChatItemAction = z.infer<typeof addChatItemActionSchema>;

export const replayChatItemActionSchema = z.object({
  replayChatItemAction: z.object({
    actions: z.array(
      z.object({
        addChatItemAction: addChatItemActionSchema.optional(),
      })
    ),
  }),
});
export type ReplayChatItemAction = z.infer<typeof replayChatItemActionSchema>;

export const liveChatResponseSchema = z.object({
  continuationContents: z
    .object({
      liveChatContinuation: z
        .object({
          // 本当はanyを使いたくないものの、YouTube側でActionの型が変わったときに対応できるようにするためにanyを使っている
          actions: z.array(z.any()).optional(),
        })
        .optional(),
    })
    .optional(),
});

export const actionSchema = z.union([
  addChatItemActionSchema,
  replayChatItemActionSchema,
]);
