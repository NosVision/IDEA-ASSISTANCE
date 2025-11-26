/**
 * Audio debugging utilities
 * Use this to check browser audio capabilities
 */

export function checkAudioSupport() {
    console.group('🎤 Audio Support Check');

    // Check MediaRecorder support
    if (!window.MediaRecorder) {
        console.error('❌ MediaRecorder is not supported');
        return;
    }
    console.log('✅ MediaRecorder is supported');

    // Check supported MIME types
    const mimeTypes = [
        'audio/wav',
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/webm;codecs=vp8',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
    ];

    console.log('\n📋 Supported MIME Types:');
    mimeTypes.forEach(type => {
        const supported = MediaRecorder.isTypeSupported(type);
        console.log(`${supported ? '✅' : '❌'} ${type}`);
    });

    // Check AudioContext support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
        console.error('❌ AudioContext is not supported');
    } else {
        console.log('\n✅ AudioContext is supported');
    }

    // Check getUserMedia support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ getUserMedia is not supported');
    } else {
        console.log('✅ getUserMedia is supported');
    }

    console.groupEnd();
}

export async function testAudioRecording() {
    console.group('🎙️ Audio Recording Test');

    try {
        // Request microphone access
        console.log('Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone access granted');

        // Determine best MIME type
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/wav')) {
            mimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        }
        console.log(`Using MIME type: ${mimeType}`);

        // Create MediaRecorder
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
                console.log(`Received audio chunk: ${e.data.size} bytes`);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            console.log(`✅ Recording complete: ${blob.size} bytes`);

            // Test decoding
            testAudioDecoding(blob);

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };

        // Record for 2 seconds
        console.log('Starting recording for 2 seconds...');
        recorder.start();

        setTimeout(() => {
            recorder.stop();
        }, 2000);

    } catch (error) {
        console.error('❌ Recording test failed:', error);
    }

    console.groupEnd();
}

async function testAudioDecoding(blob: Blob) {
    console.group('🔊 Audio Decoding Test');

    try {
        const audioContext = new AudioContext();
        const arrayBuffer = await blob.arrayBuffer();
        console.log(`Array buffer size: ${arrayBuffer.byteLength} bytes`);

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('✅ Audio decoded successfully:', {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
            length: audioBuffer.length
        });

        await audioContext.close();
    } catch (error) {
        console.error('❌ Audio decoding failed:', error);
    }

    console.groupEnd();
}
