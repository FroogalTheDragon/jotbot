import {
  AnxietySeverity,
  DepressionSeverity,
  Entry,
  GAD7Score,
  JournalEntryPhoto,
  PHQ9Score,
} from "../types/types.ts";
import {
  anxietyExplanations,
  depressionExplanations,
} from "../constants/strings.ts";
import { getTelegramDownloadUrl } from "../utils/telegram.ts";
import { File } from "grammy/types";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function entryFromString(entryString: string): Entry {
  try {
    const emotion = entryString.match(
      /(?<=Emotion)[\S\s]*(?=Emotion Description)/,
    )?.toString().trim();
    const emotionDescription = entryString.match(
      /(?<=Emotion Description)[\S\s]*(?=Situation)/,
    )?.toString().trim();
    const situation = entryString.match(
      // /(?<=Situation[\S\s]*).*(?=[\S\s]*Automatic Thoughts)/,
      /(?<=Situation)[\S\s]*(?=Automatic Thoughts)/,
    )?.toString().trim();
    const automaticThoughts = entryString.match(
      // /(?<=Automatic Thoughts[\S\s]*).*(?=[\S\s]*Page.*)/,
      /(?<=Automatic Thoughts)[\S\s]*(?=Page.*)/,
    )?.toString().trim();
    const emotionArr = emotion!.split(" ");
    const emotionName = emotionArr[0], emotionEmoji = emotionArr[1];

    console.log(emotionArr);

    return {
      userId: 0,
      timestamp: 0,
      emotion: {
        emotionName: emotionName,
        emotionEmoji: emotionEmoji,
        emotionDescription: emotionDescription!,
      },
      situation: situation!,
      automaticThoughts: automaticThoughts!,
      selfiePath: null,
    };
  } catch (err) {
    throw new Error(`Failed to build entry from string: ${err}`);
  }
}

export function entryToString(entry: Entry): string {
  let lastEditedString: string = "";
  if (entry.lastEditedTimestamp !== undefined) {
    lastEditedString = `<b>Last Edited</b> ${
      new Date(entry.lastEditedTimestamp!).toLocaleString()
    }`;
  }
  return `<b>Date Created</b> ${new Date(entry.timestamp!).toLocaleString()}
${lastEditedString}
<b><u>Emotion</u></b>
${entry.emotion.emotionName} ${entry.emotion.emotionEmoji || ""}

<b><u>Emotion Description</u></b>
${entry.emotion.emotionDescription}

<b><u>Situation</u></b>
${entry.situation}

<b><u>Automatic Thoughts</u></b>
${entry.automaticThoughts}`;
}

export function calcPhq9Score(
  score: number,
  userId: number,
  impactQuestionAnswer: string,
): PHQ9Score {
  let depressionSeverity: DepressionSeverity;
  let depressionExplanation: string;

  if (score <= 4) {
    depressionSeverity = DepressionSeverity.NONE_MINIMAL;
    depressionExplanation = depressionExplanations.none_minimal;
  } else if (score <= 9) {
    depressionSeverity = DepressionSeverity.MILD;
    depressionExplanation = depressionExplanations.mild;
  } else if (score <= 14) {
    depressionSeverity = DepressionSeverity.MODERATE;
    depressionExplanation = depressionExplanations.moderate;
  } else if (score <= 19) {
    depressionSeverity = DepressionSeverity.MODERATELY_SEVERE;
    depressionExplanation = depressionExplanations.moderately_severe;
  } else if (score <= 27) {
    depressionSeverity = DepressionSeverity.SEVERE;
    depressionExplanation = depressionExplanations.severe;
  } else {
    console.log("Depression Score out of bounds!");
  }

  return {
    userId: userId,
    score: score,
    severity: depressionSeverity!,
    action: depressionExplanation!,
    impactQuestionAnswer: impactQuestionAnswer,
    timestamp: Date.now(),
  };
}

