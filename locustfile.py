from locust import HttpUser, task, between

class AirCheckLoadTester(HttpUser):
    wait_time = between(0.1, 0.5)

    @task(3)
    def view_analysis(self):
        self.client.get("/api/v1/devices/AABBCCDDEEFF/analysis")

    @task(1)
    def get_all_devices(self):
        self.client.get("/admin/devices/all")