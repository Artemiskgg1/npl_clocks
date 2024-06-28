from django.db import models


class LogEntry(models.Model):
    timestamp = models.DateTimeField()
    log_time = models.CharField(max_length=100)
    ip = models.GenericIPAddressField()
    status = models.CharField(max_length=20)
    bias = models.IntegerField()
    location = models.ForeignKey(
        LocationIPMapping, on_delete=models.CASCADE, related_name="log_entries"  # type: ignore
    )

    def __str__(self):
        return f"{self.timestamp} - {self.ip} - {self.status} - {self.location}"


class LocationIPMapping(models.Model):
    location_name = models.CharField(max_length=200)
    ip_address = models.GenericIPAddressField()
