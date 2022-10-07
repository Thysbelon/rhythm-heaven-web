onmessage = async function(e) {
	console.log('fetchling: received '+e.data)
	//var result = e.data.replace('monky','monkey')
	var response = await fetch(e.data)
	var result=await response.arrayBuffer()
	console.log('fetchling: posting '+result)
	postMessage(result, [result])
	if (result.byteLength) {
	  console.log('Transferable fail')
	} else {
	  console.log('transferable success')
	}
	setTimeout(function(){console.log('still alive?')}, 1000)
}
