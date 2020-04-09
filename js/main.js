var w = 500;
var h = 300;
var hr = 3;
var selectedMonth = 0
var selectedYear = "1990"
function saveTextAsFile(t){
		var textFileAsBlob = new Blob([t], {type:"application/json"});
		var downloadLink = document.createElement("a");
		downloadLink.download = "cords.json";
		downloadLink.innerHTML = "Download File";
		if (window.webkitURL != null)
		{
			// Chrome allows the link to be clicked
			// without actually adding it to the DOM.
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		}
		else
		{
			// Firefox requires the link to be added to the DOM
			// before it can be clicked.
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = destroyClickedElement;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);
		}

		downloadLink.click();
}
function cordToKey(cord){
  return cord[0].toString()+" "+cord[1].toString()
}
function cordRound(cord){
  return [Math.round( cord[0] * 100 + Number.EPSILON ) / 100,
          Math.round( cord[1] * 100 + Number.EPSILON ) / 100]
}
window.onload = function () {
  var svg = d3.select("#canvas")
    .attr("height", h)
    .attr("width", w)
    .attr("viewBox", [0, 0, w, h]); 

  var ca_b = d3.json("canadaBorder.geo.json")
    .then(function (ca){ 
      var proj = d3.geoAlbers()
        .fitSize([w*0.95, h*0.90], ca)
      var path = d3.geoPath().projection(proj);
      var hex = d3.hexgrid()
        .extent([w, h])
        .geography(ca)
        .pathGenerator(path)
        .projection(proj)
        .hexRadius(hr)
      var map = svg.append("g")
      var hexmap = hex(ca)
      //Gets the cords for preprocessing
      // var cords = hexmap.grid.layout.map((x) => {
      //       return cordRound(proj.invert([x.y, x.x]))
      //       })
      //saveTextAsFile(JSON.stringify({"cords": cords}))
      //console.log(JSON.stringify({"cords": cords}))

      var ca_b = d3.json("tout.json")
      .then(function (weatherData){
        var slider = d3
        .sliderHorizontal()
        .min(1)
        .max(12)
        .step(1)
        .width(w*0.9)
        .displayValue(false)
        .on('onchange', val => {
          d3.select('#value').text(val);
          selectedMonth = val-1
        });
    
      d3.select('#slider')
        .append('svg')
        .attr('width', 500)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(slider);

        var cScale = d3.scaleLinear()
                        .domain([-5, 30])
                        .range(['white', 'blue'])
        var yearlyData = weatherData[selectedYear]
        svg.selectAll('.hex')
          .data(hexmap.grid.layout)
          .enter()
          .append('path')
          .attr('class', 'hex')
          .attr('transform', d => 'translate('+d.x+','+d.y+')')
          .attr('d', hexmap.hexagon())
          .style('stroke', '#666')
          .style('fill', (d)=>{
            var hexLonLat = cordRound(proj.invert([d.y, d.x]))
            if (cordToKey(hexLonLat) in yearlyData){
              var hexData = yearlyData[cordToKey(hexLonLat)][selectedMonth]
              if (hexData != null){
                return cScale(hexData)
              } 
            }
            return 'gray'
          })
          .style('stroke-width', 1);
      })
      
   
   
      }); // end then()

}
