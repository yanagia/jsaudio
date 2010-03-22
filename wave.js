function createSquareSignal(t, sinF){
  var i;
  var signals, sig, phase, hz;

  hz = 44100;
  phase = 0;
  t = Math.round(t*hz);
  var freq = sinF * 2.0 * Math.PI / hz;
  signals = "";

  for(i = 0; i < t; i++){
    sig = Math.sin(phase);
    sig = sig > 0 ? 255 : 0;
    signals += String.fromCharCode(sig);

    phase += freq;
  };

  // ぶち切れノイズ対策 -> 今は矩形波なのでやっていない
  var s;
  var head = "";
  var foot = "";

  return head + signals + foot;
}

function createSawSignal(duration, f){
  var i, t;
  var signals, sig, phase, hz;

  hz = 44100;
  phase = 0;
  t = Math.round(duration*hz);
//   var freq = f * 2.0 * Math.PI / hz;
  var freq, sum;
  freq = hz / f;
  signals = "";
  sum = 0.0;
  for(i = 0; i < t; i++){

    if(phase > freq){
      phase -= freq;
    }
    sig = phase / freq * 255;
    signals += String.fromCharCode(sig);

    phase += 1;
  }

  return signals;
}

function createRawSawSignal(duration, f){
  var i, t;
  var signals, sig, phase, hz;

  hz = 44100;
  phase = 0;
  t = Math.round(duration*hz);
//   var freq = f * 2.0 * Math.PI / hz;
  var freq, sum;
  freq = hz / f;
  signals = new Array(t);
  sum = 0.0;
  for(i = 0; i < t; i++){

    if(phase > freq){
      phase -= freq;
    }
    sig = phase / freq * 255;
    signals[i] = Math.ceil(sig * 0.2);

    phase += 1;
  }

  return signals;
}

function convertToURL(signals){
  var header;

  header = "WAVEfmt " + String.fromCharCode(16, 0, 0, 0);
  header += String.fromCharCode(1, 0); // format id
  header += String.fromCharCode(1, 0); // channels
  header += String.fromCharCode(68, 172, 0, 0); // sampling rate
  header += String.fromCharCode(68, 172, 0, 0); // byte/sec
  header += String.fromCharCode(1, 0); // block size
  header += String.fromCharCode(8, 0); // byte/sample
  header += "data";		       // data chunk label

  var siglen = signals.length;
  var sigsize;

  sigsize = String.fromCharCode((siglen >> 0 & 0xFF),
				(siglen >> 8 & 0xFF),
				(siglen >> 16 & 0xFF),
				(siglen >> 24 & 0xFF));

  header += sigsize;
  // ここまで36バイト
  var wavlen = header.length + signals.length;
  var riff = "RIFF";
  
  riff += String.fromCharCode((wavlen >> 0 & 0xFF),
			      (wavlen >> 8 & 0xFF),
			      (wavlen >> 16 & 0xFF),
			      (wavlen >> 24 & 0xFF));
 
  var wavefile = riff + header + signals;
  var encodedata = Base64.encode(wavefile);
  var dataurl = "data:audio/wav;base64," + encodedata;

  return dataurl;
};
