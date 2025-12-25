// Background script to handle extension icon click
// Activates destruction mode directly without popup

chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Check if we can inject into this tab
    if (!tab || !tab.id) {
      console.error('No active tab found');
      return;
    }

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
      // Can't show alert from background, just log
      console.error('Cannot run on Chrome system pages');
      return;
    }

    console.log('Activating destruction mode on tab:', tab.id, tab.url);

    // First, inject CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['src/content.css']
    });
    console.log('CSS injected');

    // Set default weapon (flamer) and activate flag
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        window.pageDestroyerWeapon = 'meteor';
        window.pageDestroyerActivate = true;
      }
    });
    console.log('Config set');

    // Now inject the main content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content.js']
    });
    console.log('Content script injected - destruction mode activated!');

  } catch (error) {
    console.error('Failed to inject scripts:', error);
  }
});
