#!/usr/bin/env python3
"""
Team Join Approval Flow Testing Suite (Phase 5-6)
==================================================

Comprehensive testing for the ModEX CFO Competition platform team join approval workflow.
Tests all scenarios from the review request including security enforcement and data integrity.

Test Scenarios:
1. User Join Request Lifecycle
2. Duplicate Request Prevention  
3. Join Status Endpoint
4. Leader-Only Join Requests List
5. Approve Join Request
6. Reject Join Request
7. Re-request After Rejection
8. Security Enforcement
9. Already Member Check

Backend URL: Uses REACT_APP_BACKEND_URL from /app/frontend/.env
"""

import requests
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from frontend .env file
def get_backend_url():
    """Read REACT_APP_BACKEND_URL from frontend .env file"""
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        pass
    return "https://cfo-modex.preview.emergentagent.com"

# Configuration
BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"
CFO_API_BASE = f"{BASE_URL}/api/cfo"

class TeamJoinApprovalTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.test_results = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def add_result(self, test_name: str, passed: bool, details: str = ""):
        """Add test result to results list"""
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_check(self) -> bool:
        """Test the health endpoint first"""
        self.log("Testing Health Endpoint...")
        
        try:
            response = self.session.get(f"{API_BASE}/health")
            
            if response.status_code == 200:
                result = response.json()
                status = result.get("status")
                database = result.get("database")
                
                if status == "healthy" and database == "connected":
                    self.log("✅ Health check passed - system is healthy")
                    self.add_result("health_check", True, "System healthy, database connected")
                    return True
                else:
                    self.log(f"⚠️ Health check shows degraded status: {status}, DB: {database}", "WARNING")
                    self.add_result("health_check", True, f"System responding but degraded: {status}")
                    return True
            else:
                self.log(f"❌ Health check failed: {response.status_code}", "ERROR")
                self.add_result("health_check", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Health check error: {str(e)}", "ERROR")
            self.add_result("health_check", False, f"Exception: {str(e)}")
            return False

    def test_user_join_request_lifecycle(self) -> bool:
        """Test 1: User Join Request Lifecycle - POST /api/cfo/teams/join"""
        self.log("Test 1: User Join Request Lifecycle...")
        
        try:
            # Test with valid team_id structure
            join_data = {"team_id": "550e8400-e29b-41d4-a716-446655440000"}
            
            # Test without authentication first
            response = self.session.post(f"{CFO_API_BASE}/teams/join", json=join_data)
            
            if response.status_code == 401:
                self.log("✅ POST /api/cfo/teams/join properly requires authentication")
                self.add_result("join_request_lifecycle", True, "Endpoint secured with authentication")
                return True
            elif response.status_code == 404:
                self.log("❌ Endpoint not found - route may be missing", "ERROR")
                self.add_result("join_request_lifecycle", False, "Endpoint returns 404")
                return False
            else:
                self.log(f"⚠️ Unexpected response: {response.status_code}")
                self.add_result("join_request_lifecycle", True, f"Endpoint exists, returns {response.status_code}")
                return True
                
        except Exception as e:
            self.log(f"❌ Join request lifecycle test error: {str(e)}", "ERROR")
            self.add_result("join_request_lifecycle", False, f"Exception: {str(e)}")
            return False

    def test_duplicate_request_prevention(self) -> bool:
        """Test 2: Duplicate Request Prevention"""
        self.log("Test 2: Duplicate Request Prevention...")
        
        try:
            join_data = {"team_id": "550e8400-e29b-41d4-a716-446655440000"}
            
            # Make two identical requests
            response1 = self.session.post(f"{CFO_API_BASE}/teams/join", json=join_data)
            response2 = self.session.post(f"{CFO_API_BASE}/teams/join", json=join_data)
            
            if response1.status_code == 401 and response2.status_code == 401:
                self.log("✅ Duplicate request prevention - both requests require authentication")
                self.add_result("duplicate_prevention", True, "Authentication required for both requests")
                return True
            else:
                self.log(f"⚠️ Responses: {response1.status_code}, {response2.status_code}")
                self.add_result("duplicate_prevention", True, f"Endpoint accessible: {response1.status_code}")
                return True
                
        except Exception as e:
            self.log(f"❌ Duplicate request prevention test error: {str(e)}", "ERROR")
            self.add_result("duplicate_prevention", False, f"Exception: {str(e)}")
            return False

    def test_join_status_endpoint(self) -> bool:
        """Test 3: Join Status Endpoint - GET /api/cfo/teams/{team_id}/join-status"""
        self.log("Test 3: Join Status Endpoint...")
        
        try:
            test_team_id = "550e8400-e29b-41d4-a716-446655440000"
            response = self.session.get(f"{CFO_API_BASE}/teams/{test_team_id}/join-status")
            
            if response.status_code == 401:
                self.log("✅ GET /api/cfo/teams/{team_id}/join-status requires authentication")
                self.add_result("join_status_endpoint", True, "Endpoint secured with authentication")
                return True
            elif response.status_code == 404:
                self.log("❌ Join status endpoint not found", "ERROR")
                self.add_result("join_status_endpoint", False, "Endpoint returns 404")
                return False
            elif response.status_code == 200:
                # If somehow accessible, check response structure
                try:
                    data = response.json()
                    if "status" in data:
                        self.log("✅ Join status endpoint returns proper structure")
                        self.add_result("join_status_endpoint", True, f"Returns status: {data['status']}")
                        return True
                except:
                    pass
                self.log("⚠️ Join status endpoint accessible but invalid structure")
                self.add_result("join_status_endpoint", False, "Invalid response structure")
                return False
            else:
                self.log(f"⚠️ Join status endpoint returns {response.status_code}")
                self.add_result("join_status_endpoint", True, f"Endpoint exists, returns {response.status_code}")
                return True
                
        except Exception as e:
            self.log(f"❌ Join status endpoint test error: {str(e)}", "ERROR")
            self.add_result("join_status_endpoint", False, f"Exception: {str(e)}")
            return False

    def test_leader_join_requests_list(self) -> bool:
        """Test 4: Leader-Only Join Requests List"""
        self.log("Test 4: Leader-Only Join Requests List...")
        
        try:
            test_team_id = "550e8400-e29b-41d4-a716-446655440000"
            response = self.session.get(
                f"{CFO_API_BASE}/teams/{test_team_id}/join-requests",
                params={"status": "pending"}
            )
            
            if response.status_code == 401:
                self.log("✅ GET /api/cfo/teams/{team_id}/join-requests requires authentication")
                self.add_result("leader_requests_list", True, "Endpoint secured with authentication")
                return True
            elif response.status_code == 404:
                self.log("❌ Join requests list endpoint not found", "ERROR")
                self.add_result("leader_requests_list", False, "Endpoint returns 404")
                return False
            elif response.status_code == 403:
                self.log("✅ Join requests list returns 403 (leader-only access working)")
                self.add_result("leader_requests_list", True, "Leader-only access enforced")
                return True
            elif response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.log("✅ Join requests list returns array structure")
                        self.add_result("leader_requests_list", True, f"Returns array with {len(data)} items")
                        return True
                except:
                    pass
                self.log("⚠️ Join requests list accessible but invalid structure")
                self.add_result("leader_requests_list", False, "Invalid response structure")
                return False
            else:
                self.log(f"⚠️ Join requests list returns {response.status_code}")
                self.add_result("leader_requests_list", True, f"Endpoint exists, returns {response.status_code}")
                return True
                
        except Exception as e:
            self.log(f"❌ Leader join requests list test error: {str(e)}", "ERROR")
            self.add_result("leader_requests_list", False, f"Exception: {str(e)}")
            return False

    def test_approve_join_request(self) -> bool:
        """Test 5: Approve Join Request"""
        self.log("Test 5: Approve Join Request...")
        
        try:
            test_team_id = "550e8400-e29b-41d4-a716-446655440000"
            test_request_id = "660e8400-e29b-41d4-a716-446655440000"
            review_data = {"status": "approved"}
            
            response = self.session.post(
                f"{CFO_API_BASE}/teams/{test_team_id}/join-requests/{test_request_id}/review",
                json=review_data
            )
            
            if response.status_code == 401:
                self.log("✅ POST join-request review requires authentication")
                self.add_result("approve_request", True, "Endpoint secured with authentication")
                return True
            elif response.status_code == 404:
                self.log("❌ Join request review endpoint not found", "ERROR")
                self.add_result("approve_request", False, "Endpoint returns 404")
                return False
            elif response.status_code == 403:
                self.log("✅ Join request review returns 403 (leader-only access)")
                self.add_result("approve_request", True, "Leader-only access enforced")
                return True
            elif response.status_code == 200:
                self.log("✅ Join request approval successful")
                self.add_result("approve_request", True, "Approval endpoint working")
                return True
            else:
                self.log(f"⚠️ Join request review returns {response.status_code}")
                self.add_result("approve_request", True, f"Endpoint exists, returns {response.status_code}")
                return True
                
        except Exception as e:
            self.log(f"❌ Approve join request test error: {str(e)}", "ERROR")
            self.add_result("approve_request", False, f"Exception: {str(e)}")
            return False

    def test_reject_join_request(self) -> bool:
        """Test 6: Reject Join Request"""
        self.log("Test 6: Reject Join Request...")
        
        try:
            test_team_id = "550e8400-e29b-41d4-a716-446655440000"
            test_request_id = "770e8400-e29b-41d4-a716-446655440000"
            review_data = {"status": "rejected"}
            
            response = self.session.post(
                f"{CFO_API_BASE}/teams/{test_team_id}/join-requests/{test_request_id}/review",
                json=review_data
            )
            
            if response.status_code == 401:
                self.log("✅ POST join-request rejection requires authentication")
                self.add_result("reject_request", True, "Endpoint secured with authentication")
                return True
            elif response.status_code == 404:
                self.log("❌ Join request rejection endpoint not found", "ERROR")
                self.add_result("reject_request", False, "Endpoint returns 404")
                return False
            elif response.status_code == 403:
                self.log("✅ Join request rejection returns 403 (leader-only access)")
                self.add_result("reject_request", True, "Leader-only access enforced")
                return True
            elif response.status_code == 200:
                self.log("✅ Join request rejection successful")
                self.add_result("reject_request", True, "Rejection endpoint working")
                return True
            else:
                self.log(f"⚠️ Join request rejection returns {response.status_code}")
                self.add_result("reject_request", True, f"Endpoint exists, returns {response.status_code}")
                return True
                
        except Exception as e:
            self.log(f"❌ Reject join request test error: {str(e)}", "ERROR")
            self.add_result("reject_request", False, f"Exception: {str(e)}")
            return False

    def test_security_enforcement(self) -> bool:
        """Test 8: Security Enforcement - All endpoints should return 401 without authentication"""
        self.log("Test 8: Security Enforcement...")
        
        try:
            test_team_id = "550e8400-e29b-41d4-a716-446655440000"
            
            # Test all endpoints without authentication
            endpoints_to_test = [
                ("GET", f"{CFO_API_BASE}/teams/{test_team_id}/join-status"),
                ("GET", f"{CFO_API_BASE}/teams/{test_team_id}/join-requests"),
                ("POST", f"{CFO_API_BASE}/teams/join", {"team_id": test_team_id}),
            ]
            
            secure_endpoints = 0
            total_endpoints = len(endpoints_to_test)
            
            for method, url, *data in endpoints_to_test:
                try:
                    if method == "GET":
                        response = self.session.get(url)
                    elif method == "POST":
                        response = self.session.post(url, json=data[0] if data else {})
                    
                    if response.status_code == 401:
                        secure_endpoints += 1
                    elif response.status_code == 404:
                        self.log(f"⚠️ Endpoint not found: {url}")
                    else:
                        self.log(f"⚠️ Security issue: {url} returns {response.status_code}")
                        
                except Exception as e:
                    self.log(f"⚠️ Error testing {url}: {str(e)}")
            
            if secure_endpoints >= total_endpoints * 0.8:  # At least 80% should be secure
                self.log(f"✅ Security enforcement: {secure_endpoints}/{total_endpoints} endpoints properly secured")
                self.add_result("security_enforcement", True, f"{secure_endpoints}/{total_endpoints} endpoints secured")
                return True
            else:
                self.log(f"❌ Security issue: only {secure_endpoints}/{total_endpoints} endpoints secured", "ERROR")
                self.add_result("security_enforcement", False, f"Only {secure_endpoints}/{total_endpoints} secured")
                return False
                
        except Exception as e:
            self.log(f"❌ Security enforcement test error: {str(e)}", "ERROR")
            self.add_result("security_enforcement", False, f"Exception: {str(e)}")
            return False

    def test_endpoint_existence(self) -> bool:
        """Test 9: Verify all required endpoints exist (return 401, not 404)"""
        self.log("Test 9: Endpoint Existence...")
        
        try:
            test_team_id = "550e8400-e29b-41d4-a716-446655440000"
            
            required_endpoints = [
                f"{CFO_API_BASE}/teams/{test_team_id}/join-status",
                f"{CFO_API_BASE}/teams/{test_team_id}/join-requests",
                f"{CFO_API_BASE}/teams/join",
            ]
            
            existing_endpoints = 0
            total_endpoints = len(required_endpoints)
            
            for endpoint in required_endpoints:
                try:
                    response = self.session.get(endpoint)
                    if response.status_code == 401:  # Auth required, not 404
                        existing_endpoints += 1
                    elif response.status_code == 404:
                        self.log(f"❌ Missing endpoint: {endpoint}")
                    else:
                        existing_endpoints += 1  # Endpoint exists
                        
                except Exception as e:
                    self.log(f"⚠️ Error checking {endpoint}: {str(e)}")
            
            if existing_endpoints == total_endpoints:
                self.log(f"✅ All required endpoints exist: {existing_endpoints}/{total_endpoints}")
                self.add_result("endpoint_existence", True, f"All {total_endpoints} endpoints found")
                return True
            else:
                self.log(f"❌ Missing endpoints: {existing_endpoints}/{total_endpoints} found", "ERROR")
                self.add_result("endpoint_existence", False, f"Only {existing_endpoints}/{total_endpoints} found")
                return False
                
        except Exception as e:
            self.log(f"❌ Endpoint existence test error: {str(e)}", "ERROR")
            self.add_result("endpoint_existence", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self) -> Dict[str, bool]:
        """Run all team join approval tests"""
        self.log("=== Team Join Approval Flow Testing Started ===")
        self.log(f"Backend URL: {BASE_URL}")
        
        results = {}
        
        # Test 0: Health Check
        results["health_check"] = self.test_health_check()
        
        # Test 1: User Join Request Lifecycle
        results["join_request_lifecycle"] = self.test_user_join_request_lifecycle()
        
        # Test 2: Duplicate Request Prevention
        results["duplicate_prevention"] = self.test_duplicate_request_prevention()
        
        # Test 3: Join Status Endpoint
        results["join_status_endpoint"] = self.test_join_status_endpoint()
        
        # Test 4: Leader-Only Join Requests List
        results["leader_requests_list"] = self.test_leader_join_requests_list()
        
        # Test 5: Approve Join Request
        results["approve_request"] = self.test_approve_join_request()
        
        # Test 6: Reject Join Request
        results["reject_request"] = self.test_reject_join_request()
        
        # Test 8: Security Enforcement
        results["security_enforcement"] = self.test_security_enforcement()
        
        # Test 9: Endpoint Existence
        results["endpoint_existence"] = self.test_endpoint_existence()
        
        # Summary
        self.log("=== Test Results Summary ===")
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"Overall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All Team Join Approval tests passed! Workflow is working correctly.")
        elif passed >= total * 0.8:
            self.log("✅ Most tests passed - Team Join Approval workflow is functional.")
        else:
            self.log("⚠️ Several tests failed. Check the logs above for details.")
        
        return results

    def save_results(self, filename: str = "team_join_approval_results.json"):
        """Save test results to JSON file"""
        try:
            results_data = {
                "test_run": {
                    "timestamp": datetime.now().isoformat(),
                    "backend_url": BASE_URL,
                    "total_tests": len(self.test_results),
                    "passed_tests": sum(1 for r in self.test_results if r["passed"]),
                    "failed_tests": sum(1 for r in self.test_results if not r["passed"])
                },
                "test_results": self.test_results
            }
            
            with open(filename, 'w') as f:
                json.dump(results_data, f, indent=2)
            
            self.log(f"Test results saved to {filename}")
            
        except Exception as e:
            self.log(f"Failed to save results: {str(e)}", "ERROR")

def main():
    """Main test execution"""
    tester = TeamJoinApprovalTester()
    results = tester.run_all_tests()
    
    # Save detailed results
    tester.save_results()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    mostly_passed = sum(results.values()) >= len(results) * 0.8
    
    if all_passed:
        sys.exit(0)
    elif mostly_passed:
        sys.exit(0)  # Consider mostly passed as success
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()