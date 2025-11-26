import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderState {
    isRecording: boolean;
    recordingTime: number;
    audioBlob: Blob | null;
}

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const onChunkRef = useRef<((blob: Blob) => void) | null>(null);

    const startRecording = useCallback(async (onChunk?: (blob: Blob) => void) => {
        try {
            onChunkRef.current = onChunk || null;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Audio Context for visualization
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;


            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            // Check supported mime types
            const mimeType = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4'
            ].find(type => MediaRecorder.isTypeSupported(type)) || '';

            console.log('Using MIME type:', mimeType);

            const options = mimeType ? { mimeType } : undefined;

            // Setup MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];


            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                    // Emit chunk for real-time processing
                    if (onChunkRef.current) {
                        onChunkRef.current(e.data);
                    }
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
                setAudioBlob(blob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Cleanup audio context
                if (audioContextRef.current?.state !== 'closed') {
                    audioContextRef.current?.close();
                }
            };

            // Request data every 1 second for real-time feedback
            mediaRecorder.start(1000);
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    return {
        isRecording,
        recordingTime,
        audioBlob,
        startRecording,
        stopRecording,
        analyser: analyserRef.current
    };
};
