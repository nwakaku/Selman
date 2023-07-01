import React, { useState, useEffect } from "react";
import { getSubtitles } from 'youtube-caption-extractor';
import axios from 'axios';
import './popup.css';

const Popup = () => {
  const [subtitles, setSubtitles] = useState([]);
  const [interpretationLanguage, setInterpretationLanguage] = useState('en');
  const [inputLanguage, setInputLanguage] = useState('en');
  const [parag, setParag] = useState();

  useEffect(() => {
    const lang = inputLanguage; // Optional, default is 'en' (English)

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'YOUTUBE_VIDEO_ID') {
        const videoID = message.videoID;
        console.log('Received YouTube Video ID in popup:', videoID);

        // Use the YouTube video ID in your popup script
        fetchSubtitles(videoID, lang);
      }
    });
    chrome.runtime.sendMessage({ type: 'POPUP_READY' });

    const fetchSubtitles = async (videoID, lang = inputLanguage) => {
      try {
        const subtitles = await getSubtitles({ videoID, lang });
        console.log(subtitles);
        setSubtitles(subtitles);
      } catch (error) {
        console.error('Error fetching subtitles:', error);
      }
    };
  }, [inputLanguage]);

  const joinSubtitles = (subtitles) => {
    const joinedSubtitles = subtitles.map(subtitle => subtitle.text).join(' ');
    return joinedSubtitles;
  };

  const translateText = async (text, targetLanguage) => {
    const options = {
      method: 'GET',
      url: 'https://translated-mymemory---translation-memory.p.rapidapi.com/get',
      params: {
        langpair: `${inputLanguage}|${targetLanguage}`,
        q: text,
        mt: '1',
        onlyprivate: '0',
        de: 'a@b.c'
      },
      headers: {
        'X-RapidAPI-Key': 'a6712fef88msh7f67c78baeaa13dp194b67jsn48e3040f04c0',
        'X-RapidAPI-Host': 'translated-mymemory---translation-memory.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      return response.data.responseData.translatedText;
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
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
    const translatedText = await translateText(joinedSubtitles, interpretationLanguage);
  
    // Punctuate the translatedText
    const punctuatedText = translatedText.replace(/[.,!?]\s*$/, '.');
  
    setParag(punctuatedText);
    speakText(punctuatedText, interpretationLanguage);
  
    // Send punctuatedText to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { type: 'PUNCTUATED_TEXT', punctuatedText });
    });
  };
  

  const handleInputLanguageChange = (e) => {
    setInputLanguage(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setInterpretationLanguage(e.target.value);
  };

  return (
    <div className="m-2 flex flex-col">
      <div className="text-center mt-3">
        <h3 className="text-4xl text-blue-700 font-bold">Selman</h3>
        <p className="text-gray-500">Subtitle Translator</p>
      </div>
      <div className="flex flex-col items-center justify-end p-4">
        <div className="mb-2">
          <button
            className="mr-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleSpeakText}
          >
            Speak Subtitles
          </button>
        </div>
        <div className="flex">
          <select
            className="mr-2 bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            value={inputLanguage}
            onChange={handleInputLanguageChange}
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            {/* Add more input language options as needed */}
          </select>
          <select
            className="bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            value={interpretationLanguage}
            onChange={handleLanguageChange}
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            {/* Add more output language options as needed */}
          </select>
        </div>
      </div>
    </div>
  );
  
  
}

export default Popup;