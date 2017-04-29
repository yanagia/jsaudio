function parseMML(smml){
  var i;
  var c;
  var len;
  var s;
  var buff;
  var bpm;
  var volume = 8;
  var tone;
  var oct = 4;
  var dnlen = 4;
  var nlen;
  var mml;
  var current;
  var track;
  var minlen = 16;

  mml = smml.toUpperCase();

  track = {};
  track.notes = [];
  track.insertNote = function(key, oct, volume, start, length){
    this.notes.push(
      {
	key : key + oct,
	volume,
	length,
	start
      });
  };

  current = 0;
  len = mml.length;
  for(i = 0; i < len; i += 1){
    c = mml.charAt(i);

    switch(c){
    case "T":
      buff = mml.slice(i+1);
      bpm = parseInt(buff, 10);
      track.bpm = bpm;
      break;
    case "L":
      buff = mml.slice(i+1);
      dnlen = parseInt(buff, 10);
      break;
    case "V":
      buff = mml.slice(i+1);
      volume = parseInt(buff, 10);
      break;
    case "@":
      // @\dにのみ対応
      s = mml.charAt(i+1);
      tone = parseInt(s, 10);
      track.tone = tone;
      break;
    case "O":
      s = mml.charAt(i+1);
      oct = parseInt(s, 10);
      break;

    case "A":
    case "B":
      s = mml.charAt(i+1);
      if(s.match(/\d/)){
	buff = mml.slice(i+1);
	nlen = parseInt(buff, 10);
      }else{
	nlen = dnlen;
      }
      nlen = minlen / nlen;
      track.insertNote(c, oct+1, volume, current, nlen);
      current += nlen;
      break;

    case "C":
    case "D":
    case "E":
    case "F":
    case "G":
      s = mml.charAt(i+1);
      if(s.match(/\d/)){
	buff = mml.slice(i+1);
	nlen = parseInt(buff, 10);
      }else{
	nlen = dnlen;
      }
      nlen = minlen / nlen;
      track.insertNote(c, oct, volume, current, nlen);
      current += nlen;
      break;

    case "R":
      s = mml.charAt(i+1);
      if(s.match(/\d/)){
	buff = mml.slice(i+1);
	nlen = parseInt(buff, 10);
      }else{
	nlen = dnlen;
      }
      nlen = minlen / nlen;
      current += nlen;
      break;

    case "<":
      oct += 1;
      break;
    case ">":
      oct -= 1;
      break;
    case ";":
      current = 0;
      break;
    }
  }

  return track;
}