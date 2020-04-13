var mapW = 960;
var mapH = 720;
var sliderSize = mapH*0.25;
var hr = 7;
var selectedMonth = 0
var selectedYear = 1990
var weatherType = 'Tmax'
var weatherFile = ''
var weatherData = {}
var visData = []
var proj = undefined
var hexPath = []
var cScale = d3.scaleLinear()
                .domain([-20, 0, 20])
                .range(['blue', 'white', 'red']);
var rainScale = d3.scaleQuantize()
                  .domain([ 0, 500 ])
                  .range(colorbrewer.Blues[9])
var t = d3.transition();

function updateVisDataColours() {
  if (visData.length != 0) {
    var yearlyData = weatherData[selectedYear] 
    visData = visData.map((d) => {
      var hexLonLat = cordRound(proj.invert([d.x, d.y]))
      if ((yearlyData != undefined) &&
        (cordToKey(hexLonLat) in yearlyData)) {
        var hexData = yearlyData[cordToKey(hexLonLat)][selectedMonth]
        if (hexData != null) {
          if(weatherType=='Tmax' || weatherType=='Tmin'){
            d.colour = cScale(hexData)
          }else{
            d.colour = rainScale(hexData)
          }
        } else {
          d.colour = 'lightgray'
        }
      } else {
        d.colour = 'black'
      }
      return d
    })
  }
  //console.log('Updated vis data', visData)
}

function loadWeatherData(weatherFile) {
  $.ajax({
    url: weatherFile,
    async: true,
    dataType: 'json',
    success: function (response) {
      weatherData = response
      updateVisDataColours()
      drawHexmap()
    }
  });
}

function makeWeatherFileName(year, wtype) {
  var prefix = '/wdata/'
  var rYear = Math.ceil(year / 5) * 5;
  return prefix + weatherType + rYear + '.json'
}

function saveTextAsFile(t) {
  var textFileAsBlob = new Blob([t], {
    type: "application/json"
  });
  var downloadLink = document.createElement("a");
  downloadLink.download = "cords.json";
  downloadLink.innerHTML = "Download File";
  if (window.webkitURL != null) {
    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
  } else {
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
  }

  downloadLink.click();
}

function cordToKey(cord) {
  return cord[0].toString() + " " + cord[1].toString()
}

function cordRound(cord) {
  return [Math.round(cord[0] * 100 + Number.EPSILON) / 100,
          Math.round(cord[1] * 100 + Number.EPSILON) / 100]
}

function drawHexmap() {
  //  console.log('Drawing Hexmap')
  var svg = d3.select("#canvas-container")
    // Container class to make it responsive.
   .classed("svg-container", true) 
   .select("#canvas")
   // Responsive SVG needs these 2 attributes and no width and height attr.
   .attr("preserveAspectRatio", "xMinYMin meet")
   .attr("viewBox", "0 0 960 720")
   
  var map = svg.append("g")
  d3.select("#canvas").on("click", function () {
    var m = d3.mouse(this)
    var p = proj.invert(m);
    console.log("lat/lon:" + p);
    console.log("mouse :" + m);
  });
  //  svg.selectAll('.hex').remove()
  map.selectAll('.hex')
    .data(visData)
    .join(
      enter => enter
      .append('path')
      .attr('class', 'hex')
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
      .attr('d', hexPath)
      .style('stroke', '#666')
      .style('fill', 'lightgray')
      .style('stroke-width', 1)
      .call(enter => enter.transition(t)
        .duration(1500)
        .style('fill', (d) => {
          return d.colour
        })),
      update => update
      .attr('class', 'hex')
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
      .attr('d', hexPath)
      .style('stroke', '#666')
      .style('stroke-width', 1)
      .call(enter => enter.transition(t)
        .duration(1500)
        .style('fill', (d) => {
          return d.colour
        })
      ),
      exit => exit
      .call(ex => ex.transition(t)
        .duration(1000)
        .style('fill', 'lightgray')
        .remove()
      )
    );
    var weatherLegend = d3.legendColor()
                  .labelFormat(d3.format(".0f"))
                  .title(weatherType + " data")
                  .titleWidth(100);

    if(weatherType=='Tmax' || weatherType=='Tmin'){
      weatherLegend.scale(cScale)
      weatherLegend.useClass(false)
    }else{
      weatherLegend.scale(rainScale)
      weatherLegend.useClass(true)
    }
    svg.select("#legend").remove()
    svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate("+ (mapW-150) +", "+ (mapH*0.1) +")")
        .call(weatherLegend);
}

var sliderMonth = d3
  .sliderRight()
  .min(1)
  .max(12)
  .step(1)
  .height(sliderSize*0.8)
  .displayValue(false)
  .on('end', val => {
    d3.select('#value').text(val);
    selectedMonth = val - 1
    //    console.log(selectedMonth)
    updateVisDataColours()
    drawHexmap()
  });

d3.select('#sliderMonth')
   .classed("slider-container", true) 
  .append('svg')
   .attr("preserveAspectRatio", "xMinYMin meet")
   .attr("viewBox", "0 0 " + 50 + " "+ sliderSize.toString())
  .attr('class', 'slider')
  .append('g')
  .attr('transform', 'translate(7, 14)')
  .call(sliderMonth);

var sliderYear = d3
  .sliderLeft()
  .min(1950)
  .max(2012)
  .default(1990)
  .step(1)
  .height(sliderSize*0.8)
  .displayValue(false)
  .on('end', val => {
    d3.select('#value').text(val);
    selectedYear = val
    if(false){
      loadWeatherData()
    }else{
      updateVisDataColours()
      drawHexmap()
    }
  });

d3.select('#sliderYear')
   .classed("slider-container", true) 
  .append('svg')
   .attr("preserveAspectRatio", "xMinYMin meet")
   .attr("viewBox", "0 0 " + 60 + " "+ sliderSize.toString())
  .attr('class', 'slider')
  .append('g')
  .attr('transform', 'translate(53, 14)')
  .call(sliderYear);

window.onload = function () {
  //Loads in the grid data
  var ca_b = d3.json("canadaBorder.geo.json")
    .then(function (ca) {
      proj = d3.geoAlbers()
                .fitSize([mapW, mapH], ca)
      var path = d3.geoPath().projection(proj);
      var hex = d3.hexgrid()
        .extent([mapW, mapH])
        .geography(ca)
        .pathGenerator(path)
        .projection(proj)
        .hexRadius(hr)
      var hexmap = hex(ca)
      hexPath = hexmap.hexagon()
      visData = hexmap.grid.layout
      //loads the weather data
      weatherFile = makeWeatherFileName(selectedYear, weatherType)
      loadWeatherData(weatherFile)
      //Updates the vis colours based on new weather data
      updateVisDataColours()
      //Redraws the hex map
      drawHexmap()
      //Gets the cords for preprocessing
      //var cords = hexmap.grid.layout.map((x) => {return cordRound(proj.invert([x.x, x.y]))})
      //saveTextAsFile(JSON.stringify({"cords": cords}))
      //console.log(JSON.stringify({"cords": cords}))
    }); // end then()
}
