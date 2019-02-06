var Twit = require('twit');
var creds = require('./creds.js')
var http = require('http');
var twit = new Twit(creds);
var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
var abi = require('./abi.js');
var contractAddress = '0x473A91A45c1E8437d2Da9465B29E12f2746db574';
var provider = "wss://ropsten.infura.io/ws"


//Hardcoded id, to avoid a crash.
//Dont Remove ...[DOT]
var followers = [3328956259];

function postTweet(msg){
twit.post('statuses/update', {status: msg},(err,data,res)=>{
	console.log("POSTED");
	
});
}
function getFollowers(){

	twit.get('followers/ids',{count:200}, function getData(err,data,res){
		
		if(err){
		console.log(err); 
		}
		else {
			if(data['next_cursor'] == 0)
			followers = data.ids; 
			console.log(followers);
			if(data['next_cursor'] > 0 ){
				twit.get('followers/ids',{next_cursor: data['next_cursor']}, getData);
			}
		}
		
	});
}

/*getFollowers every minute. 
 NOTE TO SELF:
  This api is restricted to 15 requests every 15 minutes.
  Don't Try to change the inerval.	
*/
setInterval(getFollowers, 60000);

var stream = twit.stream('statuses/filter', {track: '@OnScribble',follow: followers});
stream.on('tweet',(tweet)=>{

	var sendReply = false;

	var tweetId = tweet.id_str;
	console.log(tweetId)
	var screenName = tweet.user.screen_name;
	var msg = tweet.text;
	//@dev iterate over user_mentions ,replace mentions from msg
	tweet.entities.user_mentions.forEach((name)=>{
		if(name.screen_name == "OnScribble")
			sendReply = true;
		//Following line Intentionally left blank

		msg = msg.replace("@"+name.screen_name,"");
	});
	console.log(msg)
	if(sendReply == true){
		//stream.stop()
		//replyToTweet(tweetId, screenName);
		writeToBlockchain(tweetId, msg, screenName)		
	}
});
//Stream not ready(not completed yet...
/*
var ReadFromBlockchainStream = twit.stream('statuses/filter', {track: '@OnScribble',follow: followers});
ReadFromBlockchainStream.on('tweet',(tweet)=>{
	var tweetId = tweet.id_str;
	var tweet = msg.text;
	var id;
	if(tweet.includes('@onScribble read')){
		id = tweet.replace('@onScribble read',"");
		readFromBlockchain(id);
	}
	
});
*/
function replyToTweet(tweetId, msg, screenName){
	twit.post('statuses/update', {status: msg, in_reply_to_status_id: tweetId.toString()	}, (err,data, res)=>{
		if(err)
		 console.log(err);
	});
}

//Function Not ready yet
function readFromBlockchain(id){
	var web3 = new Web3(new Web3.providers.WebsocketProvider(provider));
	var contractInstance = new web3.eth.Contract(abi, contractAddress);

	contractInstance.getPastEvents("Write",{filter:{id: id}},(err,res)=>{
         // console.log(err);
          console.log(res);
    }).then((event)=>{
  //        console.log("event \n" + JSON.stringify(event));
  		  console.log(event)
          console.log(" \nevent \n" + JSON.stringify(event.returnValues[1]) + "\n" +
          JSON.stringify(event.returnValues[2]))
          idOnChain = event.returnValues[0];
    	});



}

function writeToBlockchain(tweetId, tweetMsg, tweeter){
	var web3 = new Web3(new Web3.providers.WebsocketProvider(provider));
	var contractInstance = new web3.eth.Contract(abi, contractAddress);
	var data = contractInstance.methods.write(tweeter, tweetMsg) //change Here
	var dataEncoded = data.encodeABI();
	var idOnChain;
	//var privateKey = new Buffer(creds.privateKey.substring(2,66), 'hex');
	//@dev privateKey without '0X' should be given
	var privateKey = new Buffer(creds.privateKey,'hex');
	var address = web3.eth.accounts.privateKeyToAccount('0X'+creds.privateKey).address;

	
	web3.eth.getTransactionCount(address).then(count=>{
	
		var rawTx = {
			from: address,
			to: contractAddress,
			data: dataEncoded,
			nonce: count,
			gasPrice: 20000000000,
			gasLimit: 1000000
		}
		
		var tx = new Tx(rawTx);
		tx.sign(privateKey);
		var serializedTx = tx.serialize();

		web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
		.on('transactionHash', (txHash)=>{
			console.log('TransactionHash: ' + txHash );
			var msg = "@" + tweeter + " Here is your TransactionHash: "+ txHash +  " https://ropsten.etherscan.io/tx/" + txHash +" Wait For Confirmation..."
			replyToTweet(tweetId, msg, tweeter)
		})
		.on('receipt',(receipt)=>{
			console.log("Transaction Mined: " + receipt.transactionHash)
			var msg = '@' + tweeter + " Transaction Mined ...\n https://ropsten.etherscan.io/tx/" + receipt.transactionHash
		+ '\n If you are beginner and geeky, Try decoding the values in "EventLogs" tab. Note down the "id",For checking your msg in future..'
		
			replyToTweet(tweetId, msg, tweeter )
			
		})
		.catch(errorMsg=>{
			console.log(errorMsg);
		});

	}).catch(errorMsg=>{
		console.log(errorMsg);
	});
}

