# tweetBot
[Fun Project]Basic tweetBot, which writes the twitter usernames and tweets to blockchain

### Steps to do:
Enter the following in terminal.
1. git clone https://github.com/seshanthS/tweetBot
2. cd tweetBot
3. npm i
4. touch creds.js
5. nano creds.js
6. paste the following (ctrl + shift +v
  ```
  //get twitter developer Account then enter your keys and secrets below
   module.exports = {   
	consumer_key:         '...',
  	consumer_secret:      '...',
  	access_token:         '...',
  	access_token_secret:  '...',
  	timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  	strictSSL:            true,
  	privateKey: 		  'paste your privateKey here'
}
```
7. save and exit
8. node index.js
