import { PathLike } from "node:fs";
import { JournalEntry } from "../types/types.ts";
import { DatabaseSync } from "node:sqlite";
import { sqlFilePath } from "../constants/paths.ts";

const sqlPath = `${sqlFilePath}/journal_entry`;

/**
 * Stores a journal entry
 * @param journalEntry Journal entry to store
 * @param dbFile The file path pointing to the DB file
 * @returns StatementResultingChanges shows changes made to the DB
 */
export function insertJournalEntry(
  journalEntry: JournalEntry,
  dbFile: PathLike,
) {
  try {
    const db = new DatabaseSync(dbFile);
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(
      `INSERT INTO journal_db (userId, timestamp, lastEditedTimestamp, content, length) VALUES (?, ?, ?, ?, ?);`,
    ).run(
      journalEntry.userId,
      journalEntry.timestamp,
      journalEntry.lastEditedTimestamp || null,
      journalEntry.content,
      journalEntry.length,
    );

    db.close();
    return queryResult;
  } catch (err) {
    console.error(
      `Failed to insert journal entry into journal_db: ${err}`,
    );
    throw err;
  }
}

/**
 * Updates the JournalEntry passed in the DB
 * @param journalEntry The journal entry to update
 * @param dbFile The file path pointing to the DB file
 * @returns StatementResultingChanges shows changes made to the DB
 */
export function updateJournalEntry(
  journalEntry: JournalEntry,
  dbFile: PathLike,
) {
  try {
    const db = new DatabaseSync(dbFile);
    const query = Deno.readTextFileSync(`${sqlPath}/update_journal_entry.sql`)
      .replace("<ID>", journalEntry.id!.toString()).trim();
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(query).run(
      journalEntry.lastEditedTimestamp!,
      journalEntry.content,
      journalEntry.length,
    );
    db.close();
    return queryResult;
  } catch (err) {
    console.error(`Failed to update journal entry ${journalEntry.id}: ${err}`);
  }
}

/**
 * Deletes a journal entry by it's id
 * @param id Id of the journal entry to delete
 * @param dbFile The file path pointing to the DB file
 * @returns StatementResultingChanges shows changes made to the DB
 */
export function deleteJournalEntryById(
  id: number,
  dbFile: PathLike,
) {
  try {
    const db = new DatabaseSync(dbFile);
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(
      `DELETE FROM journal_db WHERE id = ${id};`,
    ).run();
    db.close();
    return queryResult;
  } catch (err) {
    console.error(`Failed to retrieve journal entry ${id}: ${err}`);
  }
}

/**
 * Retrieve a journal entry from the database by it's id
 * @param id Id of the entry to retrieve
 * @param dbFile The file path pointing to the DB file
 * @returns JournalEntry
 */
export function getJournalEntryById(
  id: number,
  dbFile: PathLike,
) {
  try {
    const db = new DatabaseSync(dbFile);
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const journalEntry = db.prepare(
      `SELECT * FROM journal_db WHERE id = ${id};`,
    ).get();
    db.close();
    return {
      id: Number(journalEntry?.id!),
      userId: Number(journalEntry?.userId!),
      timestamp: Number(journalEntry?.timestamp!),
      lastEditedTimestamp: Number(journalEntry?.lastEditedTimestamp) || null,
      content: String(journalEntry?.content!),
      length: Number(journalEntry?.length!),
    };
  } catch (err) {
    console.error(`Failed to retrieve journal entry ${id}: ${err}`);
  }
}

/**
 * Grab all of a user's journal entries
 * @param userId The id of the user who owns the journal entries
 * @param dbFile The file path pointing to the DB file
 * @returns JournalEntry[]
 */
export function getAllJournalEntriesByUserId(
  userId: number,
  dbFile: PathLike,
): JournalEntry[] {
  const journalEntries: JournalEntry[] = [];
  try {
    const db = new DatabaseSync(dbFile);
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const journalEntriesResults = db.prepare(
      `SELECT * FROM journal_db WHERE userId = ${userId} ORDER BY timestamp DESC;`,
    ).all();
    for (const je in journalEntriesResults) {
      const journalEntry: JournalEntry = {
        id: Number(journalEntriesResults[je]?.id!),
        userId: Number(journalEntriesResults[je]?.userId!),
        timestamp: Number(journalEntriesResults[je]?.timestamp!),
        lastEditedTimestamp:
          Number(journalEntriesResults[je]?.lastEditedTimestamp) || null,
        content: String(journalEntriesResults[je]?.content!),
        length: Number(journalEntriesResults[je]?.length!),
      };
      journalEntries.push(journalEntry);
    }
    db.close();
  } catch (err) {
    console.error(
      `Failed to retrieve entries that belong to ${userId}: ${err}`,
    );
  }
  return journalEntries;
}
