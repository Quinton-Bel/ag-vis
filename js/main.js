var mapW = 960;
var mapH = 720;
var sliderSize = mapH * 0.25;
var hr = 7;
var sliderLock = false;
var selectedMonth = 0
var weatherTypes = ['Tmax', 'Tmin', 'P']
var defaultYear = 1990
var selectedYear = defaultYear
var weatherType = 'Tmax'
var weatherFile = ''
var weatherData = {}
var visData = []
var proj = undefined
var hexPath = []
var cScale =
  //    d3.scaleThreshold([-20, -15, -10, -5, 0, 5, 10, 15, 20], d3.schemeRdBu[10].reverse());
  d3.scaleLinear()
  .domain([-20, -10, 0, 10, 20])
  .range(['#2E62FF',
          '#2B9AB1',
          '#E7CB7C',
          '#E9A640',
          '#FF5928'])
  .interpolate(d3.interpolateRgb);

var rainScale = d3.scaleThreshold()
  .domain([0, 50, 150, 300, 500])
  .range(colorbrewer.Blues[5])

var svg = d3.select("#canvas-container")
  // Container class to make it responsive.
  .classed("svg-container", true)
  .select("#canvas")
  // Responsive SVG needs these 2 attributes and no width and height attr.
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 960 720")

var map = svg.append("g");

var sliderWeather = d3
  .sliderBottom()
  .min(1)
  .max(3)
  .step(1)
  .ticks(2)
  .tickFormat((d) => {
    return weatherTypes[d - 1]
  })
  .width(75)
  .displayValue(true)
  .on('end', val => {
    d3.select('#value').text(val);
    console.log(weatherTypes[val - 1])
    if (weatherType != weatherTypes[val - 1]) {
      weatherType = weatherTypes[val - 1]
      weatherFile = makeWeatherFileName(selectedYear, weatherType)
      loadWeatherData(weatherFile)
    }
  });

svg.append('g')
  .attr("transform", "translate(" + (mapW - 150) + ", " + (mapH * 0.3) + ")")
  .call(sliderWeather);

function updateVisDataColours() {
  if (visData.length != 0) {
    var yearlyData = weatherData[selectedYear]
    visData = visData.map((d) => {
      var hexLonLat = cordRound(proj.invert([d.x, d.y]))
      if ((yearlyData != undefined) &&
        (cordToKey(hexLonLat) in yearlyData)) {
        var hexData = yearlyData[cordToKey(hexLonLat)][selectedMonth]
        if (hexData != null) {
          if (weatherType == 'Tmax' || weatherType == 'Tmin') {
            d.colour = cScale(hexData)
          } else {
            d.colour = rainScale(hexData)
          }
        } else {
          d.colour = 'white'
        }
      } else {
        d.colour = 'white'
      }
      return d
    })

  }
  //console.log('Updated vis data', visData)
}

function loadWeatherData(weatherFile) {
  console.log('Loading new weather file: ', weatherFile)
  $.ajax({
    url: weatherFile,
    async: true,
    dataType: 'json',
    success: function (response) {
      weatherData = response;
      updateVisDataColours();
      drawHexmap();
    }
  });
}

