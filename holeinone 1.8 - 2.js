'use strict';
//This project uses the Web Audio API to play sound effects, schedule sound effects to play in advance, and schedule functions. https://web.dev/webaudio-intro/
function gameplay() {
	{
		let starty=document.getElementById('startbutton')
		starty.onmouseup=null;
		starty.remove();
	}
	/*if (document.getElementById('chartinput').files[0]!=undefined) {
		var TheChart=document.getElementById('chartinput').files[0];
	}
	else {}*/
	//todo: add page visibility api, add gamepad api, bluetooth api?, indexed db?
	var r=document.querySelector(':root');
	/*The #gamearea is only 854 by 480 pixels, which is the resolution of the wii. This ResizeFunction runs every time the window is resized.
	The --scaly variable is used for transform:scale() on the #gamearea, to make it the size of the browser window.*/
	function ResizeFunction() {
		r.style.setProperty('--scaly', (window.innerHeight/480));
	}
	//var PauseState=document.getElementById('pauseresumestate');
	var CuePress=false;
	var animtoggle=false; //have these toggles be dynamically generated for each rhythm game like m, mh, and mhc
	var animtoggle2=false; /*These animtoggles exist only to work around a limitation of CSS animations,
	the inability to reset a currently running animation and play it from the start. 
	Animations that must be able to repeat, like the golf swing, have two identical copies that are switched between to create the illusion of repeating.*/
	var boptoggle=1; /*same as animtoggle. Usually the bop is an infinitely repeating animation, 
	but it needs to be reset during bpm changes (for a clean look) and time signatures that are an odd number above 8 (because they only bop on quarter notes).*/
	var AKeyPress=false; //detects if the key is being held; prevents the event from firing rapidly while the key is held.
	var PauseKeyPress=false;
	var btracker; /*varible used to store invisible element #beatracker, 
	this element's infinite bop animation has 
	an iteration event listener attached that is used to properly restart an element's bop animation 
	after a different animation has ended. 
	for example, it is used to restart the bop on the Golfer after the player goofs around with the swing button outside of a cue.*/
	var ResetGolferBop=function(){}; /*these variables are called as functions by btracker on every beat. 
	when a character's animation ends, their ResetBop variable is 
	assigned a function that sets the character's animation back to the bop then assigns ResetBop back to an empty function. 
	The fact that ResetBop's function is called by btracker's iteration bop, which is always on beat, ensures that the bop animation restarts on beat.*/
	var ResetMonkeyBop=function(){};
	var ResetMandrilBop=function(){};
	var MandrilBopName='mandrilbop_'; //decides whether mandril is doing a bop or a cheer.
	var MeasureStart=function(){}; //stores whether btracker is doing a common time or odd time function. (the characters only bop on quarter notes)
	var safeZone=0.04;/*margin of error for player input. cue can be hit forty milliseconds before and after the cue
	this should hopefully go out of scope when gameplay ends*/
	const MySounds={bgm: null, pause: null}
	const MyFunctions={ /*Functions for every cue, such as the monkey picking up the ball, the monkey throwing the ball, a bpm change in the song, etc.
		These cues are scheduled in advance using the Web Audio API, after calculating times from the chart. 
		when the time comes for the monkey to throw their ball at a certain part of the song, these are the functions that are being executed; 
		they mostly handle syncing animations to the music and sound.*/
		/*the default animation name is now 'none', so every "style.animationName='none'" could be replaced with "style.animationName=''"*/
		bgm: function(){
			console.log('start bop');
			btracker.style.animationName='monkeybophead_'+boptoggle;
			if (m.style.animationName!=='monkeypickup') {m.style.animationName='monkeybopbody_'+boptoggle};
			mhc.style.animationName='monkeybophead_'+boptoggle;
			if (dril.style.animationName!=='mandrilpickup') {dril.style.animationName='mandrilbop_'+boptoggle};
			golfer.style.animationName='golferbop_'+boptoggle;
			golfer.style.animationIterationCount='infinite';
			ResetGolferBop=function(){};
		},
		bpmchange: function(){
			curbpm++; //the chart's bpm changes are stored in the array bpmvalues. curbpm selects the index of that array.
			console.log('bpmchange: '+bpmvalues[curbpm]);
			r.style.setProperty('--rhythm', (60/bpmvalues[curbpm])+'s') /*--rhythm controls the speed of all css animations. 
			its main purpose is to keep the bop in sync with the song.*/
			if (boptoggle===1) {boptoggle=2} else {boptoggle=1};
			if (m.style.animationName.slice(0, -1)==='monkeybopbody_') {m.style.animationName='monkeybopbody_'+boptoggle};
			if (dril.style.animationName.slice(0, -1)==='mandrilbop_') {dril.style.animationName='mandrilbop_'+boptoggle};
			//if (mhc.style.animationName.slice(0, -1)==='monkeybophead_') {
			mhc.style.animationName='monkeybophead_'+boptoggle//};
			//if statement has been commented out because mhc is always monkeybophead, it never changes.
			btracker.style.animationName='monkeybophead_'+boptoggle;
			if (golfer.style.animationName.slice(0, -1)==='golferbop_') {golfer.style.animationName='golferbop_'+boptoggle};
			ResetGolferBop(); //I think these are here because, when btracker is being reset, the iteration bop doesn't happen.
			ResetMonkeyBop();
			ResetMandrilBop();
			//changing the duration mid animation doesn't work and will always lead to stutters
			//this bpmchange function must restart the animation
			//when cue animations happen during a bpm change, either by being on the offbeat before the change or being on the same beat as the change, they will stutter due to their animation duration changing mid naimations.
			//maybe this could be fixed by not changing the animationDuration right away and adding an animationEnd listener to set ResetBop again. This would require changing those in progress animations from var rhythm to a number value of their previous durtion, so they don't change mid animation with the rhythm, but would doing this result in stutters anyway?
		},
		timesigchange: function(){
			curtimesig++
			curbeat=-1;
			console.log('timesigchangefunction')
			if (timesigs.denominator[curtimesig]!==4 && Number.isInteger(timesigs.numerator[curtimesig]/2)===false) {
				MeasureStart=OddTimeSig //function being stored in a variable
				btracker.style.animationDuration=30/bpmvalues[0]+'s'
			} else {
				//
				if (boptoggle===1) {boptoggle=2} else {boptoggle=1};
				if (m.style.animationName.slice(0, -1)==='monkeybopbody_') {m.style.animationName='monkeybopbody_'+boptoggle};
				if (dril.style.animationName.slice(0, -1)==='mandrilbop_') {dril.style.animationName='mandrilbop_'+boptoggle};
				mhc.style.animationName='monkeybophead_'+boptoggle
				btracker.style.animationName='monkeybophead_'+boptoggle;
				if (golfer.style.animationName.slice(0, -1)==='golferbop_') {golfer.style.animationName='golferbop_'+boptoggle};
				ResetGolferBop();
				ResetMonkeyBop();
				ResetMandrilBop();
				//technically, the above is only needed if the previous timesig was odd/8
				MeasureStart=CommonTimeSig;
				btracker.style.animationDuration=''
			}
		},
		monkey1: function(){
			//console.log('pick up');
			setTimeout(function(){m.style.animationName='monkeypickup'; console.log("m.style.animationName='monkeypickup'"); mhc.style.opacity=0; console.log("mhc.style.opacity=0")}, 1) //this setTimeout could be replaced with an if statement in mokey3 next to m.style.animationName='monkeybopbody_'+boptoggle;
			mhc.style.animationName='none';
		}, 
		monkey2: function(){
			ResetGolferBop=function(){}; //is this bad for perfomance? hopefully not.
			//console.log('throw')
			mhc.style.opacity=0; console.log("mhc.style.opacity=0"); /*the monkey's head is separate from its body so 
			the head's 'looking at the ball after a perfect hit' animation can play independently of the body's bop animation. 
			when other animations, like throwing, are being performed, the bopping head is made invisible.*/
			setTimeout(function(){m.style.animationName='monkeythrow'; console.log("m.style.animationName='monkeythrow'")},2)
			/*the set timeout above is there to make sure that during a 1 1 1 cue ( https://youtu.be/_VIyF1e6sWk?t=79 ), 
			the monkey will continously throw the ball, instead of continuously crouching down while the ball flies.*/
			//these two animations CANNOT use the same toggle boolean
			//it will cause the standing glitch to happen again.
			if (animtoggle2===true) {
				golfer.style.animationName='golfready_1';
				animtoggle2=false
			} else {
				golfer.style.animationName='golfready_2';
				animtoggle2=true
			}
		}, 
		monkey3: function(time){ /*when the player must hit the golf ball. 
			time parameter is the time this function starts, 15 milliseconds before the perfect time to hit the golf ball.*/
			//alt: complex monkey3function.js, timeout monkey3.js
			timecompare=time+0.15
			ResetGolferBop=function(){};
			var osci2=ctx.createOscillator();
			osci2.start(time);
			osci2.addEventListener('ended', function(){
				if (CuePress===false) {
					golfer.style.animationName='golfnoinput'; //maybe this could be moved to when the cue ends?
					golfer.style.animationIterationCount='1'
				}
			}, {once: true})
			osci2.stop(time+0.15); //sets the golfer's animation to 'golfnoinput' on beat.
			m.style.animationName='none'; console.log("m.style.animationName='none'")
			//mhc.style.animationName='none'
			mhc.style.opacity=1; console.log("mhc.style.opacity=1")
			ResetMonkeyBop=function(){if (m.style.animationName=='none') {m.style.animationName='monkeybopbody_'+boptoggle; console.log("m.style.animationName=monkeybopbody_"+boptoggle); mhc.style.animationName='monkeybophead_'+boptoggle;}; ResetMonkeyBop=function(){}}
			/*The if statement in ResetMonkeyBop fixes a glitch in which the pickup animation would be cancelled out by the standing animation, 
			and monkey's head would still be at opacity 0*/
			//console.log('start input')
			var osci=ctx.createOscillator();
			osci.start(time);
			osci.addEventListener('ended', function(){
				if (CuePress===true) {CuePress=false} else {
					var golferOsci=ctx.createOscillator();
					golferOsci.start(0);
					golferOsci.addEventListener('ended', function(){
						ResetGolferBop=function(){};
						ResetGolferBop=function(){golfer.style.animationName='golferbop_'+boptoggle; console.log("golfer.style.animationName=golferbop_"+boptoggle); golfer.style.animationIterationCount='infinite'; ResetGolferBop=function(){}}
					}, {once: true})
					golferOsci.stop(timecompare+(45/bpmvalues[curbpm])); //ensures that the swing animation is not reset to the bop too soon.
					switch (Math.floor(Math.random() * 3)) {
						case 0:
							playSound('golfNoPress1')
							break;
						case 1:
							playSound('golfNoPress2')
							break;
						default:
							playSound('golfNoPress3')
					};
					
				}
				timecompare='bip'; //console.log('end input');
			}, {once: true})
			osci.stop(time+0.30);
		},
		mandril1: function(){
			dril.style.animationName='mandrilpickup'
		},
		mandril2: function(){
			dril.style.animationName='mandrilrise'
		},
		mandril3: function(){
			dril.style.animationName='mandrildown'
			if (animtoggle2===true) {
				golfer.style.animationName='golfready_1';
				animtoggle2=false
			} else {
				golfer.style.animationName='golfready_2';
				animtoggle2=true
			}
		},
		mandril4: function(time){
			timecompare=time+0.15
			ResetGolferBop=function(){};
			var osci2=ctx.createOscillator();
			osci2.start(time);
			osci2.addEventListener('ended', function(){
				dril.style.animationName='mandrilthrow'
				console.log('reset being set');
				ResetMandrilBop=function(){if (dril.style.animationName!='mandrilpickup') {console.log('resetting'); dril.style.animationName='mandrilbop_'+boptoggle;}; ResetMandrilBop=function(){}}
				if (CuePress===false) {
					golfer.style.animationName='golferdead';
					golfer.style.animationIterationCount='1'
					playSound('mandrilshout')
					playSound('mandrilmiss')
				}
				timecompare='bip'
			}, {once: true})
			osci2.stop(time+0.30);
			//the sound effect for this function CANNOT have the same name as the function itself, otherwise, the sound effect will play too early, due to the fact that input cues happen before the beat.
			//solution: mandrill will yell at the same time as the button press
		}
	}
	var timecompare='bip';
	var ctx
	var menuctx=new AudioContext();
	var pauseresumetoggle=pausethegame; //a variable storing a function
	{
		const TheChart={ /*now, the chart will go out of scope once the timers and counters have finished setting.*/ 
			//The chart stores when each cue should play in the form of eigth beats.
			bpm:{ //stores bpm changes. beatnum is when the bpm change should happen. values are the bpm that the bpm should change to.
			//beatnum:[1,9,17,25,33,41,49], //for tempotrack.mp3
			//values:[169,310,169,310,133,310,133]
			beatnum:[1,71,105,129], //standard
			values:[120,83,135,83]
			//beatnum:[1], //blue rondo
			//values:[189]
			//beatnum:[1], //story 2
			//values:[110]
			},
			timesig:{ //stores time signature changes.
			beatnum:[1],
			numerator:[4], //standard
			denominator:[4]
			//numerator:[9], //blue rondo
			//denominator:[8]
			//beatnum:[1,37,69,109,157,213], //story 2
			//numerator:[3,4,5,6,7,8],
			//denominator:[8,8,8,8,8,8]
			},
			monkey:[1,11,19,27,33,43,51,59,65,75,83,91,97,105,109,113,121,125,133], //standard for testone
			mandril:[],
			//monkey:[29],			//eee
			//mandril:[1, 12, 27],
			//monkey:[1,11,15,19,23,27,31,35,39,43,47,51,55], //1 2 1 2 test
			//monkey:[1,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39], //1 1 1 test
			//monkey:[1,11,13,15,19,21,23,27,29,31,33,35,37], //1 1 1 test
			//monkey:[1,5,9,13,17,21,25,29,33,37,41,45,49,53], //tempotrack
			//monkey:[1,11,12,13,19,20,21,27,28,29], //eighthbeat test? (this kind of pattern never appear in an official game) for this animation to work, monkeypickup and monkeythrow would also have to be _1 animations with a toggle boolean.
			//monkey:[1,12,20,28,34,44,52,60,66,76,84], //offbeat test
			//monkey:[1,12,14,16,18,20,22,24,26,28,30],
			//monkey:[1],
			//songstart:2.8, //bgm starts playing after this number of SECONDS
			songstart:3,
			songend:138, //should this also be in seconds, instead of being in beats? something like, 1 second after the bgm audio buffer ends, the game fades to black. 
			//this could give people control over how long end of stage animations play
			sfx: false //if set to true, will play a sound effect, like waves crashing on the beach, before the song starts and the characters start bopping.
		};
		var curbpm=0, bpmvalues=TheChart.bpm.values;
		/*I've decided to make the counter for bpm changes a top scope variable, 
		I couldn't think of any better option, 
		because a closure would still require a top scope variable to exist*/
		var curtimesig=0, timesigs=TheChart.timesig;
		var curbeat=1; //used for the OddTimeSig function
		if (TheChart.monkey!=null || TheChart.mandril!=null) {
		/*The idea behind this project was that the user would input their chart and music file, 
		then the program would read the chart and ONLY run code and fetch assets needed for the rhythm games in that specific chart.*/
			var m;
			var mh;
			var mhc;
			var golfer;
			var dril;
		}
		
		setup(TheChart)
		function setup(c) {
			var TimersArray; //this is now only sent to start()
			var myCountdown=0; //keeps track of what workers have finished and when the song can start
			
			var MasterFetchWorker=new Worker('Fetcher.js'); //fetches the audio file of every sound effect in a separate thread.
			var myCalculator=new Worker('SecondCalc2.js'); /*takes the chart, 
			then calculates from the eigth beats which time in seconds each of the cues should play. 
			the result is stored in TimersArray*/
			
			var mymessage=['testsound.wav','testone2.mp3'/*song name here is placeholder, user should upload their chart and song file in an input file HTML tag*/];
			if (c.sfx===true) {
				mymessage.push('wave.wav')
			}
			if (c.monkey!=null) {
				var monkeyindex=mymessage.length
				//monkeyindex allows the program to correctly pick out the monkey sound effects from the array of all the sound effects that are received.
				mymessage.push('monky1.wav','monky2.wav','monky3.wav','NoPress1.wav','NoPress2.wav','NoPress3.wav','swingwhenidle.wav','miss.wav')
				console.log('monkeyindex: '+monkeyindex)
			}
			if (c.mandril!=null) {
				var mandrilindex=mymessage.length;
				mymessage.push('mandrill1.wav','mandrill2.wav','mandrill3.wav','mandrill4.wav','mandrillmiss.wav');
				console.log('mandrilindex: '+mandrilindex)
			}
			
		
			MasterFetchWorker.addEventListener('message', function(e){
				console.log('message received from fetcher');
				MasterFetchWorker.terminate(); 
				console.log(e.data); 
				let promiseiterable=[menuctx.decodeAudioData(e.data[0]), menuctx.decodeAudioData(e.data[1])];
				for (let i=2, l=e.data.length; i<l; i++) {
					promiseiterable[i]=menuctx.decodeAudioData(e.data[i])
				}
				Promise.all(
					promiseiterable
				).then(function(values){
					MySounds.pause=values[0];
					MySounds.bgm=values[1];
					if (c.sfx===true) {
						MySounds.ambiance=values[2];
					}
					if (c.monkey!=null) {
						MySounds.monkey1=values[monkeyindex];
						MySounds.monkey2=values[monkeyindex+1];
						MySounds.golfHit=values[monkeyindex+2];
						MySounds.golfNoPress1=values[monkeyindex+3];
						MySounds.golfNoPress2=values[monkeyindex+4];
						MySounds.golfNoPress3=values[monkeyindex+5];
						MySounds.GolfIdleSwing=values[monkeyindex+6];
						MySounds.GolfBarely=values[monkeyindex+7]
					}
					if (c.mandril!=null) {
						MySounds.mandril1=values[mandrilindex];
						MySounds.mandril2=values[mandrilindex+1];
						MySounds.mandril3=values[mandrilindex+2];
						MySounds.mandrilshout=values[mandrilindex+3];
						MySounds.mandrilmiss=values[mandrilindex+4]
					}
					console.log(values);
					myCountdown++;
					console.log('myCountdown++ '+myCountdown)
					if (myCountdown===3) {
						myStart(TimersArray, c.songstart)
					}
				})
			}, {once: true})
			MasterFetchWorker.postMessage(mymessage);
			console.log('message posted')
			
			myCalculator.addEventListener('message', function(e){
				console.log('message received from calculator');
				myCalculator.terminate();
				console.log(e.data[0]);
				TimersArray=e.data
				myCountdown++;
				if (myCountdown===3) {
					myStart(TimersArray, c.songstart)
				}
			}, {once: true});
			myCalculator.postMessage(c)
			
			//document.head.innerHTML+='<link rel="stylesheet" href="holeinonelayoutstylesheet.css">'
			var cntnr=document.createElement('div');
			cntnr.id='container';
			document.body.append(cntnr);
			cntnr.innerHTML="<div id=gamearea><div id=zoomarea><div id=beatracker></div><div id=golfer><div id=gshadow></div></div><div id=mandrill><div id=m2shadow></div></div><div id=monkey><div id=mheadcontainer><div id=mhead></div></div><div id=mshadow></div></div><div id=gbg><div id=island></div></div></div></div>"
			var myLink=document.createElement('link');
			myLink.addEventListener('load', function(){ /*automatically duplicates animations that end with '_1' in the Stylesheet; 
			to avoid redundancy in the stylesheet and still be able to repeat an animation by switching between identical copies of it.*/
				console.log('please')
				let rules=myLink.sheet.cssRules
				let thesheet=myLink.sheet
				let tempArray=[];
				for (let i=0, l=rules.length; i<l; i++) {
					//console.log('rule: '+myLink.sheet.cssRules[i])
					//if ('rule: '+myLink.sheet.cssRules[i]=='rule: [object CSSKeyframesRule]') {console.log('true')} else {console.log('false')}
					if ('rule: '+rules[i]=='rule: [object CSSKeyframesRule]') {
						if (rules[i].cssText.includes('_1')===true) {
							tempArray.push(rules[i].cssText.replace('_1','_2'))
						}
					}
				};
				for (let i=0, l=tempArray.length; i<l; i++) {
					thesheet.insertRule(tempArray[i], 1)
				}
				console.log(myLink.sheet.cssRules)
				myCountdown++;
				if (myCountdown===3) {
					myStart(TimersArray, c.songstart)
				}
			}, {once: true})
			myLink.rel='stylesheet'
			myLink.href='holeinonelayoutstylesheet1.css'
			m=document.getElementById('monkey');
			mh=document.getElementById('mhead');
			mhc=document.getElementById('mheadcontainer');
			btracker=document.getElementById('beatracker');
			btracker.addEventListener('animationiteration', function(){
				MeasureStart() //I don't remember why this is called "MeasureStart", it runs on every beat.
			})
			golfer=document.getElementById('golfer');
			dril=document.getElementById('mandrill');
			document.head.appendChild(myLink);
			
		}
	}; 
	
	function myStart(TimersArray, startime) {
		r.style.setProperty('--rhythm', (60/bpmvalues[0])+'s');
		if (timesigs.denominator[0]!==4 && Number.isInteger(timesigs.numerator[0]/2)===false) {
			MeasureStart=OddTimeSig //function being stored in a variable
			btracker.style.animationDuration=30/bpmvalues[0]+'s'
		} else {MeasureStart=CommonTimeSig}
		console.log('mystart()')
		console.log(TimersArray)
		r.style.setProperty('--playState', 'running'); //--playState controls the play-state of all css animations, allowing them to all be paused at the same time.
		ResizeFunction();
		window.addEventListener("resize", ResizeFunction);
		document.addEventListener('fullscreenchange', ResizeFunction);
		document.body.addEventListener("keydown", hitkey);
		document.body.addEventListener("keyup", LiftKey);
		ctx=new AudioContext; //the AudioContext needs to be created when the song starts so its timer will sync up with the song.
		playSound('ambiance')
		playCue('bgm',startime)
		//the playCue function schedules both a sound and one of the functions in MyFunctions
		for (let i=0, l=TimersArray.length; i<l; i+=2) {
			for (let i2=0, l2=TimersArray[i+1].length; i2<l2; i2++) {
				playCue(TimersArray[i], TimersArray[i+1][i2]+startime)
			}
		}
	}
	
	function hitkey(TheEvent) {
		switch (TheEvent.code) { 
			case 'KeyP':
			case 'Enter':
			case 'Backspace':
			case 'Escape':
				pauseresumetoggle();
				break;
			case 'KeyQ':
			case 'KeyW':
			case 'KeyE':
			case 'KeyR':
			case 'KeyT':
			case 'KeyY':
			case 'KeyU':
			case 'KeyI':
			case 'KeyO':
			case 'KeyP':
			case 'KeyA':
			case 'KeyS':
			case 'KeyD':
			case 'KeyF':
			case 'KeyG':
			case 'KeyH':
			case 'KeyJ':
			case 'KeyK':
			case 'KeyL':
			case 'KeyZ':
			case 'KeyX':
			case 'KeyC':
			case 'KeyV':
			case 'KeyB':
			case 'KeyN':
			case 'KeyM':
			case 'Space':
			case "Quote":
			case 'Semicolon':
			case 'Comma':
			case 'Period':
			case 'Slash':
			case 'ArrowUp':
			case 'ArrowDown':
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'Numpad0':
			case 'Numpad1':
			case 'Numpad2':
			case 'Numpad3':
			case 'Numpad4':
			case 'Numpad5':
			case 'Numpad6':
			case 'Numpad7':
			case 'Numpad8':
			case 'Numpad9':
			case 'NumpadDecimal':
				GolfInput();
				break;
			default:
				return;
		}
	}
	function LiftKey(TheEvent) {
		switch (TheEvent.code) { 
			case 'KeyQ':
			case 'KeyW':
			case 'KeyE':
			case 'KeyR':
			case 'KeyT':
			case 'KeyY':
			case 'KeyU':
			case 'KeyI':
			case 'KeyO':
			case 'KeyP':
			case 'KeyA':
			case 'KeyS':
			case 'KeyD':
			case 'KeyF':
			case 'KeyG':
			case 'KeyH':
			case 'KeyJ':
			case 'KeyK':
			case 'KeyL':
			case 'KeyZ':
			case 'KeyX':
			case 'KeyC':
			case 'KeyV':
			case 'KeyB':
			case 'KeyN':
			case 'KeyM':
			case 'Space':
			case "Quote":
			case 'Semicolon':
			case 'Comma':
			case 'Period':
			case 'Slash':
			case 'ArrowUp':
			case 'ArrowDown':
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'Numpad0':
			case 'Numpad1':
			case 'Numpad2':
			case 'Numpad3':
			case 'Numpad4':
			case 'Numpad5':
			case 'Numpad6':
			case 'Numpad7':
			case 'Numpad8':
			case 'Numpad9':
			case 'NumpadDecimal':
				AKeyPress=false;
				break;
			default:
				return;
		}
	}
	function GolfInput() {
		if (AKeyPress===false) {
			var curtime=ctx.currentTime;
			if (((timecompare)-safeZone) < curtime && 
			((timecompare)+safeZone) > curtime) { //hit
				playSound('golfHit'); 
				CuePress=true; 
				console.log('hit'); 
				if (animtoggle===true) {
					mh.style.animationName='monkeyturnhead_1';
				} else {
					mh.style.animationName='monkeyturnhead_2';
				}
				ResetGolferBop=function(){};
				var golferOsci=ctx.createOscillator();
				golferOsci.start(0);
				golferOsci.addEventListener('ended', function(){
					ResetGolferBop=function(){};
					ResetGolferBop=function(){golfer.style.animationName='golferbop_'+boptoggle; console.log("golfer.style.animationName=golferbop_"+boptoggle); golfer.style.animationIterationCount='infinite'; ResetGolferBop=function(){}};
				}, {once: true})
				golferOsci.stop(timecompare+(45/bpmvalues[curbpm]));
				timecompare='bip';
			} else if (((timecompare)-(safeZone*1.5)) < curtime && 
			((timecompare)+(safeZone*1.5)) > curtime) { //barely
				playSound('GolfBarely'); 
				CuePress=true; 
				console.log('barely'); 
				ResetGolferBop=function(){};
				var golferOsci=ctx.createOscillator();
				golferOsci.start(0);
				golferOsci.addEventListener('ended', function(){
					ResetGolferBop=function(){};
					ResetGolferBop=function(){golfer.style.animationName='golferbop_'+boptoggle; console.log("golfer.style.animationName=golferbop_"+boptoggle); golfer.style.animationIterationCount='infinite'; ResetGolferBop=function(){}}
				}, {once: true})
				golferOsci.stop(timecompare+(45/bpmvalues[curbpm]));
				timecompare='bip';
			} else if (typeof timecompare==='number') { //miss
				playSound('GolfIdleSwing'); 
				CuePress=true; 
				console.log('miss'); 
				ResetGolferBop=function(){};
				var golferOsci=ctx.createOscillator();
				golferOsci.start(0);
				golferOsci.addEventListener('ended', function(){
					ResetGolferBop=function(){};
					ResetGolferBop=function(){golfer.style.animationName='golferbop_'+boptoggle; console.log("golfer.style.animationName=golferbop_"+boptoggle); golfer.style.animationIterationCount='infinite'; ResetGolferBop=function(){}}
				}, {once: true})
				golferOsci.stop(timecompare+(45/bpmvalues[curbpm]));
				timecompare='bip';
			} else { //messing around and pressing the button outside of a cue
				playSound('GolfIdleSwing'); 
				if (ResetGolferBop!==function(){}) {ResetGolferBop=function(){}};
				golfer.removeEventListener('animationend', AnimationEndEvent);
				golfer.addEventListener('animationend', AnimationEndEvent, {once: true});
			};
			AKeyPress=true;
			
			if (animtoggle===true) {
				golfer.style.animationName='golfswing_1';
				animtoggle=false;
			} else {
				golfer.style.animationName='golfswing_2';
				animtoggle=true;
			}
			
			//when an animationName changes, then goes back to it's original state too quickly, the DOM doesn't see the change, and it won't replay the animation.
			//maybe that's what causes the standing glitch? during a 1 1 1 beat, the name changes from swing, to golfready, then back to swing too fast for the dom to see, so it only plays the swing animation once, and when that animation ends, the golfer goes back to her default standing position.
			// ^ the fact that having two identical animations and switching between them fixes this PROVES that the above was the cause of the issue.
			golfer.style.animationIterationCount='1'
		}
	}
	function pausethegame() {
		ctx.suspend().then(function(){
			pauseresumetoggle=resumethegame
			playSound('pause', 0, menuctx)
			//PauseState.innerHTML='PAUSED';
			console.log('paused')
			console.log(ctx.currentTime)
		});
		r.style.setProperty('--playState', 'paused');
	}
	function resumethegame() {
		playSound('pause', 0, menuctx)
		ctx.resume().then(function(){
			pauseresumetoggle=pausethegame
			//PauseState.innerHTML='RESUMED';
			console.log('resumed')
		});
		r.style.setProperty('--playState', 'running');
	}
	
	function playCue(buffer, time) { /*the Web Audio API can schedule sound effects in advance using an extremely accurate internal timer. 
	unfortunately, the only way to use this timer to run functions rather than sound effects: 
	is to make a silent oscillator and attach an event listener to that oscillator's 'ended' event.*/
		//would using a constant source node https://developer.mozilla.org/en-US/docs/Web/API/ConstantSourceNode
		//be better than using an oscillator?
		playSound(buffer, time);
		var osci=ctx.createOscillator();
		osci.start(time-0.1);
		osci.stop(time);
		osci.addEventListener('ended', function(){MyFunctions[buffer](time)}, {once:true})
		// ^ is this better or worse for performance than .onended=
	}
	
	function playSound(buffer, time=0, context=ctx) {
	  var source = context.createBufferSource();
	  source.buffer = MySounds[buffer];
	  source.connect(context.destination);
	  source.start(time);
	}
	
	function AnimationEndEvent() {
		console.log('animation end activated'); 
		ResetGolferBop=function(){golfer.style.animationName='golferbop_'+boptoggle; console.log("golfer.style.animationName=golferbop_"+boptoggle); golfer.style.animationIterationCount='infinite'; ResetGolferBop=function(){}}
	}
	
	function CommonTimeSig() {
		console.log('iteration bop')
		ResetGolferBop() //this is not a function. it is a variable.
		ResetMonkeyBop() //this is needed for offbeat monkey cues.
		ResetMandrilBop()
	}
	
	function OddTimeSig() {
		curbeat++
		console.log('iteration bop '+curbeat);
		if (curbeat===1) {
			if (boptoggle===1) {boptoggle=2} else {boptoggle=1};
			if (m.style.animationName.slice(0, -1)==='monkeybopbody_') {m.style.animationName='monkeybopbody_'+boptoggle};
			if (dril.style.animationName.slice(0, -1)==='mandrilbop_') {dril.style.animationName='mandrilbop_'+boptoggle};
			mhc.style.animationName='monkeybophead_'+boptoggle
			if (golfer.style.animationName.slice(0, -1)==='golferbop_') {golfer.style.animationName='golferbop_'+boptoggle};
			//ResetGolferBop();
			//ResetMonkeyBop();
		};
		if (curbeat===timesigs.numerator[curtimesig]) {
			curbeat=0
		};
		if (Number.isInteger((curbeat+1)/2)) {
			ResetGolferBop();
			ResetMonkeyBop();
			ResetMandrilBop();
		};
	}
}
