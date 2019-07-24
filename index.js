const http = require('http');
var mysql = require('mysql');
//var aesjs = require('aes-js');
var CryptoJS = require("crypto-js");
var geslo = "GesloTEST"
//key = CryptoJS.enc.Base64.parse(key)
const hostname = '127.0.0.1';
const port = 3000;

const express = require('express');
var bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.listen(port, () => console.log(`FirePlace app listening on port: ${port}!`));


//Socket for API with ESP
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 3030, clientTracking:true })
//CLIENTS = new Map();
CLIENTS =  {};
var curent_temperature = 0.0;
var wanted_tempearture = 15.0;
var heating = false;

var con = mysql.createPool({
  multipleStatements: true,
  connectionLimit : 2,
  host: "hribernik.eu",
  user: "ihpulltl_fire",
  password: "firefire13",
  database: "ihpulltl_fireplace"
});

// con.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

con.on('error', function (err) {
  console.log('caught this error: ' + err.toString());
});

app.get('/', (req, res) => { 
  res.sendFile("./WS_client/index.html",{root: __dirname});
  //responseToSensors("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad", "TEST FORM FRONTINFO");
});
app.get('/urnik', (req, res) => { 
  res.sendFile("./WS_client/urnik.html",{root: __dirname});
  //responseToSensors("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad", "TEST FORM FRONTINFO");
});
app.get('/zgodovina', (req, res) => { 
  res.sendFile("./WS_client/zgodovina.html",{root: __dirname});
  //responseToSensors("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad", "TEST FORM FRONTINFO");
});
app.use('/files', express.static('WS_client'))


app.get('/test', function (req, res) {
  //responseToSensors("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad", "TEST FORM FRONTINFO");
    con.query('SELECT * FROM uporabniki', function (error, results, fields) {
    if (error) throw error;
    //console.log('The solution is: ', results[0].solution);
    var resultJson = JSON.stringify(results);
    resultJson = JSON.parse(resultJson);
    var apiResult = {};        
    // create a meta table to help apps
    //do we have results? what section? etc
    apiResult.meta = {
      table: "uporabniki",
      type: "collection",
      total: 1,
      total_entries: 0
    }
    //add our JSON results to the data table
    apiResult.data = resultJson;   
    //send JSON to Express
    res.json(apiResult);
    //res.json(resoults);
  });
  //con.end();
});
app.get('/api/frontinfo', function (req, res) {
  //responseToSensors("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad", "TEST FORM FRONTINFO");
  //send user - vanted temperature, current temp, other sensor data, 
  //is the heating on or off, the timetable for the future 5 days. 
  setTimeout(function () {
    checkSensorMeasurmentAndTimetable("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad",wanted_tempearture);
}, 1000);
  var sql1='select meritve.id meritve_id, meritve.vrednost zmerjena_vrednost, meritve.time mertive_time, merilne_tocke.`hash_id`, merilne_tocke.`zeljena_vrednost`, merilne_tocke.`enota`, nastavitve.vrednost nastavitev_vrednost, nastavitve.`ime` ime_nastavitve from meritve left JOIN merilne_tocke ON meritve.id_merilne_tocke = merilne_tocke.id LEFT JOIN nastavitve ON nastavitve.ime = "fireplace" order by meritve.time DESC LIMIT 1; select * from urnik where datum_ura > now() and expiered != 1 order by datum_ura asc limit 7;';
  con.query(sql1, [2, 1], function (error, results, fields) {
  if (error) throw error;
  //console.log('The solution is: ', results[0].solution);
  var resultJson1 = JSON.stringify(results[0]);
  resultJson1 = JSON.parse(resultJson1); 
  var resultJson2 = JSON.stringify(results[1]);
  resultJson2 = JSON.parse(resultJson2); 
  var apiResult = {};      
  // create a meta table to help apps
  //do we have results? what section? etc
  //console.log(resultJson1);
  apiResult.meta = {
    table: "frontend",
    type: "collection",
    total: resultJson1.length+resultJson2.length,
    chart_entries: resultJson2.length
  }
  //add our JSON results to the data table
  apiResult.data = resultJson1[0];
  apiResult.data_chart = resultJson2;
  //send JSON to Express
  //res.json(resoults);
  res.json(apiResult);
  });
//con.end();
});

