#!/usr/bin/env python3
"""
Team Submission API Testing - Focused on Case and Submission tab functionality
"""

import requests
import sys
from datetime import datetime

class TeamSubmissionTester:
    def __init__(self):
        self.base_url = "https://modex-uploader.preview.emergentagent.com"
        self.api_base = f"{self.base_url}/api/cfo"
        self.token = None
        self.team_id = None
        self.competition_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        self.tests_run += 1
        try:
            response = requests.get(f"{self.api_base}/competitions")
            if response.status_code == 200:
                competitions = response.json()
                if competitions:
                    self.competition_id = competitions[0]['id']
                    self.log(f"✅ API connectivity OK, found {len(competitions)} competitions")
                    self.tests_passed += 1
                    return True
                else:
                    self.log("❌ No competitions found")
            else:
                self.log(f"❌ API connectivity failed: {response.status_code}")
        except Exception as e:
            self.log(f"❌ API connectivity error: {str(e)}")
        return False

    def test_team_endpoints_without_auth(self):
        """Test team submission endpoints without authentication (should fail)"""
        self.log("Testing team submission endpoints without authentication...")
        
        # Test GET submission without auth
        self.tests_run += 1
        try:
            response = requests.get(f"{self.api_base}/teams/test-team-id/submission")
            if response.status_code in [401, 403]:
                self.log("✅ GET team submission properly requires authentication")
                self.tests_passed += 1
            else:
                self.log(f"❌ Expected 401/403 for unauthenticated GET, got: {response.status_code}")
        except Exception as e:
            self.log(f"❌ GET submission test error: {str(e)}")

        # Test POST submission without auth
        self.tests_run += 1
        try:
            files = {'file': ('test.pdf', b'test content', 'application/pdf')}
            response = requests.post(f"{self.api_base}/teams/test-team-id/submission", files=files)
            if response.status_code in [401, 403]:
                self.log("✅ POST team submission properly requires authentication")
                self.tests_passed += 1
            else:
                self.log(f"❌ Expected 401/403 for unauthenticated POST, got: {response.status_code}")
        except Exception as e:
            self.log(f"❌ POST submission test error: {str(e)}")

    def test_team_endpoints_with_invalid_team(self):
        """Test team submission endpoints with invalid team ID"""
        self.log("Testing team submission endpoints with invalid team ID...")
        
        # Test with clearly invalid team ID
        invalid_team_id = "invalid-team-id-123"
        
        self.tests_run += 1
        try:
            response = requests.get(f"{self.api_base}/teams/{invalid_team_id}/submission")
            if response.status_code in [400, 401, 403, 404]:
                self.log("✅ GET submission with invalid team ID returns appropriate error")
                self.tests_passed += 1
            else:
                self.log(f"❌ Expected error for invalid team ID, got: {response.status_code}")
        except Exception as e:
            self.log(f"❌ Invalid team ID test error: {str(e)}")

    def test_api_endpoint_structure(self):
        """Test that the expected API endpoints exist and return appropriate responses"""
        self.log("Testing API endpoint structure...")
        
        # Test teams endpoint structure
        self.tests_run += 1
        try:
            if self.competition_id:
                response = requests.get(f"{self.api_base}/teams/competition/{self.competition_id}")
                if response.status_code == 200:
                    teams = response.json()
                    self.log(f"✅ Teams endpoint working, found {len(teams)} teams")
                    if teams:
                        self.team_id = teams[0]['id']
                        self.log(f"   Using team ID: {self.team_id}")
                    self.tests_passed += 1
                else:
                    self.log(f"❌ Teams endpoint failed: {response.status_code}")
            else:
                self.log("❌ No competition ID available for teams test")
        except Exception as e:
            self.log(f"❌ Teams endpoint test error: {str(e)}")

    def test_submission_endpoint_responses(self):
        """Test submission endpoints return expected response structure"""
        if not self.team_id:
            self.log("❌ No team ID available for submission endpoint tests")
            return
            
        self.log("Testing submission endpoint response structure...")
        
        # Test GET submission endpoint
        self.tests_run += 1
        try:
            response = requests.get(f"{self.api_base}/teams/{self.team_id}/submission")
            # Should return 401/403 (auth required) or 404 (no submission) - both are valid
            if response.status_code in [401, 403, 404]:
                self.log("✅ GET submission endpoint exists and returns appropriate response")
                self.tests_passed += 1
            else:
                self.log(f"❌ Unexpected response from GET submission: {response.status_code}")
        except Exception as e:
            self.log(f"❌ GET submission endpoint test error: {str(e)}")

    def run_all_tests(self):
        """Run all tests"""
        self.log("=== Team Submission API Testing Started ===")
        
        # Test 1: Basic connectivity
        if not self.test_basic_connectivity():
            self.log("❌ Basic connectivity failed, stopping tests")
            return False
        
        # Test 2: Authentication requirements
        self.test_team_endpoints_without_auth()
        
        # Test 3: Invalid team ID handling
        self.test_team_endpoints_with_invalid_team()
        
        # Test 4: API endpoint structure
        self.test_api_endpoint_structure()
        
        # Test 5: Submission endpoint responses
        self.test_submission_endpoint_responses()
        
        # Summary
        self.log("=== Test Results Summary ===")
        self.log(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        
        if self.tests_passed >= self.tests_run * 0.8:  # 80% pass rate
            self.log("🎉 Team submission API structure looks good!")
            return True
        else:
            self.log("⚠️ Some API structure issues found")
            return False

def main():
    tester = TeamSubmissionTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()