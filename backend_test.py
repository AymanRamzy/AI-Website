#!/usr/bin/env python3
"""
CFO Competition Backend API Testing Suite
Tests authentication flow and team management APIs
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://app-fix-12.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api/cfo"

class CFOAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_users = {}
        self.test_tokens = {}
        self.test_competitions = {}
        self.test_teams = {}
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_api_health(self) -> bool:
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{BASE_URL}/api/")
            if response.status_code == 200:
                self.log("✅ API health check passed")
                return True
            else:
                self.log(f"❌ API health check failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ API health check failed: {str(e)}", "ERROR")
            return False
    
    def test_user_registration(self) -> bool:
        """Test user registration endpoint"""
        self.log("Testing User Registration Flow...")
        
        # Test data for different user roles (using timestamp to ensure uniqueness)
        import time
        timestamp = str(int(time.time()))
        test_users_data = [
            {
                "email": f"participant{timestamp}@modex.com",
                "password": "SecurePass123!",
                "full_name": "John Participant",
                "role": "participant"
            },
            {
                "email": f"judge{timestamp}@modex.com", 
                "password": "JudgePass456!",
                "full_name": "Jane Judge",
                "role": "judge"
            },
            {
                "email": f"admin{timestamp}@modex.com",
                "password": "AdminPass789!",
                "full_name": "Admin User",
                "role": "admin"
            }
        ]
        
        success_count = 0
        
        for user_data in test_users_data:
            try:
                response = self.session.post(
                    f"{API_BASE}/auth/register",
                    json=user_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.test_users[user_data["role"]] = {
                        "credentials": user_data,
                        "user_data": result
                    }
                    self.log(f"✅ Registration successful for {user_data['role']}: {user_data['email']}")
                    success_count += 1
                else:
                    self.log(f"❌ Registration failed for {user_data['email']}: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Registration error for {user_data['email']}: {str(e)}", "ERROR")
        
        # Test duplicate email rejection
        try:
            duplicate_response = self.session.post(
                f"{API_BASE}/auth/register",
                json=test_users_data[0],  # Try to register first user again
                headers={"Content-Type": "application/json"}
            )
            
            if duplicate_response.status_code == 400:
                self.log("✅ Duplicate email rejection working correctly")
                success_count += 1
            else:
                self.log(f"❌ Duplicate email should be rejected but got: {duplicate_response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ Duplicate email test error: {str(e)}", "ERROR")
        
        return success_count >= 3  # At least 3 users registered + duplicate rejection
    
    def test_user_login(self) -> bool:
        """Test user login endpoint"""
        self.log("Testing User Login Flow...")
        
        success_count = 0
        
        for role, user_info in self.test_users.items():
            try:
                login_data = {
                    "email": user_info["credentials"]["email"],
                    "password": user_info["credentials"]["password"]
                }
                
                response = self.session.post(
                    f"{API_BASE}/auth/login",
                    json=login_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if "access_token" in result and "user" in result:
                        self.test_tokens[role] = result["access_token"]
                        self.log(f"✅ Login successful for {role}: {login_data['email']}")
                        success_count += 1
                    else:
                        self.log(f"❌ Login response missing required fields for {role}", "ERROR")
                else:
                    self.log(f"❌ Login failed for {role}: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Login error for {role}: {str(e)}", "ERROR")
        
        # Test invalid credentials
        try:
            invalid_response = self.session.post(
                f"{API_BASE}/auth/login",
                json={"email": "invalid@test.com", "password": "wrongpass"},
                headers={"Content-Type": "application/json"}
            )
            
            if invalid_response.status_code == 401:
                self.log("✅ Invalid credentials rejection working correctly")
                success_count += 1
            else:
                self.log(f"❌ Invalid credentials should be rejected but got: {invalid_response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ Invalid credentials test error: {str(e)}", "ERROR")
        
        return success_count >= len(self.test_users)
    
    def test_protected_endpoint_access(self) -> bool:
        """Test protected endpoint access with JWT tokens"""
        self.log("Testing Protected Endpoint Access...")
        
        success_count = 0
        
        # Test valid token access
        for role, token in self.test_tokens.items():
            try:
                response = self.session.get(
                    f"{API_BASE}/auth/me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    expected_email = self.test_users[role]["credentials"]["email"]
                    if result.get("email") == expected_email:
                        self.log(f"✅ Protected endpoint access successful for {role}")
                        success_count += 1
                    else:
                        self.log(f"❌ Protected endpoint returned wrong user data for {role}", "ERROR")
                else:
                    self.log(f"❌ Protected endpoint access failed for {role}: {response.status_code}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Protected endpoint error for {role}: {str(e)}", "ERROR")
        
        # Test unauthorized access (no token)
        try:
            no_token_response = self.session.get(f"{API_BASE}/auth/me")
            if no_token_response.status_code in [401, 403]:  # Both are valid for unauthorized access
                self.log("✅ Unauthorized access rejection working correctly")
                success_count += 1
            else:
                self.log(f"❌ Unauthorized access should be rejected but got: {no_token_response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"❌ Unauthorized access test error: {str(e)}", "ERROR")
        
        # Test invalid token
        try:
            invalid_token_response = self.session.get(
                f"{API_BASE}/auth/me",
                headers={"Authorization": "Bearer invalid_token_here"}
            )
            if invalid_token_response.status_code == 401:
                self.log("✅ Invalid token rejection working correctly")
                success_count += 1
            else:
                self.log(f"❌ Invalid token should be rejected but got: {invalid_token_response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"❌ Invalid token test error: {str(e)}", "ERROR")
        
        return success_count >= len(self.test_tokens) + 2  # Valid tokens + unauthorized + invalid token
    
    def test_team_management_apis(self) -> bool:
        """Test team management APIs (requires admin user and competition)"""
        self.log("Testing Team Management APIs...")
        
        if "admin" not in self.test_tokens:
            self.log("❌ Admin user not available for team management tests", "ERROR")
            return False
        
        success_count = 0
        
        # First create a competition (admin only)
        try:
            competition_data = {
                "title": "Test CFO Competition 2024",
                "description": "A test competition for API validation",
                "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
                "end_date": (datetime.now() + timedelta(days=14)).isoformat(),
                "registration_deadline": (datetime.now() + timedelta(days=3)).isoformat(),
                "max_teams": 8
            }
            
            response = self.session.post(
                f"{API_BASE}/competitions",
                json=competition_data,
                headers={"Authorization": f"Bearer {self.test_tokens['admin']}"}
            )
            
            if response.status_code == 200:
                competition = response.json()
                self.test_competitions["test_comp"] = competition
                self.log(f"✅ Competition created: {competition['id']}")
                success_count += 1
            else:
                self.log(f"❌ Competition creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Competition creation error: {str(e)}", "ERROR")
            return False
        
        # Create a team (participant user)
        if "participant" in self.test_tokens:
            try:
                team_data = {
                    "team_name": "Test Team Alpha",
                    "competition_id": self.test_competitions["test_comp"]["id"]
                }
                
                response = self.session.post(
                    f"{API_BASE}/teams",
                    json=team_data,
                    headers={"Authorization": f"Bearer {self.test_tokens['participant']}"}
                )
                
                if response.status_code == 200:
                    team = response.json()
                    self.test_teams["alpha"] = team
                    self.log(f"✅ Team created: {team['id']}")
                    success_count += 1
                else:
                    self.log(f"❌ Team creation failed: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Team creation error: {str(e)}", "ERROR")
        
        # Get team data
        if "alpha" in self.test_teams:
            try:
                response = self.session.get(
                    f"{API_BASE}/teams/{self.test_teams['alpha']['id']}"
                )
                
                if response.status_code == 200:
                    team_data = response.json()
                    self.log(f"✅ Team data retrieved: {team_data['team_name']}")
                    success_count += 1
                else:
                    self.log(f"❌ Team data retrieval failed: {response.status_code}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Team data retrieval error: {str(e)}", "ERROR")
        
        # Test team joining (if we have judge user)
        if "judge" in self.test_tokens and "alpha" in self.test_teams:
            try:
                join_data = {
                    "team_id": self.test_teams["alpha"]["id"]
                }
                
                response = self.session.post(
                    f"{API_BASE}/teams/join",
                    json=join_data,
                    headers={"Authorization": f"Bearer {self.test_tokens['judge']}"}
                )
                
                if response.status_code == 200:
                    self.log("✅ Team joining successful")
                    success_count += 1
                else:
                    self.log(f"❌ Team joining failed: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Team joining error: {str(e)}", "ERROR")
        
        return success_count >= 3  # Competition + Team creation + Team retrieval
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all test suites and return results"""
        self.log("=== CFO Competition Backend API Testing Started ===")
        
        results = {}
        
        # Test 1: API Health Check
        results["api_health"] = self.test_api_health()
        
        # Test 2: User Registration
        results["user_registration"] = self.test_user_registration()
        
        # Test 3: User Login
        results["user_login"] = self.test_user_login()
        
        # Test 4: Protected Endpoint Access
        results["protected_access"] = self.test_protected_endpoint_access()
        
        # Test 5: Team Management (if basic auth works)
        if results["user_registration"] and results["user_login"]:
            results["team_management"] = self.test_team_management_apis()
        else:
            results["team_management"] = False
            self.log("⚠️ Skipping team management tests due to auth failures", "WARNING")
        
        # Summary
        self.log("=== Test Results Summary ===")
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"Overall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests passed! Authentication flow is working correctly.")
        else:
            self.log("⚠️ Some tests failed. Check the logs above for details.")
        
        return results

def main():
    """Main test execution"""
    tester = CFOAPITester()
    results = tester.run_all_tests()
    
    # Print test credentials for manual verification
    if tester.test_users:
        print("\n=== Test User Credentials (for manual verification) ===")
        for role, user_info in tester.test_users.items():
            creds = user_info["credentials"]
            print(f"{role.upper()}: {creds['email']} / {creds['password']}")
    
    # Exit with appropriate code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()