function WS_api_frontinfo(id){
  setTimeout(function () {
    checkSensorMeasurmentAndTimetable("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad",wanted_tempearture);
}, 1000);
  var sql1='select meritve.id meritve_id, meritve.vrednost zmerjena_vrednost, meritve.time mertive_time, merilne_tocke.`hash_id`, merilne_tocke.`zeljena_vrednost`, merilne_tocke.`enota`, nastavitve.vrednost nastavitev_vrednost, nastavitve.`ime` ime_nastavitve from meritve left JOIN merilne_tocke ON meritve.id_merilne_tocke = merilne_tocke.id LEFT JOIN nastavitve ON nastavitve.ime = "fireplace" order by meritve.time DESC LIMIT 1; select * from urnik where datum_ura > now() and expiered != 1 order by datum_ura asc limit 7;';
  con.query(sql1, [2, 1], function (error, results, fields) {
  if (error) throw error;
  //console.log('The solution is: ', results[0].solution);
  var resultJson1 = JSON.stringify(results[0]);
  resultJson1 = JSON.parse(resultJson1); 
  var resultJson2 = JSON.stringify(results[1]);
  resultJson2 = JSON.parse(resultJson2); 
  var apiResult = {};      
  // create a meta table to help apps
  //do we have results? what section? etc
  //console.log(resultJson1);
  apiResult.meta = {
    table: "frontend",
    type: "collection",
    total: resultJson1.length+resultJson2.length,
    chart_entries: resultJson2.length
  }
  //add our JSON results to the data table
  apiResult.data = encrypt(JSON.stringify(resultJson1[0]), geslo);
  apiResult.data_chart = resultJson2;
  //send JSON to Express
  //res.json(resoults);
  responseToSensors(id, JSON.stringify(apiResult));
  });
//con.end();
}

app.post('/api/change_temp', function (req, res) {
  //when user changes temperature this fucntion takes over and does what is requierd
  //two options, update if there si already set temperature on the timetable or
  //and insert into if there is no new dates.
  //prejeti je treba datum/uro + temperaturo. expiry
  //console.log(req.body);
  var temp = req.body.temperature;
  var time = req.body.time;
  var id = req.body.id;
  var exp = req.body.expiered;
  var sql="";
  setTimeout(function () {
    checkSensorMeasurmentAndTimetable("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad",wanted_tempearture);
}, 1000);
  if (isset(req.body.id)){
    console.log("update");
    sql = "UPDATE urnik SET datum_ura = '"+time+"', vrednost = '"+temp+"', expiered = '"+exp+"' WHERE id = "+id+";"
  }else if(isset(req.body.time)){
    console.log("insert");
    sql = "INSERT INTO urnik (datum_ura, vrednost, enota) VALUES ('"+time+"', "+temp+", 'C')";
  }else{
    console.log("insert now");
    sql = "INSERT INTO urnik (datum_ura, vrednost, enota) VALUES (now(), "+temp+", 'C')";
  }
  con.query(sql, function (error, results, fields) {
  if (error) throw error;
  //console.log('The solution is: ', results[0].solution);
  var resultJson = JSON.stringify(results);
  resultJson = JSON.parse(resultJson);
  var apiResult = {};        
  // create a meta table to help apps
  //do we have results? what section? etc
  apiResult.meta = {
    table: "temparatura",
    type: "dodana",
    total: 1,
    total_entries: 0
  }
  //add our JSON results to the data table
  apiResult.data = resultJson;   
  //send JSON to Express
  //res.json(resoults);
  res.json(apiResult);
  });

  //responseToSensors("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad", "TEST FORM FRONTINFO");
//con.end();
});

function WS_api_change_temp(id, temp){
  setTimeout(function () {
    checkSensorMeasurmentAndTimetable("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad",wanted_tempearture);
}, 1000);
    console.log("insert now");
    sql = "INSERT INTO urnik (datum_ura, vrednost, enota) VALUES (now(), "+temp+", 'C')";

  con.query(sql, function (error, results, fields) {
    if (error) throw error;
    //console.log('The solution is: ', results[0].solution);
    var resultJson = JSON.stringify(results);
    resultJson = JSON.parse(resultJson);
    var apiResult = {};        
    // create a meta table to help apps
    //do we have results? what section? etc
    apiResult.meta = {
      table: "temparatura",
      type: "dodana",
      total: 1,
      total_entries: 0
    }
    //add our JSON results to the data table
    apiResult.data = resultJson;   
    //send JSON to Express
    //res.json(resoults);
    responseToSensors(id, JSON.stringify(apiResult));
  });
}

