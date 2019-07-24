
var connection = null;
var url = 'wss://10.10.90.100';
var id = "USR_TEST_THAT";
var conn_id = "";
var key = CryptoJS.enc.Hex.parse("2B7E151628AED2A6ABF7158809CF4F3C");
var iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
var connected = false;
var G_lat = 46.2316178;
var G_long = 15.2657849;
var G_TEMP;
var G_HOME_TEMP;
var G_AWAY_TEMP;
var G_MANUAL;
var G_RELEY;
var G_HOME; 

function WS_open(id){
    if (navigator.geolocation) {
        var options = {timeout:60000};
        navigator.geolocation.watchPosition(success, errorHandler, options)
    }
    connection = new WebSocket(url);

    connection.onopen = (e) => {
        let msg = {
            packet_type:'LOG_ON',
            transmitter: id,
            receiver: url,
        }
        connection.send(JSON.stringify(msg));
    }

    connection.onerror = (error) => {
    console.log(`WebSocket error: ${error}`)
    }
    connection.onclose = function(e) {
        console.log('Disconnected!');
        connected = false;
    };

    connection.onmessage = function (event) {
        console.log(event.data);
        data = JSON.parse(event.data);
        //WS posodobitev frontend.
        if (data.packet_type == "ACK_LOG_ON"){
            console.log('Connected to Broker')
            connected = true;
        }
        if (data.packet_type == "START"){
            console.log('START connection to ', data.transmitter)
            conn_id=data.transmitter;
            //start procedure when client conncets to this IoT device 
        }
        if (data.packet_type == "MSG"){
            console.log('MSG from ', data.transmitter)
            data.data = JSON.parse(decrypt(data.data, key, iv));
            console.log(data.data[0]);
            if (data.data[0].instruction == "STATE"){
                G_TEMP = data.data[0].current_temp;
                G_HOME_TEMP = data.data[0].home_temp;
                G_AWAY_TEMP = data.data[0].away_temp;
                G_RELEY = data.data[0].reley;
                G_HOME = data.data[0].home;
                G_MANUAL = data.data[0].manual;
                updateview();
            }
            //recived data from connceted device
        }
    }
    setTimeout(function(){
        if (conn_id != ""){
            let msg = {
                packet_type:'START', // MSG, ACK, GET, START ...
                transmitter: id,
                receiver: conn_id, // broadcast, multicast
            }
            let data = [
                {
                name:'Functions',
                value:'GET, POST',    //ta polja so lahko specifična napravi in klientu
                description: 'Different functions for interaction',
                },
            ]
            // var words = CryptoJS.enc.Utf8.parse(JSON.stringify(data)); // WordArray object
            // var plaintext_b64 = CryptoJS.enc.Base64.stringify(words)
            // let ebytes = CryptoJS.AES.encrypt( plaintext_b64, key, { iv: iv } );
            // let ciphertext = ebytes.toString();
            // msg.data = ciphertext;
            msg.data = encrypt(JSON.stringify(data), key, iv)
            console.log("msg send", decrypt(msg.data,key,iv))

            connection.send(JSON.stringify(msg));
            console.log("START sent to", conn_id)
        }
    },100)

}

  $(document).ready(function(){
    $("#id").val(id);
    $("#conn_id").val(conn_id);
    $("#pass").val(key);
    $("#latitude").val(G_lat);
    $("#longitude").val(G_long);
    url = "wss://"+window.location.host
    $(".time_btn, .btn_nows").click(function(){
        //close websocket
        try {
            connection.close();
        } catch (error) {
            console.log(error);
        }
    });
    $("#WS_toggle").click(function(){
        //open websocket
        WS_open(id);
    });
    $("#WS_SEND").click(function(){
        if (conn_id != ""){
            let hometemp = $("#set_home_temp").val();
            let awaytemp = $("#set_away_temp").val();
            let manual = $("#set_manual_reley").is(':checked');
            manual = manual.toString();
            let msg = {
                packet_type:'MSG', // MSG, ACK, GET, START ...
                transmitter: id,
                receiver: conn_id, // broadcast, multicast
            }
            let data = [
                {
                instruction: "SET",
                home_temp:hometemp,
                away_temp:awaytemp,    //ta polja so lahko specifična napravi in klientu
                reley: manual,
                },
            ]
            // var words = CryptoJS.enc.Utf8.parse(JSON.stringify(data)); // WordArray object
            // var plaintext_b64 = CryptoJS.enc.Base64.stringify(words)
            // let ebytes = CryptoJS.AES.encrypt( plaintext_b64, key, { iv: iv } );
            // let ciphertext = ebytes.toString();
            // msg.data = ciphertext;
            msg.data = encrypt(JSON.stringify(data), key, iv)
            console.log("msg send", decrypt(msg.data,key,iv))

            connection.send(JSON.stringify(msg));
            $("#text_send").val("");
        }
    })

    $("#WS_SENSOR").click(function(){
        console.log("WS_SEND_sensor send")
        // var battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery;

        // if (navigator.getBattery) {
        //     navigator.getBattery().then(logBattery);
        // } else if (battery) {
        //     logBattery(battery);
        // }
    })


    $("#save").click(function() {
        //front end change temp instant
        id = $("#id").val();
        conn_id = $("#conn_id").val();
        key = CryptoJS.enc.Hex.parse($("#pass").val());
        G_lat = $("#latitude").val();
        G_long = $("#longitude").val();
        WS_open(id);
    });
    $(".time_btn").click(function() {
        var new_time=parseInt($(this).val());
        //console.log(new_time);
        $(".time_btn").removeClass("active");
        $(this).addClass("active");
        clearInterval(interval)
        timeout_time=new_time;
        interval=setInterval(load_Frontinfo, timeout_time*1000);
        //console.log(new_time);
    });
    $("#generate_btn").click(function(){
        let UUID = generate_UUID();
        $("#id").val(UUID);
    });

  });


