'use strict';
//to do
//loop animaitons
//allow animations to have a time set unrelated to rhythm

//main gameplay could have each rhythm game be a separate function, one that generates it's own animation variables, which will then go out of scope when the rhythm game switches
//or just store everything in memory at once at the start, which probably won't be good.

//var GolferSprites;
//var MonkeySprites;

/*(async function() {
	let response=await fetch("golferspritearray3.txt")
	GolferSprites=await response.json()
	response=await fetch("monkeyspritearray3.txt")
	MonkeySprites=await response.json()
	//these will happen in web workers in the final
})()*/

var golferImage=new Image();
golferImage.src='Texture0.png'; //texture ripped from the wii game. contains body parts that are assembled to make the sprites.
const golfercanv=document.getElementById('golfercanv'); //remove?
const gctx=golfercanv.getContext('2d');

var monkeyImage=new Image();
monkeyImage.src='Texture2.png';
const monkeycanv=document.getElementById('monkeycanv');
const mctx=monkeycanv.getContext('2d');

var cancellationID; //used to cancel the requestAnimationFrame() loop.
var PauseTime=0;

var curAnimObject={
	Golfer:'Ready',
	Monkey:'Beat',
	Mandrill:'b'
	//animations with only one step don't cause errors any more.
}
var cursObject={ //stores the current sprite index for each character.
	Golfer:0,
	Monkey:0,
	Mandrill:0
}
var prevCursObject={ //stores the previous sprite index. If the current sprite is the same as the previous one, it won't be redrawn (optimization)
	Golfer:0,
	Monkey:0,
	Mandrill:0
}
var AnimIndexObject={ /*stores where in the animation the character currently is.
this is different from the current sprite.
How the animations work:
Separate body parts are in Texture0.png
These body parts are assembled to make separate poses, or sprites. 
at this point, it becomes like a spritesheet ( https://github.com/Thysbelon/rhythm-heaven-web/blob/main/golfspritesheet.png )
The sprites are then used for animations. An animation may reuse the same sprite multiple times in its runtime (the monkey spinning animation)*/
	Golfer:0,
	Monkey:0,
	Mandrill:0
}
var curbpmBeatTime=500 //half a second in milliseconds
const curAnimLengths={
	Golfer:0,
	Monkey:0,
	Mandrill:0
}

