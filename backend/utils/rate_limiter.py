"""
OPTIONAL IMPROVEMENT: Lightweight Rate Limiting
================================================
Post-hardening robustness enhancement (not security-critical)

Simple in-memory rate limiting for auth endpoints.
No Redis, no external services, FastAPI middleware only.

Limits:
- /auth/login: 5 attempts per 5 minutes per IP
- /auth/register: 3 attempts per 10 minutes per IP
- /cfo/upload-cv: 3 attempts per 5 minutes per IP
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class SimpleRateLimiter(BaseHTTPMiddleware):
    """
    Lightweight in-memory rate limiter for specific endpoints
    
    WARNING: This is per-worker, not distributed. For production,
    consider Redis or a proper rate limiting service.
    
    For now, this provides basic protection against brute force.
    """
    
    def __init__(self, app):
        super().__init__(app)
        
        # In-memory storage: {ip: {endpoint: [timestamps]}}
        self.requests = defaultdict(lambda: defaultdict(list))
        
        # Rate limit configurations: {path_pattern: (max_requests, window_seconds)}
        self.limits = {
            '/api/cfo/auth/login': (5, 300),      # 5 per 5 minutes
            '/api/cfo/auth/register': (3, 600),   # 3 per 10 minutes
            '/api/cfo/applications/upload-cv': (3, 300),  # 3 per 5 minutes
        }
        
        # Cleanup interval (remove old entries every 10 minutes)
        self.last_cleanup = datetime.utcnow()
        self.cleanup_interval = timedelta(minutes=10)
    
    async def dispatch(self, request: Request, call_next):
        """Process request and apply rate limiting if applicable"""
        
        # Only apply to configured endpoints
        path = request.url.path
        method = request.method
        
        # Only rate limit POST requests to auth endpoints
        if method == 'POST' and path in self.limits:
            client_ip = request.client.host if request.client else 'unknown'
            
            # Check rate limit
            if not self._check_rate_limit(client_ip, path):
                logger.warning(f"Rate limit exceeded: {client_ip} on {path}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "code": "RATE_LIMITED",
                        "message": "Too many requests. Please try again later."
                    }
                )
        
        # Periodic cleanup of old entries
        self._periodic_cleanup()
        
        # Process request
        response = await call_next(request)
        return response
    
    def _check_rate_limit(self, client_ip: str, endpoint: str) -> bool:
        """
        Check if client has exceeded rate limit for endpoint
        
        Returns: True if allowed, False if rate limited
        """
        max_requests, window_seconds = self.limits[endpoint]
        now = datetime.utcnow()
        cutoff_time = now - timedelta(seconds=window_seconds)
        
        # Get timestamps for this IP and endpoint
        timestamps = self.requests[client_ip][endpoint]
        
        # Remove old timestamps outside the window
        timestamps[:] = [ts for ts in timestamps if ts > cutoff_time]
        
        # Check if limit exceeded
        if len(timestamps) >= max_requests:
            return False
        
        # Record this request
        timestamps.append(now)
        return True
    
    def _periodic_cleanup(self):
        """Clean up old entries to prevent memory bloat"""
        now = datetime.utcnow()
        
        if now - self.last_cleanup < self.cleanup_interval:
            return
        
        logger.info("Running rate limiter cleanup")
        
        # Remove entries older than 1 hour
        cutoff = now - timedelta(hours=1)
        
        # Clean up each IP's endpoints
        ips_to_remove = []
        for ip, endpoints in self.requests.items():
            endpoints_to_remove = []
            for endpoint, timestamps in endpoints.items():
                # Remove old timestamps
                timestamps[:] = [ts for ts in timestamps if ts > cutoff]
                
                # Mark empty endpoints for removal
                if not timestamps:
                    endpoints_to_remove.append(endpoint)
            
            # Remove empty endpoints
            for endpoint in endpoints_to_remove:
                del endpoints[endpoint]
            
            # Mark empty IPs for removal
            if not endpoints:
                ips_to_remove.append(ip)
        
        # Remove empty IPs
        for ip in ips_to_remove:
            del self.requests[ip]
        
        self.last_cleanup = now
        logger.info(f"Rate limiter cleanup complete. Active IPs: {len(self.requests)}")
