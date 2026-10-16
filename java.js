const weatherBtn=document.getElementById("WeatherBtn");
const weatherResult=document.getElementById("weatherResult");

weatherBtn.addEventListener("click",getWeather);

async function getWeather(){
    weatherResult.textContent="Loading weather...";

    const url=
    "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m";
    try{
        const response=await fetch(url);
        if(!response.ok){
            throw new Error("Weather request failed");
        }
        const data=await response.json();
        const current=data.current;

        weatherResult.textContent=
        "temperature:"+current.temperature_2m+"C"|+
        "humidity:"+current.relative_humidity_2m+"% "|+
        "Wind speed:"+current.wind_speed_10m+"km/h";
    }
    catch(error){
        result.textContent="unable to load weather data";
        console.log(error.message);
    }
}

