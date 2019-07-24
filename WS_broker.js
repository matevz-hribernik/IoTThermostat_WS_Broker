// const WebSocket = require('ws')
// const http = require('http');

// const wss = new WebSocket.Server({ port: 8080 })

// wss.on('connection', ws => {
//   ws.on('message', message => {
//     console.log(`Received message => ${message}`)
//   })
//   ws.send('ho!')
// })




// app.js
// Minimal amount of secure websocket server
var fs = require('fs');
var http = require('http');
var https = require('https');
// read ssl certificate
var privateKey = fs.readFileSync('ssl-cert/17067342_localhost.key', 'utf8');
var certificate = fs.readFileSync('ssl-cert/17067342_localhost.cert', 'utf8');
var credentials = { key: privateKey, cert: certificate };
const hostname = '10.10.90.100';
const port = 443;
var WebSocketServer = require('ws').Server;
var express         = require('express');
var app             = express();
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
httpServer.listen(80);
httpsServer.listen(443);
var wsServer        = new WebSocketServer({ server : httpsServer });

CLIENTS =  {};
// this will make Express serve your static files
//app.use(express.static(__dirname + '/public'));
app.use(function(req, res, next) {
  if (req.secure) {
  next();
  } else {
  res.redirect('https://' + req.headers.host + req.url);
  }
  });
app.use('/files', express.static('WS_client_broker'))
app.use('/phone', express.static('WS_phone'))
app.use('/thermo', express.static('WS_thermo_phone_client'))

// the rest of your code
wsServer.on('connection', ws => { 
  ws.on('close', message =>{
    console.log("Closed", ws.eventNames())
  });
  ws.on('message', message => {
    console.log(`Received message => ${message}`);

    // var msg_split = message.split(" ");
    // if (msg_split[0]=="Sign"){
    //   var id = msg_split[3];
    //   console.log("ID joined to server: "+ id);
    //   //CLIENTS.set(id, ws);
    //   CLIENTS[id]=ws;
    //   //console.log(CLIENTS);
    // }

    if (IsJsonString(message)){
      var message_obj = JSON.parse(message);
      if (message_obj.hasOwnProperty("packet_type") && message_obj.packet_type=="LOG_ON"){
        var id = message_obj.transmitter;
        console.log("ID joined to server: "+ id);
        try{
          CLIENTS[id].close();
          delete CLIENTS[id];
          console.log("Client with same name changed")
        }catch{
          console.log("no clients removed")
        }
        CLIENTS[id]=ws;
        var obj = {
          packet_type: 'ACK_LOG_ON',
          transmitter: hostname+":"+port,
          receiver: id
        };
        obj = JSON.stringify(obj);
        responseToClient(id, obj);
      }//                             transmitter                                  receiver                                  data 
      // one to one broker            transmitter                                  receiver                                  data
      if (message_obj.hasOwnProperty('transmitter') && message_obj.hasOwnProperty('receiver') && message_obj.hasOwnProperty('data')){
        responseToClient(message_obj.receiver , message);
      }
      //broadcast - to all data not aes
      if (message_obj.hasOwnProperty('transmitter') && message_obj.hasOwnProperty('receiver') && message_obj.receiver == "broadcast"){
        responseToClient("all" , message);
      }
      //multicast to be implemented.
      if (message_obj.hasOwnProperty('transmitter') && message_obj.hasOwnProperty('receiver') && message_obj.receiver == "multicast" && message_obj.hasOwnProperty('theme')){

      }
    }

  });
  //console.log(`Vzpostavitev povezave WS!`)
  //ws.send('Vzpostavila sva povezavo!') //TODO ACK_LOG_ON
});

function responseToClient(id, msg){
  //response which is send to MCU when sensor sends data and when configoration of the server is changed.
  //include curent temp, wantend temp, instrution (heat, stendby), time
  console.log("called response "+id);
  try{
  if (id == "all"){
    for (var key of CLIENTS) {
      //client = CLIENTS.get(key);
      //client.send(msg);
      CLIENTS[key].send(msg);
    }
  }else{
    //client=CLIENTS.get(id);
    //console.log(client);
    CLIENTS[id].send(msg);
    //client.send(msg);
  }}catch(err){
    console.log(err);
  }
}

function IsJsonString(str) {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}
function isset(c){
  if( typeof c !== 'undefined' ) {
      return true;
  }
  return false;
}

function encrypt(message = '', key = ''){
  var message = CryptoJS.AES.encrypt(message, key);
  return message.toString();
}
function decrypt(message = '', key = ''){
  var code = CryptoJS.AES.decrypt(message, key);
  var decryptedMessage = code.toString(CryptoJS.enc.Utf8);

  return decryptedMessage;
}