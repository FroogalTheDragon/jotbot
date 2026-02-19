import { assertEquals } from "@std/assert/equals";
import { testDbFile, testDbFileBasePath } from "../constants/paths.ts";
import {
  createJournalEntryPhotosTable,
  createJournalTable,
  createUserTable,
} from "../db/migration.ts";
import { insertJournalEntry } from "../models/journal.ts";
import {
  getJournalEntryPhotoById,
  getJournalEntryPhotosByJournalEntryId,
  insertJournalEntryPhoto,
  updateJournalEntryPhoto,
} from "../models/journal_entry_photo.ts";
import { insertUser } from "../models/user.ts";
import { JournalEntry, JournalEntryPhoto, User } from "../types/types.ts";
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

const testJournalEntryPhoto: JournalEntryPhoto = {
  id: 1,
  entryId: 1,
  path: "/some/test/path.jpg",
  caption: "Test Caption",
  fileSize: 1024,
};

// Need to insert multiple photos for getJournalEntryPhotosByJournalEntryId
const testJournalEntryPhoto2: JournalEntryPhoto = {
  id: 2,
  entryId: 1,
  path: "/some/test/path2.jpg",
  caption: "Test Caption",
  fileSize: 1024,
};

Deno.test("Test insertJournalEntryPhoto()", () => {
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  createJournalEntryPhotosTable(testDbFile);
  insertUser(testUser, testDbFile);
  insertJournalEntry(testJournalEntry, testDbFile);

  const queryResult = insertJournalEntryPhoto(
    testJournalEntryPhoto,
    testDbFile,
  );

  assertEquals(queryResult?.changes, 1);
  assertEquals(queryResult.lastInsertRowid, 1);
  Deno.removeSync(testDbFile);
});

Deno.test("Test updateJournalEntryPhoto", () => {
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  createJournalEntryPhotosTable(testDbFile);
  insertUser(testUser, testDbFile);
  insertJournalEntry(testJournalEntry, testDbFile);
  insertJournalEntryPhoto(
    testJournalEntryPhoto,
    testDbFile,
  );

  const updatedPhoto = testJournalEntryPhoto;
  updatedPhoto.path = "/some/other/test/path/image.jpg";
  const queryResults = updateJournalEntryPhoto(updatedPhoto, testDbFile);
  assertEquals(queryResults.changes, 1);
  assertEquals(queryResults.lastInsertRowid, 0);
  Deno.removeSync(testDbFile);
});

Deno.test("Test deleteJournalEntryPhoto", () => {
  // TODO: Write proper test for journal entry photo deleteion
});

Deno.test("Test getJournalEntryPhotosByJournalEntryId", () => {
  // TODO: Write proper test for photos(s) retrieval from the journal by entry id(may be multiple)
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  createJournalEntryPhotosTable(testDbFile);
  insertUser(testUser, testDbFile);
  insertJournalEntry(testJournalEntry, testDbFile);

  // Insert one photo
  insertJournalEntryPhoto(
    testJournalEntryPhoto,
    testDbFile,
  );

  // Insert a second photo
  insertJournalEntryPhoto(
    testJournalEntryPhoto2,
    testDbFile,
  );

  const testPhotos: JournalEntryPhoto[] = [
    testJournalEntryPhoto,
    testJournalEntryPhoto2,
  ];

  const photos: JournalEntryPhoto[] = getJournalEntryPhotosByJournalEntryId(
    1,
    testDbFile,
  );
  assertEquals(
    photos,
    testPhotos,
    "Something went wrong when comparing two JournalEntryPhoto[]",
  );
  Deno.removeSync(testDbFile);
});

Deno.test("Test getJournalEntryPhotoById", () => {
  createUserTable(testDbFile);
  createJournalTable(testDbFile);
  createJournalEntryPhotosTable(testDbFile);
  insertUser(testUser, testDbFile);
  insertJournalEntry(testJournalEntry, testDbFile);

  // Insert two photos so we can verify we get the right one
  insertJournalEntryPhoto(testJournalEntryPhoto, testDbFile);
  insertJournalEntryPhoto(testJournalEntryPhoto2, testDbFile);

  const photo = getJournalEntryPhotoById(1, testDbFile);

  // node:sqlite returns numbers as bigints, so compare field by field
  assertEquals(Number(photo.id), testJournalEntryPhoto.id);
  assertEquals(
    Number(photo.entryId),
    testJournalEntryPhoto.entryId,
  );
  assertEquals(photo.path, testJournalEntryPhoto.path);
  assertEquals(photo.caption, testJournalEntryPhoto.caption);
  assertEquals(Number(photo.fileSize), testJournalEntryPhoto.fileSize);

  // Verify retrieving the second photo returns different data
  const photo2 = getJournalEntryPhotoById(2, testDbFile);
  assertEquals(Number(photo2.id), testJournalEntryPhoto2.id);
  assertEquals(photo2.path, testJournalEntryPhoto2.path);

  Deno.removeSync(testDbFile);
});
