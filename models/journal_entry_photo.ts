import { DatabaseSync } from "node:sqlite";
import { JournalEntryPhoto } from "../types/types.ts";
import { PathLike } from "node:fs";

/**
 * @param jePhoto
 * @param dbFile
 * @returns StatementResultingChanges
 */
export function insertJournalEntryPhoto(
  jePhoto: JournalEntryPhoto,
  dbFile: PathLike,
) {
  try {
    const db = new DatabaseSync(dbFile);
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(
      `INSERT INTO photo_db (entryId, path, caption, fileSize) VALUES (?, ?, ?, ?);`,
    ).run(
      jePhoto.entryId,
      jePhoto.path,
      jePhoto.caption || null,
      jePhoto.fileSize,
    );

    db.close();
    return queryResult;
  } catch (err) {
    console.error(
      `Failed to insert journal entry photo into photo_db: ${err}`,
    );
    throw err;
  }
}

/**
 * @param newPhoto
 * @param dbFile
 * @returns StatementResultingChanges
 */
export function updateJournalEntryPhoto(
  newPhoto: JournalEntryPhoto,
  dbFile: PathLike,
) {
  try {
    const db = new DatabaseSync(dbFile);
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(
      `UPDATE OR FAIL photo_db SET path = ?, caption = ?, fileSize = ? WHERE id = ${newPhoto.id};`,
    ).run(
      newPhoto.path,
      newPhoto.caption || null,
      newPhoto.fileSize,
    );

    db.close();
    return queryResult;
  } catch (err) {
    console.error(
      `Failed to insert journal entry photo into photo_db: ${err}`,
    );
    throw err;
  }
}

/**
 * Deletes a photo by it's id from the database
 * @param id Id of photo to be deleted
 * @param dbFile Path to database file
 * @returns StatementResultingChanges
 */
export function deleteJournalEntryPhoto(id: number, dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(
      `DELETE FROM photo_db WHERE id = ${id};`,
    ).run();

    db.close();
    return queryResult;
  } catch (err) {
    console.error(
      `Failed to insert journal entry photo into photo_db: ${err}`,
    );
    throw err;
  }
}

/**
 * @param entryId Journal entry the photos are linked to
 * @param dbFile Path to database file
 */
export function getJournalEntryPhotosByJournalEntryId(
  entryId: number,
  dbFile: PathLike,
): JournalEntryPhoto[] {
  try {
    const db = new DatabaseSync(dbFile);
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResults = db.prepare(
      `SELECT * FROM photo_db WHERE entryId = ${entryId};`,
    ).all();

    db.close();
    const photos: JournalEntryPhoto[] = [];
    for (const result in queryResults) {
      if (queryResults[result] != null) {
        const photo: JournalEntryPhoto = {
          id: Number(queryResults[result].id),
          entryId: Number(queryResults[result].entryId),
          path: queryResults[result].path?.toString()!,
          caption: queryResults[result].caption?.toString() || undefined,
          fileSize: Number(queryResults[result].fileSize),
        };
        photos.push(photo);
      }
    }
    return photos;
  } catch (err) {
    console.error(
      `Failed to insert journal entry photo into photo_db: ${err}`,
    );
    throw err;
  }
}

/**
 * Get a single journal entry photo by it's ID
 * @param id Id of the Journal Entry Photo
 * @param dbFile Path to database file
 */
export function getJournalEntryPhotoById(
  id: number,
  dbFile: PathLike,
): JournalEntryPhoto {
  try {
    const db = new DatabaseSync(dbFile);
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(
      `SELECT * FROM photo_db WHERE id = ${id}`,
    ).get();

    db.close();
    return queryResult as JournalEntryPhoto;
  } catch (err) {
    console.error(
      `Failed to insert journal entry photo into photo_db: ${err}`,
    );
    throw err;
  }
}
