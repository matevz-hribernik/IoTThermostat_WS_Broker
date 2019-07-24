var connection = null;
const url = 'ws://10.10.90.100:3030';
var id = "USR_0612650abd575ab9b94a26e0d29f20948e838d3812bc79285f45dcad";
var key = "GesloTEST";
var iv = CryptoJS.enc.Hex.parse('AAAAAAAAAAAAAAAAAAAAAA==');
function WS_open(id){
    connection = new WebSocket(url);
    

    connection.onopen = (e) => {
        connection.send('Sign on as '+id);
    }

    connection.onerror = (error) => {
    console.log(`WebSocket error: ${error}`)
    }
    connection.onclose = function(e) {
        console.log('Disconnected!');
    };

    connection.onmessage = function (event) {
        console.log(event.data);
        data = JSON.parse(event.data);
        console.log(data.meta);
        //WS posodobitev frontend.
        if (data.meta.table=="frontend"){
            console.dir(data.data.toString());
            data.data = decrypt(data.data.toString(), key);
            console.dir(data.data);
            data.data=JSON.parse(data.data);
            console.dir(data.data);
            $( "#moment_temp" ).text(data.data.zmerjena_vrednost+"ºC");
            $( "#set_temp span" ).text(data.data.zeljena_vrednost+"ºC");

            if (data.data.nastavitev_vrednost==0){
                $( "#stanje" ).text("Peč izklopljena");
                $( "#stanje_change" ).hide();
            }else{
                $( "#stanje" ).text("Peč vklopljena");
                $( "#stanje_change" ).show();
                $( "#stanje_change" ).text(data.data.zmerjena_vrednost+"ºC ->"+data.data.zeljena_vrednost+"ºC");
            }
            connection.send('Posodobitev Frontend na '+id);
        }
    }

}

//get data from server for forntinfo
var chartdata1=[];
var chartdata2=[];
var timeout_time = 10;
var interval = 1;

  $(document).ready(function(){
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
        WS_open("USR_c57f73cac4c1f396d5ca6ca7daef307a536b957bf8b70abd567c64c1");
    });
    if (document.location.pathname == "/") {
        interval = setInterval(load_Frontinfo, timeout_time*1000);
        window.onload = load_Frontinfo();
    }
    if (document.location.pathname == "/urnik") {
        //setInterval(load_Urnik, 10000);
        window.onload = load_Urnik();
        $( "#datetimepicker2" ).datetimepicker({format: 'yyyy-mm-dd hh:ii'});
    }
    if (document.location.pathname == "/zgodovina") {
        //setInterval(load_Urnik, 10000);
        window.onload = load_History();
        //$( "#datetimepicker2" ).datetimepicker({format: 'yyyy-mm-dd hh:ii'});
    }
    $("#save2").click(function() {
        var datum = $("#datetimepicker2").val();
        var temperature = $("#temperature").val();
        var exp = $("#expiered").val();
        $.post( "/api/change_temp", { temperature: temperature, time: datum, expiered: exp})
        .done(function( data ) {
            //alert( "Data Loaded: " + data );
            window.location.reload();
        });
    });
    $("#save").click(function() {
        //front end change temp instant
        var temperature = $("#temperature").val();
        if ($(".time_btn.active").attr('id') == "WS_toggle"){
            packet = '{"packet_type":"USR_SET", "ID_server":"10.10.90.100:3030", "ID_client":"'+id+'", "data":{ "set_temp": '+temperature+'}}';
            connection.send(packet);
        }else{
            $.post( "/api/change_temp", { temperature: temperature})
            .done(function( data ) {
                //alert( "Data Loaded: " + data );
                //window.location.reload();
            });
        }
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

  });

function load_Frontinfo(){
    console.log("loadFrontinfo called");
    console.log(timeout_time);
    $.getJSON( "/api/frontinfo", function( data ) {
        $( "#moment_temp" ).text(data.data.zmerjena_vrednost+"ºC");
        $( "#set_temp span" ).text(data.data.zeljena_vrednost+"ºC");

        if (data.data.nastavitev_vrednost==0){
            $( "#stanje" ).text("Peč izklopljena");
            $( "#stanje_change" ).hide();
        }else{
            $( "#stanje" ).text("Peč vklopljena");
            $( "#stanje_change" ).show();
            $( "#stanje_change" ).text(data.data.zmerjena_vrednost+"ºC ->"+data.data.zeljena_vrednost+"ºC");
        }
        //console.log("changed",data);
      });   
}
function load_History(){
    console.log("load_History history")
    $.getJSON( "/api/history", function( data ) {
        data1 = data.data;
        //console.log(data1);
        data1.forEach(i => {
            var date = new Date(i.datum_ura);
            chartdata1.push({
                x: date.toLocaleString("en",{"year":"numeric","month":"2-digit","day":"2-digit","minute":"2-digit","hour":"2-digit"}).replace(",", "").replace("AM", "").replace("PM", ""),
                y: i.vrednost
            })
        });
        console.log(chartdata1);
        var ctx = document.getElementById('myChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                label: [
                    newDate(0),
                    newDate(1),
                ],
                datasets: [{
                    label: 'Nastavljene temperature - Urnik',
                    fill: false,
                    data: chartdata1,

                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                },
                {
                    label: 'Izmerjene temperature',
                    fill: false,
                    data: chartdata2,

                    backgroundColor: [
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                title: {
                            text: 'Chart.js Time Scale'
                        },
                        scales: {
                            xAxes: [{
                                type: 'time',
                                time: {
                                    parser: timeFormat,
                                    // round: 'day'
                                    tooltipFormat: 'll HH:mm'
                                },
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Date'
                                }
                            }],
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'value'
                                },
                                ticks: {
                                    beginAtZero:true
                                }
                            }]
                }
            }
        });
    });  
    //myChart.data.datasets[0].data=chartdata1;
}
function load_Urnik(){
    console.log("load_Urnik called")
    $.getJSON( "/api/timetable", function( data ) {
        data.data_time.forEach(element => {
            id = element.id;
            ura = new Date(element.datum_ura);
            var date = ura.getFullYear()+'-'+(ura.getMonth()+1)+'-'+ura.getDate();
            var time = ura.getHours() + ":" + ura.getMinutes();
            ura_n=date+' '+time;
            vrednost = element.vrednost+element.enota;
            expired = element.expiered;
            $( ".list-group" ).append(
                '<a href="#"  class="list-group-item list-group-item-action flex-column align-items-start">'+
                '<div class="d-flex w-100 justify-content-between mb-1">'+
                    '<h5 class="mb-1">'+ura_n+'</h5>'+
                    '<small class="id">ID: '+id+'</small>'+
                    '</div>'+
                    '<p class="mb-1">'+vrednost+'</p>'+
                    '<small class="exp">EXPIRED: '+expired+'</small>'
                +'</a>'
            )
        });
        //console.log("changed",data);
      });   
}


function encrypt(message = '', key = ''){
    var message = CryptoJS.AES.encrypt(message, key, { iv: iv });
    return message.toString();
}
function decrypt(message = '', key = ''){
    var code = CryptoJS.AES.decrypt(message, key, { iv: iv });
    var decryptedMessage = code.toString(CryptoJS.enc.Utf8);

    return decryptedMessage;
}


// function test(){
//     connection.send(JSON.stringify({Data:'Podatki'}));
// }
//var Chart = require('Chart.js');

var timeFormat = 'MM/DD/YYYY HH:mm';

function newDate(days) {
    return moment().add(days, 'd').toDate();
}

function newDateString(days) {
    return moment().add(days, 'd').format(timeFormat);
}

