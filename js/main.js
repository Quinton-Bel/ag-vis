var w = innerWidth;
var h = innerHeight;
var hr = 5;
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
window.onload = function () {
  var svg = d3.select("#canvas")
    .attr("height", h)
    .attr("width", w)
    .attr("viewBox", [0, 0, w, h]);

  var gdata = d3.json("canada.topojson")
    .then(function (ca) {
      var feature = topojson.feature(ca, ca.objects.collection)
      var proj = d3.geoAlbers()
        .fitSize([w * 0.8, h * 0.8], feature)
        .translate([w / 2, h])
      var path = d3.geoPath().projection(proj);
      var map = svg.append("g")
      console.log(feature)
      //      map
      //        .datum(feature)
      //        .append("path")
      //        .attr("class", "provience")
      //        .attr("fill", "white")
      //        .attr("stroke", "black")
      //        .attr("d", path);

    });

  var ca_b = d3.json("canadaBorder.geo.json")
    .then(function (ca) {
      var proj = d3.geoAlbers()
        .fitSize([w * 0.8, h * 0.8], ca)
        .translate([w / 2, h])
      var path = d3.geoPath().projection(proj);
      var hex = d3.hexgrid()
        .extent([w, h])
        .geography(ca)
        .pathGenerator(path)
        .projection(proj)
        .hexRadius(hr)
      var map = svg.append("g")

      var hexmap = hex(ca)
	
	var cords = hexmap.grid.layout.map((x) => {return [x.x, x.y]})
	saveTextAsFile(JSON.stringify({"cords": cords}))
    console.log(JSON.stringify({"cords": cords}))

      svg.selectAll('.hex')
        .data(hexmap.grid.layout)
        .enter()
        .append('path')
        .attr('class', 'hex')
        .attr('transform', d => `translate(${d.x} ${d.y})`)
        .attr('d', hexmap.hexagon())
        .style('stroke', '#666')
        .style('fill', '#fff')
        .style('stroke-width', 1);
    });

}
