# 🤖 JotBot

A Telegram bot for journaling, mental health tracking, and emotional wellness — built with [Deno](https://deno.land), [grammY](https://grammy.dev), and SQLite.

## What is JotBot?

JotBot helps you record your thoughts, emotions, and daily experiences directly inside Telegram. It supports two types of entries:

- **CBT Entries** — Structured entries based on Cognitive Behavioral Therapy (situation, automatic thoughts, emotion tracking with selfie)
- **Journal Entries** — Free-form journaling with support for photos and voice recordings

JotBot also includes clinically validated mental health assessments (PHQ-9 for depression, GAD-7 for anxiety), a mental health snapshot, crisis resources, and a kitty engine — because studies show that looking at cats can improve your mood. 🐱

## Getting Started

### Prerequisites

- [Deno](https://deno.land) v2+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd jotbot

# Copy the environment file and add your bot token
cp .env.example .env
```

Edit `.env` with your values:

```env
TELEGRAM_BOT_KEY=your_bot_token_here
TELEGRAM_API_BASE_URL=https://api.telegram.org
```

### Environment Variables

| Variable                | Description                             | Default                    |
| ----------------------- | --------------------------------------- | -------------------------- |
| `TELEGRAM_BOT_KEY`      | Your Telegram bot token from @BotFather | *(required)*               |
| `TELEGRAM_API_BASE_URL` | Custom Telegram Bot API URL             | `https://api.telegram.org` |

The `TELEGRAM_API_BASE_URL` is useful when running behind a proxy or using a self-hosted Telegram Bot API server.

### Running

```bash
# Development (with file watcher)
deno task dev

# Run tests
deno task test

# Compile to standalone binary
deno task bin          # x86_64 Linux
deno task bin-arm      # aarch64 Linux (ARM)
```

The compiled binaries are output to `./bin/`.

## How to Use JotBot

### 1. Register

Send `/start` to JotBot. If you're a new user, you'll be prompted to register. Registration collects your username and date of birth — this is required before you can use any features.

### 2. Create a CBT Entry

Use `/new_entry` to start a structured CBT entry. The bot will guide you through:

1. **How are you feeling?** — Select an emotion (Very Sad → Very Happy)
2. **Describe the situation** — What happened?
3. **Automatic thoughts** — What thoughts popped into your head?
4. **Describe the emotion** — Elaborate on how you feel
5. **Take a selfie** — Capture how you look in the moment *(optional)*

### 3. Create a Journal Entry

Use `/new_journal_entry` for free-form journaling:

1. **Write your entry** — Tell the bot what's on your mind
2. **Attach photos** — Send as many photos as you'd like, then press **Done**
3. **Attach voice recordings** — Optionally record voice memos, then press **Done**

Photos and voice recordings are stored locally and linked to your journal entry.

### 4. View & Manage CBT Entries

Use `/view_entries` to browse your CBT entries. The viewer shows your selfie and entry details with navigation controls:

| Button | Action |
|---|---|
| ⬅️ / ➡️ | Navigate between entries |
| ✏️ Edit Entry ✏️ | Edit the selected entry |
| 💣 Delete 💣 | Delete the selected entry |
| 🛑 Exit 🛑 | Close the viewer |

**Editing:** Copy the entry text, modify it, and send it back. Only edit the parts you typed — don't change the field labels (Situation, Automatic Thoughts, etc.) or the bot won't be able to parse it.

**Deleting:** You'll be asked to confirm before the entry and its selfie are permanently removed.

### 5. View & Manage Journal Entries

Use `/view_journal_entries` to browse your journal entries:

| Button | Action |
|---|---|
| ⬅️ / ➡️ | Navigate between entries |
| 🖼️ Photos | View all photos attached to this entry |
| 🎙️ Voice | Listen to voice recordings for this entry |
| ✏️ Edit | Edit the journal entry text |
| 💣 Delete | Delete the entry and all attached media |
| 🛑 Exit 🛑 | Close the viewer |

**Viewing photos:** Pressing 🖼️ Photos sends all attached photos as a Telegram album (swipeable gallery). A single photo is sent individually. Press **✖️ Dismiss Photos** to clean up the messages.

**Viewing voice recordings:** Pressing 🎙️ Voice sends all voice recordings as playable audio messages.

**Deleting:** Removes the journal entry and cleans up all associated photo and voice recording files from disk. The database cascade also removes the records from `photo_db` and `voice_recording_db`.

### 6. Mental Health Assessments

| Command | Assessment | What it Measures |
|---|---|---|
| `/am_i_depressed` | **PHQ-9** (Patient Health Questionnaire) | Depression severity (None → Severe) |
| `/am_i_anxious` | **GAD-7** (Generalized Anxiety Disorder) | Anxiety severity (Minimal → Severe) |

Each assessment walks you through clinically validated questions. Your score, severity level, and a detailed explanation are provided at the end. Scores are stored (if enabled in settings) so you can track changes over time.

> ⚠️ **These are NOT medical or psychiatric diagnoses.** Only a trained mental health professional can diagnose mental illness. These tools are meant as personal references to help you understand when to seek help.

### 7. Mental Health Snapshot

Use `/snapshot` to view a summary of your most recent PHQ-9 and GAD-7 scores, including severity levels and descriptions.

### 8. Kitties 🐱

Use `/kitties` to open the kitty menu:

- 🐱 **Random Kitty** — Get a random cat photo
- **Kitty Gif** — Get an animated cat
- **Kitty Says** — Get a cat with custom text
- **Inspirational** — Get a cat with an inspirational quote

### 9. Crisis Resources

Use `/🆘` or `/sos` to display crisis helplines and resources including:

- 988 Mental Health Crisis Line
- National Suicide Prevention Lifeline
- Crisis Text Line (text HOME to 741741)
- The Trevor Project (LGBTQ+)
- Veteran Combat Call Center
- Sexual Assault Resources

### 10. Settings

Use `/settings` to manage your preferences:

- **Store Mental Health Info** — Toggle whether PHQ-9 and GAD-7 scores are saved
- **Custom 404 Image** — Set a custom image for when a selfie is missing

## Commands Reference

| Command | Description |
|---|---|
| `/start` | Start the bot and register if needed |
| `/help` | Show the help message |
| `/new_entry` | Create a new CBT entry |
| `/view_entries` | Browse, edit, and delete CBT entries |
| `/new_journal_entry` | Create a new journal entry with photos & voice |
| `/view_journal_entries` | Browse, edit, and delete journal entries |
| `/snapshot` | View mental health overview |
| `/am_i_depressed` | Take the PHQ-9 depression assessment |
| `/am_i_anxious` | Take the GAD-7 anxiety assessment |
| `/kitties` | Open the kitty engine |
| `/settings` | Manage your preferences |
| `/delete_account` | Delete your account and all data |
| `/🆘` or `/sos` | Show crisis helplines |

## Database Schema

JotBot uses SQLite with the following tables:

```
user_db              — Registered users
├── entry_db         — CBT entries (1:many)
├── journal_db       — Journal entries (1:many)
│   ├── photo_db     — Journal entry photos (1:many, CASCADE delete)
│   └── voice_recording_db — Voice recordings (1:many, CASCADE delete)
├── phq_score_db     — PHQ-9 depression scores
├── gad_score_db     — GAD-7 anxiety scores
└── settings_db      — User preferences (auto-created via trigger)
```

The database is automatically created on first run and migrations are applied on subsequent startups.

## Project Structure

```
jotbot/
├── main.ts                    # Bot entry point & command registration
├── handlers/                  # Conversation handlers
│   ├── new_entry.ts           # CBT entry creation
│   ├── view_entries.ts        # CBT entry viewer
│   ├── new_journal_entry.ts   # Journal entry creation (photos + voice)
│   ├── view_journal_entries.ts# Journal entry viewer (album support)
│   ├── register.ts            # User registration
│   ├── delete_account.ts      # Account deletion
│   ├── phq9_assessment.ts     # PHQ-9 assessment
│   ├── gad7_assessment.ts     # GAD-7 assessment
│   ├── kitties.ts             # Cat image engine
│   └── set_custom_404_image.ts# Custom 404 image setting
├── models/                    # Database CRUD operations
│   ├── user.ts
│   ├── entry.ts
│   ├── journal.ts
│   ├── journal_entry_photo.ts
│   ├── voice_recording.ts
│   ├── phq9_score.ts
│   ├── gad7_score.ts
│   └── settings.ts
├── db/
│   ├── migration.ts           # Table creation functions
│   └── sql/                   # SQL files for tables and queries
├── types/types.ts             # TypeScript type definitions
├── constants/                 # Paths, strings, numbers
├── utils/                     # Keyboards, DB utilities, Telegram helpers
├── tests/                     # Deno test files
├── assets/                    # Stored selfies, journal photos, voice recordings
└── bin/                       # Compiled binaries
```

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
