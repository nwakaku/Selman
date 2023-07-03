import React, { useState, useEffect } from "react";
import { getSubtitles } from 'youtube-caption-extractor';
import axios from 'axios';
import './popup.css';
import { useTts } from 'tts-react'
import type { TTSHookProps } from 'tts-react'



const Popup = () => {
  //something is here

  interface CustomProps extends TTSHookProps {
    highlight?: boolean,
    lang?: string,
    rate?: number,
    voice?: SpeechSynthesisVoice
  }
  
  const CustomTTSComponent = ({ children, highlight = true }: CustomProps) => {
    const { ttsChildren, state, play, stop, pause } = useTts({
      children,
      markTextAsSpoken: highlight,
      lang: interpretationLanguage === 'en' ? 'en-US' : interpretationLanguage ,
      rate: 0.8,
      voice: window.speechSynthesis.getVoices().find(voice => voice.name === 'Alex' && voice.lang === 'en-US')
    })
  
    return (
      <div>
        <>
          <button disabled={state.isPlaying} onClick={play}>Play</button>
          <button disabled={!state.isPlaying} onClick={pause}>Pause</button>
          <button onClick={stop}>Stop</button>
        </>
        {ttsChildren}
      </div>
    )
  }
  // 

  const [subtitles, setSubtitles] = useState([]);
  const [interpretationLanguage, setInterpretationLanguage] = useState('en');
  const [inputLanguage, setInputLanguage] = useState('en');
  const [parag, setParag] = useState();


  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'YOUTUBE_VIDEO_ID') {
        const videoID = message.videoID;
        console.log('Received YouTube Video ID in popup:', videoID);

        // Use the YouTube video ID in your popup script
        fetchSubtitles(videoID, inputLanguage);
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
    const encodedParams = new URLSearchParams();
    encodedParams.set('source_language', inputLanguage);
    encodedParams.set('target_language', targetLanguage);
    encodedParams.set('text', text);
  
    const options = {
      method: 'POST',
      url: 'https://text-translator2.p.rapidapi.com/translate',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': '28754cf323mshe1e49252e469ba7p199522jsnd9ee930decab',
        'X-RapidAPI-Host': 'text-translator2.p.rapidapi.com'
      },
      data: encodedParams,
    };
  
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  };
  



  const handleSpeakText = async () => {
    const joinedSubtitles = joinSubtitles(subtitles);
    const quicken = await translateText(joinedSubtitles, interpretationLanguage);
    const translatedText = quicken.data.translatedText
    console.log(translatedText);
    setParag(translatedText);
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

      <CustomTTSComponent highlight>
        <div>
          {parag}
        </div>
      </CustomTTSComponent>

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
          </select>
          <select
            className="bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            value={interpretationLanguage}
            onChange={handleLanguageChange}
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </div>
      </div>
    </div>
  );
  
  
}

export default Popup;