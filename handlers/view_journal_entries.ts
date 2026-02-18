import { Context, InlineKeyboard } from "grammy";
import { Conversation } from "@grammyjs/conversations";
import { JournalEntry } from "../types/types.ts";
import { dbFile } from "../constants/paths.ts";
import {
  deleteJournalEntryById,
  getAllJournalEntriesByUserId,
  updateJournalEntry,
} from "../models/journal.ts";
import { getJournalEntryPhotosByJournalEntryId } from "../models/journal_entry_photo.ts";
import { getAllVoiceRecordingsByEntryId } from "../models/voice_recording.ts";
import { InputFile } from "grammy/types";

const viewJournalEntriesKeyboard: InlineKeyboard = new InlineKeyboard()
  .text("⬅️", "prev-journal")
  .text("🖼️ Photos", "view-photos")
  .text("➡️", "next-journal").row()
  .text("🎙️ Voice", "view-voice")
  .text("✏️ Edit", "edit-journal")
  .text("💣 Delete", "delete-journal").row()
  .text("🛑 Exit 🛑", "exit-journal");

/**
 * Builds the display string for a journal entry.
 */
function buildJournalEntryString(
  entry: JournalEntry,
  currentIndex: number,
  total: number,
): string {
  const dateCreated = new Date(entry.timestamp!).toLocaleString();
  const lastEdited = entry.lastEditedTimestamp
    ? `\n<b>Last Edited</b> ${new Date(entry.lastEditedTimestamp).toLocaleString()}`
    : "";

  return `📖 <b>Journal Entry</b>

<b>Date Created</b> ${dateCreated}${lastEdited}

${entry.content}

Page <b>${currentIndex + 1}</b> of <b>${total}</b>`;
}

/**
 * A conversation to view current journal entries
 * @param conversation 
 * @param ctx 
 * @returns null
 */
