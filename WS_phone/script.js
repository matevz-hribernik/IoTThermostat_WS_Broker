
var connection = null;
var url = 'wss://10.10.90.100';
var id = "USR_0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad";
var conn_id = "";
var key = CryptoJS.enc.Hex.parse("2B7E151628AED2A6ABF7158809CF4F3C");
var iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
var connected = false;
var lat;
var long;
function WS_open(id){
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
            console.log(data.data);
            if (data.data[0].name == "SEND"){
                console.log("ADD",data.data[0].value);
                $("#recive").text(data.data[0].value);
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
        txt = $("#text_send").val();
        let msg = {
            packet_type:'MSG', // MSG, ACK, GET, START ...
            transmitter: id,
            receiver: conn_id, // broadcast, multicast
        }
        let data = [
            {
            name:'SEND',
            value:txt,    //ta polja so lahko specifična napravi in klientu
            description: 'New USER imput',
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
    })

    $("#WS_SENSOR").click(function(){
        console.log("WS_SEND_sensor send")
        // var battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery;

        // if (navigator.getBattery) {
        //     navigator.getBattery().then(logBattery);
        // } else if (battery) {
        //     logBattery(battery);
        // }
        if (navigator.geolocation) {
            var options = {timeout:60000};
            navigator.geolocation.getCurrentPosition(success,errorHandler, options);
        }

    })


    $("#save").click(function() {
        //front end change temp instant
        id = $("#id").val();
        conn_id = $("#conn_id").val();
        key = CryptoJS.enc.Hex.parse($("#pass").val());
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
    lat = position.coords.latitude;
    long = position.coords.longitude;

    console.log('Latitude: ' + position.coords.latitude);
    console.log('Longitude: ' + position.coords.longitude);
    let msg = {
        packet_type:'MSG', // MSG, ACK, GET, START ...
        transmitter: id,
        receiver: conn_id, // broadcast, multicast
    }
    let data = [
        {
        name:'Longitude',
        value: long,    //ta polja so lahko specifična napravi in klientu
        description: 'User longitude',
        },
        {
            name:'Latitude',
            value: lat,    //ta polja so lahko specifična napravi in klientu
            description: 'User latitude',
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

