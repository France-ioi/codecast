
import AudioBuffer from 'audio-buffer';

/* Object used for recording, with an interface close to AudioBuffer */
export default function Recording ({numberOfChannels, sampleRate}) {
  this.numberOfChannels = numberOfChannels;
  this.sampleRate = sampleRate;
  this.duration = 0;
  this.length = 0;
  this.channels = new Array(numberOfChannels);
  for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber += 1) {
    this.channels[channelNumber] = {chunks: []};
  }
}

Recording.prototype.getAudioBuffer = function (progressCallback) {
  const {length, sampleRate, numberOfChannels, channels} = this;
  const audioBuffer = new AudioBuffer({length, sampleRate, numberOfChannels});
  const samplesToCopy = length * numberOfChannels;
  let samplesCopied = 0;
  for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber += 1) {
    let position = 0;
    for (let chunk of channels[channelNumber].chunks) {
      audioBuffer.copyToChannel(chunk, channelNumber, position);
      position += chunk.length;
      samplesCopied += chunk.length
      if (typeof progressCallback === 'function') {
        progressCallback(samplesCopied / samplesToCopy);
      }
    }
  }
  return audioBuffer;
};

/* Add samples to the recording.
   The samples are passed as an array holding, for each channel, a Float32Array
   chunk of samples.  All chunks passed together must have the same length.
 */
Recording.prototype.addSamples = function (samples) {
  console.log('addSamples', samples);
  const {numberOfChannels, channels} = this;
  const chunkLength = samples[0].length;
  for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber += 1) {
    if (samples[channelNumber].length !== chunkLength) {
      throw new Error('inconsistent chunk lengths');
    }
    channels[channelNumber].chunks.push(samples[channelNumber]);
  }
  this.length += chunkLength;
  this.duration = this.length / this.sampleRate;
  return true;
};

/* Truncate the recording at the given position (expressed in seconds).
   Returns true if the recording was truncated, false if it is unchanged. */
Recording.prototype.truncateAt = function (position) {
  const {sampleRate, length, numberOfChannels, channels} = this;
  const truncPos = Math.round(position * sampleRate);
  let chunkStart = 0, iChunk = 0, truncated = false;
  while (iChunk < length) {
    const chunkEnd = chunkStart + channels[iChunk].length;
    if (chunkEnd >= truncPos) {
      // Trim current chunk if needed.
      const posInChunk = truncPos - chunkStart;
      if (posInChunk < chunksL.length) {
        chunksL[iChunk] = chunksL[iChunk].slice(0, posInChunk);
        chunksR[iChunk] = chunksR[iChunk].slice(0, posInChunk);
      }
      // Trim immediately past current cunk.
      chunksL.splice(iChunk + 1);
      chunksR.splice(iChunk + 1);
      chunkStart += chunksL[iChunk].length;
      truncated = true;
      break;
    }
    iChunk += 1;
    chunkStart = chunkEnd;
  }
  return truncated;
};
