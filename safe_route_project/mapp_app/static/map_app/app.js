let map;
let directionsService;
let directionsRenderers = [];
let markers = [];
let waterloggedAreas = [];
let drawingManager;
let startInput, endInput;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 19.0760, lng: 72.8777 },
        zoom: 12
    });

    directionsService = new google.maps.DirectionsService();

    startInput = document.getElementById("start");
    endInput = document.getElementById("end");

    new google.maps.places.Autocomplete(startInput);
    new google.maps.places.Autocomplete(endInput);

    drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
            fillColor: "#0000FF",
            fillOpacity: 0.35,
            strokeWeight: 2,
            clickable: false,
            editable: false,
            zIndex: 1
        }
    });
    drawingManager.setMap(map);

    loadPolygons();
}

// Inside your JS file

function startAddingPolygon() {
    alert("Draw polygon to mark waterlogged area. Double-click to finish.");
    drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);

    // Listen for polygon completion
    google.maps.event.addListenerOnce(drawingManager, 'polygoncomplete', function(polygon) {
        // Add polygon to array
        waterloggedAreas.push(polygon);

        // Stop drawing mode
        drawingManager.setDrawingMode(null);

        // Optional: send to server
        const coords = polygon.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
        fetch('/add_polygon/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ coordinates: coords })
        });
    });
}


// Fetch polygons from server
async function loadPolygons() {
    const res = await fetch('/load_polygons/');
    const data = await res.json();
    data.forEach(area => {
        const polygon = new google.maps.Polygon({
            paths: area.coordinates,
            fillColor: "#0000FF",
            fillOpacity: 0.35,
            strokeWeight: 2,
            map: map
        });
        waterloggedAreas.push(polygon);
    });
}

// CSRF helper
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        document.cookie.split(';').forEach(cookie => {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        });
    }
    return cookieValue;
}

// Remove old routes
function clearRoutes() {
    directionsRenderers.forEach(renderer => renderer.setMap(null));
    directionsRenderers = [];
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Check if point is inside polygons
function isPointInWaterloggedAreas(latLng) {
    return waterloggedAreas.some(polygon => google.maps.geometry.poly.containsLocation(latLng, polygon));
}

// Generate waypoints around polygon
function generateWaypoints(polygon) {
    const path = polygon.getPath().getArray();
    let waypoints = [];
    path.forEach(pt => {
        waypoints.push({location: {lat: pt.lat() + 0.01, lng: pt.lng() + 0.01}, stopover: false});
        waypoints.push({location: {lat: pt.lat() - 0.01, lng: pt.lng() - 0.01}, stopover: false});
    });
    return waypoints;
}

// Calculate safe routes
function calculateSafeRoute() {
    const start = startInput.value;
    const end = endInput.value;

    if (!start || !end) {
        alert("Please enter both Start and End locations.");
        return;
    }

    const startGeocoder = new google.maps.Geocoder();
    const endGeocoder = new google.maps.Geocoder();

    startGeocoder.geocode({ address: start }, (startResults, status1) => {
        if (status1 !== "OK" || !startResults[0]) { alert("Invalid start location."); return; }
        const startLatLng = startResults[0].geometry.location;

        endGeocoder.geocode({ address: end }, (endResults, status2) => {
            if (status2 !== "OK" || !endResults[0]) { alert("Invalid end location."); return; }
            const endLatLng = endResults[0].geometry.location;

            if (isPointInWaterloggedAreas(startLatLng) || isPointInWaterloggedAreas(endLatLng)) {
                alert("Start or End is inside a waterlogged area! Choose another location."); return;
            }

            clearRoutes();

            let attempt = 0;
            let maxAttempts = 5;
            let allWaypoints = [];

            function tryRoute() {
                directionsService.route({
                    origin: startLatLng,
                    destination: endLatLng,
                    travelMode: 'DRIVING',
                    waypoints: allWaypoints,
                    optimizeWaypoints: true,
                    provideRouteAlternatives: true
                }, (response, status) => {
                    if (status === 'OK') {
                        const safeRoutes = response.routes.filter(route => {
                            for (let leg of route.legs) {
                                for (let step of leg.steps) {
                                    for (let point of step.path) {
                                        if (isPointInWaterloggedAreas(point)) return false;
                                    }
                                }
                            }
                            return true;
                        });

                        if (safeRoutes.length > 0) {
                            const colors = ["#3366FF", "#33CC33", "#FF9933", "#FF3333"];
                            safeRoutes.forEach((route, index) => {
                                const renderer = new google.maps.DirectionsRenderer({
                                    map: map,
                                    directions: response,
                                    routeIndex: response.routes.indexOf(route),
                                    polylineOptions: { strokeColor: colors[index % colors.length], strokeWeight: 5 },
                                    suppressMarkers: true
                                });
                                directionsRenderers.push(renderer);

                                // Add markers
                                const leg = route.legs[0];
                                const startMarker = new google.maps.Marker({ position: leg.start_location, map: map, label: (index + 1).toString() });
                                const endMarker = new google.maps.Marker({ position: leg.end_location, map: map, label: (index + 1).toString() });
                                markers.push(startMarker, endMarker);

                                const info = new google.maps.InfoWindow({ content: `Route ${index + 1}` });
                                startMarker.addListener('click', () => info.open(map, startMarker));
                                endMarker.addListener('click', () => info.open(map, endMarker));
                            });

                            alert(`✅ Safe route found! ${safeRoutes.length} safe route(s) displayed.`);
                        } else {
                            attempt++;
                            if (attempt <= maxAttempts && waterloggedAreas.length > 0) {
                                allWaypoints = allWaypoints.concat(generateWaypoints(waterloggedAreas[0]));
                                tryRoute();
                            } else alert("❌ Could not find a safe route after several attempts.");
                        }
                    } else {
                        alert("Could not calculate route: " + status);
                    }
                });
            }

            tryRoute();
        });
    });
}

function removeLastPolygon() {
    if (waterloggedAreas.length > 0) {
        const lastPolygon = waterloggedAreas.pop();
        lastPolygon.setMap(null);

        // Send the coordinates of the removed polygon to server
        const coords = lastPolygon.getPath().getArray().map(p => ({lat: p.lat(), lng: p.lng()}));
        fetch('/remove_last_polygon/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({coordinates: coords})
        });

        alert("Last polygon removed!");
    } else {
        alert("No polygons to remove.");
    }
}


function clearAllPolygons() {
    if (waterloggedAreas.length > 0) {
        waterloggedAreas.forEach(polygon => polygon.setMap(null));
        waterloggedAreas = [];

        // Tell server to clear polygons
        fetch('/clear_polygons/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        alert("All polygons removed!");
    } else {
        alert("No polygons to remove.");
    }
}

function updatePolygonButtons() {
    document.getElementById("removeLastBtn").disabled = waterloggedAreas.length === 0;
    document.getElementById("clearAllBtn").disabled = waterloggedAreas.length === 0;
}
