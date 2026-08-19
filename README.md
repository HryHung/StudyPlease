# StudyPlease

StudyPlease is a browser extension that turns restricted websites into short English (or any language u want) vocabulary checkpoints.

## Features
- Full-screen in-page quiz overlay on restricted sites.
- 4 multiple-choice answers.
- Wrong answer: the correct meaning is highlighted green, then a different word appears.
- Correct answer: unlocks browsing for 1–60 minutes.
- Floating countdown in the top-right corner.
- Add/remove restricted domains from the extension popup.
- Add personal vocabulary using `word` + `meaning`.
- 10 C1 starter words are seeded on first install.
- Basic quiz statistics.

## Install in Chrome / Edge
1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the extracted `StudyPlease` folder.
5. Open the StudyPlease extension popup and configure restricted sites / unlock time.

## Important
This MVP uses a document-start content script to put the full-screen StudyPlease overlay over restricted pages. The page itself may still technically begin loading underneath the overlay, but the user cannot interact with it while StudyPlease is locked.
