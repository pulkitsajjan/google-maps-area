import { Loader } from '@googlemaps/js-api-loader';

const apiOptions = {
  "apiKey": "AIzaSyAQxdgEu8NxpSTFhOyh9oF9avKQpteYhXE",
  "version": "beta",
};

let maxZoomService;
let map;
let myLatlng = { lat: 0, lng: 0 };
let sides;

let lineDrawn;
let geometry;

// DOM Elements 
let bgWhite = document.getElementById('container');
let infoCont = document.getElementById('info-container');
let infoText = document.getElementById('info-text');

let submitBtn = document.getElementById("submitBtn");
submitBtn.addEventListener("click", saveCoordinates)

//Get input cooridnates from user
function saveCoordinates() {
  const latitude = document.getElementById('latitude').value;
  const longitude = document.getElementById('longitude').value;
  
  myLatlng = {
    lat: Number(latitude),
    lng: Number(longitude)
  };

  (async () => {        
    map = await initMap();
  })();

  bgWhite.style.display = "none";
  return false;
}

async function initMap() {   
    const mapOptions = {
      "zoom": 0,
      gestureHandling: "none",
      zoomControl: true,
      streetViewControl: false,
      mapTypeId: "satellite",
      "center": myLatlng,
      "mapId": "d2c7da83dcc26652",
    }

    const mapDiv = document.getElementById("map");

    const apiLoader = new Loader(apiOptions);
    await apiLoader.load()      

    map = new google.maps.Map(mapDiv, mapOptions);
    geometry = await google.maps.importLibrary("geometry");

     // Set current max zoom level
    maxZoomService = new google.maps.MaxZoomService();
    maxZoomService.getMaxZoomAtLatLng(myLatlng, (result) => {
      map.setZoom(result.zoom + 2);
    });

    // Line drawn on selection
    lineDrawn = new google.maps.Polyline({
      strokeColor: '#000000',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      fillColor: 'black',
      fillOpacity: 0.05
    });
    lineDrawn.setMap(map);
    map.addListener('click', addLatLng);
    return map
}

// Calculate the length between 2 coordinates
function computeLength(coord1, coord2){
  return geometry.spherical.computeDistanceBetween(coord1, coord2).toFixed(2);
}


// Add clicked points and calculate measurements
function addLatLng(event) {
  sides = lineDrawn.getPath();
  sides.push(event.latLng);

  // If user selects 4 points then calculate the area.
  if(sides.length == 3) {
    let polygonOptions = { path:sides,
      strokeColor:"#ffffff",
      fillColor:"black" 
    };

    let polygon = new google.maps.Polygon(polygonOptions);
    polygon.setMap(map);

    infoCont.style.display = "block";
    infoText.innerHTML = `The area of selected points is - ${google.maps.geometry.spherical.computeArea(sides).toFixed(2)} sq m<br>
    Length of sides -<br>
    1: ${computeLength(sides.g[0], sides.g[1])} m, 2: ${computeLength(sides.g[1], sides.g[2])} m,<br>
    3: ${computeLength(sides.g[2], sides.g[3])} m, 4: ${computeLength(sides.g[3], sides.g[0])} m`    
  } else {
    infoCont.style.display = "none";
  }
    
  let marker = new google.maps.Marker({
    position: event.latLng,
    icon: "../White-Circle.svg",
    title: '#' + sides.getLength(),
    map: map,
  });
}