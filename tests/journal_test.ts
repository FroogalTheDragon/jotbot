import { assertEquals } from "@std/assert/equals";
import { testDbFile, testDbFileBasePath } from "../constants/paths.ts";
import { createJournalTable, createUserTable } from "../db/migration.ts";
import {
  deleteJournalEntryById,
  getAllJournalEntriesByUserId,
  getJournalEntryById,
  insertJournalEntry,
  updateJournalEntry,
} from "../models/journal.ts";
import { insertUser } from "../models/user.ts";
import { JournalEntry, User } from "../types/types.ts";
import { assertObjectMatch } from "@std/assert/object-match";
import { existsSync } from "node:fs";
import { print } from "../utils/misc.ts";

// Create test db directory structure
if (!existsSync(testDbFileBasePath)) {
  Deno.mkdirSync(testDbFileBasePath, { recursive: true });
}

// Create test journal entry
const testJournalEntry: JournalEntry = {
  id: 1,
  userId: 12345,
  timestamp: 1234567890,
  lastEditedTimestamp: null,
  content: "Test journal entry.",
  length: 19,
};

// Create test user
const testUser: User = {
  telegramId: 12345,
  username: "username",
  dob: new Date(Date.now()),
  joinedDate: new Date(Date.now()),
};

Deno.test("Test insertJournalEntry()", () => {
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  insertUser(testUser, testDbFile);

  const queryResult = insertJournalEntry(testJournalEntry, testDbFile);

  assertEquals(queryResult?.changes, 1);
  assertEquals(queryResult?.lastInsertRowid, 1);

  Deno.removeSync(testDbFile);
});

Deno.test("Test getJournalEntryById()", () => {
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  insertUser(testUser, testDbFile);
  insertJournalEntry(testJournalEntry, testDbFile);

  const entry = getJournalEntryById(1, testDbFile);
  print(entry);
  assertObjectMatch(entry!, testJournalEntry);
  Deno.removeSync(testDbFile);
});

Deno.test("Test updateJournalEntry()", () => {
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  insertUser(testUser, testDbFile);
  insertJournalEntry(testJournalEntry, testDbFile);

  const updatedJournalEntry: JournalEntry = testJournalEntry;
  updatedJournalEntry.content = "I changed the content!";
  updatedJournalEntry.length = updatedJournalEntry.content.length;
  updatedJournalEntry.lastEditedTimestamp = Date.now();

  const queryResult = updateJournalEntry(updatedJournalEntry, testDbFile);
  assertEquals(queryResult?.changes, 1);
  console.log(queryResult);
  Deno.removeSync(testDbFile);
});

Deno.test("Test deleteJournalEntryById()", () => {
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  insertUser(testUser, testDbFile);
  insertJournalEntry(testJournalEntry, testDbFile);

  const queryResult = deleteJournalEntryById(1, testDbFile);

  assertEquals(queryResult?.changes, 1);
  assertEquals(queryResult?.lastInsertRowid, 0);
  Deno.removeSync(testDbFile);
});

Deno.test("Test getAllJournalEntriesByUserId()", () => {
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  insertUser(testUser, testDbFile);

  // Insert 5 Journal Entries
  for (let i = 0; i < 5; i++) {
    insertJournalEntry(testJournalEntry, testDbFile);
  }

  const entries = getAllJournalEntriesByUserId(12345, testDbFile);

  assertEquals(entries.length, 5);
  Deno.removeSync(testDbFile);
});
