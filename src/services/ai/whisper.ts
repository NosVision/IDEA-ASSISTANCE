import { pipeline, env } from '@xenova/transformers';

// Skip local model checks to avoid "Unexpected token <" errors (Vite returning index.html)
env.allowLocalModels = false;
env.useBrowserCache = false;

export class OfflineWhisperService {
    private static transcriber: any = null;
    private static isInitializing = false;
    private static initPromise: Promise<void> | null = null;

    static async initialize(onProgress?: (progress: number) => void) {
        if (this.transcriber) {
            if (onProgress) onProgress(100);
            return;
        }
        if (this.isInitializing && this.initPromise) {
            return this.initPromise;
        }

        this.isInitializing = true;
        this.initPromise = (async () => {
            try {
                console.log('Initializing Whisper...');
                if (onProgress) onProgress(10); // Started

                this.transcriber = await pipeline(
                    'automatic-speech-recognition',
                    'Xenova/whisper-tiny',
                    {
                        quantized: true,
                        progress_callback: (data: any) => {
                            // Calculate progress based on download status
                            if (data.status === 'progress' && onProgress) {
                                // Map download progress (0-100) to overall progress (10-90)
                                const overallProgress = 10 + (data.progress || 0) * 0.8;
                                onProgress(Math.round(overallProgress));
                            }
                        }
                    }
                );

                console.log('Whisper initialized successfully');
                if (onProgress) onProgress(100); // Complete
            } catch (error) {
                console.error('Failed to initialize Whisper:', error);
                this.transcriber = null;
                throw error;
            } finally {
                this.isInitializing = false;
            }
        })();

        return this.initPromise;
    }

    static async transcribe(input: Blob | Float32Array): Promise<string> {
        // Ensure initialized
        if (!this.transcriber) {
            console.log('Transcriber not initialized, initializing now...');
            await this.initialize();
        }

        try {
            let audioData: Float32Array;

            if (input instanceof Blob) {
                console.log('Processing audio blob:', {
                    size: input.size,
                    type: input.type
                });

                if (input.size === 0) {
                    throw new Error('Audio blob is empty');
                }

                // Convert Blob to Float32Array
                const audioContext = new AudioContext();
                const arrayBuffer = await input.arrayBuffer();

                console.log('Array buffer size:', arrayBuffer.byteLength);

                let audioBuffer;
                try {
                    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    console.log('Audio decoded successfully:', {
                        duration: audioBuffer.duration,
                        sampleRate: audioBuffer.sampleRate,
                        numberOfChannels: audioBuffer.numberOfChannels
                    });
                } catch (decodeError) {
                    console.error('Failed to decode audio data:', decodeError);
                    throw new Error('Failed to decode audio. The audio format may not be supported.');
                }

                audioData = audioBuffer.getChannelData(0);

                // Resample to 16000Hz if needed
                if (audioBuffer.sampleRate !== 16000) {
                    console.log(`Resampling from ${audioBuffer.sampleRate}Hz to 16000Hz`);
                    const offlineContext = new OfflineAudioContext(
                        1,
                        Math.ceil(audioBuffer.duration * 16000),
                        16000
                    );
                    const source = offlineContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(offlineContext.destination);
                    source.start();
                    const resampledBuffer = await offlineContext.startRendering();
                    audioData = resampledBuffer.getChannelData(0);
                    console.log('Resampling complete');
                }

                // Close audio context
                await audioContext.close();
            } else {
                audioData = input;
                console.log('Using provided Float32Array, length:', audioData.length);
            }

            // Check if audio data is valid
            if (audioData.length === 0) {
                throw new Error('Audio data is empty');
            }

            console.log('Starting transcription with Whisper...');
            // Transcribe
            const result = await this.transcriber(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5
            });

            console.log('Transcription result:', result);
            const transcribedText = result.text || '';
            console.log('Transcribed text:', transcribedText);
            return transcribedText;

        } catch (error) {
            console.error('Transcription error:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to transcribe audio: ${error.message}`);
            }
            throw new Error('Failed to transcribe audio. Please try again.');
        }
    }
}