app.get('/api/timetable', function (req, res) {
  //responseToSensors("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad", "TEST FORM timetable");
  //Get set temperature timetable from now till the last item in DB.
  function query (callback){
    con.query('select * from urnik where datum_ura < now() order by datum_ura desc limit 1; select * from urnik where datum_ura > now() order by datum_ura asc; ',[2,1], function (error, results, fields) {
      if (error) throw error;
      //console.log('The solution is: ', results[0].solution);
      var resultJson1 = JSON.stringify(results[0]);
      resultJson1 = JSON.parse(resultJson1);
      var resultJson2 = JSON.stringify(results[1]);
      resultJson2 = JSON.parse(resultJson2);
      var apiResult = {};       
      // create a meta table to help apps
      //do we have results? what section? etc
      apiResult.meta = {
        table: "timetable",
        type: "collection",
        total: 1,
        total_entries: resultJson1.length+resultJson2.length
      }
      //add our JSON results to the data table
      apiResult.data_time = resultJson1;
      resultJson2.forEach(i => {
        apiResult.data_time.push(i);
      });
      //apiResult.data_time.push(resultJson2);
      callback(null,apiResult);
      //return apiResult;
      //send JSON to Express
      //res.json(resoults);
    });
  }

  
  function myCallback(err, value) {
    if (err) {
      // handle error
      return; // Returning here is important!
    }
    res.json(value);  
    // Do something with value
  }
  query(myCallback);
//con.end();
});

app.get('/api/history', function (req, res) {
  //Get data measurment from given sensor for choosen time slot.
  con.query('select * from urnik where datum_ura <= now() order by datum_ura desc limit 7;', function (error, results, fields) {
  if (error) throw error;
  //console.log('The solution is: ', results[0].solution);
  var resultJson = JSON.stringify(results);
  resultJson = JSON.parse(resultJson);
  var apiResult = {};        
  // create a meta table to help apps
  //do we have results? what section? etc
  apiResult.meta = {
    table: "histroy",
    type: "collection",
    total: 1,
    total_entries: resultJson.length
  }
  //add our JSON results to the data table
  apiResult.data = resultJson;   
  //send JSON to Express
  res.json(apiResult);
  //res.json(resoults);
  });
//con.end();
});


app.post('/api/del_temp', function (req, res) {
  //used to make urnik data expiered
  con.query('SELECT * FROM uporabniki', function (error, results, fields) {
  if (error) throw error;
  //console.log('The solution is: ', results[0].solution);
  var resultJson = JSON.stringify(results);
  resultJson = JSON.parse(resultJson);
  var apiResult = {};        
  // create a meta table to help apps
  //do we have results? what section? etc
  apiResult.meta = {
    table: "uporabniki",
    type: "collection",
    total: 1,
    total_entries: 0
  }
  //add our JSON results to the data table
  apiResult.data = resultJson;   
  //send JSON to Express
  res.json(apiResult);
  //res.json(resoults);
  });
//con.end();
});









/* const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
}); */



