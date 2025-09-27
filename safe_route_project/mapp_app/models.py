from django.db import models

# Create your models here.
class WaterloggedArea(models.Model):
    name = models.CharField(max_length=100, blank=True)
    # Store polygon coordinates as JSON
    coordinates = models.JSONField()

    def __str__(self):
        return self.name or f"Area {self.id}"
