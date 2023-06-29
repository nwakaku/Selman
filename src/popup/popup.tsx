import React, { useState, useEffect } from "react";
import { getSubtitles } from 'youtube-caption-extractor';
import './popup.css';

const Popup = () => {
  const [subtitles, setSubtitles] = useState([]);
  const [interpretationLanguage, setInterpretationLanguage] = useState('en');
  const [parag, setParag] = useState();

  useEffect(() => {
    const lang = 'fr'; // Optional, default is 'en' (English)

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'YOUTUBE_VIDEO_ID') {
        const videoID = message.videoID;
        console.log('Received YouTube Video ID in popup:', videoID);

        // Use the YouTube video ID in your popup script
        // ...
        fetchSubtitles(videoID, lang);
      }
    });
    chrome.runtime.sendMessage({ type: 'POPUP_READY' });

    const fetchSubtitles = async (videoID, lang = 'en') => {
      try {
        const subtitles = await getSubtitles({ videoID, lang });
        console.log(subtitles);
        setSubtitles(subtitles);
      } catch (error) {
        console.error('Error fetching subtitles:', error);
      }
    };
  }, []);

  const joinSubtitles = (subtitles) => {
    const joinedSubtitles = subtitles.map(subtitle => subtitle.text).join(' ');
    return joinedSubtitles;
  };

  // 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

  const punctuateText = async (text, lang) => {
    const apiKey = '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'; // Replace with your ChatGPT API key
    const endpoint = 'https://api.openai.com/v1/chat/completions';
  
    // Prepare the request payload
    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `translate to ${lang} language, Do not complain either.` },
        { role: 'user', content: text },
      ],
      max_tokens: 1000,
      temperature: 0.7,
      n: 1,
      stop: '\n',
    };
  
    // Make the API request to ChatGPT API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  
    // Parse the response
    const data = await response.json();
    const generatedSentence = data.choices[0].message.content;  
    return generatedSentence;
  };

  const speakText = (text, targetLanguage) => {
    const speech = new SpeechSynthesisUtterance();
    speech.lang = targetLanguage;
    speech.text = text;
    speech.volume = 1;
    speech.rate = 0.7; // Adjust the rate value to make it slower (0.1 - 10)
    speech.pitch = 0.8; // Adjust the pitch value to make it deeper (0 - 2)
    // speech.voiceURI = 'native';
    speechSynthesis.speak(speech);
  };

  const handleSpeakText = async () => {
    const joinedSubtitles = joinSubtitles(subtitles);
    const punctuatedText = await punctuateText(joinedSubtitles, interpretationLanguage);
    setParag(punctuatedText);
    speakText(punctuatedText, interpretationLanguage);
  };

  const handleLanguageChange = (e) => {
    setInterpretationLanguage(e.target.value);
  };

  return (
    <div className="m-2 flex flex-col justify-end h-screen">
      <div className="p-4 border rounded">
        <h3 className="text-center font-bold">Selman</h3>
        <p className="mb-4">{parag}</p>
      </div>
      <div className="flex justify-center p-4">
        <button className="mr-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleSpeakText}>
          Speak Subtitles
        </button>
        <select
          className="bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
          value={interpretationLanguage}
          onChange={handleLanguageChange}
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          {/* Add more language options as needed */}
        </select>
      </div>
    </div>
  );
}

export default Popup;