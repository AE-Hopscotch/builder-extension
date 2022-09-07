# spider-hs

A Chrome Extension that brings the power of the Project Builder to the native Hopscotch Web Editor

---

## Loading the Extension (Chromium-based Browsers)

1. Download latest `spider-chrome.zip` from the Releases Tab
2. Extract the ZIP file and store the folder somewhere
3. Go to `chrome://extensions/`
4. Turn on Developer mode on the top right<br>
![Developer Mode](assets/developer-mode.png)
5. Click on "Load Unpacked"<br>
![Load Unpacked](assets/unpacked.png)
6. Choose the `spider-chrome` folder

You should get a message that says "Extension Loaded"

## Loading the Extension (Firefox)

(this will be written once compatibility with Firefox is tested)

## Running Development

1. Clone the repo
2. `npm install` to install dependencies
3. `npm run build` to create a build (optional). The `build` directory contains a local build for a chrome and firefox version of the extension.
4. `npm run dev` to watch changes to the `extension` directory. 
