// content_script.ts
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  console.log(msg);
  console.log(sender);

  // Function to reload the tab until the video ID and search parameter are obtained
  const reloadTabUntilVideoIDAndSearch = async () => {
    // Get the current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs.length > 0) {
        const currentTab = tabs[0];
        const currentTabURL = currentTab.url;
        console.log('Current Tab URL:', currentTabURL);

        // Check if the current tab is a YouTube page
        if (isYouTubeURL(currentTabURL)) {
          const videoID = getYouTubeVideoID(currentTabURL);
          const searchParam = getYouTubeSearchParam(currentTabURL);
          if (videoID) {
            console.log('YouTube Video ID:', videoID);
            // Send message to the popup script
            chrome.runtime.sendMessage({ type: 'YOUTUBE_VIDEO_ID', videoID });
          }
          if (searchParam) {
            console.log('YouTube Search Parameter:', searchParam);
            const translatedSearch = await translateSearch(searchParam);
            console.log('Translated Search:', translatedSearch);

            // Modify the URL search query and reload the tab
            const newURL = modifyURLSearchQuery(currentTabURL, 'search_query', translatedSearch);
            chrome.tabs.update(currentTab.id, { url: newURL });

            // Mute the current tab
            sendResponse({ videoID, searchParam, translatedSearch });
          }
        } else {
          console.log('Not a YouTube page');
          // Reload the tab after a short delay
          setTimeout(reloadTabUntilVideoIDAndSearch, 1000);
        }
      }
    });
  };

  // Check if the message is from the popup script
  if (msg.type === 'POPUP_READY') {
    // Start reloading the tab until the video ID and search parameter are obtained
    reloadTabUntilVideoIDAndSearch();
  }
  return true; // Indicates that the response will be sent asynchronously
});

// Function to check if a URL is a YouTube page
const isYouTubeURL = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Function to extract the YouTube video ID from a URL
const getYouTubeVideoID = (url: string): string | null => {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v') || url.split('/').pop() || null;
};

// Function to extract the YouTube search parameter from a URL
const getYouTubeSearchParam = (url: string): string | null => {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('search_query') || null;
};

// Function to modify the URL search query
const modifyURLSearchQuery = (url: string, key: string, value: string): string => {
  const urlObject = new URL(url);
  urlObject.searchParams.set(key, value);
  return urlObject.href;
};

// Function to translate the searchParam using ChatGPT API
async function translateSearch(searchParam: string): Promise<string> {
  const apiKey = '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'; // Replace with your ChatGPT API key
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  // Prepare the request payload
  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: `You're a universal Language assistant` },
      { role: 'user', content: `Translate the phrase "${searchParam}" into 15 different languages so that it can be searched on YouTube. Please provide the translations in one sentence, separating them with commas.` },
    ],
    max_tokens: 100,
    temperature: 0.7,
    n: 1,
    stop: '\n',
  };

  // Make the API request to ChatGPT API
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  // Parse the response
  const data = await response.json();
  const generatedSentence = data.choices[0].message.content;

  return generatedSentence;
}
