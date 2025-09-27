from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import WaterloggedArea

# Create your views here.

def home(request):
    return render(request, 'map_app/home.html')

def index(request):
    areas = WaterloggedArea.objects.all()
    # Convert coordinates to JSON for frontend
    areas_json = json.dumps([area.coordinates for area in areas])
    return render(request, 'map_app/index.html', {'areas_json': areas_json})

def weather(request):
    return render(request, 'map_app/weather.html')

def sos(request):
    # Load all waterlogged areas from DB
    areas = WaterloggedArea.objects.all()
    return render(request, 'map_app/sos.html', {'areas': areas})

# Save a new polygon
@csrf_exempt
def add_polygon(request):
    if request.method == "POST":
        data = json.loads(request.body)
        coords = data.get("coordinates", [])
        if coords:
            WaterloggedArea.objects.create(coordinates=coords)
            return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"}, status=400)


# Remove the last polygon
@csrf_exempt
def remove_last_polygon(request):
    if request.method == "POST":
        last = WaterloggedArea.objects.order_by('-id').first()
        if last:
            last.delete()
            return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"}, status=400)


# Clear all polygons
@csrf_exempt
def clear_polygons(request):
    if request.method == "POST":
        WaterloggedArea.objects.all().delete()
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"}, status=400)


# Load all polygons (for initializing the map)
def load_polygons(request):
    areas = WaterloggedArea.objects.all()
    data = [{"id": area.id, "coordinates": area.coordinates} for area in areas]
    return JsonResponse(data, safe=False)


