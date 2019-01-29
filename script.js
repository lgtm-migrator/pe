//CONSTANTS

var PERIODS_PER_DAY = 10;
var slotList = ["Early Bird", "1st Period", "2nd Period", "3rd Period", "4th Period", "5th Period", "6th Period", "7th Period", "8th Period", "9th Period"];
var DELAY = 15;

// GLOBAL VARIABLES

var currentlyShowing, currentPeriod, timeLeft;


//QUICK SELECT

function sel(query) {
  return document.querySelector(query);
}

//DATE AND TIME
//functions
function numSuffix(i) {
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
}

function toBool(str) {
  if (str == "TRUE") {
    return true;
  } else if (str == "FALSE") {
    return false;
  } else {
    return "Error";
  }
}

function twoDigit(i) {
  if (i.toString().length === 1) {
    return ('0' + i);
  } else {
    return i;
  }
}


//BEGIN BIG OLE' FUNCTION
function reload() {
  //Fill left column
  var date = new Date();
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var dayOfWeek = days[date.getDay()];
  var month = months[date.getMonth()];
  var day = date.getDate();
  var year = date.getFullYear();
  var hour = (date.getHours() > 12) ? date.getHours() - 12 : date.getHours();
  if (hour == 0) {
    hour = 12;
  }
  var period = (date.getHours() < 12) ? "AM" : "PM";
  var minute = date.getMinutes();
  var fullDate = dayOfWeek + ', ' + month + ' ' + numSuffix(day);
  var fullTime = hour + ':' + twoDigit(minute) + " " + period;

  sel('#date').innerHTML = fullDate;
  sel('#time').innerHTML = fullTime;
  get();
}
reload();
//ETHSBELL

function ajax(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  };
  xmlHttp.open("GET", theUrl, true); // true for asynchronous
  xmlHttp.send(null);
}

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function get() {


  var mocktime = getParameterByName("mock_time");

  if (mocktime == null) {
    mocktime = "";
  } else {
    mocktime = "?mock_time=" + mocktime;
  }


  var bellUrl = "https://api.ethsbell.xyz/data" + mocktime;

  ajax(bellUrl, function(data) {
    console.log(data);
    data = JSON.parse(data);

    currentPeriod = data.theSlot;
    timeLeft = data.timeLeftInPeriod;

    if (currentPeriod == null) {
      sel('#showing').innerHTML = '';
    } else {
      sel('#showing').innerHTML = 'Showing locations for ' + currentPeriod + ' period.';
      sel('#timeleft').innerHTML = currentPeriod + ' ends in ' + timeLeft + ' minutes.';
    }

    ajax(sheetURL, run);
  });
}
//
function run(msg) {
  var datadiv = document.getElementById("data");
  var data = JSON.parse(msg);
  var responseObj = {};
  var rows = [];
  var columns = {};
  for (var i = 0; i < data.feed.entry.length; i++) {
    var entry = data.feed.entry[i];
    var keys = Object.keys(entry);
    var newRow = {};
    var queried = false;
    for (var j = 0; j < keys.length; j++) {
      var gsxCheck = keys[j].indexOf("gsx$");
      if (gsxCheck > -1) {
        var key = keys[j];
        var name = key.substring(4);
        var content = entry[key];
        var value = content.$t;
        queried = true;
        if (true && !isNaN(value)) {
          value = Number(value);
        }
        newRow[name] = value;
        if (queried === true) {
          if (!columns.hasOwnProperty(name)) {
            columns[name] = [];
            columns[name].push(value);
          } else {
            columns[name].push(value);
          }
        }
      }
    }
    if (queried === true) {
      rows.push(newRow);
    }
  }
  if (true) {
    responseObj.columns = columns;
  }
  if (true) {
    responseObj.rows = rows;
  }
  table(responseObj);
}

var teacherArray = [];
var teacherData = {};

function table(data) {
  var currentJson = [];
  var currentName;
  var currentArray = [];
  var current;
  data = data.rows;
  var teacherLength = data.length - 1;
  for (var k = 0; k < PERIODS_PER_DAY; k++) {
    teacherData[k] = [];
  }
  for (var i = 0; i <= teacherLength; i++) {
    current = {};
    currentArray = [];
    currentArray = Object.values(data[i]);
    teacherArray.push(currentArray);
    currentName = currentArray[0];
    currentJson = [];
    currentJson.push(currentName);
    for (var j = 0; j < PERIODS_PER_DAY; j++) {
      current = {};
      current.name = currentName;
      current.location = currentArray[4 * j + 1 + 0];
      current.uniform = toBool(currentArray[4 * j + 1 + 1]);
      current.heart = toBool(currentArray[4 * j + 1 + 2]);
      current.chromebook = toBool(currentArray[4 * j + 1 + 3]);
      teacherData[j].push(current);
    }
  }
  putData(teacherData);
}

function putData(data) {
  if (currentPeriod == null) {
    sel('#main').innerHTML = '<span id="message">Have a nice day!</span>';
  } else {
    var periodArray = [];
    var periodNumber = slotList.indexOf(currentPeriod);
    for (var i = 0; i < teacherData[periodNumber].length; i++) {
      if (teacherData[periodNumber][i].location !== "null") {
        periodArray.push(teacherData[periodNumber][i]);
      }
    }

    var cellArray = document.querySelectorAll('.cell');
    for (var j = 0; j < periodArray.length; j++) {
      cellArray[j].querySelector('.icons .uniform').style.display = '';
      cellArray[j].querySelector('.icons .heart').style.display = '';
      cellArray[j].querySelector('.icons .laptop').style.display = '';
      cellArray[j].querySelector('.name').innerHTML = periodArray[j].name;
      cellArray[j].querySelector('.location').innerHTML = periodArray[j].location;
      if (periodArray[j].uniform) {
        cellArray[j].querySelector('.icons .uniform').style.display = 'inline';
      }
      if (periodArray[j].heart) {
        cellArray[j].querySelector('.icons .heart').style.display = 'inline';
      }
      if (periodArray[j].chromebook) {
        cellArray[j].querySelector('.icons .laptop').style.display = 'inline';
      }
    }
  }
}

var sheetURL =
  "https://spreadsheets.google.com/feeds/list/1T-HUAINDX69-UYUHhOO1jVjZ_Aq0Zqi1z08my0KHzqU/1/public/values?alt=json";

//Reload interval

var interval = setInterval(reload, DELAY * 1000);
