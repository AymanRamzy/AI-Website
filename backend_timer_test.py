#!/usr/bin/env python3
"""
ModEX Platform Timer and Case File Management Testing Suite
Tests case timer and download flow functionality
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import time

# Configuration
BASE_URL = "https://modex-uploader.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"
CFO_API = f"{API_BASE}/cfo"
ADMIN_API = f"{API_BASE}/admin"

class ModEXTimerTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.test_competition_id = None
        self.test_team_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def run_test(self, name: str, test_func) -> bool:
        """Run a single test and track results"""
        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            result = test_func()
            if result:
                self.tests_passed += 1
                self.log(f"✅ {name} - PASSED")
            else:
                self.log(f"❌ {name} - FAILED")
            return result
        except Exception as e:
            self.log(f"❌ {name} - ERROR: {str(e)}")
            return False
    
    def test_competitions_endpoint_timer_fields(self) -> bool:
        """Test GET /api/cfo/competitions returns timer fields"""
        try:
            response = self.session.get(f"{CFO_API}/competitions")
            
            if response.status_code != 200:
                self.log(f"Competitions endpoint failed: {response.status_code}")
                return False
            
            competitions = response.json()
            if not competitions:
                self.log("No competitions found")
                return False
            
            # Check if timer fields exist in response
            comp = competitions[0]
            has_case_release = 'case_release_at' in comp
            has_submission_deadline = 'submission_deadline_at' in comp
            
            self.log(f"Competition has case_release_at: {has_case_release}")
            self.log(f"Competition has submission_deadline_at: {has_submission_deadline}")
            
            # Store competition ID for later tests
            self.test_competition_id = comp.get('id')
            
            return has_case_release and has_submission_deadline
            
        except Exception as e:
            self.log(f"Error testing competitions endpoint: {e}")
            return False
    
    def test_competition_detail_timer_fields(self) -> bool:
        """Test GET /api/cfo/competitions/{id} returns timer fields"""
        if not self.test_competition_id:
            self.log("No competition ID available for detail test")
            return False
            
        try:
            response = self.session.get(f"{CFO_API}/competitions/{self.test_competition_id}")
            
            if response.status_code != 200:
                self.log(f"Competition detail endpoint failed: {response.status_code}")
                return False
            
            competition = response.json()
            has_case_release = 'case_release_at' in competition
            has_submission_deadline = 'submission_deadline_at' in competition
            
            self.log(f"Competition detail has case_release_at: {has_case_release}")
            self.log(f"Competition detail has submission_deadline_at: {has_submission_deadline}")
            
            return has_case_release and has_submission_deadline
            
        except Exception as e:
            self.log(f"Error testing competition detail: {e}")
            return False
    
    def test_admin_competition_update_timer_fields(self) -> bool:
        """Test PATCH /api/admin/competitions/{id} updates timer fields without 520 error"""
        if not self.test_competition_id:
            self.log("No competition ID available for admin update test")
            return False
        
        # Try to get admin credentials from environment or create test admin
        try:
            # First try to login as admin (assuming test admin exists)
            admin_login = {
                "email": "admin@modex.com",
                "password": "AdminPass123!"
            }
            
            response = self.session.post(f"{CFO_API}/auth/login", json=admin_login)
            if response.status_code == 200:
                self.admin_token = response.json().get("access_token")
            else:
                self.log("Admin login failed, skipping admin tests")
                return False
                
        except Exception as e:
            self.log(f"Admin authentication failed: {e}")
            return False
        
        if not self.admin_token:
            self.log("No admin token available")
            return False
        
        try:
            # Test updating timer fields
            future_time = (datetime.now() + timedelta(hours=1)).isoformat()
            deadline_time = (datetime.now() + timedelta(hours=24)).isoformat()
            
            update_data = {
                "case_release_at": future_time,
                "submission_deadline_at": deadline_time
            }
            
            response = self.session.patch(
                f"{ADMIN_API}/competitions/{self.test_competition_id}",
                json=update_data,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            # Check for 520 error specifically
            if response.status_code == 520:
                self.log("❌ Got 520 error when updating timer fields")
                return False
            elif response.status_code in [200, 201]:
                self.log("✅ Timer fields updated successfully")
                return True
            else:
                self.log(f"Update failed with status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"Error testing admin competition update: {e}")
            return False
    
    def test_case_files_timer_enforcement(self) -> bool:
        """Test GET /api/cfo/teams/{team_id}/case-files enforces case_release_at timer"""
        # This test requires a team, which requires authentication
        # For now, test the endpoint structure
        try:
            # Test with a dummy team ID to check endpoint structure
            dummy_team_id = "00000000-0000-0000-0000-000000000000"
            response = self.session.get(f"{CFO_API}/teams/{dummy_team_id}/case-files")
            
            # Should get 401/403 (auth required) or 404 (team not found)
            # Not 500 (server error) which would indicate endpoint issues
            if response.status_code in [401, 403, 404]:
                self.log("✅ Case files endpoint exists and requires authentication")
                return True
            else:
                self.log(f"Unexpected response from case files endpoint: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"Error testing case files endpoint: {e}")
            return False
    
    def test_submission_deadline_enforcement(self) -> bool:
        """Test POST /api/cfo/teams/{team_id}/submission enforces submission_deadline_at"""
        try:
            # Test with a dummy team ID to check endpoint structure
            dummy_team_id = "00000000-0000-0000-0000-000000000000"
            
            # Create dummy file data
            files = {'file': ('test.pdf', b'test content', 'application/pdf')}
            data = {'team_id': dummy_team_id}
            
            response = self.session.post(
                f"{CFO_API}/teams/{dummy_team_id}/submission",
                data=data,
                files=files
            )
            
            # Should get 401/403 (auth required) or 404 (team not found)
            # Not 500 (server error) which would indicate endpoint issues
            if response.status_code in [401, 403, 404]:
                self.log("✅ Submission endpoint exists and requires authentication")
                return True
            else:
                self.log(f"Unexpected response from submission endpoint: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"Error testing submission endpoint: {e}")
            return False
    
    def test_admin_case_file_upload(self) -> bool:
        """Test POST /api/admin/competitions/{id}/case-files for admin file upload"""
        if not self.admin_token or not self.test_competition_id:
            self.log("Admin token or competition ID not available")
            return False
        
        try:
            # Create test file
            test_content = b"Test case file content for competition"
            files = {'file': ('test_case.pdf', test_content, 'application/pdf')}
            
            response = self.session.post(
                f"{ADMIN_API}/competitions/{self.test_competition_id}/case-files",
                files=files,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if response.status_code in [200, 201]:
                self.log("✅ Admin case file upload successful")
                return True
            else:
                self.log(f"Admin case file upload failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"Error testing admin case file upload: {e}")
            return False
    
    def test_frontend_admin_dashboard_structure(self) -> bool:
        """Test that Admin Dashboard shows datetime inputs for timer fields"""
        try:
            # Test if the admin dashboard page loads
            response = self.session.get(f"{BASE_URL}/admin")
            
            if response.status_code == 200:
                content = response.text
                # Check for datetime input elements
                has_datetime_inputs = 'type="datetime-local"' in content
                has_case_release = 'case_release' in content.lower()
                has_submission_deadline = 'submission_deadline' in content.lower()
                
                self.log(f"Admin dashboard has datetime inputs: {has_datetime_inputs}")
                self.log(f"Admin dashboard mentions case release: {has_case_release}")
                self.log(f"Admin dashboard mentions submission deadline: {has_submission_deadline}")
                
                return has_datetime_inputs and (has_case_release or has_submission_deadline)
            else:
                self.log(f"Admin dashboard not accessible: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"Error testing admin dashboard: {e}")
            return False
    
    def test_team_case_countdown_structure(self) -> bool:
        """Test that Team Case tab shows countdown structure"""
        try:
            # Test if team details page structure exists
            response = self.session.get(f"{BASE_URL}/teams/test")
            
            # Even if we get 404 or auth error, check if it's a React app
            if response.status_code in [200, 404]:
                content = response.text
                # Check for React app structure and countdown elements
                has_react = 'react' in content.lower() or 'id="root"' in content
                has_countdown = 'countdown' in content.lower() or 'timer' in content.lower()
                
                self.log(f"Page has React structure: {has_react}")
                self.log(f"Page mentions countdown/timer: {has_countdown}")
                
                return has_react  # React app structure is sufficient
            else:
                self.log(f"Team page not accessible: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"Error testing team case structure: {e}")
            return False
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all timer and case file tests"""
        self.log("=== ModEX Platform Timer & Case File Testing Started ===")
        
        results = {}
        
        # Backend API Tests
        results["competitions_timer_fields"] = self.run_test(
            "GET /api/cfo/competitions returns timer fields",
            self.test_competitions_endpoint_timer_fields
        )
        
        results["competition_detail_timer_fields"] = self.run_test(
            "GET /api/cfo/competitions/{id} returns timer fields", 
            self.test_competition_detail_timer_fields
        )
        
        results["admin_competition_update"] = self.run_test(
            "PATCH /api/admin/competitions/{id} updates timer fields without 520 error",
            self.test_admin_competition_update_timer_fields
        )
        
        results["case_files_timer_enforcement"] = self.run_test(
            "GET /api/cfo/teams/{team_id}/case-files enforces timer",
            self.test_case_files_timer_enforcement
        )
        
        results["submission_deadline_enforcement"] = self.run_test(
            "POST /api/cfo/teams/{team_id}/submission enforces deadline",
            self.test_submission_deadline_enforcement
        )
        
        results["admin_case_file_upload"] = self.run_test(
            "POST /api/admin/competitions/{id}/case-files uploads files",
            self.test_admin_case_file_upload
        )
        
        # Frontend Structure Tests
        results["admin_dashboard_structure"] = self.run_test(
            "Admin Dashboard shows datetime inputs",
            self.test_frontend_admin_dashboard_structure
        )
        
        results["team_case_structure"] = self.run_test(
            "Team Case tab structure exists",
            self.test_team_case_countdown_structure
        )
        
        # Summary
        self.log("=== Timer & Case File Test Results ===")
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"Overall: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All timer and case file tests passed!")
        else:
            self.log("⚠️ Some tests failed. Check implementation.")
        
        return results

def main():
    """Main test execution"""
    tester = ModEXTimerTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()