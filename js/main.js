var w = innerWidth;
var h = innerHeight;
var hr = 5;

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