//Socket for API with ESP
wss.on('connection', ws => {
  //CLIENTS.push(ws);
  //CLIENTS.set(id, ws);
  ws.on('close', message =>{
    console.log("Closed", ws.eventNames())
  })
  ws.on('message', message => {
    var msg_split = message.split(" ");
    if (msg_split[0]=="Sign"){
      var id = msg_split[3];
      console.log("ID joined to server: "+ id);
      //CLIENTS.set(id, ws);
      CLIENTS[id]=ws;
      //console.log(CLIENTS);
    }
    
    console.log(`Received message => ${message}`)
    

    if (IsJsonString(message)){
      message_obj = JSON.parse(message);
      if (message_obj.hasOwnProperty("packet_type") && message_obj.packet_type=="measurment"){
        //get data from sensor via WS write it to the DB and choose the next step, response is neded sent response to MCU
        //ws.send("Server_ACK");
        //save data to DB
        writeSensorData(message_obj.ID_client, message_obj.data.measured_temperature);
        //check if db is diffrent from global variables
        checkSensorMeasurmentAndTimetable(message_obj.ID_client, message_obj.data.wanted_temperature);
        setSettingsMeasuringSpot(message_obj.data.wanted_temperature,message_obj.data.reley_on, message_obj.ID_client);
        WS_api_frontinfo("USR_c57f73cac4c1f396d5ca6ca7daef307a536b957bf8b70abd567c64c1");
        //ws.send(message_obj.Data);
      }else if (message_obj.hasOwnProperty("packet_type") && message_obj.packet_type=="ACK"){
        //client je poslal nazaj odgovor. TODO
        console.log("ACK recived from", message_obj.ID_client)
        setSettingsMeasuringSpot(message_obj.data.wanted_temperature,message_obj.data.reley_on, message_obj.ID_client);
      }else if(message_obj.hasOwnProperty("packet_type") && message_obj.packet_type=="USR_SET"){
        WS_api_change_temp("USR_c57f73cac4c1f396d5ca6ca7daef307a536b957bf8b70abd567c64c1",message_obj.data.set_temp)
        setTimeout(function () {
          WS_api_frontinfo("USR_c57f73cac4c1f396d5ca6ca7daef307a536b957bf8b70abd567c64c1")
      }, 3000);
      }else{
        ws.send("Napačni podatki v JSON obliki");
      }
    }
    if(message=="ACK"){
      console.log(`ACK RECIVED`)
    }
  })
  console.log(`Vzpostavitev povezave WS!`)
  ws.send('Vzpostavila sva povezavo!')
})


function responseToSensors(id, msg){
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
function writeSensorData(sensor_id,value){
  //write data to DB from sensor. 
  sql= "INSERT INTO meritve (id_merilne_tocke, vrednost, time) SELECT merilne_tocke.id, "+value+", now() FROM merilne_tocke WHERE merilne_tocke.hash_id = '"+sensor_id+"';";
  //sql = "INSERT INTO mertive (id_merilne_tocke, vrednost) VALUES ('"+sensor_id+"', "+value+")";
  con.query(sql, function (error, results, fields) {
    if (error) throw error;
    //console.log('Dodano v data bazo: ', results);
  });
}

const intervalObj = setInterval(() => {
  checkSensorMeasurmentAndTimetable("0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad",wanted_tempearture+1)
}, 30000);
const intervalObj2 = setInterval(() => {
  WS_api_frontinfo("USR_c57f73cac4c1f396d5ca6ca7daef307a536b957bf8b70abd567c64c1");
}, 30000);

function checkSensorMeasurmentAndTimetable(id,wantedTemp){
  //if client need to heat up
  //that is chacked with db
  //send instrution response to client
  sql1 = "select urnik.id as urnik_id, urnik.`datum_ura` as urnik_time, urnik.vrednost as urnik_vrednost, meritve.id as meritve_id, meritve.vrednost as meritve_vrednost, meritve.time as meritve_time from urnik, meritve where `datum_ura`< now() and time < now() and urnik.expiered !=1 order by datum_ura desc, time desc limit 1;";
  con.query(sql1, function (error, results, fields) {
    if (error) throw error;
    var resultJson1 = JSON.stringify(results);
    resultJson1 = JSON.parse(resultJson1);
    resultJson1=resultJson1[0];
    console.log("Check db", resultJson1.meritve_vrednost, resultJson1.urnik_vrednost);
    if (resultJson1.urnik_vrednost>=resultJson1.meritve_vrednost || wantedTemp!=resultJson1.urnik_vrednost){
      var apiResult = {
        packet_type:"instruction",
        ID_server: hostname+":"+port,
        ID_client:id
      };        
      // create a meta table to help apps
      //do we have results? what section? etc
      wanted_tempearture = resultJson1.urnik_vrednost;
      apiResult.data = {
        wanted_temperature:resultJson1.urnik_vrednost
      }
      responseToSensors(id, JSON.stringify(apiResult));
    }
  });
}

function setSettingsMeasuringSpot(Wantedtemp, reley, id){
  sql1 = "update merilne_tocke set `zeljena_vrednost` = "+Wantedtemp+", `time_vrednosti` = now() where hash_id='"+id+"';";
  sql2 = "update nastavitve set vrednost = '"+reley+"' where ime = 'fireplace' and id_connceted = '"+id+"';";
  con.query(sql1+sql2, [2,1], function (error, results, fields) {
    if (error) throw error;
    //console.log('Dodano v data bazo: ', results);
  });
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