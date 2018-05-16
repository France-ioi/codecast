
import {Mp3Encoder} from './lame';
import {floatTo16BitPCM} from './utils';

export default function encode (audioBuffer, options, progressCallback) {
  /* XXX audioBuffer is assumed stereo */
  const {numberOfChannels, sampleRate, length} = audioBuffer;
  const outputRate = options.outputRate;
  const encoder = new Mp3Encoder(numberOfChannels, sampleRate, outputRate);
  const blockSize = 1152;
  const outputBuffers = [];
  const leftArray = new Int16Array(blockSize), leftView = new DataView(leftArray.buffer);
  const rightArray = new Int16Array(blockSize), rightView = new DataView(rightArray.buffer);
  let mp3buf, completion, lastCompletion = 0;
  for (let i = 0; i < length; i += blockSize) {
    completion = Math.min(1, Math.round(100 * i * blockSize / length) / 100);
    if (completion !== lastCompletion) {
      progressCallback(completion);
      lastCompletion = completion;
    }
    floatTo16BitPCM(leftView, 0, audioBuffer.getChannelData(0).subarray(i, i + blockSize));
    floatTo16BitPCM(rightView, 0, audioBuffer.getChannelData(1).subarray(i, i + blockSize));
    mp3buf = encoder.encodeBuffer(leftArray, rightArray);
    if (mp3buf.length > 0) {
      outputBuffers.push(mp3buf);
    }
  }
  mp3buf = encoder.flush();
  if (mp3buf.length > 0) {
    outputBuffers.push(mp3buf);
  }
  return new Blob(outputBuffers, {type: "audio/mpeg"});
}
