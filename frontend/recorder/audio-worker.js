'use strict';
/*
  This file is based on https://github.com/Khan/MultiRecorderJS,
  itself based on https://github.com/mattdiamond/Recorderjs

  This is the Web Worker that processes messages from audio.js.
  This worker is responsible for building up buffers from an audio stream,
  turning those into WAV file URLs when requested.
  This worker can also paste together multiple WAV files (identified by their
  URL) and return a new WAV file URL.
  This work is done inside a worker to avoid blocking the main browser loop
  during encoding.


  TODO: integrate https://www.npmjs.com/package/lamejs

*/

// List of chunks for the current recording. Each chunk is a Float32Array.
var chunksL = [];
var chunksR = [];

// Configured sample rate, stored in the WAV files produced.
var recordingSampleRate;

// Map each WAV file URL to its samples, in order to assemble a new file
// from multiple recordings.
var recordings = {};

self.onmessage = function(e) {
  switch (e.data.command) {
    case "init":
      init(e.data.config);
      break;
    case "record":
      record(e.data.buffer);
      break;
    case "finishRecording":
      var url = finishRecording();
      sendMessage(e, {url: url});
      break;
    case "combineRecordings":
      var result = combineRecordings(e.data.recordings, e.data.options);
      sendMessage(e, result);
      break;
    case "getRecording":
      var recording = recordings[e.data.recording];
      sendMessage(e, recording && recording.wav);
      break;
    case "clearRecordings":
      clearRecordings();
      sendMessage(e, {});
      break;
  }
};

function init (config) {
  recordingSampleRate = config.sampleRate;
}

// Add a chunk to the current recording.
function record (input) {
  chunksL.push(input[0]);
  chunksR.push(input[1]);
}

function clearRecordings () {
  for (var url in recordings) {
    var recording = recordings[url];
    if ('url' in recording)
      URL.revokeObjectURL(recording.url);
  }
  recordings = {};
}

function finishRecording () {
  var samplesL = combineChunks(chunksL);
  chunksL = [];
  var samplesR = combineChunks(chunksR);
  chunksR = [];
  var channels = [samplesL, samplesR];
  var encodingOptions = {numChannels: 1, sampleSize: 1, sampleRate: recordingSampleRate};
  var wav = encodeWav(channels, encodingOptions);
  var url = URL.createObjectURL(wav);
  recordings[url] = {wav: wav, url: url, channels: channels};
  return url;
}

function combineRecordings (urls, options) {
  // Combine the interleaved samples from the listed recordings.
  var chunksL = [], chunksR = [];
  for (var i = 0; i < urls.length; i += 1) {
    var url = urls[i];
    if (url in recordings) {
      var recording = recordings[url];
      chunksL.push(recording.channels[0]);
      chunksR.push(recording.channels[1]);
    }
  }
  var samplesL = combineChunks(chunksL);
  var samplesR = combineChunks(chunksR);
  var channels = [samplesL, samplesR];
  var wav = encodeWav(channels, options);
  return {wav: wav};
}

function averageSamples (channels) {
  var samplesL = channels[0];
  var samplesR = channels[1];
  if (samplesL.length != samplesR.length)
    throw "cannot average samples of different length";
  var inputLength = samplesL.length;
  var result = new Float32Array(inputLength);
  var index = 0;
  var inputIndex = 0;
  while (inputIndex < inputLength) {
    result[index++] = (samplesL[inputIndex] + samplesR[inputIndex]) / 2;
    inputIndex++;
  }
  return result;
}

function interleaveSamples (channels) {
  var samplesL = channels[0];
  var samplesR = channels[1];
  if (samplesL.length != samplesR.length)
    throw "cannot interleave samples of different length";
  var inputLength = samplesL.length;
  var result = new Float32Array(inputLength * 2);
  var index = 0;
  var inputIndex = 0;
  while (inputIndex < inputLength) {
    result[index++] = samplesL[inputIndex];
    result[index++] = samplesR[inputIndex];
    inputIndex++;
  }
  return result;
}

function combineChunks (chunks) {
  var totalLength = 0;
  for (var i = 0; i < chunks.length; i++)
    totalLength += chunks[i].length;
  var result = new Float32Array(totalLength);
  var offset = 0;
  for (i = 0; i < chunks.length; i++) {
    result.set(chunks[i], offset);
    offset += chunks[i].length;
  }
  return result;
}

function sendMessage (e, result) {
  self.postMessage({callbackId: e.data.callbackId, result: result});
}

function floatTo16BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function floatTo8BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 1) {
    var s = (Math.max(-1, Math.min(1, input[i])) + 1.0) / 2;
    output.setInt8(offset, s * 0xFF, true);
  }
}

