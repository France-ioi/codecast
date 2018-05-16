
export function floatTo16BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

export function floatTo8BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 1) {
    var s = (Math.max(-1, Math.min(1, input[i])) + 1.0) / 2;
    output.setInt8(offset, s * 0xFF, true);
  }
}
