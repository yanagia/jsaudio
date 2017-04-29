var Score;
var Player;
var minlen = 16;

window.onload = () => {
  init();

//   var track = parseMML("t60l16 @3 o4 cdefedc8 efgagfe8 c4 c4 c4 c4 ccddeeffe8d8c4; t60l16 @3 o4 r2 cdefedc8 efgagfe8 c4 c4 c4 eeffe8d8c4; t60l16 @3 o5 r1 cdefedc8 efgagfe8 c4 eeffe8d8c4");
//   var note;

//   for(var i = 0; i < track.notes.length; i++){
//     note = track.notes[i];
//     addNote(note.key, note.start, note.length);
//   }
//   Score.bpm = track.bpm;

};

function parseInput(){
  init();

  var mml = document.getElementById("mml");
  var track = parseMML(mml.value);
  var note;

  for(var i = 0; i < track.notes.length; i++){
    note = track.notes[i];
    addNote(note.key, note.start, note.length);
  }
  Score.bpm = track.bpm;
}

function init(){
  Score = {
    bpm : 320,
    bpb : 4, 			// bar per beat
    notes : []
  };

  Player = {
    currentBar : 0,
    timer : null,
    renderBuffer : [],
    renderStream : document.getElementById("audioStream")
  };

  Player.pitchList = createPitchList();
}

function createPitchList(){
  var base = {
    "Cd" : 261.6/4, "Cd#" : 277.2/4, "Dd" : 293.7/4, "Dd#" : 311.1/4,
    "Ed" : 329.6/4, "Fd" : 349.2/4, "Fd#" : 370.0/4, "Gd" : 392.0/4,
    "Gd#" : 415.3/4, "Ad" : 440.0/8, "Ad#" : 466.2/8, "Bd" : 493.9/8
  };

  var pitchList = {
    "A1" :  440.0/8 , "A1#" : 466.2/8 , "B1" : 493.9/8,
    "C1" : 261.6/4, "C1#" : 277.2/4, "D1" : 293.7/4, "D1#" : 311.1/4,
    "E1" : 329.6/4, "F1" : 349.2/4, "F1#" : 370.0/4, "G1" : 392.0/4,
    "G1#" : 415.3/4
  };

  var h;
  for(h = 2; h < 8; h++){
    for(var i in base){
      pitchList[i.replace("d", h.toString(10))] = 
	pitchList[i.replace("d", (h-1).toString(10))] * 2;
    }
  }

  return pitchList;
}

function addNote(key, sb, eb){
  var arr = Score.notes;

  arr.push({
	     start : sb,
	     end : eb+sb,
	     key
	   });
}

function convertToPitch(key){
  var f = Player.pitchList[key];

  if(f) return f;
  else return 220.0;
}

function setUserCode(){
  var code = document.getElementById("usercode").value;

  try{
    Player.userCode = new Function(code);
    return true;
  }catch(e){
    alert(e);
    console.log(e);
    return false;
  }
}

function createSignal(duration, pitch){
  try{
    var signal = Player.userCode(duration, pitch);
  }catch(e){
    stop();
    alert("波形を生成する関数に誤りがあります。");
    console.log(e);
  }
//   var binary = "";
//   var i, len = signal.length;
//   for(i = 0; i < signal.length; i++){
//     binary += String.fromCharCode(signal[i]);
//   }
//   return binary;
  return signal;
}

function play(){
  parseInput();
  if(! setUserCode()) return;
  Player.currentBar = 0;

  Score.notes.sort(
    (a, b) => a.start - b.start);

  var lastNote = Score.notes[Score.notes.length-1];
  Player.endTime = lastNote.end;

  Player.timer = setInterval(renderBar, 
			     1000 * ((60.0 / Score.bpm) / (minlen / 4)));

}

function stop(){
  clearInterval(Player.timer);

  var ndlist = Player.renderStream.childNodes;
  var i;
  var len;
  len = ndlist.length;
  for(i = 0; i < ndlist.length; i++){
    ndlist[i].pause();
    Player.renderStream.removeChild(ndlist[i]);
  }
}

