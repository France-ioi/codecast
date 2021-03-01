import {floatTo16BitPCM, floatTo8BitPCM} from './utils';
import downsample from "./downsample";

// options.numChannels: 1 (mono), 2 (stereo)
// options.sampleSize: 1 (8-bit), 2 (16-bit)
// options.sampleRate: recordingSampleRate / {1,2,3,4,6}
export default function encode(audioBuffer, options, progressCallback) {
    /* Inspect audioBuffer input. */
    const {numberOfChannels, sampleRate} = audioBuffer;
    let channels = new Array(numberOfChannels);
    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber += 1) {
        channels[channelNumber] = audioBuffer.getChannelData(channelNumber);
    }
    progressCallback(0.1);

    /* Downsample if needed (integral dividers of 2-6 are supported). */
    const divider = sampleRate / options.sampleRate;
    if (divider !== 1) {
        channels = channels.map(samples => downsample(samples, divider));
    }

    progressCallback(0.2);

    /* Adapt number of channels and order samples (still using Float32Array). */
    let samples;
    switch (`${numberOfChannels}->${options.numChannels}`) {
        case '1->1':
            samples = channels[0];
            break;
        case '1->2':
            samples = interleaveSamples([channels[0], channels[0]]);
            break;
        case '2->1':
            samples = averageSamples(channels);
            break;
        case '2->2':
            samples = interleaveSamples(channels);
            break;
        default:
            throw new Error(`unsupported channels conversion`);
    }

    progressCallback(0.3);

    /* Allocate output buffer. */
    const blockAlignment = options.numChannels * options.sampleSize;
    const dataByteCount = samples.length * options.sampleSize;
    const buffer = new ArrayBuffer(44 + dataByteCount);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, "RIFF");
    /* file length */
    view.setUint32(4, buffer.byteLength - 8, true);

    /* RIFF type */
    writeString(view, 8, "WAVE");
    /* format chunk identifier */
    writeString(view, 12, "fmt ");
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count (mono) */
    view.setUint16(22, options.numChannels, true);
    /* sample rate */
    view.setUint32(24, options.sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, options.sampleRate * blockAlignment, true);
    /* block alignment */
    view.setUint16(32, blockAlignment, true);
    /* bits per sample */
    view.setUint16(34, options.sampleSize * 8, true);
    /* data chunk identifier */
    writeString(view, 36, "data");
    /* data chunk length */
    view.setUint32(40, dataByteCount, true);
    progressCallback(0.4);

    /* Encode the samples appropriately. */
    switch (options.sampleSize) {
        case 1:
            floatTo8BitPCM(view, 44, samples);
            break;
        case 2:
            floatTo16BitPCM(view, 44, samples);
            break;
    }

    progressCallback(1);

    return new Blob([buffer], {type: "audio/wav"});
}

function averageSamples(channels) {
    const samplesL = channels[0];
    const samplesR = channels[1];
    const inputLength = samplesL.length;
    const result = new Float32Array(inputLength);
    for (let index = 0; index < inputLength; index++) {
        result[index++] = (samplesL[index] + samplesR[index]) / 2;
    }

    return result;
}

function interleaveSamples(channels) {
    const samplesL = channels[0];
    const samplesR = channels[1];
    const inputLength = samplesL.length;
    const result = new Float32Array(inputLength * 2);
    let outputIndex = 0;
    for (let index = 0; index < inputLength; index++) {
        result[outputIndex++] = samplesL[index];
        result[outputIndex++] = samplesR[index];
    }

    return result;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