const AnimationList={
	Golfer:{	
		//GolfSwing:[22, 0.04*curbpmBeatTime, 24, 0.08*curbpmBeatTime, 25, 0.16*curbpmBeatTime...
		//will this work?
		/*every group of six numbers is a different value. They are all settings to apply to that step of the animation. 
		They are 
		the index of the sprite to use, 
		how much the sprite should be stretched or squished horizontally (-1 is a flip), 
		same as previous but vertical, 
		how much the sprite should be rotated, 
		opacity, 
		and when the step should end */
		Ready:[4,1,1,0,255,0.08,5,1,1,0,255,0.16,6,1,1,0,255,0.24,7,1,1,0,255,0.36,8,1,1,0,255,0.48,9,1,1,0,255,0.6,10,1,1,0,255,0.72,11,1,1,0,255,1.08],
		Beat:[3,1,1,0,255,0.16,2,1,1,0,255,0.32,1,1,1,0,255,0.8],
		SwingHit:[19,1,1,0,255,0.04,21,1,1,0,255,0.08,22,1,1,0,255,0.16,23,1,1,0,255,0.24,23,1,1,0,255,0.32,24,1,1,0,255,0.4,24,1,1,0,255,0.48,25,1,1,0,255,0.6,26,1,1,0,255,0.76,27,1,1,0,255,1.96,1,1,1,0,255,2],
		Swing:[20,1,1,0,255,0.08,21,1,1,0,255,0.16,22,1,1,0,255,0.24,23,1,1,0,255,0.36,23,1,1,0,255,0.48,24,1,1,0,255,0.6,24,1,1,0,255,0.76,25,1,1,0,255,0.92,26,1,1,0,255,1.12,27,1,1,0,255,2.32,1,1,1,0,255,2.4],
		NoInput:[12,1,1,0,255,0.08,13,1,1,0,255,0.16,14,1,1,0,255,0.24,15,1,1,0,255,0.28,16,1,1,0,255,0.32,17,1,1,0,255,0.36,18,1,1,0,255,0.44,28,1,1,0,255,0.56,29,1,1,0,255,2.8,1,1,1,0,255,3.6],
		MandrillMiss:[30,1,1,0,255,0.12,32,1,1,0,255,0.28,33,1,1,0,255,0.44,32,1,1,0,255,0.6,33,1,1,0,255,0.76,32,1,1,0,255,0.92,33,1,1,0,255,1.08,32,1,1,0,255,1.24,33,1,1,0,255,2.24,1,1,1,0,255,2.4],
		UnusedOut:[12,1,1,0,255,0.04,13,1,1,0,255,0.08,14,1,1,0,255,0.12,29,1,1,0,255,0.16,20,1,1,0,255,0.24,21,1,1,0,255,0.32,22,1,1,0,255,0.4,23,1,1,0,255,0.52,23,1,1,0,255,0.64,24,1,1,0,255,0.76,24,1,1,0,255,0.92,25,1,1,0,255,1.08,26,1,1,0,255,1.28,27,1,1,0,255,2.32,1,1,1,0,255,2.4],
		Standing:[34,1,1,0,255,0.16],
		Look:[0,1,1,0,255,0.16],
		Greet:[35,1,1,0,255,0.8,36,1,1,0,255,0.96,37,1,1,0,255,1.12,38,1,1,0,255,1.28,34,1,1,0,255,1.6,0,1,1,0,255,2.4],
		shadow:[39,1,1,0,100,0.16],
		test1:[3,1,1,0,255,4,4,1,1,0,255,4.08,5,1,1,0,255,4.16,6,1,1,0,255,4.28,7,1,1,0,255,4.44,8,1,1,0,255,5,12,1,1,0,255,5.08,13,1,1,0,255,5.16,14,1,1,0,255,5.24,18,1,1,0,255,5.32,19,1,1,0,255,5.36,21,1,1,0,255,5.4,22,1,1,0,255,5.48,23,1,1,0,255,5.56,23,1,1,0,255,5.64,24,1,1,0,255,5.72,24,1,1,0,255,5.8,25,1,1,0,255,5.92,26,1,1,0,255,6.08,27,1,1,0,255,7.2],
		test2:[3,1,1,0,255,4,4,1,1,0,255,4.08,5,1,1,0,255,4.16,6,1,1,0,255,4.28,7,1,1,0,255,4.44,8,1,1,0,255,5,12,1,1,0,255,5.08,13,1,1,0,255,5.16,14,1,1,0,255,5.24,18,1,1,0,255,5.36,28,1,1,0,255,5.52,29,1,1,0,255,5.72,20,1,1,0,255,5.8,21,1,1,0,255,5.88,22,1,1,0,255,5.96,23,1,1,0,255,6.08,23,1,1,0,255,6.2,24,1,1,0,255,6.32,24,1,1,0,255,6.48,25,1,1,0,255,6.64,26,1,1,0,255,6.84,27,1,1,0,255,8],
		test3:[3,1,1,0,255,4,4,1,1,0,255,4.08,5,1,1,0,255,4.16,6,1,1,0,255,4.28,7,1,1,0,255,4.68,20,1,1,0,255,4.76,21,1,1,0,255,4.84,22,1,1,0,255,4.92,23,1,1,0,255,5.04,23,1,1,0,255,5.16,24,1,1,0,255,5.28,24,1,1,0,255,5.44,25,1,1,0,255,5.6,26,1,1,0,255,5.8,27,1,1,0,255,7]
	},
	Monkey:{				
		Beat:[36,1,1,0,255,0.16,37,1,1,0,255,0.32,38,1,1,0,255,0.8],
		Wait:[38,1,1,0,255,0.16],
		Ready:[11,1,1,0,255,0.16,12,1,1,0,255,1.2],
		UnusedreadyL:[0,1,1,0,255,0.16],
		Throw:[13,1,1,0,255,0.04,14,1,1,0,255,0.52,15,1,1,0,255,0.6,16,1,1,0,255,0.72],
		Spin:[19,1,1,0,255,0.04,20,1,1,0,255,0.08,21,1,1,0,255,0.12,30,1,1,0,255,0.16,23,1,1,0,255,0.2,24,1,1,0,255,0.24,26,1,1,0,255,0.28,19,1,1,0,255,0.36,20,1,1,0,255,0.44,21,1,1,0,255,0.52,22,1,1,0,255,0.6,23,1,1,0,255,0.68,24,1,1,0,255,0.76,26,1,1,0,255,0.84,19,1,1,0,255,0.96,28,1,1,0,255,1.08,29,1,1,0,255,1.2,30,1,1,0,255,1.32,31,1,1,0,255,1.44,32,1,1,0,255,1.56,25,1,1,0,255,1.68,34,1,1,0,255,1.8,19,1,1,0,255,1.96,28,1,1,0,255,2.12,29,1,1,0,255,2.28,30,1,1,0,255,2.44,31,1,1,0,255,2.6,32,1,1,0,255,2.76,34,1,1,0,255,2.92,27,1,1,0,255,3.08],
		ForwardWait:[2,1,1,0,255,0.16],
		Talk:[0,1,1,0,255,0.16,1,1,1,0,255,0.32,2,1,1,0,255,0.48],
		Blink:[3,1,1,0,255,0.16,2,1,1,0,255,0.32],
		Lets:[4,1,1,0,255,0.16,5,1,1,0,255,0.32,6,1,1,0,255,0.48],
		Sorry:[7,1,1,0,255,0.16,8,1,1,0,255,0.32,9,1,1,0,255,0.48],
		osii:[50,1,1,0,255,0.08,51,1,1,0,255,0.4,52,1,1,0,255,0.56,53,1,1,0,255,0.72,54,1,1,0,255,1.2],
		dodo:[56,1,1,0,255,0.12,57,1,1,0,255,0.24,58,1,1,0,255,0.36,56,1,1,0,255,0.48,57,1,1,0,255,0.6,58,1,1,0,255,0.72,56,1,1,0,255,0.84,57,1,1,0,255,0.96,58,1,1,0,255,1.08,56,1,1,0,255,1.2,57,1,1,0,255,1.32,58,1,1,0,255,1.44,56,1,1,0,255,1.56,57,1,1,0,255,1.68,58,1,1,0,255,1.8],
		Good:[72,1,1,0,255,0.08,72,1,1,0,255,0.16,72,1,1,0,255,0.24,73,1,1,0,255,0.32,74,1,1,0,255,0.4,75,1,1,0,255,0.48,76,1,1,0,255,0.56],
		Uhouho:[66,-1,1,0,255,0.04,67,-1,1,0,255,0.12,68,-1,1,0,255,0.2,69,-1,1,0,255,0.28,70,-1,1,0,255,0.32,71,-1,1,0,255,0.4,69,-1,1,0,255,0.48,68,-1,1,0,255,0.56],
		Effect:[77,1,1,0,255,0.04,78,1,1,0,255,0.08,79,1,1,0,255,0.12,80,1,1,0,255,0.16],
		Shadow:[173,1,1,0,255,0.16],
		FaceHit:[46,1,1,0,255,0.16,47,1,1,0,255,0.24,48,1,1,0,255,0.32,49,1,1,0,255,1.84,47,1,1,0,255,1.92,43,1,1,0,255,3.12,42,1,1,0,255,3.2],
		FaceMiss:[46,1,1,0,255,0.08,47,1,1,0,255,0.16,48,1,1,0,255,0.24,49,1,1,0,255,0.96,47,1,1,0,255,1.04,45,1,1,0,255,2.32,42,1,1,0,255,2.4],
		FaceSad:[45,1,1,0,255,2.24,42,1,1,0,255,2.4],
		FaceTalk:[43,1,1,0,255,0.16,42,1,1,0,255,0.32]
	},
	Mandrill:{}
}

