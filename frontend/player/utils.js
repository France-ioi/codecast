

function zeroPad2 (n) {
  return ('0'+n).slice(-2);
}

export function formatTime (ms) {
  let s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  s -= m * 60;
  return zeroPad2(m) + ':' + zeroPad2(s);
};
