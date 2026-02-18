import { assertEquals } from "@std/assert/equals";
import { assertObjectMatch } from "@std/assert/object-match";
import { testDbFile, testDbFileBasePath } from "../constants/paths.ts";
import {
  createJournalTable,
  createUserTable,
  createVoiceRecordingTable,
} from "../db/migration.ts";
import { insertJournalEntry } from "../models/journal.ts";
import {
  deleteVoiceRecordingById,
  getAllVoiceRecordingsByEntryId,
  getVoiceRecordingById,
  insertVoiceRecording,
  updateVoiceRecording,
} from "../models/voice_recording.ts";
import { insertUser } from "../models/user.ts";
import { JournalEntry, User, VoiceRecording } from "../types/types.ts";
import { existsSync } from "node:fs";

// Create test db directory structure
if (!existsSync(testDbFileBasePath)) {
  Deno.mkdirSync(testDbFileBasePath, { recursive: true });
}

// Create test user
const testUser: User = {
  telegramId: 12345,
  username: "username",
  dob: new Date(Date.now()),
  joinedDate: new Date(Date.now()),
};

const testJournalEntry: JournalEntry = {
  userId: 12345,
  timestamp: 12345,
  content: "Test Content",
  length: 100,
};

const testVoiceRecording: VoiceRecording = {
  id: 1,
  entryId: 1,
  path: "/some/test/path/recording.ogg",
  length: 30,
};

/**
 * Helper to set up a fresh test database with user, journal entry,
 * and voice recording table ready to go.
 */
function setupTestDb() {
  if (existsSync(testDbFile)) Deno.removeSync(testDbFile);
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  createVoiceRecordingTable(testDbFile);
  insertUser(testUser, testDbFile);
  insertJournalEntry(testJournalEntry, testDbFile);
}

Deno.test("Test insertVoiceRecording()", () => {
  setupTestDb();

  const queryResult = insertVoiceRecording(
    testVoiceRecording,
    testDbFile,
  );

  assertEquals(queryResult?.changes, 1);
  assertEquals(queryResult.lastInsertRowid, 1);

  // Clean up
  Deno.removeSync(testDbFile);
});

Deno.test("Test updateVoiceRecording()", () => {
  setupTestDb();
  insertVoiceRecording(testVoiceRecording, testDbFile);

  const updatedRecording: VoiceRecording = {
    ...testVoiceRecording,
    path: "/some/other/test/path/recording.ogg",
    length: 60,
  };
  const queryResult = updateVoiceRecording(updatedRecording, testDbFile);

  assertEquals(queryResult.changes, 1);
  assertEquals(queryResult.lastInsertRowid, 0);

  // Clean up
  Deno.removeSync(testDbFile);
});

Deno.test("Test deleteVoiceRecordingById()", () => {
  setupTestDb();
  insertVoiceRecording(testVoiceRecording, testDbFile);

  const queryResult = deleteVoiceRecordingById(
    testVoiceRecording.id!,
    testDbFile,
  );

  assertEquals(queryResult?.changes, 1);
  assertEquals(queryResult?.lastInsertRowid, 0);

  // Clean up
  Deno.removeSync(testDbFile);
});

Deno.test("Test getVoiceRecordingById()", () => {
  setupTestDb();
  insertVoiceRecording(testVoiceRecording, testDbFile);

  const voiceRecording = getVoiceRecordingById(1, testDbFile);

  assertObjectMatch(testVoiceRecording, voiceRecording);

  // Clean up
  Deno.removeSync(testDbFile);
});

Deno.test("Test getAllVoiceRecordingsByEntryId()", () => {
  setupTestDb();

  // Insert 3 voice recordings for the same journal entry
  for (let i = 0; i < 3; i++) {
    insertVoiceRecording(testVoiceRecording, testDbFile);
  }

  const voiceRecordings = getAllVoiceRecordingsByEntryId(
    testVoiceRecording.entryId,
    testDbFile,
  );

  assertEquals(voiceRecordings.length, 3);

  for (const vr in voiceRecordings) {
    assertEquals(voiceRecordings[vr].id, Number(vr) + 1);
    assertEquals(voiceRecordings[vr].entryId, testVoiceRecording.entryId);
  }

  // Clean up
  Deno.removeSync(testDbFile);
});