function renderingStart(){
  parseInput();
  if(! setUserCode()) return;
  setTimeout(renderingAll, 1);
}

function renderingAll(){
  var i;
  var len;
  var notes;
  var currentBar;
  var signal;
  var audio;
  var url;
  var baseSignal;
  var totalFrame;

  Score.notes.sort(
    (a, b) => a.start - b.start);

  var lastNote = Score.notes[Score.notes.length-1];
  Player.endTime = lastNote.end + minlen;

  notes = Score.notes;
  len = notes.length;
  totalFrame = Player.endTime * ((60.0 / Score.bpm) / (minlen / 4)) * 44100;
  baseSignal = new Array(totalFrame);
  for(i = 0; i < totalFrame; i++){
    baseSignal[i] = 0;
  }

  for(i = 0; i < len; i++){
    signal = createSignal(
      ((60.0 / Score.bpm) / (minlen / 4)) * 
	(notes[i].end - notes[i].start), 
      convertToPitch(notes[i].key));
    signal = signal.map(item => item * 0.3);
    mixSignal(baseSignal, signal, ((60.0 / Score.bpm) / (minlen / 4)) * notes[i].start * 44100);
  }

  var binary;
  binary = convertToBinary(baseSignal);
  url = convertToURL(binary);
  audio = new Audio(url);
  Player.renderStream.appendChild(audio);
  audio.volume = 0.30;
  Player.renderBuffer = [audio];

  audio.play();
}

function convertToBinary(signal){
  var binary = "";
  var i;
  var len;
  len = signal.length;
  for(i = 0; i < len; i++){
    if(signal[i] > 255){
      binary += String.fromCharCode(255);
    }
    else binary += String.fromCharCode(signal[i]);
  }
  return binary;
}

// *(s1+offset)++ = *s2++
function mixSignal(s1, s2, offset){
  var i;
  var len;
  len = s2.length;
  for(i = 0; i < len; i++){
    s1[i+offset] = s1[i+offset] + s2[i];
  }
}

function renderBar(){
  var i;
  var len;
  var notes;
  var currentBar;
  var signal;
  var audio;
  var url;

  currentBar = Player.currentBar;
  notes = Score.notes;
  len = notes.length;

  if(currentBar > Player.endTime){
    stop();
    return;
  }

  for(i = 0; i < len; i++){
    if(notes[i].start == currentBar){
      signal = createSignal(
	((60.0 / Score.bpm) / (minlen / 4)) * 
	(notes[i].end - notes[i].start) - 0.0001, 
// 	  * 60 / Score.bpm - 0.01, 
	convertToPitch(notes[i].key));
      url = convertToURL(convertToBinary(signal));
      audio = new Audio(url);
      Player.renderStream.appendChild(audio); // ここでロードがはじまる
      notes[i].audio = audio;
      audio.volume = 0.05;
      Player.renderBuffer.push(audio); // 再生バッファにためる

      document.getElementById(notes[i].key.charAt(0))
	.style.backgroundColor = "#6666ff";  // 色をつけるコード
    }else if(notes[i].end == currentBar){
      if(notes[i].audio){
	// release audio
	notes[i].audio.pause();
	Player.renderStream.removeChild(notes[i].audio);
	notes[i].audio = null;	// 参照を切る。これでGCされるはず。

      document.getElementById(notes[i].key.charAt(0))
	.style.backgroundColor = "#ffffff";  // 色を消すコード	
      }
    }
  }
  setTimeout(playBuffer, 10);

  Player.currentBar += 1;
}

// 再生バッファに溜まっているものを再生
function playBuffer(){
  var i;
  var len;
  len = Player.renderBuffer.length;
  for(i = 0; i < len; i++){
    Player.renderBuffer[i].play();
  }
  Player.renderBuffer = [];	// バッファをクリア
}