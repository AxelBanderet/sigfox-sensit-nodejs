//Main class

var express = require("express");
var myParser = require("body-parser");
var hexToBinary = require('hex-to-binary');
var app = express();

const pg = require('pg');
const pool = new pg.Pool({
    user: 'user',
    host: 'host',
    database: 'database',
    password: 'password',
    port: '5432'
});

var humidity = new String("humidity");
var temperature = new String("temperature");
var mapHumidityTemperature = new Map();
var humidityDisplayed = new String();
var temperatureDisplayed = new String();
var finalHumidity = new String();
var finalTemperature = new String();
var result;
var listHumidity=[];
var listTemperature=[];

app.use(myParser.json({extended : true}));
app.post("/", function(request, response) {
    storeData(request, response); 
});
app.get("/", function(request, response){
    var query = pool.query("select * from t_data;", (err, res) => {
        if (err) {
            console.log(err.stack);
        } else {
            result = res.rows;
            for (var i = 0; i < res.rowCount; i++) {
                mapHumidityTemperature = parseData(result[i].payload);

                humidityDisplayed = mapHumidityTemperature.get(humidity);
                temperatureDisplayed = mapHumidityTemperature.get(temperature);
                
                listHumidity[i]=humidityDisplayed;
                listTemperature[i]=temperatureDisplayed;
            }
            
            if (listHumidity.size == 0) {
                response.end("Welcome on this website.");
            } else {
                response.write(JSON.stringify(listHumidity));
                response.write(JSON.stringify(listTemperature));
                return response.end();
            }
        }
        pool.end();
    });
});
app.listen(process.env.PORT || 5000);

function storeData(request, response){
    console.log(request.body);
    //Store into DB
    pool.query("insert into t_data(payload) values ('" + request.body.data + "');").then(res => {
        pool.release()
    }).catch(e => {
        client.release()
        console.log(err.stack)
    })
    response.end("Success");
}

function parseData(data){
    var binaryData = hexToBinary(data);
    var humidityBinaryData = binaryData.substring(binaryData.length-8, binaryData.length);
    var temperatureBinaryData = binaryData.substring(binaryData.length-17 , binaryData.length-8);

    var humidityDecimalData = parseInt(humidityBinaryData, 2);
    var temperatureDecimalData = parseInt(temperatureBinaryData, 2);

    var humidityResult = humidityDecimalData/2;
    var temperatureResult = (temperatureDecimalData-200)/8;

    mapHumidityTemperature.set(humidity, humidityResult);
    mapHumidityTemperature.set(temperature, temperatureResult);
    return mapHumidityTemperature;
}


