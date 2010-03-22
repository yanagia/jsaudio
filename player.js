var Score, Player;
var minlen = 16;

window.onload = function(){
  init();

  var track = parseMML("t60l16 @3 o4 cdefedc8 efgagfe8 c4 c4 c4 c4 ccddeeffe8d8c4; t60l16 @3 o4 r2 cdefedc8 efgagfe8 c4 c4 c4 eeffe8d8c4; t60l16 @3 o5 r1 cdefedc8 efgagfe8 c4 eeffe8d8c4");
  var note;

  for(var i = 0; i < track.notes.length; i++){
    note = track.notes[i];
    addNote(note.key, note.start, note.length);
  }
  Score.bpm = track.bpm;

};

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
	     key : key
	   });
}

function convertToPitch(key){
  var f = Player.pitchList[key];

  if(f) return f;
  else return 220.0;
}

function play(){
  Player.currentBar = 0;

  Score.notes.sort(
    function (a, b){
      return a.start - b.start;
    });

  var lastNote = Score.notes[Score.notes.length-1];
  Player.endTime = lastNote.end + minlen;

  Player.timer = setInterval(renderBar, 
			     1000 * ((60.0 / Score.bpm) / (minlen / 4)));

}

function stop(){
  clearInterval(Player.timer);

  var ndlist = Player.renderStream.childNodes;
  var i, len;
  len = ndlist.length;
  for(i = 0; i < ndlist.length; i++){
    ndlist[i].pause();
    Player.renderStream.removeChild(ndlist[i]);
  }
}

function renderBar(){
  var i, len, notes, currentBar;
  var signal, audio, url;

  currentBar = Player.currentBar;
  notes = Score.notes;
  len = notes.length;

  if(currentBar > Player.endTime){
    stop();
    return;
  }

  for(i = 0; i < len; i++){
    if(notes[i].start == currentBar){
      signal = createSawSignal(
	((60.0 / Score.bpm) / (minlen / 4)) * 
	(notes[i].end - notes[i].start) - 0.0001, 
// 	  * 60 / Score.bpm - 0.01, 
	convertToPitch(notes[i].key));
      url = convertToURL(signal);
      audio = new Audio(url);
      Player.renderStream.appendChild(audio); // ここでロードがはじまる
      notes[i].audio = audio;
      audio.volume = 0.1;
      Player.renderBuffer.push(audio); // 再生バッファにためる
    }else if(notes[i].end+2 == currentBar){
      if(notes[i].audio){
	// release audio
	notes[i].audio.pause();
	Player.renderStream.removeChild(notes[i].audio);
	notes[i].audio = null;	// 参照を切る。これでGCされるはず。
      }
    }
  }
  setTimeout(playBuffer, 10); 

  Player.currentBar += 1;
}

// 再生バッファに溜まっているものを再生
function playBuffer(){
  var i, len;
  len = Player.renderBuffer.length;
  for(i = 0; i < len; i++){
    Player.renderBuffer[i].play();
  }
  Player.renderBuffer = [];	// バッファをクリア
}