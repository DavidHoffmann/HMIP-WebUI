$(function() {
  addGroupsToMenu();

});

function openFirstMenuItem(containerid) {
  $('#' + containerid + ' li:first a:first').first().click();
}

function addGroupsToMenu() {
  getGroups(addGroupsToMenu_callback);
}

function addGroupsToMenu_callback(data) {
  var menu = $('#menu_groups');
  menu.text('');
  for(var index = 0; index < data.length; index++)
    menu.append('<li><a href="#" onclick="showGroup(\'' + data[index][0] + '\', \'' + data[index][1] + '\'); return false;">' + data[index][1] + '</a></li>');

  openFirstMenuItem(menu.get(0).id);
}

function getGroups(addGroupsToMenu_callback) {
  $.ajax({
    type: "GET",
    dataType: "json",
    url: "./api/groups",
    success: function(data) {
      addGroupsToMenu_callback(data)
    }
  });
}

function showGroup(id, label) {
  $('#group_label').text(label);

  $.ajax({
    type: "GET",
    dataType: "json",
    url: "./api/groupdevices/" + id,
    success: function(data) {
      showGroupDevices_callback(data);
    }
  });
}

function showGroupDevices_callback(data) {
  var main = $('#main');
  main.text('');
  for(var index = 0; index < data.length; index++) {
    var device_id = data[index][0];
    main.append('<div class="col-sm-12 col-md-6 col-lg-4" id="device_' + device_id + '" data-type="' + data[index][2] + '"><div id="graph_' + device_id + '"></div></div>');

    showDeviceGraph_call(device_id, data[index][2], data[index][1]);
  }
}

function showDeviceGraph_call(device_id, device_type, device_label) {
  var cntValues = 1000;
  $.ajax({
    type: "GET",
    dataType: "json",
    url: "./api/devicelogs/" + cntValues + "/" + device_id,
    success: function(logdata) {
      showDeviceGraph_callback(device_id, device_type, device_label, logdata);
    }
  });
}

function showDeviceGraph_callback(device_id, device_type, device_label, data) {
  var eGraph = document.getElementById('graph_' + device_id);
  var devicegraph = $(eGraph);
  devicegraph.text('');

  graphX = new Array();
  graphY1 = new Array();
  graphY2 = new Array();

  for (var index = 0; index < data.length; index++) {
    graphX.push(data[index][0]);

    switch (device_type) {
      case 'SHUTTER_CONTACT':
        graphY1.push(data[index][1]);
        break;
      case 'HEATING_THERMOSTAT':
        graphY1.push(data[index][2]);
        break;
      case 'TEMPERATURE_HUMIDITY_SENSOR_DISPLAY':
      case 'WALL_MOUNTED_THERMOSTAT_PRO':
        graphY1.push(data[index][3]);
        graphY2.push(data[index][4]);
        break;
      default:
    }
  }

  var yLabel1;
  var yLabel2;

  switch (device_type) {
    case 'SHUTTER_CONTACT':
      yLabel1 = '';
      yLabel2 = '';
      break;
    case 'HEATING_THERMOSTAT':
      yLabel1 = '';
      yLabel2 = '';
      break;
    case 'TEMPERATURE_HUMIDITY_SENSOR_DISPLAY':
    case 'WALL_MOUNTED_THERMOSTAT_PRO':
      yLabel1 = 'Feuchte';
      yLabel2 = 'Temp.';
      break;
    default:
  }


  var trace1 = {
    x: graphX,
    y: graphY1,
    type: 'scatter',
    name: yLabel1,
    sizeref:20
  };
  var data = [trace1];

  if (graphY2.length > 0) {
    var trace2 = {
      x: graphX,
      y: graphY2,
      type: 'scatter',
      name: yLabel2,
      sizeref:20
    };

    data = [trace1, trace2];
  }
  var layout = {
    title: device_label,
    xaxis: {
      title: 'Datum',
      showgrid: false,
      zeroline: false
    },
    yaxis: {
      title: '',
      showline: false
    }
  };
  Plotly.newPlot(eGraph, data, layout);

}