const AnimStartTimesy={
	Golfer:0,
	Monkey:0,
	Mandrill:0
}

function UpdateSprite(curs, ctx, BRCAD, xImage){ //makes heavy use of the Canvas API
/*each sprite is built by assembling the body parts from the Texture. 
curs is the sprite being drawn. i is the current body part of the sprite being drawn.
Each body part has settings for which region of the image it should be cut from (x:[0], y:[1], width:[2], height[3]), 
where it should be placed (x:[4], y:[5]), how much it should be stretched (x:[6], y:[7]), 
if it should or should not be flipped on the x or y axis (x:[8], y:[9]), 
how much it should be rotated [10], and opacity [11] (opacity not used in function).
These settings were extracted from the wii game using https://github.com/rhmodding/bread then converted to a javascript object. 
the script tags at the top of this html file link to them. */
	ctx.clearRect(0,0,1024,1024)
	for (let i=0, l=BRCAD[curs].length, curX=0, curY=0; i < l; i++) {
		
		if (BRCAD[curs][i][10] != 0) { //rotation
			ctx.translate(BRCAD[curs][i][4] + (BRCAD[curs][i][2]*BRCAD[curs][i][6]) / 2,BRCAD[curs][i][5] + (BRCAD[curs][i][3]*BRCAD[curs][i][7]) / 2);
			ctx.rotate(BRCAD[curs][i][10] * Math.PI / 180);
			ctx.translate(-(BRCAD[curs][i][4] + (BRCAD[curs][i][2]*BRCAD[curs][i][6]) / 2),-(BRCAD[curs][i][5] + (BRCAD[curs][i][3]*BRCAD[curs][i][7]) / 2));
		}
		if (BRCAD[curs][i][8] === true) { //reflect x
			ctx.scale(-1, 1);
			curX=-(BRCAD[curs][i][4])-BRCAD[curs][i][2]//*BRCAD[curs][i][6];
		} else {
			curX=BRCAD[curs][i][4];
		}
		if (BRCAD[curs][i][9] === true) { //reflect y
			ctx.scale(1, -1);
			curY=-(BRCAD[curs][i][5])-BRCAD[curs][i][3]//*BRCAD[curs][i][7];
		} else {
			curY=BRCAD[curs][i][5]
		}
			
		ctx.drawImage(xImage, BRCAD[curs][i][0], BRCAD[curs][i][1], BRCAD[curs][i][2], BRCAD[curs][i][3], curX, curY, BRCAD[curs][i][2]*BRCAD[curs][i][6], BRCAD[curs][i][3]*BRCAD[curs][i][7])
		ctx.resetTransform();
	}
}

