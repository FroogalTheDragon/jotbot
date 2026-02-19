import { PathLike } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { sqlFilePath } from "../constants/paths.ts";

export function createEntryTable(dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    const query =
      (Deno.readTextFileSync(`${sqlFilePath}/create_entry_table.sql`)).trim();
    db.exec("PRAGMA foreign_keys = ON;");
    db.prepare(query).run();
    db.close();
  } catch (err) {
    console.error(`Failed to create entry_db table: ${err}`);
  }
}

export function createGadScoreTable(dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    const query =
      (Deno.readTextFileSync(`${sqlFilePath}/create_gad_score_table.sql`))
        .trim();
    db.exec("PRAGMA foreign_keys = ON;");
    db.prepare(query).run();
    db.close();
  } catch (err) {
    console.error(`There was a a problem create the user_db table: ${err}`);
  }
}

export function createPhqScoreTable(dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    const query =
      (Deno.readTextFileSync(`${sqlFilePath}/create_phq_score_table.sql`))
        .trim();
    db.exec("PRAGMA foreign_keys = ON;");
    db.prepare(query).run();
    db.close();
  } catch (err) {
    console.error(`There was a a problem create the user_db table: ${err}`);
  }
}

export function createUserTable(dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    const query = (Deno.readTextFileSync(
      `${sqlFilePath}/create_user_table.sql`,
    )).trim();
    db.exec("PRAGMA foreign_keys = ON;");
    db.prepare(query).run();
    db.close();
  } catch (err) {
    console.error(`There was a a problem create the user_db table: ${err}`);
  }
}

export function createSettingsTable(dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    const query =
      (Deno.readTextFileSync(`${sqlFilePath}/create_settings_table.sql`))
        .trim();
    db.exec("PRAGMA foreign_keys = ON;");
    db.prepare(query).run();
    db.close();
  } catch (err) {
    console.error(`Failed to create settings table: ${err}`);
  }
}

export function addCustom404ImagePathColumn(dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    db.exec("PRAGMA foreign_keys = ON;");
    db.prepare("ALTER TABLE settings_db ADD COLUMN custom404ImagePath TEXT;")
      .run();
    db.close();
  } catch (err) {
    console.error(`Failed to add custom404ImagePath column: ${err}`);
  }
}

export function createJournalTable(dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    const query =
      (Deno.readTextFileSync(`${sqlFilePath}/create_journal_table.sql`))
        .trim();
    db.exec("PRAGMA foreign_keys = ON;");
    db.prepare(query).run();
    db.close();
  } catch (err) {
    console.error(`Failed to create settings table: ${err}`);
  }
}

export function createJournalEntryPhotosTable(dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    const query = Deno.readTextFileSync(`${sqlFilePath}/create_photo_table.sql`)
      .trim();
    db.exec("PRAGMA foreign_keys = ON;");
    db.prepare(query).run();
    db.close();
  } catch (err) {
    console.error(`Failed to create photo_db table: ${err}`);
  }
}

export function createVoiceRecordingTable(dbFile: PathLike) {
  try {
    const db = new DatabaseSync(dbFile);
    const query =
      (Deno.readTextFileSync(`${sqlFilePath}/create_voice_recording_table.sql`))
        .trim();
    db.exec("PRAGMA foreign_keys = ON;");
    db.prepare(query).run();
    db.close();
  } catch (err) {
    console.error(`Failed to create settings table: ${err}`);
  }
}
