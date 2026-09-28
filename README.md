# StudyPlease

StudyPlease is a browser extension that turns restricted websites into short English (or any language u want) vocabulary checkpoints.

<img width="1307" height="602" alt="image" src="https://github.com/user-attachments/assets/0367762f-c7e0-4a5c-b6b1-23ddc71d8cc2" />

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
1. Download Zip file
    <img width="774" height="452" alt="image" src="https://github.com/user-attachments/assets/04087c78-08f2-411e-85cd-8d3e143cff6a" />
2. Open `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode**.
   <img width="336" height="564" alt="image" src="https://github.com/user-attachments/assets/30dc960a-cdf6-4977-88ac-b84ea5238177" />
4. Choose **Load unpacked**.
   <img width="891" height="167" alt="image" src="https://github.com/user-attachments/assets/2fccf30a-4996-484d-8186-d123dbd782a4" />
6. Select the extracted `StudyPlease` folder.
7. Open the StudyPlease extension popup and configure restricted sites / unlock time.

## Important
This MVP uses a document-start content script to put the full-screen StudyPlease overlay over restricted pages. The page itself may still technically begin loading underneath the overlay, but the user cannot interact with it while StudyPlease is locked.
