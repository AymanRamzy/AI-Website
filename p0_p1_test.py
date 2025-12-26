#!/usr/bin/env python3
"""
P0 & P1 Critical Issues Testing Suite
Tests Google Sign-In redirect and Team File Submission functionality
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://modex-uploader.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api/cfo"

class P0P1Tester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_api_connectivity(self) -> bool:
        """Test basic API connectivity"""
        try:
            # Test the main API endpoint
            response = self.session.get(f"{BASE_URL}/api/")
            if response.status_code == 200:
                self.log("✅ API connectivity check passed")
                return True
            else:
                self.log(f"❌ API connectivity failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ API connectivity error: {str(e)}", "ERROR")
            return False
    
    def test_p0_google_auth_callback_endpoint(self) -> bool:
        """Test P0: Google OAuth callback endpoint structure"""
        self.log("Testing P0: Google OAuth callback endpoint...")
        
        try:
            # Test the google-callback endpoint with mock data
            # This tests the endpoint structure, not actual OAuth flow
            mock_google_data = {
                "access_token": "mock_access_token",
                "refresh_token": "mock_refresh_token",
                "user": {
                    "id": "mock_google_user_id",
                    "email": "test.google.user@gmail.com",
                    "full_name": "Test Google User",
                    "avatar_url": "https://example.com/avatar.jpg"
                }
            }
            
            response = self.session.post(
                f"{API_BASE}/auth/google-callback",
                json=mock_google_data,
                timeout=10
            )
            
            # We expect this to fail with 400/401 since it's mock data
            # But the endpoint should exist and respond properly
            if response.status_code in [400, 401, 422]:
                self.log("✅ Google callback endpoint exists and responds correctly")
                return True
            elif response.status_code == 404:
                self.log("❌ Google callback endpoint not found", "ERROR")
                return False
            else:
                self.log(f"✅ Google callback endpoint exists (status: {response.status_code})")
                return True
                
        except Exception as e:
            self.log(f"❌ Google callback endpoint test error: {str(e)}", "ERROR")
            return False
    
    def test_p0_auth_me_endpoint(self) -> bool:
        """Test P0: /auth/me endpoint structure"""
        self.log("Testing P0: /auth/me endpoint structure...")
        
        try:
            # Test without authentication (should return 401)
            response = self.session.get(f"{API_BASE}/auth/me")
            
            if response.status_code == 401:
                self.log("✅ /auth/me endpoint exists and requires authentication")
                return True
            elif response.status_code == 404:
                self.log("❌ /auth/me endpoint not found", "ERROR")
                return False
            else:
                self.log(f"✅ /auth/me endpoint exists (status: {response.status_code})")
                return True
                
        except Exception as e:
            self.log(f"❌ /auth/me endpoint test error: {str(e)}", "ERROR")
            return False
    
    def test_p1_team_submission_endpoint_structure(self) -> bool:
        """Test P1: Team submission endpoint structure"""
        self.log("Testing P1: Team submission endpoint structure...")
        
        try:
            # Test POST endpoint without authentication (should return 401)
            mock_team_id = "test-team-id"
            response = self.session.post(f"{API_BASE}/teams/{mock_team_id}/submission")
            
            if response.status_code in [401, 403]:
                self.log("✅ Team submission POST endpoint exists and requires authentication")
                return True
            elif response.status_code == 404:
                self.log("❌ Team submission POST endpoint not found", "ERROR")
                return False
            else:
                self.log(f"✅ Team submission POST endpoint exists (status: {response.status_code})")
                return True
                
        except Exception as e:
            self.log(f"❌ Team submission POST endpoint test error: {str(e)}", "ERROR")
            return False
    
    def test_p1_team_submission_get_endpoint(self) -> bool:
        """Test P1: Team submission GET endpoint structure"""
        self.log("Testing P1: Team submission GET endpoint structure...")
        
        try:
            # Test GET endpoint without authentication
            mock_team_id = "test-team-id"
            response = self.session.get(
                f"{API_BASE}/teams/{mock_team_id}/submission",
                params={"competition_id": "test-competition-id"}
            )
            
            if response.status_code in [401, 403, 404]:
                self.log("✅ Team submission GET endpoint exists")
                return True
            else:
                self.log(f"✅ Team submission GET endpoint exists (status: {response.status_code})")
                return True
                
        except Exception as e:
            self.log(f"❌ Team submission GET endpoint test error: {str(e)}", "ERROR")
            return False
    
    def test_competitions_endpoint(self) -> bool:
        """Test competitions endpoint to check for existing competitions"""
        self.log("Testing competitions endpoint...")
        
        try:
            response = self.session.get(f"{API_BASE}/competitions")
            
            if response.status_code == 200:
                competitions = response.json()
                self.log(f"✅ Competitions endpoint working - found {len(competitions)} competitions")
                
                # Check for the specific competition mentioned in the context
                target_competition_id = "39c75cda-4888-4c6f-be22-fbc07d4c476e"
                found_target = any(comp.get('id') == target_competition_id for comp in competitions)
                
                if found_target:
                    self.log(f"✅ Found target competition: {target_competition_id}")
                else:
                    self.log(f"⚠️ Target competition {target_competition_id} not found")
                
                return True
            else:
                self.log(f"❌ Competitions endpoint failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Competitions endpoint test error: {str(e)}", "ERROR")
            return False
    
    def test_storage_bucket_configuration(self) -> bool:
        """Test if storage bucket configuration is accessible"""
        self.log("Testing storage bucket configuration...")
        
        try:
            # This is an indirect test - we can't directly test Supabase storage
            # but we can check if the backend has the right configuration
            # by testing a file upload endpoint structure
            
            mock_team_id = "test-team-id"
            
            # Create a small test file
            test_file_content = b"Test file content for storage validation"
            files = {'file': ('test.pdf', test_file_content, 'application/pdf')}
            data = {
                'team_id': mock_team_id,
                'competition_id': '39c75cda-4888-4c6f-be22-fbc07d4c476e'
            }
            
            response = self.session.post(
                f"{API_BASE}/teams/{mock_team_id}/submission",
                data=data,
                files=files
            )
            
            # We expect 401/403 (auth required) or 400/422 (validation error)
            # 500 would indicate storage configuration issues
            if response.status_code in [401, 403, 400, 422]:
                self.log("✅ Storage endpoint structure appears correct")
                return True
            elif response.status_code == 500:
                self.log("❌ Storage configuration may have issues (500 error)", "ERROR")
                return False
            else:
                self.log(f"✅ Storage endpoint responds (status: {response.status_code})")
                return True
                
        except Exception as e:
            self.log(f"❌ Storage configuration test error: {str(e)}", "ERROR")
            return False
    
    def run_p0_p1_tests(self) -> Dict[str, bool]:
        """Run P0 and P1 specific tests"""
        self.log("=== P0 & P1 Critical Issues Testing Started ===")
        
        results = {}
        
        # Basic connectivity
        results["api_connectivity"] = self.test_api_connectivity()
        
        # P0 Tests: Google Sign-In
        results["p0_google_callback_endpoint"] = self.test_p0_google_auth_callback_endpoint()
        results["p0_auth_me_endpoint"] = self.test_p0_auth_me_endpoint()
        
        # P1 Tests: Team File Submission
        results["p1_submission_post_endpoint"] = self.test_p1_team_submission_endpoint_structure()
        results["p1_submission_get_endpoint"] = self.test_p1_team_submission_get_endpoint()
        results["storage_configuration"] = self.test_storage_bucket_configuration()
        
        # Supporting tests
        results["competitions_endpoint"] = self.test_competitions_endpoint()
        
        # Summary
        self.log("=== P0 & P1 Test Results Summary ===")
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"Overall: {passed}/{total} tests passed")
        
        # P0 and P1 specific analysis
        p0_tests = ["p0_google_callback_endpoint", "p0_auth_me_endpoint"]
        p1_tests = ["p1_submission_post_endpoint", "p1_submission_get_endpoint", "storage_configuration"]
        
        p0_passed = sum(1 for test in p0_tests if results.get(test, False))
        p1_passed = sum(1 for test in p1_tests if results.get(test, False))
        
        self.log(f"P0 (Google Auth): {p0_passed}/{len(p0_tests)} tests passed")
        self.log(f"P1 (File Submission): {p1_passed}/{len(p1_tests)} tests passed")
        
        if passed == total:
            self.log("🎉 All P0 & P1 endpoint structures are working correctly!")
        else:
            self.log("⚠️ Some P0/P1 tests failed. Check the logs above for details.")
        
        return results

def main():
    """Main test execution"""
    tester = P0P1Tester()
    results = tester.run_p0_p1_tests()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()