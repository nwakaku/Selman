chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg);
  console.log(sender);

  // Function to reload the tab until the video ID is obtained
  const reloadTabUntilVideoID = async () => {
    // Get the current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const currentTab = tabs[0];
        const currentTabURL = currentTab.url;
        console.log('Current Tab URL:', currentTabURL);

        // Check if the current tab is a YouTube page
        if (isYouTubeURL(currentTabURL)) {
          const videoID = getYouTubeVideoID(currentTabURL);
          if (videoID) {
            console.log('YouTube Video ID:', videoID);

            // Send message to the popup script
            chrome.runtime.sendMessage({ type: 'YOUTUBE_VIDEO_ID', videoID });

            // Mute the current tab
            chrome.tabs.update(currentTab.id, { muted: true }, () => {
              console.log('Tab muted');
            });
          } else {
            console.log('Invalid YouTube URL');
            // Reload the tab after a short delay
            setTimeout(reloadTabUntilVideoID, 1000);
          }
        } else {
          console.log('Not a YouTube page');
          // Reload the tab after a short delay
          setTimeout(reloadTabUntilVideoID, 1000);
        }
      }
    });
  };

  // Check if the message is from the popup script
  if (msg.type === 'POPUP_READY') {
    // Start reloading the tab until the video ID is obtained
    reloadTabUntilVideoID();
  }

  sendResponse('From the background Script');
});

// Function to check if a URL is a YouTube page
const isYouTubeURL = (url) => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Function to extract the YouTube video ID from a URL
const getYouTubeVideoID = (url) => {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v') || url.split('/').pop();
};