function makeWeatherFileName(year, wtype) {
  console.log('Making weather file for: ', year, wtype)
  var prefix = '/wdata/'
  var rYear = Math.floor(year / 10) * 10;
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
  d3.select("#canvas").on("click", function () {
    var m = d3.mouse(this)
    var p = proj.invert(m);
    console.log("lat/lon:" + p);
    console.log("mouse :" + m);
  });

  var t = d3.transition().ease(d3.easeCubicOut);
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
      .style('fill', 'white')
      .style('stroke-width', 1)
      .call(enter => enter
        .transition(t)
        .duration(750)
        .style('fill', (d) => {
          return d.colour
        })
      ),
      update => update
      .attr('class', 'hex')
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
      .attr('d', hexPath)
      .style('stroke', '#666')
      .style('stroke-width', 1)
      .call(enter => enter
        .transition(t)
        .delay((d, i) => 500 + i / 2)
        .duration(750)
        .style('fill', (d) => {
          return d.colour
        })
      )
    );

  var weatherLegend = d3.legendColor()
    .labelFormat(d3.format(".0f"))
    .title(weatherType + " data")
    .titleWidth(100);

  if (weatherType == 'Tmax' || weatherType == 'Tmin') {
    weatherLegend.scale(cScale)
  } else {
    weatherLegend.scale(rainScale)
  }
  svg.select("#legend").remove()
  svg.append("g")
    .attr("id", "legend")
    .attr("transform", "translate(" + (mapW - 150) + ", " + (mapH * 0.1) + ")")
    .call(weatherLegend);
}
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
var sliderMonth = d3
  .sliderRight()
  .min(1)
  .max(12)
  .step(1)
  .tickFormat((d) => {
    return months[d - 1]
  })
  .height(sliderSize * 0.8)
  .displayValue(true)
  .on('end', val => {
    if(!sliderLock){
      d3.select('#value').text(val);
      selectedMonth = val - 1
      //    console.log(selectedMonth)
      updateVisDataColours()
      drawHexmap()
    }else{
      sliderMonth.value(0)
    }
  });

d3.select('#sliderMonth')
  .classed("slider-container", true)
  .append('svg')
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 " + 60 + " " + sliderSize.toString())
  .attr('class', 'slider')
  .append('g')
  .attr('transform', 'translate(7, 14)')
  .call(sliderMonth);

function isNewDateFile(prevDate, newDate) {
  var prevDecade = Math.floor(prevDate / 10) * 10
  var newDecade = Math.floor(newDate / 10) * 10
  return (prevDecade != newDecade)
}
var sliderYear = d3
  .sliderLeft()
  .min(1950)
  .max(2009)
  .default(defaultYear)
  .step(1)
  .height(sliderSize * 0.8)
  .displayValue(true)
  .on('end', val => {
    d3.select('#value').text(val);
    prevDate = selectedYear
    selectedYear = val
    weatherFile = makeWeatherFileName(selectedYear, weatherType)
    if (isNewDateFile(prevDate, selectedYear)) {
      loadWeatherData(weatherFile)
    } else {
      updateVisDataColours()
      drawHexmap()
    }
    updateYearSelect();
    updateProvienceSelect();
    updateUnitSelect();
  });

//The checkbox for averages
d3.select("#avg").on("change",
()=>{
  sliderLock = !sliderLock;
  console.log(sliderLock)
});

d3.select('#sliderYear')
  .classed("slider-container", true)
  .append('svg')
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 " + 60 + " " + sliderSize.toString())
  .attr('class', 'slider')
  .append('g')
  .attr('transform', 'translate(53, 14)')
  .call(sliderYear);

window.onload = function () {
  //Loads in the grid data
  var ca_p = d3.json("canada.geojson")
    .then(function (ca) {
      proj = d3.geoAlbers()
        .fitSize([mapW, mapH], ca)
      var path = d3.geoPath().projection(proj);
      var mg = svg.append('g').attr('class', 'prov-map')
      mg
        .datum(ca)
        .append("path")
        .attr("fill", "transparent")
        .style("opacity", 0.5)
        .style("stroke-width", '2px')
        .attr("stroke", "white")
        .attr("d", (d) => {
          //          console.log(d);
          return path(d)
        });
    });

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
      //Redraws the hex map
      drawHexmap()
      //Gets the cords for preprocessing
      //var cords = hexmap.grid.layout.map((x) => {return cordRound(proj.invert([x.x, x.y]))})
      //saveTextAsFile(JSON.stringify({"cords": cords}))
      //console.log(JSON.stringify({"cords": cords}))
    }); // end then()

  setTimeout(drawChart, 2000);
}
var yearNum;
var minMaxYear;
var provienceName;

// go button
var goBtn;

var init = true;
var proviences;
var years

