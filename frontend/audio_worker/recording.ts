import AudioBuffer from 'audio-buffer';

/* Object used for recording, with an interface close to AudioBuffer */
export default class Recording {
    numberOfChannels = 0;
    sampleRate = 0;
    duration = 0;
    length = 0;
    channels = [];

    constructor({numberOfChannels, sampleRate}) {
        this.numberOfChannels = numberOfChannels;
        this.sampleRate = sampleRate;
        this.duration = 0;
        this.length = 0;
        this.channels = new Array(numberOfChannels);

        for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber += 1) {
            this.channels[channelNumber] = {chunks: []};
        }
    }

    stats() {
        const {numberOfChannels, sampleRate, duration, length, channels} = this;

        return {
            numberOfChannels, sampleRate, duration, length,
            channels: channels.map(({chunks}) => ({chunks: chunks.length}))
        };
    };

    getAudioBuffer(progressCallback): AudioBuffer {
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
    }

    /* Add samples to the recording.
       The samples are passed as an array holding, for each channel, a Float32Array
       chunk of samples.  All chunks passed together must have the same length.
     */
    addSamples(samples) {
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
    }

    /* Truncate the recording at the given position (expressed in seconds).
       Returns true if the recording was truncated, false if it is unchanged. */
    truncateAt(position) {
        const {sampleRate, numberOfChannels, channels} = this;
        const truncPos = Math.round(position * sampleRate);
        const chunks = channels[0].chunks;
        let startPos = 0;
        for (let iChunk = 0; iChunk < chunks.length; iChunk += 1) {
            const chunk = chunks[iChunk];
            const endPos = startPos + chunk.length;
            if (truncPos <= endPos) {
                /* Trim current chunk if needed. */
                const posInChunk = truncPos - startPos;
                if (posInChunk < chunk.length) {
                    for (let iChannel = 0; iChannel < numberOfChannels; iChannel += 1) {
                        channels[iChannel].chunks[iChunk] = channels[iChannel].chunks[iChunk].slice(0, posInChunk);
                    }
                }

                /* Trim immediately past current chunk. */
                for (let iChannel = 0; iChannel < numberOfChannels; iChannel += 1) {
                    channels[iChannel].chunks.splice(iChunk + 1);
                }

                /* Update length and duration. */
                this.length = truncPos;
                this.duration = truncPos / sampleRate;

                return true;
            }

            startPos = endPos;
        }

        return false;
    }
}
