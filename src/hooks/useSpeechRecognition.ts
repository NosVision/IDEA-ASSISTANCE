import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const useSpeechRecognition = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const silenceTimerRef = useRef<number | null>(null);
    const isRecordingRef = useRef(false);

    // Update ref when isRecording changes
    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    // Clear silence timer
    const clearSilenceTimer = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    // Start silence timer (3 seconds)
    const startSilenceTimer = useCallback(() => {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
            console.log('3 seconds of silence detected, stopping recording...');
            if (recognitionRef.current && isRecordingRef.current) {
                recognitionRef.current.stop();
            }
        }, 3000); // 3 seconds
    }, [clearSilenceTimer]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                setIsSupported(true);
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'th-TH'; // Default to Thai, but can be mixed

                recognition.onresult = (event: any) => {
                    let finalTrans = '';
                    let interimTrans = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTrans += event.results[i][0].transcript;
                        } else {
                            interimTrans += event.results[i][0].transcript;
                        }
                    }

                    if (finalTrans) {
                        setTranscript(prev => prev + (prev ? ' ' : '') + finalTrans);
                    }
                    setInterimTranscript(interimTrans);

                    // Reset silence timer on any speech
                    startSilenceTimer();
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setError(event.error);
                    setIsRecording(false);
                    clearSilenceTimer();
                };

                recognition.onend = () => {
                    setIsRecording(false);
                    clearSilenceTimer();
                };

                recognitionRef.current = recognition;
            }
        }

        return () => {
            clearSilenceTimer();
        };
    }, [startSilenceTimer, clearSilenceTimer]);

    const startRecording = useCallback(() => {
        if (recognitionRef.current && !isRecording) {
            try {
                // Clear transcript completely when starting new recording
                setTranscript('');
                setInterimTranscript('');
                setError(null);
                recognitionRef.current.start();
                setIsRecording(true);
                // Start silence timer immediately
                startSilenceTimer();
            } catch (err) {
                console.error('Failed to start recording:', err);
            }
        }
    }, [isRecording, startSilenceTimer]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            clearSilenceTimer();
        }
    }, [isRecording, clearSilenceTimer]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        isRecording,
        transcript,
        interimTranscript,
        startRecording,
        stopRecording,
        resetTranscript,
        error,
        isSupported
    };
};
