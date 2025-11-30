
import { useState, useEffect, useCallback, useRef } from 'react';

// Define SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    onerror: (event: any) => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const useSpeechRecognition = (language: string = 'en') => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [hasSupport, setHasSupport] = useState(false);
    
    // Use ref to keep track of recognition instance to avoid stale closures
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognitionCtor) {
            setHasSupport(true);
            const recognitionInstance = new SpeechRecognitionCtor();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = language === 'ru' ? 'ru-RU' : 'en-US';

            recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognitionInstance.onerror = (event: any) => {
                // Extract the specific error code (e.g., 'not-allowed', 'no-speech')
                const errorMsg = event.error || 'Unknown error';
                console.warn("Speech Recognition Status:", errorMsg);
                
                // Don't treat 'no-speech' as a critical error, just a timeout
                if (errorMsg !== 'no-speech') {
                    setError(errorMsg);
                }
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognitionInstance;
        } else {
            setHasSupport(false);
            setError("Browser does not support Speech Recognition");
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [language]);

    const startListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition) {
            try {
                // Reset previous state
                setTranscript('');
                setError(null);
                
                // Attempt to start
                recognition.start();
                setIsListening(true);
            } catch (e) {
                console.warn("Speech recognition already active or failed to start:", e);
                // If it's already started, we just update state to match
                setIsListening(true);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.warn("Failed to stop recognition:", e);
            }
            setIsListening(false);
        }
    }, []);

    return { isListening, transcript, startListening, stopListening, error, hasSupport };
};