export function calcGad7Score(
  score: number,
  userId: number,
  impactQestionAnswer: string,
): GAD7Score {
  let anxietySeverity: AnxietySeverity;
  let anxietyExplanation: string;

  if (score <= 4) {
    anxietySeverity = AnxietySeverity.MINIMAL_ANXIETY;
    anxietyExplanation = anxietyExplanations.minimal_anxiety;
  } else if (score <= 9) {
    anxietySeverity = AnxietySeverity.MILD_ANXIETY;
    anxietyExplanation = anxietyExplanations.mild_anxiety;
  } else if (score <= 14) {
    anxietySeverity = AnxietySeverity.MODERATE_ANXIETY;
    anxietyExplanation = anxietyExplanations.moderate_anxiety;
  } else if (score <= 21) {
    anxietySeverity = AnxietySeverity.MODERATE_TO_SEVERE_ANXIETY;
    anxietyExplanation = anxietyExplanations.severe_anxiety;
  } else {
    console.log("Depression Score out of bounds!");
  }

  return {
    id: 0,
    userId: userId,
    timestamp: Date.now(),
    score: score,
    severity: anxietySeverity!,
    action: anxietyExplanation!,
    impactQuestionAnswer: impactQestionAnswer,
  };
}

export function depressionSeverityStringToEnum(
  severityString: string,
): DepressionSeverity {
  let severityEnum: DepressionSeverity;
  switch (severityString) {
    // Depression Cases
    case "None to Minimal Depression": {
      severityEnum = DepressionSeverity.NONE_MINIMAL;
      break;
    }
    case "Mild Depression": {
      severityEnum = DepressionSeverity.MILD;
      break;
    }
    case "Moderate Depression": {
      severityEnum = DepressionSeverity.MODERATE;
      break;
    }
    case "Moderate to Severe Depression": {
      severityEnum = DepressionSeverity.MODERATELY_SEVERE;
      break;
    }
    case "Severe Depression": {
      severityEnum = DepressionSeverity.SEVERE;
      break;
    }

    default: {
      throw new Error("Failed to convert string to enum.");
    }
  }
  return severityEnum;
}

export function anxietySeverityStringToEnum(
  severityString: string,
): AnxietySeverity {
  let severityEnum;
  switch (severityString) {
    case "Minimal Anxiety": {
      severityEnum = AnxietySeverity.MINIMAL_ANXIETY;
      break;
    }
    case "Mild Anxiety": {
      severityEnum = AnxietySeverity.MILD_ANXIETY;
      break;
    }
    case "Moderate Anxiety": {
      severityEnum = AnxietySeverity.MODERATE_ANXIETY;
      break;
    }
    case "Moderate to Severe Anxiety": {
      severityEnum = AnxietySeverity.MODERATE_TO_SEVERE_ANXIETY;
      break;
    }
    default: {
      throw new Error("Failed to convert string to enum.");
    }
  }
  return severityEnum;
}

export async function downloadTelegramImage(
  token: string,
  caption: string,
  telegramFile: File,
  entryId: number,
): Promise<JournalEntryPhoto> {
  const journalEntryPhoto: JournalEntryPhoto = {
    entryId: entryId,
    path: "",
    caption: "",
    fileSize: 0,
  };
  try {
    const selfieResponse = await fetch(
      getTelegramDownloadUrl().replace("<token>", token).replace(
        "<file_path>",
        telegramFile.file_path!,
      ),
    );

    journalEntryPhoto.fileSize = telegramFile.file_size!;
    journalEntryPhoto.caption = caption;

    if (selfieResponse.body) {
      const fileName = `${entryId}_${new Date(Date.now()).toLocaleString()}.jpg`
        .replaceAll(" ", "_").replace(",", "").replaceAll("/", "-"); // Build and sanitize selfie file name

      const filePath = `${Deno.cwd()}/assets/journal_entry_images/${fileName}`;
      const file = await Deno.open(filePath, {
        write: true,
        create: true,
      });

      journalEntryPhoto.path = filePath;

      console.log(`File: ${file}`);
      journalEntryPhoto.path = await Deno.realPath(filePath);
      await selfieResponse.body!.pipeTo(file.writable);
    }
  } catch (err) {
    throw err;
  }
  return journalEntryPhoto;
}

/**
 * A simpler console.log
 * @param message
 */
// deno-lint-ignore no-explicit-any
export function print(message: any) {
  console.log(message);
}