function writeString (view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function FIR (coeffs) {
  this.coeffs = coeffs;
  this.nCoeffs = coeffs.length;
  this.registers = new Float32Array(this.nCoeffs);
  this.iTopReg = this.nCoeffs - 1;
}
FIR.prototype.sampleIn = function (sample) {
  var i = this.iTopReg;
  i += 1;
  if (i >= this.nCoeffs)
    i = 0;
  this.registers[i] = sample;
  this.iTopReg = i;
};
FIR.prototype.sampleOut = function () {
  var sample = 0.0, iCoeff = 0;
  for (var iReg = this.iTopReg; iReg >= 0; iReg--)
    sample += this.coeffs[iCoeff++] * this.registers[iReg];
  for (iReg = this.nCoeffs - 1; iReg > this.iTopReg; iReg--)
    sample += this.coeffs[iCoeff++] * this.registers[iReg];
  return sample;
};

function downsample (samples, fir, stride) {
  var nCoeffs = fir.nCoeffs;
  var iSampleIn = 0;
  for (var i = 0; i < nCoeffs; i++)
    fir.sampleIn(samples[iSampleIn++]);
  var iSampleOut = 0;
  var samplesOut = new Float32Array(samples.length / stride);
  var nth = 0;
  while (iSampleIn < samples.length) {
    if (nth === 0)
      samplesOut[iSampleOut++] = fir.sampleOut();
    if (++nth == stride) nth = 0;
    fir.sampleIn(samples[iSampleIn++]);
  }
  while (iSampleOut < samplesOut.length) {
    samplesOut[iSampleOut++] = fir.sampleOut();
    fir.sampleIn(0);
  }
  return samplesOut;
}

// Source http://www.arc.id.au/FilterDesign.html
var FIR_48k_8k = [-0.000000, -0.000684, -0.001238, 0.000000, 0.003098, 0.004522, -0.000000, -0.008736, -0.011729, 0.000000, 0.020268, 0.026356, -0.000000, -0.045082, -0.060638, 0.000000, 0.133528, 0.273491, 0.333333, 0.273491, 0.133528, 0.000000, -0.060638, -0.045082, -0.000000, 0.026356, 0.020268, 0.000000, -0.011729, -0.008736, -0.000000, 0.004522, 0.003098, 0.000000, -0.001238, -0.000684, -0.000000];
var FIR_48k_12k = [0.000000, 0.000790, -0.000000, -0.002338, 0.000000, 0.005222, -0.000000, -0.010087, 0.000000, 0.017899, -0.000000, -0.030433, 0.000000, 0.052057, -0.000000, -0.098769, 0.000000, 0.315800, 0.500000, 0.315800, 0.000000, -0.098769, -0.000000, 0.052057, 0.000000, -0.030433, -0.000000, 0.017899, 0.000000, -0.010087, -0.000000, 0.005222, 0.000000, -0.002338, -0.000000, 0.000790, 0.000000];
var FIR_48k_16k = [-0.000000, -0.000684, 0.001238, -0.000000, -0.003098, 0.004522, -0.000000, -0.008736, 0.011729, -0.000000, -0.020268, 0.026356, -0.000000, -0.045082, 0.060638, -0.000000, -0.133528, 0.273491, 0.666667, 0.273491, -0.133528, -0.000000, 0.060638, -0.045082, -0.000000, 0.026356, -0.020268, -0.000000, 0.011729, -0.008736, -0.000000, 0.004522, -0.003098, -0.000000, 0.001238, -0.000684, -0.000000];
var FIR_48k_24k = [0.5, 0.5]; // also try [0,1,0]

function encodeWav (channels, options) {
  // options.numChannels: 1 (mono), 2 (stereo)
  // options.sampleSize: 1 (8-bit), 2 (16-bit)
  // options.sampleRate: recordingSampleRate / {1,2,3,4,6}

  // Select sensible options if not provided.
  if (!options) {
    if (recordingSampleRate == 48000)
      options = {numChannels: 1, sampleSize: 2, sampleRate: 8000};
    else
      options = {numChannels: 1, sampleSize: 1, sampleRate: recordingSampleRate};
  }

  // Downsample.
  var div = recordingSampleRate / options.sampleRate;
  var int_div = Math.round(div);
  var err = Math.abs(div - int_div);
  if (err > 1e-6) return "cannot downsample by " + div;
  switch (int_div) {
    case 1:
      break;
    case 2:
      channels = channels.map(function (samples) {
        return downsample(samples, new FIR(FIR_48k_24k), 2);
      });
      break;
    case 3:
      channels = channels.map(function (samples) {
        return downsample(samples, new FIR(FIR_48k_16k), 3);
      });
      break;
    case 4:
      channels = channels.map(function (samples) {
        return downsample(samples, new FIR(FIR_48k_12k), 4);
      });
      break;
    case 6:
      channels = channels.map(function (samples) {
        return downsample(samples, new FIR(FIR_48k_8k), 6);
      });
      break;
    default:
      return "cannot downsample by " + int_div;
  }

  // Interleave or average samples depending on the number of output channels.
  var samples = options.numChannels == 2 ? interleaveSamples(channels) : averageSamples(channels);

  var blockAlignment = options.numChannels * options.sampleSize;
  var dataByteCount = samples.length * blockAlignment;
  var buffer = new ArrayBuffer(44 + dataByteCount);
  var view = new DataView(buffer);

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

  switch (options.sampleSize) {
    case 1: floatTo8BitPCM(view, 44, samples); break;
    case 2: floatTo16BitPCM(view, 44, samples); break;
  }

  return new Blob([buffer], {type: "audio/wav"});
}

self.postMessage('loaded');
