import { Conversation } from "@grammyjs/conversations";
import { Context, InlineKeyboard } from "grammy";
import { JournalEntry, VoiceRecording } from "../types/types.ts";
import {
  getAllJournalEntriesByUserId,
  insertJournalEntry,
} from "../models/journal.ts";
import { dbFile } from "../constants/paths.ts";
import { downloadTelegramImage } from "../utils/misc.ts";
import { insertJournalEntryPhoto } from "../models/journal_entry_photo.ts";
import { insertVoiceRecording } from "../models/voice_recording.ts";
import { getTelegramDownloadUrl } from "../utils/telegram.ts";

/**
 * Starts the process of creating a new journal entry.
 * @param conversation Conversation
 * @param ctx Context
 */
export async function new_journal_entry(
  conversation: Conversation,
  ctx: Context,
) {
  await ctx.reply(
    `Hello ${ctx.from?.username!}!  Tell me what is on your mind.`,
  );

  const journalEntryCtx = await conversation.waitFor("message:text");
  // Try to insert journal entry
  try {
    const journalEntry: JournalEntry = {
      userId: ctx.from?.id!,
      timestamp: await conversation.now(),
      content: journalEntryCtx.message.text,
      length: journalEntryCtx.message.text.length,
    };
    await conversation.external(() => insertJournalEntry(journalEntry, dbFile));
  } catch (err) {
    await conversation.error(`Failed to insert Journal Entry: ${err}`);
    await ctx.reply(`Failed to insert Journal Entry: ${err}`);
    throw new Error(`Failed to insert Journal Entry: ${err}`);
  }
  await ctx.reply(`Successfully saved journal entry!`);

  let imageCount = 0;
  while (true) {
    await ctx.reply(
      `Send me an image or click done.  You have sent ${imageCount} images.`,
      { reply_markup: new InlineKeyboard().text("Done", "photo-done") },
    );

    const imagesCtx = await conversation.waitFor([
      "message:photo",
      "callback_query",
    ]);

    if (imagesCtx.callbackQuery?.data === "photo-done") {
      break;
    }

    try {
      const file = await imagesCtx.getFile();
      const id = await conversation.external(() =>
        getAllJournalEntriesByUserId(ctx.from?.id!, dbFile)[0].id!
      );
      const journalEntryPhoto = await conversation.external(async () =>
        await downloadTelegramImage(
          ctx.api.token,
          imagesCtx.message?.caption!,
          file,
          id, // Latest ID
        )
      );
      await conversation.log(journalEntryPhoto);
      await conversation.external(() =>
        insertJournalEntryPhoto(journalEntryPhoto, dbFile)
      );
      await ctx.reply(`Saved photo!`);
      imageCount++;
    } catch (err) {
      console.error(
        `Failed to save images for Journal Entry ${getAllJournalEntriesByUserId(
          ctx.from?.id!,
          dbFile,
        )[0].id!}: ${err}`,
      );
    }
  }

  // Ask user if they want to add a voice recording
  const askVoiceMsg = await ctx.reply(
    "Would you like to add a voice recording?",
    {
      reply_markup: new InlineKeyboard().text("🎙️ Yes", "voice-yes").text(
        "⛔ No",
        "voice-no",
      ),
    },
  );

  const voiceChoiceCtx = await conversation.waitForCallbackQuery([
    "voice-yes",
    "voice-no",
  ]);

  if (voiceChoiceCtx.callbackQuery.data === "voice-yes") {
    let voiceCount = 0;
    while (true) {
      await ctx.api.editMessageText(
        ctx.chatId!,
        askVoiceMsg.message_id,
        `Send me a voice recording or click done.  You have sent ${voiceCount} recording(s).`,
      );
      await ctx.api.editMessageReplyMarkup(
        ctx.chatId!,
        askVoiceMsg.message_id,
        {
          reply_markup: new InlineKeyboard().text("Done", "voice-done"),
        },
      );

      const voiceCtx = await conversation.waitFor([
        "message:voice",
        "callback_query",
      ]);

      if (voiceCtx.callbackQuery?.data === "voice-done") {
        break;
      }

      try {
        const file = await voiceCtx.getFile();
        const journalEntryId = await conversation.external(() =>
          getAllJournalEntriesByUserId(ctx.from?.id!, dbFile)[0].id!
        );

        // Download voice file from Telegram
        const voiceResponse = await fetch(
          getTelegramDownloadUrl().replace("<token>", ctx.api.token).replace(
            "<file_path>",
            file.file_path!,
          ),
        );

        if (voiceResponse.body) {
          const voiceRecording: VoiceRecording = await conversation.external(
            async () => {
              const fileName = `${journalEntryId}_${
                new Date(Date.now()).toLocaleString()
              }.ogg`.replaceAll(" ", "_").replace(",", "").replaceAll(
                "/",
                "-",
              );

              const filePath =
                `${Deno.cwd()}/assets/voice_recordings/${fileName}`;
              const outFile = await Deno.open(filePath, {
                write: true,
                create: true,
              });

              const realPath = await Deno.realPath(filePath);
              await voiceResponse.body!.pipeTo(outFile.writable);

              return {
                entryId: journalEntryId,
                path: realPath,
                length: voiceCtx.message?.voice?.duration || 0,
              };
            },
          );

          await conversation.external(() =>
            insertVoiceRecording(voiceRecording, dbFile)
          );
          await ctx.reply(`Saved voice recording!`);
          voiceCount++;
        }
      } catch (err) {
        console.error(
          `Failed to save voice recording for Journal Entry: ${err}`,
        );
        await ctx.reply(`Failed to save voice recording: ${err}`);
      }
    }
  }

  return await ctx.reply("Journaling Done!");
}
