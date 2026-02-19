export enum DepressionSeverity {
  NONE_MINIMAL = "None to Minimal Depression",
  MILD = "Mild Depression",
  MODERATE = "Moderate Depression",
  MODERATELY_SEVERE = "Moderate to Severe Depression",
  SEVERE = "Severe Depression",
}

export enum AnxietySeverity {
  MINIMAL_ANXIETY = "Minimal Anxiety",
  MILD_ANXIETY = "Mild Anxiety",
  MODERATE_ANXIETY = "Moderate Anxiety",
  MODERATE_TO_SEVERE_ANXIETY = "Moderate to Severe Anxiety",
}

export type Entry = {
  id?: number;
  userId: number;
  timestamp: number;
  lastEditedTimestamp?: number | null;
  emotion: Emotion;
  situation: string;
  automaticThoughts: string;
  selfiePath: string | null;
};

export type EntryContent = {
  emotion: Emotion;
  situation: string;
  automaticThoughts: string;
};

export type Emotion = {
  emotionName: string;
  emotionEmoji?: string;
  emotionDescription: string;
};

export type User = {
  id?: number;
  telegramId: number;
  username: string;
  dob: Date;
  joinedDate: Date;
};

export type PHQ9Score = {
  id?: number; // Id of this time the test was taken
  userId: number; // Telegram user ID this score is attatched to
  timestamp: number; // When the test was taken
  score: number; // The overall depression score
  severity: DepressionSeverity; // The severity of the depression
  action: string; // What having that severe of depression can be like
  impactQuestionAnswer: string; // The impact the depression is having on the users life
};

export type GAD7Score = {
  id?: number; // Id of this take
  userId: number;
  timestamp: number;
  score: number;
  severity: AnxietySeverity;
  action: string;
  impactQuestionAnswer: string;
};

export type Settings = {
  id?: number;
  userId: number;
  storeMentalHealthInfo: boolean;
  custom404ImagePath?: string | null;
};

export type JournalEntryPhoto = {
  id?: number;
  entryId: number;
  path: string;
  caption?: string;
  fileSize: number;
};

export type JournalEntry = {
  id?: number;
  userId: number;
  timestamp: number;
  lastEditedTimestamp?: number | null;
  content: string;
  length: number;
};

export type VoiceRecording = {
  id?: number;
  entryId: number;
  path: string;
  length: number;
};
