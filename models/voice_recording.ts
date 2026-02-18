import { DatabaseSync, SQLOutputValue } from "node:sqlite";
import { VoiceRecording } from "../types/types.ts";
import { PathLike } from "node:fs";
import { sqlFilePath } from "../constants/paths.ts";

const sqlFilePathVoiceRecording = `${sqlFilePath}/voice_recording`;

/**
 * Insert a voice recording into voice_recording_db
 * @param voiceRecording VoiceRecording - Voice recording to insert
 * @param dbFile PathLike - Path to the sqlite db file
 * @returns StatementResultingChanges
 */
export function insertVoiceRecording(
  voiceRecording: VoiceRecording,
  dbFile: PathLike,
) {
  try {
    const db = new DatabaseSync(dbFile);
    const query = Deno.readTextFileSync(
      `${sqlFilePathVoiceRecording}/insert_voice_recording.sql`,
    ).trim();
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(query).run(
      voiceRecording.entryId,
      voiceRecording.path,
      voiceRecording.length || null,
    );

    if (queryResult.changes === 0) {
      throw new Error(
        `Query ran but no changes were made.`,
      );
    }

    db.close();
    return queryResult;
  } catch (err) {
    console.error(
      `Failed to insert voice recording into voice_recording_db: ${err}`,
    );
    throw err;
  }
}

/**
 * Update a voice recording based on its ID
 * @param voiceRecording VoiceRecording - Updated voice recording to store
 * @param dbFile PathLike - Path to the sqlite db file
 * @returns StatementResultingChanges
 */
export function updateVoiceRecording(
  voiceRecording: VoiceRecording,
  dbFile: PathLike,
) {
  try {
    const db = new DatabaseSync(dbFile);
    const query = Deno.readTextFileSync(
      `${sqlFilePathVoiceRecording}/update_voice_recording.sql`,
    ).replace("<ID>", voiceRecording.id!.toString()).trim();
    if (
      !(db.prepare("PRAGMA integrity_check(voice_recording_db);").get()
        ?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(query).run(
      voiceRecording.path,
      voiceRecording.length || null,
    );

    if (queryResult.changes === 0) {
      throw new Error(
        `Query ran but no changes were made.`,
      );
    }

    db.close();
    return queryResult;
  } catch (err) {
    console.error(
      `Failed to update voice recording ${voiceRecording.id}: ${err}`,
    );
    throw new Error(
      `Failed to update voice recording ${voiceRecording.id} in voice_recording_db: ${err}`,
    );
  }
}

/**
 * Deletes a voice recording by its ID
 * @param voiceRecordingId Number - ID of voice recording to delete
 * @param dbFile PathLike - Path to the sqlite db file
 * @returns StatementResultingChanges | undefined
 */
export function deleteVoiceRecordingById(
  voiceRecordingId: number,
  dbFile: PathLike,
) {
  try {
    const db = new DatabaseSync(dbFile);
    const query = Deno.readTextFileSync(
      `${sqlFilePathVoiceRecording}/delete_voice_recording.sql`,
    ).replace("<ID>", voiceRecordingId.toString()).trim();
    if (
      !(db.prepare("PRAGMA integrity_check(voice_recording_db);").get()
        ?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");

    const queryResult = db.prepare(query).run();

    if (queryResult.changes === 0) {
      throw new Error(
        `Query ran but no changes were made.`,
      );
    }

    db.close();
    return queryResult;
  } catch (err) {
    console.error(
      `Failed to delete voice recording ${voiceRecordingId} from voice_recording_db: ${err}`,
    );
  }
}

/**
 * Retrieve a voice recording by its ID
 * @param voiceRecordingId Number - ID of voice recording to retrieve
 * @param dbFile PathLike - Path to the sqlite db file
 * @returns VoiceRecording
 */
export function getVoiceRecordingById(
  voiceRecordingId: number,
  dbFile: PathLike,
): VoiceRecording {
  let queryResult: Record<string, SQLOutputValue> | undefined;
  try {
    const db = new DatabaseSync(dbFile);
    const query = Deno.readTextFileSync(
      `${sqlFilePathVoiceRecording}/get_voice_recording_by_id.sql`,
    ).replace("<ID>", voiceRecordingId.toString()).trim();
    if (
      !(db.prepare("PRAGMA integrity_check(voice_recording_db);").get()
        ?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    db.exec("PRAGMA foreign_keys = ON;");
    queryResult = db.prepare(query).get();
    db.close();
  } catch (err) {
    console.error(
      `Failed to retrieve voice recording ${voiceRecordingId}: ${err}`,
    );
  }

  return {
    id: Number(queryResult?.id!),
    entryId: Number(queryResult?.entryId!),
    path: String(queryResult?.path!),
    length: Number(queryResult?.length!),
  };
}

/**
 * Retrieve all voice recordings for a journal entry
 * @param entryId Number - ID of the journal entry
 * @param dbFile PathLike - Path to the sqlite db file
 * @returns VoiceRecording[]
 */
export function getAllVoiceRecordingsByEntryId(
  entryId: number,
  dbFile: PathLike,
): VoiceRecording[] {
  const voiceRecordings: VoiceRecording[] = [];
  try {
    const db = new DatabaseSync(dbFile);
    const query = Deno.readTextFileSync(
      `${sqlFilePathVoiceRecording}/get_all_voice_recordings_by_id.sql`,
    ).replace("<ID>", entryId.toString()).trim();
    if (
      !(db.prepare("PRAGMA integrity_check;").get()?.integrity_check === "ok")
    ) throw new Error("JotBot Error: Databaes integrety check failed!");
    const queryResults = db.prepare(query).all();
    for (const vr in queryResults) {
      const voiceRecording: VoiceRecording = {
        id: Number(queryResults[vr].id!),
        entryId: Number(queryResults[vr].entryId!),
        path: queryResults[vr].path?.toString()!,
        length: Number(queryResults[vr].length!),
      };

      voiceRecordings.push(voiceRecording);
    }
    db.close();
  } catch (err) {
    console.error(
      `Jotbot Error: Failed retrieving all voice recordings for entry ${entryId}: ${err}`,
    );
  }
  return voiceRecordings;
}
