const videoElement = document.querySelector('video');

if (videoElement) {
  const overlayDiv = document.createElement('div');
  overlayDiv.style.position = 'absolute';
  overlayDiv.style.top = '50%';
  overlayDiv.style.left = '50%';
  overlayDiv.style.transform = 'translate(-50%, -50%)';
  overlayDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlayDiv.style.color = '#ffffff';
  overlayDiv.style.fontSize = '24px';
  overlayDiv.style.padding = '10px';
  overlayDiv.style.fontWeight = 'bold';
  overlayDiv.style.zIndex = '9999';
  overlayDiv.style.pointerEvents = 'none';

  videoElement.parentNode.insertBefore(overlayDiv, videoElement);

  let words = []; // Array to store individual words
  let currentWordIndex = 0; // Index of the currently spoken word

  chrome.runtime.onMessage.addListener(function listenForPunctuatedText(message, sender, sendResponse) {
    if (message.type === 'PUNCTUATED_TEXT') {
      overlayDiv.textContent = message.punctuatedText;
      words = message.punctuatedText.split(' '); // Split the punctuated text into words
      currentWordIndex = 0; // Reset the current word index
      speakNextWord(); // Start speaking the words
    } else if (message.type === 'REQUEST_PUNCTUATED_TEXT') {
      // Keep refreshing until punctuated text is received
      setTimeout(() => {
        chrome.runtime.sendMessage({ type: 'REQUEST_PUNCTUATED_TEXT' });
      }, 1000); // Wait for 1 second before refreshing
    }
  });

  // Request punctuated text from the popup
  chrome.runtime.sendMessage({ type: 'REQUEST_PUNCTUATED_TEXT' });

  function speakNextWord() {
    if (currentWordIndex < words.length) {
      const currentWord = words[currentWordIndex];
      overlayDiv.innerHTML = words
        .map((word, index) => {
          if (index === currentWordIndex) {
            return `<span style="color: yellow;">${word}</span>`; // Highlight the current word in yellow
          } else {
            return word;
          }
        })
        .join(' ');

      speakText(currentWord); // Speak the current word
      currentWordIndex++;
    }
  }

  function speakText(text) {
    const speech = new SpeechSynthesisUtterance();
    speech.lang = 'en-US'; // Set the language of the speech
    speech.text = text;
    speech.volume = 1;
    speech.rate = 1; // Adjust the rate of speech (0.1 - 10)
    speech.pitch = 1; // Adjust the pitch of speech (0 - 2)
    speech.onend = () => {
      speakNextWord(); // Speak the next word after the current word ends
    };
    speechSynthesis.speak(speech);
  }
}

// chrome.runtime.sendMessage('I am loading content script', (response) => {
//   console.log(response);
//   console.log('I am content script');
// });

// window.onload = () => {
//   console.log('Page is fully loaded');
// };