function UpdateAnim(time){
	cancellationID=window.requestAnimationFrame(UpdateAnim)
	if (time>=AnimationList.Golfer[curAnimObject.Golfer][AnimIndexObject.Golfer+5]*curbpmBeatTime+AnimStartTimesy.Golfer && AnimIndexObject.Golfer<=curAnimLengths.Golfer){
		AnimIndexObject.Golfer+=6
		cursObject.Golfer=AnimationList.Golfer[curAnimObject.Golfer][AnimIndexObject.Golfer]
	}
	if (cursObject.Golfer!==prevCursObject.Golfer) {
		UpdateSprite(cursObject.Golfer, gctx, GolferSprites, golferImage)
		prevCursObject.Golfer=cursObject.Golfer
	}
	
	if (time>=AnimationList.Monkey[curAnimObject.Monkey][AnimIndexObject.Monkey+5]*curbpmBeatTime+AnimStartTimesy.Monkey && AnimIndexObject.Monkey<=curAnimLengths.Monkey){
		AnimIndexObject.Monkey+=6
		cursObject.Monkey=AnimationList.Monkey[curAnimObject.Monkey][AnimIndexObject.Monkey]
	}
	if (cursObject.Monkey!==prevCursObject.Monkey) { //should this if statement be merged with the above if, and prevCursObject be removed?
		//apply animations scale settings with a css transform
		//monkeycanv.style.transform='scale('+AnimationList.Monkey[curAnimObject.Monkey][AnimIndexObject.Monkey+1]+','+AnimationList.Monkey[curAnimObject.Monkey][AnimIndexObject.Monkey+2]+')'
		let temp=0; //stores the sined rotation
		if (AnimationList.Monkey[curAnimObject.Monkey][AnimIndexObject.Monkey+3]!==0) { //rotation
		temp=Math.sin(AnimationList.Monkey[curAnimObject.Monkey][AnimIndexObject.Monkey+3])
		//degrees could be sined on bread converstion
		//same goes for the other values that are being converted here
		}
		//transform applies both scaling and rotation
		monkeycanv.style.transform='matrix('+AnimationList.Monkey[curAnimObject.Monkey][AnimIndexObject.Monkey+1]+','+temp+','+-(temp)+','+AnimationList.Monkey[curAnimObject.Monkey][AnimIndexObject.Monkey+2]+',0,0)'
		monkeycanv.style.opacity=AnimationList.Monkey[curAnimObject.Monkey][AnimIndexObject.Monkey+4]/255
		UpdateSprite(cursObject.Monkey, mctx, MonkeySprites, monkeyImage)
		prevCursObject.Monkey=cursObject.Monkey
	}
	
}

function ChangeAnim(AnimPara, chara){
	curAnimObject[chara]=AnimPara
	AnimStartTimesy[chara]=performance.now();
	AnimIndexObject[chara]=0
	cursObject[chara]=AnimationList[chara][curAnimObject[chara]][AnimIndexObject[chara]]
	curAnimLengths[chara]=AnimationList[chara][curAnimObject[chara]].length-7
}

function PauseAnimation() {
	window.cancelAnimationFrame(cancellationID)
	var PauseTime=performance.now();
	//resume
	document.addEventListener('keyup', function(){ //this limits the scope of pausetime
		let mycurtime=performance.now() - PauseTime
		AnimStartTimesy.Golfer+=mycurtime
		AnimStartTimesy.Monkey+=mycurtime
		AnimStartTimesy.Mandrill+=mycurtime
		cancellationID=window.requestAnimationFrame(UpdateAnim)
		document.body.addEventListener("keydown", PauseAnimation, {once:true})
	}, {once:true})
}

golferImage.addEventListener('load', function(){
	document.body.addEventListener("click", UpdateAnim, {once:true});
	document.body.addEventListener("keydown", PauseAnimation, {once:true})
	document.getElementById('readybut').addEventListener('click',function(){ChangeAnim('Ready', 'Golfer')})
	document.getElementById('swingbut').addEventListener('click',function(){ChangeAnim('Swing', 'Golfer')})
	document.getElementById('mon1but').addEventListener('click',function(){ChangeAnim('Uhouho', 'Monkey')})
	document.getElementById('mon2but').addEventListener('click',function(){ChangeAnim('Spin', 'Monkey')})
	document.getElementById('mmissbut').addEventListener('click',function(){ChangeAnim('NoInput', 'Golfer')})
}, {once:true})