export async function view_journal_entries(
  conversation: Conversation,
  ctx: Context,
) {
  let journalEntries: JournalEntry[] = await conversation.external(() =>
    getAllJournalEntriesByUserId(ctx.from?.id!, dbFile)
  );

  if (journalEntries.length === 0) {
    return await ctx.api.sendMessage(ctx.chatId!, "No journal entries to view.");
  }

  let currentEntry = 0;

  const displayEntryMsg = await ctx.api.sendMessage(
    ctx.chatId!,
    buildJournalEntryString(
      journalEntries[currentEntry],
      currentEntry,
      journalEntries.length,
    ),
    {
      reply_markup: viewJournalEntriesKeyboard,
      parse_mode: "HTML",
    },
  );

  loop:
  while (true) {
    if (journalEntries.length === 0) {
      return await ctx.api.editMessageText(
        ctx.chatId!,
        displayEntryMsg.message_id,
        "No journal entries to view.",
      );
    }

    const viewCtx = await conversation.waitForCallbackQuery([
      "prev-journal",
      "next-journal",
      "view-photos",
      "view-voice",
      "edit-journal",
      "delete-journal",
      "exit-journal",
    ]);

    switch (viewCtx.callbackQuery.data) {
      case "next-journal": {
        if (journalEntries.length > 1) {
          currentEntry = currentEntry >= journalEntries.length - 1
            ? 0
            : currentEntry + 1;
        }
        break;
      }
      case "prev-journal": {
        if (journalEntries.length > 1) {
          currentEntry = currentEntry <= 0
            ? journalEntries.length - 1
            : currentEntry - 1;
        }
        break;
      }
      case "view-photos": {
        try {
          const entryId = journalEntries[currentEntry].id!;
          const photos = await conversation.external(() =>
            getJournalEntryPhotosByJournalEntryId(entryId, dbFile)
          );

          if (!photos || (Array.isArray(photos) && photos.length === 0)) {
            await viewCtx.answerCallbackQuery({
              text: "No photos for this entry.",
              show_alert: true,
            });
            break;
          }

          // Normalize to array (the existing function may return a single object due to .get())
          const photoArray = Array.isArray(photos) ? photos : [photos];

          for (const photo of photoArray) {
            try {
              await ctx.api.sendPhoto(
                ctx.chatId!,
                new InputFile(photo.path || photo.path),
                {
                  caption: photo.caption
                    ? `📷 ${photo.caption}`
                    : "📷 Journal photo",
                },
              );
            } catch (photoErr) {
              console.error(`Failed to send photo: ${photoErr}`);
              await ctx.api.sendMessage(
                ctx.chatId!,
                `⚠️ Could not load photo: ${photo.path}`,
              );
            }
          }
        } catch (err) {
          console.error(`Failed to retrieve photos: ${err}`);
          await viewCtx.answerCallbackQuery({
            text: "Failed to load photos.",
            show_alert: true,
          });
        }
        break;
      }
      case "view-voice": {
        try {
          const entryId = journalEntries[currentEntry].id!;
          const voiceRecordings = await conversation.external(() =>
            getAllVoiceRecordingsByEntryId(entryId, dbFile)
          );

          if (voiceRecordings.length === 0) {
            await viewCtx.answerCallbackQuery({
              text: "No voice recordings for this entry.",
              show_alert: true,
            });
            break;
          }

          for (let i = 0; i < voiceRecordings.length; i++) {
            try {
              await ctx.api.sendVoice(
                ctx.chatId!,
                new InputFile(voiceRecordings[i].path),
                {
                  caption: `🎙️ Voice recording ${i + 1} of ${voiceRecordings.length}`,
                  duration: voiceRecordings[i].length || undefined,
                },
              );
            } catch (voiceErr) {
              console.error(`Failed to send voice recording: ${voiceErr}`);
              await ctx.api.sendMessage(
                ctx.chatId!,
                `⚠️ Could not load voice recording: ${voiceRecordings[i].path}`,
              );
            }
          }
        } catch (err) {
          console.error(`Failed to retrieve voice recordings: ${err}`);
          await viewCtx.answerCallbackQuery({
            text: "Failed to load voice recordings.",
            show_alert: true,
          });
        }
        break;
      }
      case "edit-journal": {
        const editMsg = await viewCtx.api.sendMessage(
          ctx.chatId!,
          `Send me the updated journal entry text.`,
        );
        const editCtx = await conversation.waitFor("message:text");

        try {
          const updatedEntry: JournalEntry = {
            id: journalEntries[currentEntry].id,
            userId: journalEntries[currentEntry].userId,
            timestamp: journalEntries[currentEntry].timestamp,
            lastEditedTimestamp: await conversation.external(() => Date.now()),
            content: editCtx.message.text,
            length: editCtx.message.text.length,
          };

          await conversation.external(() =>
            updateJournalEntry(updatedEntry, dbFile)
          );

          // Refresh entries
          journalEntries = await conversation.external(() =>
            getAllJournalEntriesByUserId(ctx.from?.id!, dbFile)
          );

          await ctx.api.editMessageText(
            ctx.chatId!,
            editMsg.message_id,
            "✅ Journal entry updated!",
          );
          await ctx.api.deleteMessage(ctx.chatId!, editCtx.msgId);
        } catch (err) {
          console.error(`Failed to update journal entry: ${err}`);
          await editCtx.reply(
            `I'm sorry I ran into an error while trying to save your changes.`,
          );
        }
        break;
      }
      case "delete-journal": {
        await ctx.api.editMessageText(
          ctx.chatId!,
          displayEntryMsg.message_id,
          "Are you sure you want to delete this journal entry?",
          {
            reply_markup: new InlineKeyboard()
              .text("✅ Yes", "delete-journal-yes")
              .text("⛔ No", "delete-journal-no"),
          },
        );

        const deleteConfirmCtx = await conversation.waitForCallbackQuery([
          "delete-journal-yes",
          "delete-journal-no",
        ]);

        if (deleteConfirmCtx.callbackQuery.data === "delete-journal-yes") {
          const entryId = journalEntries[currentEntry].id!;

          // Clean up associated photo files
          try {
            const photos = await conversation.external(() =>
              getJournalEntryPhotosByJournalEntryId(entryId, dbFile)
            );
            const photoArray = Array.isArray(photos) ? photos : photos ? [photos] : [];
            for (const photo of photoArray) {
              try {
                await conversation.external(async () => {
                  await Deno.remove(photo.path);
                });
              } catch (_err) {
                console.error(`Failed to delete photo file: ${photo.path}`);
              }
            }
          } catch (_err) {
            // No photos to clean up
          }

          // Clean up associated voice recording files
          try {
            const recordings = await conversation.external(() =>
              getAllVoiceRecordingsByEntryId(entryId, dbFile)
            );
            for (const recording of recordings) {
              try {
                await conversation.external(async () => {
                  await Deno.remove(recording.path);
                });
              } catch (_err) {
                console.error(
                  `Failed to delete voice recording file: ${recording.path}`,
                );
              }
            }
          } catch (_err) {
            // No recordings to clean up
          }

          // Delete the journal entry (cascades to photo_db and voice_recording_db)
          await conversation.external(() =>
            deleteJournalEntryById(entryId, dbFile)
          );

          // Refresh entries
          journalEntries = await conversation.external(() =>
            getAllJournalEntriesByUserId(ctx.from?.id!, dbFile)
          );

          if (journalEntries.length === 0) {
            await ctx.api.editMessageText(
              ctx.chatId!,
              displayEntryMsg.message_id,
              "No journal entries to view.",
            );
            break loop;
          }

          // Reset to first entry if needed
          if (currentEntry >= journalEntries.length) {
            currentEntry = 0;
          }
        }
        break;
      }
      case "exit-journal": {
        await ctx.api.deleteMessages(ctx.chatId!, [
          displayEntryMsg.message_id,
        ]);
        break loop;
      }
      default: {
        throw new Error(
          `Error invalid action in view journal entries: ${viewCtx.callbackQuery.data}`,
        );
      }
    }

    // Update the displayed entry
    try {
      await ctx.api.editMessageText(
        ctx.chatId!,
        displayEntryMsg.message_id,
        buildJournalEntryString(
          journalEntries[currentEntry],
          currentEntry,
          journalEntries.length,
        ),
        { reply_markup: viewJournalEntriesKeyboard, parse_mode: "HTML" },
      );
    } catch (_err) {
      // Ignore error if message content doesn't change
      continue;
    }
  }
}
