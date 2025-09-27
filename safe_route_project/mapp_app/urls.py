"""
URL configuration for safe_route_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from mapp_app import views

app_name = 'mapp_app'

urlpatterns = [
    path('',views.home,name='home'),
    path('index/', views.index, name='index'),
    path('weather/', views.weather, name='weather'),
    path('sos/', views.sos, name='sos'),
    path('add_polygon/', views.add_polygon, name='add_polygon'),
    path('remove_last_polygon/', views.remove_last_polygon, name='remove_last_polygon'),
    path('clear_polygons/', views.clear_polygons, name='clear_polygons'),
    path('load_polygons/', views.load_polygons, name='load_polygons'),
]
