
/* Performs downsampling by an integral amount (2 to 6) with low-pass filter. */
export default function downsample (samples, divider) {
  const fir = getFIR(divider);
  const samplesOut = new Float32Array(Math.round(samples.length / divider));
  let iSampleIn = 0, iSampleOut = 0, counter = 0;
  while (iSampleOut < samplesOut.length) {
    // Input a sample
    if (iSampleIn < samples.length) {
      fir.sampleIn(samples[iSampleIn++]);
    } else {
      fir.sampleIn(0);
    }
    // Time to output a sample?
    ++counter;
    if (counter === divider) {
      counter = 0;
      samplesOut[iSampleOut++] = fir.sampleOut();
    }
  }
  return samplesOut;
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

/*
  Returns low-pass filter cut-off frequency (sample frequency)/(divider).
  Coefficients computed with http://www.arc.id.au/FilterDesign.html
  (37 samples, 60dB attenuation)
*/
function getFIR (divider) {
  switch (divider) {
    case 2: return new FIR([0.5, 0.5]); // average; actual FIR coeffs [0,1,0]
    case 3: return new FIR([-0.000000, -0.000684, 0.001238, -0.000000, -0.003098, 0.004522, -0.000000, -0.008736, 0.011729, -0.000000, -0.020268, 0.026356, -0.000000, -0.045082, 0.060638, -0.000000, -0.133528, 0.273491, 0.666667, 0.273491, -0.133528, -0.000000, 0.060638, -0.045082, -0.000000, 0.026356, -0.020268, -0.000000, 0.011729, -0.008736, -0.000000, 0.004522, -0.003098, -0.000000, 0.001238, -0.000684, -0.000000]);
    case 4: return new FIR([0.000000, 0.000790, -0.000000, -0.002338, 0.000000, 0.005222, -0.000000, -0.010087, 0.000000, 0.017899, -0.000000, -0.030433, 0.000000, 0.052057, -0.000000, -0.098769, 0.000000, 0.315800, 0.500000, 0.315800, 0.000000, -0.098769, -0.000000, 0.052057, 0.000000, -0.030433, -0.000000, 0.017899, 0.000000, -0.010087, -0.000000, 0.005222, 0.000000, -0.002338, -0.000000, 0.000790, 0.000000]);
    case 5: return new FIR([-0.000212, 0.000464, 0.001360, -0.000000, -0.003402, -0.003069, 0.004324, 0.009594, -0.000000, -0.017023, -0.013756, 0.017888, 0.037672, -0.000000, -0.066591, -0.058055, 0.090628, 0.300344, 0.400000, 0.300344, 0.090628, -0.058055, -0.066591, -0.000000, 0.037672, 0.017888, -0.013756, -0.017023, -0.000000, 0.009594, 0.004324, -0.003069, -0.003402, -0.000000, 0.001360, 0.000464, -0.000212]);
    case 6: return new FIR([-0.000000, -0.000684, -0.001238, 0.000000, 0.003098, 0.004522, -0.000000, -0.008736, -0.011729, 0.000000, 0.020268, 0.026356, -0.000000, -0.045082, -0.060638, 0.000000, 0.133528, 0.273491, 0.333333, 0.273491, 0.133528, 0.000000, -0.060638, -0.045082, -0.000000, 0.026356, 0.020268, 0.000000, -0.011729, -0.008736, -0.000000, 0.004522, 0.003098, 0.000000, -0.001238, -0.000684, -0.000000]);
    default: throw new Error(`unsupported divider (${divider})`);
  }
}
