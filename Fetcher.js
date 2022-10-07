var theresult=[];
console.log('var theresult=[];')
var counter=0;
console.log('var counter=0;')
console.log('self.addEventListener(\'message\',')
self.addEventListener('message', function(e) {
	console.log('fetcher: Message received from main script');
	var Fetchlings=[];
	console.log('var Fetchlings=[];')
	var l=e.data.length
	console.log('var l=e.data.length')
	console.log('for loop')
	for (let i=0; i<l; i++) {
		console.log('loop '+i)
		Fetchlings[i]=new Worker('Fetchling.js');
		console.log('Fetchlings['+i+']=new Worker(\'Fetchling.js\');')
		Fetchlings[i].addEventListener('message', function(e){
			console.log('fetcher: message reveived from fetchling'+i+': '+e.data);
			theresult[i]=e.data; 
			Fetchlings[i].terminate();
			counter++;
			console.log('fetcher: counter++: '+counter);
			if (counter===l) {
				console.log('fetcher: posting result to main script'); 
				postMessage(theresult, theresult);
				//https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast
				//https://stackoverflow.com/questions/20042948/sending-multiple-array-buffers-to-a-javascript-web-worker
				if (theresult[0].byteLength) {
				  console.log('fetcher: Transferable fail')
				} else {
				  console.log('fetcher: transferable success')
				}
				setTimeout(function(){console.log('still alive?')}, 1000)
			}
		}, {once: true});
		console.log('Fetchlings['+i+'].addEventListener(\'message\', function(e){theresult['+i+']=e.data; Fetchlings['+i+'].terminate()}, {once: true});')
		Fetchlings[i].postMessage(e.data[i]);
		console.log('Fetchlings['+i+'].postMessage(e.data['+i+']);')
	}
}, {once: true})