function drawChart() {
  var linechart = d3.select("#chart")
    .classed("svg-container", true)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 960 400");

  d3.csv("SAD.csv").then(function (data) {
    //Read data
    data = data.filter((d) => d.VALUE != "");
    proviences = d3.group(data, (d) => d.Provience);
    years = d3.group(data, (d) => d.REF_DATE, (d) => d.Provience, d => d.UOM, d => d["Type of crop"]);
    //    console.log(years);
    yearNum = Array.from(years.keys());
    minMaxYear = d3.extent(yearNum);
    provienceName = Array.from(proviences.keys());

    // go button
    goBtn = $("#btn-go").on('click', draw);
    // read selection 
    init = true;
    updateYearSelect();
    updateProvienceSelect();
    updateUnitSelect();
    draw();
    init = false;
  });
}

function updateYearSelect() {
  var yearSelect = $("#year-select")
  yearSelect.val(selectedYear);
  yearSelect.remove("option");
  //      console.log(yearSelect);
  yearSelect.on("change", function () {
    var val = yearSelect.val()
    if (val < 2010) {
      sliderYear.value(val);
      d3.select('#value').text(val);
      prevDate = selectedYear
      selectedYear = val
      weatherFile = makeWeatherFileName(selectedYear, weatherType)
      if (isNewDateFile(prevDate, selectedYear)) {
        loadWeatherData(weatherFile)
      } else {
        updateVisDataColours()
        drawHexmap()
      }
    }
    updateProvienceSelect();
  });
  for (var i = 0; i < yearNum.length; i++) {
    var option = document.createElement("option");
    option.value = yearNum[i]
    option.innerText = yearNum[i];
    yearSelect.append(option);
  }
  if (!init) draw();
}

function updateProvienceSelect() {
  var year = selectedYear.toString();
  //      console.log(years.get(year))
  if (year <= minMaxYear[1] && year >= minMaxYear[0]) {
    var proviences = Array.from(years.get(year).keys()).sort();
    var provSelect = $("#prov-select");
    provSelect.on("change", updateUnitSelect);
    provSelect.html("");
    for (var i = 0; i < proviences.length; i++) {
      var option = document.createElement("option");
      option.value = proviences[i]
      option.innerText = proviences[i];
      provSelect.append(option);
    }
    if (!init) draw();
  }

}

function updateUnitSelect() {
  var year = selectedYear.toString();
  if (year <= minMaxYear[1] && year >= minMaxYear[0]) {
    var prov = $("#prov-select").val();
    var proviences = years.get(year);
    var uoms = proviences.get(prov);
    var units = Array.from(uoms.keys());
    var unitSelect = $("#unit-select");
    unitSelect.on("change", draw);
    unitSelect.html("");
    for (var i = 0; i < units.length; i++) {
      var option = document.createElement("option");
      option.value = units[i]
      option.innerText = units[i];
      unitSelect.append(option);
    }
    if (!init) draw();
  }
}

function draw() {
  //      var year = $("#year-select").val();
  var year = selectedYear.toString();
  var prov = $("#prov-select").val();
  var unitSelect = $("#unit-select").val();
  if (year <= minMaxYear[1] && year >= minMaxYear[0]) {
    var proviencesData = years.get(year);
    var provience = proviencesData.get(prov);
    var unit = Array.from(provience.get(unitSelect));
    //      console.log(unit);
    var measure = unit[0]
    newdata = []
    for (var i = 0; i < unit.length; i++) {
      var values = unit[i][1].map((d) => d.VALUE);
      newdata.push([unit[i][0]].concat(values));
    }
    // Draw 
    var chart = c3.generate({
      bindto: '#chart',
      data: {
        columns: newdata
      },
      axis: {
        y: {
          label: { // ADD
            text: unitSelect + "/(" +
              unit[0][1][0].SCALAR_FACTOR +
              ")",
            position: 'outer-middle'
          }
        }
      },
      transition: {
        duration: 1000
      }
    });
  }
}
