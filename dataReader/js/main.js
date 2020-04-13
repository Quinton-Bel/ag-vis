window.onload = function () {
  var svg = d3.select("#chart")
    .attr("width", innerWidth * 0.8)
    .attr("height", innerHeight * 0.6)

  d3.csv("SAD.csv").then(function (data) {
    //Read data
    data = data.filter((d) => d.VALUE != "");
    var proviences = d3.group(data, (d) => d.Provience);
    var years = d3.group(data, (d) => d.REF_DATE, (d) => d.Provience, d => d.UOM, d => d["Type of crop"]);
    var attribs = {
      harvest: "Harvest disposition",
      provience: "Provience",
      type: "Type of crop",
      unitName: "UOM",
      unit: "SCALAR_FACTOR",
      value: "VALUE"
    };
    //    console.log(years);
    var yearNum = Array.from(years.keys());
    var provienceName = Array.from(proviences.keys());

    // go button
    var goBtn = $("#btn-go").on('click', draw);
    // read selection 
    var init = true;
    updateYearSelect();
    updateProvienceSelect();
    updateUnitSelect();
    draw();
    init = false;

    function updateYearSelect() {
      var yearSelect = $("#year-select")
      yearSelect.remove("option");
      yearSelect.on("change", updateProvienceSelect);
      for (var i = 0; i < yearNum.length; i++) {
        var option = document.createElement("option");
        option.value = yearNum[i]
        option.innerText = yearNum[i];
        yearSelect.append(option);
      }
      if (!init) draw();
    }

    function updateProvienceSelect() {
      var year = $("#year-select").val();
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

    function updateUnitSelect() {
      var year = $("#year-select").val();
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

    function draw() {
      var year = $("#year-select").val();
      var prov = $("#prov-select").val();
      var unitSelect = $("#unit-select").val();

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

  });

}
