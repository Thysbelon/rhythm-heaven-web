'use strict';
let bpmchangemillis;
console.log('let bpmchangemillis;')
console.log('self.addEventListener(\'message\',')
self.addEventListener('message', function(e) {
	console.log('Calc: Message received from main script');
	var theresult=[];
	bpmchangemillis=bpmcalc(e.data);
	theresult.push('bpmchange', bpmchangemillis)
	if (e.data.timesig.beatnum.length>1) {
		theresult.push('timesigchange', TimeSigChangeSet(e.data, 0))
	}
	if (e.data.monkey!=null) {
		theresult.push('monkey1', StandardCueSet(e.data, 0, 'monkey'))
		theresult.push('monkey2', StandardCueSet(e.data, 2, 'monkey'))
		theresult.push('monkey3', StandardCueSet(e.data, 4, 'monkey', true))
	};
	if (e.data.mandril!=null) {
		theresult.push('mandril1', StandardCueSet(e.data, 0, 'mandril'))
		theresult.push('mandril2', StandardCueSet(e.data, 2, 'mandril'))
		theresult.push('mandril3', StandardCueSet(e.data, 4, 'mandril'))
		theresult.push('mandril4', StandardCueSet(e.data, 6, 'mandril', true))
	}
	theresult[1].shift(); //remove the 0 at the start of bpmchangemillis
	console.log('Calc: posting to main');
	postMessage(theresult);
	setTimeout(function(){console.log('still alive?')},6000)
}, {once: true})

function bpmcalc(c) {
	let bpmchangemillis=[0]; /*0 here to simplify the loop in StandardCueSet*/
	if (c.bpm.values.length>1) {
		for (let i=1, x=0, songsofar=0, l=c.bpm.values.length; i<l; i++) { /*i starts at one in order to avoid accessing undefined indexes when subtracting beatnums from eachother*/
			x=(30/c.bpm.values[i-1])*(c.bpm.beatnum[i]-c.bpm.beatnum[i-1]);
			x + songsofar;
			songsofar += x;
			bpmchangemillis.push(songsofar);
		}
	}
	return bpmchangemillis
}

function StandardCueSet(c, beatnum, cuetype, isInput) {
	let CurBeats=[], CueMilliArray=[];
	if (isInput===true) {var toSubtract=0.15} else {var toSubtract=0};
	for (let i=0, l=c[cuetype].length; i<l; i++) {CurBeats[i]=c[cuetype][i]+beatnum};
	for (let i=0, songsofar=0, tempbpmtouse=0, tempsubeats=0, l=CurBeats.length; i<l; i++) { 
	/*goes through each beat for the cue, Takes that beat, then compares it to every bpm beatnum to figure out what bpm to use*/
		for (let i2=0; c.bpm.beatnum[i2]<=CurBeats[i]; i2++) {
			tempbpmtouse=c.bpm.values[i2];
			tempsubeats=c.bpm.beatnum[i2];
			songsofar=bpmchangemillis[i2]
			/*ALWAYS make sure that i2 here chooses the correct millisecond value from bpmchangemillis. If it doesn't, it will ruin all the cues.
			I had an issue before because I had added a zero to the beginning of bpmchangemillis since the last time I tested this.*/
		};
		CueMilliArray.push(((CurBeats[i]-tempsubeats)*(30/tempbpmtouse)+songsofar)-toSubtract)
	};
	console.log('CueMilliArray'+beatnum+': '+CueMilliArray);
	return CueMilliArray
}

function TimeSigChangeSet(c) {
	let CueMilliArray=[];
	//will the parameter and the property with the exact same name cause glitches?
	for (let i=1, songsofar=0, tempbpmtouse=0, tempsubeats=0, l=c.timesig.beatnum.length; i<l; i++) { 
	/*goes through each beat for the cue, Takes that beat, then compares it to every bpm beatnum to figure out what bpm to use*/
		for (let i2=0; c.bpm.beatnum[i2]<=c.timesig.beatnum[i]; i2++) {
			tempbpmtouse=c.bpm.values[i2];
			tempsubeats=c.bpm.beatnum[i2];
			songsofar=bpmchangemillis[i2]
			/*ALWAYS make sure that i2 here chooses the correct millisecond value from bpmchangemillis. If it doesn't, it will ruin all the cues.
			I had an issue before because I had added a zero to the beginning of bpmchangemillis since the last time I tested this.*/
		};
		CueMilliArray.push((c.timesig.beatnum[i]-tempsubeats)*(30/tempbpmtouse)+songsofar)
	};
	console.log('Timesigchange MilliArray: '+CueMilliArray);
	return CueMilliArray
}