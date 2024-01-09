import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Loader } from '@googlemaps/js-api-loader';
import ThreeJSOverlayView from '@ubilabs/threejs-overlay-view';
import {MeshLine, MeshLineGeometry, MeshLineMaterial} from '@lume/three-meshline'

let maxZoomService;
let myLatlng = { lat: 0, lng: 0 };
let mapOptions;
let overlay;
let scene;
let map;
let drawing;
let selectedCoords = [];
let bounds;
let geometry;
let polygon;

// Google maps key
const apiOptions = {
  "apiKey": "AIzaSyAQxdgEu8NxpSTFhOyh9oF9avKQpteYhXE",
  "version": "beta",
};

// DOM Elements 
let bgWhite = document.getElementById('container');
let coordText = document.getElementById('coord-text');
let areaText = document.getElementById('area-text');
let infoCont = document.getElementById('info-container');

// Buttons
let submitBtn = document.getElementById("submit-button");
submitBtn.addEventListener("click", saveCoordinates)

let drawBtn = document.getElementById("draw-button");
drawBtn.addEventListener("click", () => {
  drawing = true;
  map.setOptions({draggable: false, zoomControl: false, scrollwheel: false, disableDoubleClickZoom: true});
  drawBtn.style.display = "none";
  calBtn.style.display = "block";
})

// Calculate area and length
let calBtn = document.getElementById("cal-button");
calBtn.addEventListener("click", () => {
  drawing = false;
  calBtn.style.display = "none";

  drawLineBetweenPoints();
  bounds = new google.maps.LatLngBounds();
  
  coordText.innerHTML = `<b>The selected coordinates area - <br> Latitude:</b> ${myLatlng.lat.toFixed(5)}º <br> <b>Longitude:</b> ${myLatlng.lng.toFixed(5)}º`;
  areaText.innerHTML = `<b>The area of selected points are -</b> <br> ${addPolygon(bounds)} sqm`;
  calculateLength();
  infoCont.style.display = "block";
})

// Hide/Unhide layer
let hideOverlayBtn = document.getElementById("hide-button");
hideOverlayBtn.addEventListener("click", function () {
  overlay.setMap(null)
})

let showOverlayBtn = document.getElementById("show-button");
showOverlayBtn.addEventListener("click", function () {
  overlay.setMap(map)
  overlay.requestRedraw();
})

// Print the info to PDF
let printBtn = document.getElementById("print-button");
printBtn.addEventListener("click", function () {
  let pdf = new jsPDF('p', 'pt', 'letter');
  let source = document.getElementById('print-container');
  let margin = 30 
  pdf.canvas.height = 72 * 11;
  pdf.canvas.width = 72 * 8.5;

  pdf.fromHTML(source, margin, margin);
  pdf.save('Solar-Plan.pdf');
})

//Get input cooridnates from user
function saveCoordinates() {
  const latitude = document.getElementById('latitude').value;
  const longitude = document.getElementById('longitude').value;
  
  myLatlng = {
    lat: Number(latitude),
    lng: Number(longitude)
  };

  initateMap();

  bgWhite.style.display = "none";
  drawBtn.style.display = "block";
  return false;
}

async function initateMap() {
  mapOptions = {
    "zoom": 0,
    gestureHandling: "greedy",
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    mapTypeId: "satellite",
    "center": myLatlng,
    "mapId": "d2c7da83dcc26652",
    tilt: 0,
  };

  const apiLoader = new Loader(apiOptions);
  await apiLoader.load()   

  // Initate Map instance
  map = new google.maps.Map(document.querySelector('#map'), mapOptions);
  geometry = await google.maps.importLibrary("geometry");

  maxZoomService = new google.maps.MaxZoomService();
    maxZoomService.getMaxZoomAtLatLng(myLatlng, (result) => {
      map.setZoom(result.zoom)
    });
  
  // Set up ThreeJS Overlay to add a 3D layer
  overlay = new ThreeJSOverlayView(myLatlng);

  scene = overlay.getScene();
  overlay.setMap(map)
  overlay.requestRedraw();

  let animationRunning = true;

  overlay.update = () => {
    if (animationRunning) {
      overlay.requestRedraw();
    }
  };
  
  // Listner to get Coordinates of point clicked on the map 
  map.addListener('click', exy => {
    addSphere({lat: exy.latLng.lat() ,lng: exy.latLng.lng()});
  });
}

let edges = [];
function addSphere(axiss) {
  if(!drawing) return; 

  scene = overlay.getScene();
  
  // Create a sphere (Point) 
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry( 1, 64, 32),
    new THREE.MeshBasicMaterial({color: 0x000000})
  );
  edges.push(sphere);
  selectedCoords.push(axiss);

  // Convert 2D coordinates to 3D 
  const cubeLocation = {...axiss, altitude: 0};
  overlay.latLngAltToVector3(cubeLocation, sphere.position);

  scene.add(sphere);
}

function drawLineBetweenPoints() {
  const points = [];
  
  // Get position of points to draw edges
  edges.forEach(element => {
    points.push(element.position);
  });
  
  points.push(edges[0].position);
  
  // Draw Line
  const lineMaterial = new MeshLineMaterial({resolution: new THREE.Vector2(1,1)})
  const lineGeometry = new MeshLineGeometry()
  lineGeometry.setPoints(points)

  const line = new MeshLine(lineGeometry, lineMaterial)
  scene.add(line)

  // Draw layer
  var geomShape = new THREE.ShapeGeometry(new THREE.Shape(points));
  var matShape = new THREE.MeshBasicMaterial({color:"grey"});
  var shape = new THREE.Mesh(geomShape, matShape);
  scene.add(shape);
}

function addPolygon(bounds) {

  // Add a ploygon to calculate the path
  let path = [];
  let polybounds = new google.maps.LatLngBounds();
  for (let i = 0; i < selectedCoords.length; i++) {
      path.push(new google.maps.LatLng(selectedCoords[i].lat, selectedCoords[i].lng));
      bounds.extend(path[path.length - 1]);
      polybounds.extend(path[path.length - 1]);
  }
  
  polygon = new google.maps.Polygon({
      paths: path,
      strokeColor: '#000000',
      strokeOpacity: 0,
      strokeWeight: 0.2,
      fillColor: '#00CCFF',
      fillOpacity: 0,
      map: map,
      bounds: polybounds
  });

  return (geometry.spherical.computeArea(polygon.getPath()).toFixed(2));
}

function computeLength(coord1, coord2){
  return geometry.spherical.computeDistanceBetween(coord1, coord2).toFixed(2);
}

function calculateLength() {
  let nextIndex = 0;
  for(let i = 0; i < selectedCoords.length; i++)
  {
    i+1==selectedCoords.length ? nextIndex = 0 : nextIndex = i + 1;
    appendLength(computeLength(polygon.getPath().g[i], polygon.getPath().g[nextIndex]) , i + 1)
  }
}

function appendLength(len, index) {
  // Append the edges length to HTML
  const node = document.createElement("li");
  const textnode = document.createTextNode(`Side ${index}: ${len} m`);
  node.appendChild(textnode);
  document.getElementById("length-list").appendChild(node);
}