function encrypt(message = '', key = '', iv){
    var words = CryptoJS.enc.Utf8.parse(message); // WordArray object
    var plaintext_b64 = CryptoJS.enc.Base64.stringify(words)
    let ebytes = CryptoJS.AES.encrypt( plaintext_b64, key, { iv: iv } );
    return ebytes.toString();
    // var message = CryptoJS.AES.encrypt(message, key, { iv: iv });
    // return message.toString();
}

function decrypt(message = '', key = '', iv){
    //message in base64
    var bytes  = CryptoJS.AES.decrypt( message, key, { iv: iv } );
    var plaintext = bytes.toString(CryptoJS.enc.Utf8);
    var words = CryptoJS.enc.Base64.parse(plaintext);
    var decryptedMessage = CryptoJS.enc.Utf8.stringify(words); 
        
    // var code = CryptoJS.AES.decrypt(message, key, { iv: iv });
    // var decryptedMessage = code.toString(CryptoJS.enc.Utf8);

    return decryptedMessage;
}

function logBattery(battery) {
    console.log(battery.level);
    console.log(battery.charging);
    console.log(dischargingTime);

    battery.addEventListener('chargingchange', function() {
        console.log('Battery chargingchange event: ' + battery.charging);
    }, false);
}

function success(position) {
    let lat = position.coords.latitude;
    let long = position.coords.longitude;


    console.log('Latitude: ' + position.coords.latitude);
    console.log('Longitude: ' + position.coords.longitude);

    var R = 6371e3; // metres
    var φ1 = Math.radians(G_lat);
    var φ2 = Math.radians(lat);
    var Δφ = Math.radians(lat-G_lat);
    var Δλ = Math.radians(G_long-long);

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = R * c;
                    //c2 = (xA − xB)2 + (yA − yB)2
    console.log("Distance: "+d);
    if (conn_id != ""){
        let msg = {
            packet_type:'MSG', // MSG, ACK, GET, START ...
            transmitter: id,
            receiver: conn_id, // broadcast, multicast
        }
        var data;
        if (d<10000){
            data = [
                {
                    instruction: "HOME_set",
                    distance:d,
                    home:"true",    //ta polja so lahko specifična napravi in klientu
                },
            ]
            // var words = CryptoJS.enc.Utf8.parse(JSON.stringify(data)); // WordArray object
            // var plaintext_b64 = CryptoJS.enc.Base64.stringify(words)
            // let ebytes = CryptoJS.AES.encrypt( plaintext_b64, key, { iv: iv } );
            // let ciphertext = ebytes.toString();
            // msg.data = ciphertext;
        }else{
            data = [
                {
                    instruction: "HOME_set",
                    distance:d,
                    home:"false",    //ta polja so lahko specifična napravi in klientu
                },
            ]
            // var words = CryptoJS.enc.Utf8.parse(JSON.stringify(data)); // WordArray object
            // var plaintext_b64 = CryptoJS.enc.Base64.stringify(words)
            // let ebytes = CryptoJS.AES.encrypt( plaintext_b64, key, { iv: iv } );
            // let ciphertext = ebytes.toString();
            // msg.data = ciphertext;
        }
        msg.data = encrypt(JSON.stringify(data), key, iv)
        console.log("msg send", decrypt(msg.data,key,iv))

        connection.send(JSON.stringify(msg));
    }
}
function errorHandler(err) {
    if(err.code == 1) {
       alert("Error: Access is denied!");
    }
    else if( err.code == 2) {
       alert("Error: Position is unavailable!");
    }
 }

 function generate_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}


function updateview(){
    $("#measured_temp").text(G_TEMP);
    $("#home_temp").text(G_HOME_TEMP);
    $("#away_temp").text(G_AWAY_TEMP);
    if (G_RELEY != "0"){
        $("#heating_bool").text("ON");
    }else{
        $("#heating_bool").text("OFF");
    }
    if (G_MANUAL != "0"){
        if (!$(set_manual_reley).is(':checked')) {
            $("#set_manual_reley").click()
        }
    }else{
        if ($(set_manual_reley).is(':checked')) {
            $("#set_manual_reley").click();
        }
    }
    $("#set_home_temp").val(G_HOME_TEMP);
    $("#set_away_temp").val(G_AWAY_TEMP);

    if (G_HOME == "1"){
        $("#user_location").text("doma");
    }else{
        $("#user_location").text("zdoma");
    }
}
// Converts from degrees to radians.
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
  };
   
  // Converts from radians to degrees.
Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
};
  
// setInterval(function(){
//     if (navigator.geolocation) {
//         var options = {timeout:60000};
//         navigator.geolocation.getCurrentPosition(success,errorHandler, options);
//     }
// },10000)