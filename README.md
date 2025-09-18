# Simple Workout Tracker

A tiny, no-auth, single-user workout logger that runs fully in your browser. Data is saved in localStorage. Create programs, workouts, exercises, and log sessions with per-set weight and reps. The last session values are shown/prefilled when logging a new session.

## Features

- Programs contain Workouts (name + optional label like "Push A")
- Workouts contain Exercises: name, number of sets, target rep range, notes
- Log sessions: weight and reps per set, with last-time values displayed
- History summary and JSON export/import for backup

## Run locally

Just open `index.html` in your browser. For best results, serve it with a tiny static server to avoid any browser restrictions:

```sh
# macOS, zsh examples
python3 -m http.server 5173
# then open: http://localhost:5173/
```

No build step, just vanilla HTML/CSS/JS.

## Data model

```jsonc
{
  "programs": [
    { "id": "p1", "name": "Base Strength", "workouts": ["w1", "w2"] }
  ],
  "workouts": {
    "w1": {
      "id": "w1",
      "name": "Day 1",
      "label": "Push A",
      "exercises": [
        {
          "id": "e1",
          "name": "Bench Press",
          "sets": 3,
          "targetReps": { "min": 5, "max": 8 },
          "notes": ""
        }
      ],
      "sessions": [
        {
          "id": "s1",
          "dateISO": "...",
          "results": {
            "e1": [
              { "weight": 80, "reps": 6 },
              { "weight": 80, "reps": 6 },
              { "weight": 80, "reps": 5 }
            ]
          }
        }
      ]
    }
  }
}
```

All of this is stored under the localStorage key `swt:data:v1`.

## Backup/Restore

Use the Export button to download a JSON. Use the Import label to load a previously exported JSON.

## Notes

- This is intentionally minimal and offline-first. No accounts, no server.
- You can tweak styling in `styles.css`.
