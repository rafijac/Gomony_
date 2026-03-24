# src/utils/security.py
import time
from collections import defaultdict

class SecurityMiddleware:
    def __init__(self, max_requests=5, window_seconds=60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)  # user_id -> [timestamps]

    def allow_request(self, user_id):
        now = time.time()
        timestamps = self.requests[user_id]
        # Remove timestamps outside window
        self.requests[user_id] = [t for t in timestamps if now - t < self.window_seconds]
        if len(self.requests[user_id]) < self.max_requests:
            self.requests[user_id].append(now)
            return True
        return False
