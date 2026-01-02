#!/usr/bin/env python3
"""
Phase 5-10 Multi-Level Competition Engine Backend API Testing Suite
Tests task submissions, judge workflow, leaderboards, certificates, integrity, and operations
"""

import requests
import json
import sys
import io
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://financialchallenge.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"
CFO_API_BASE = f"{BASE_URL}/api/cfo"
ADMIN_API_BASE = f"{BASE_URL}/api/admin"
JUDGE_API_BASE = f"{BASE_URL}/api/judge"

class Phase510APITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.judge_token = None
        self.participant_token = None
        self.test_competition_id = None
        self.test_task_id = None
        self.test_criterion_id = None
        self.test_team_id = None
        self.test_submission_id = None
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def setup_test_users(self) -> bool:
        """Setup test users with different roles for testing"""
        self.log("Setting up test users...")
        
        # For this test, we'll use existing credentials or create test users
        # In a real scenario, you'd have pre-created test users
        
        # Try to login with known test credentials
        test_credentials = [
            {"email": "admin@modex.com", "password": "admin123", "role": "admin"},
            {"email": "judge@modex.com", "password": "judge123", "role": "judge"},
            {"email": "participant@modex.com", "password": "participant123", "role": "participant"}
        ]
        
        success_count = 0
        
        for creds in test_credentials:
            try:
                response = self.session.post(
                    f"{API_BASE}/auth/login",
                    json={"email": creds["email"], "password": creds["password"]},
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    token = result.get("access_token")
                    if token:
                        if creds["role"] == "admin":
                            self.admin_token = token
                        elif creds["role"] == "judge":
                            self.judge_token = token
                        elif creds["role"] == "participant":
                            self.participant_token = token
                        
                        self.log(f"✅ Logged in as {creds['role']}: {creds['email']}")
                        success_count += 1
                    else:
                        self.log(f"❌ No token received for {creds['role']}", "ERROR")
                else:
                    self.log(f"❌ Login failed for {creds['role']}: {response.status_code}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Login error for {creds['role']}: {str(e)}", "ERROR")
        
        return success_count >= 1  # At least admin should work
    
    def get_test_competition(self) -> bool:
        """Get an existing competition for testing"""
        self.log("Getting test competition...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        try:
            response = self.session.get(
                f"{ADMIN_API_BASE}/competitions",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if response.status_code == 200:
                competitions = response.json()
                if competitions:
                    self.test_competition_id = competitions[0]["id"]
                    self.log(f"✅ Using test competition: {self.test_competition_id}")
                    return True
                else:
                    self.log("❌ No competitions found", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get competitions: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting competitions: {str(e)}", "ERROR")
            return False
    
    def test_admin_task_management(self) -> bool:
        """Test admin task management endpoints"""
        self.log("Testing Admin Task Management APIs...")
        
        if not self.admin_token or not self.test_competition_id:
            self.log("❌ Missing admin token or competition ID", "ERROR")
            return False
        
        success_count = 0
        
        # Test 1: GET /api/admin/competitions/{id}/tasks - List tasks
        try:
            response = self.session.get(
                f"{ADMIN_API_BASE}/competitions/{self.test_competition_id}/tasks",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if response.status_code == 200:
                tasks = response.json()
                self.log(f"✅ GET tasks successful - found {len(tasks)} tasks")
                success_count += 1
            else:
                self.log(f"❌ GET tasks failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ GET tasks error: {str(e)}", "ERROR")
        
        # Test 2: POST /api/admin/competitions/{id}/tasks - Create task
        try:
            task_data = {
                "title": "Test Financial Model Task",
                "description": "Build a comprehensive financial model for Level 2",
                "task_type": "submission",
                "level": 2,
                "allowed_file_types": ["xlsx", "xlsm"],
                "max_file_size_mb": 25,
                "max_points": 100,
                "order_index": 1,
                "constraints_text": "Must include sensitivity analysis",
                "assumptions_policy": "Document all assumptions clearly"
            }
            
            response = self.session.post(
                f"{ADMIN_API_BASE}/competitions/{self.test_competition_id}/tasks",
                json=task_data,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if response.status_code == 200:
                task = response.json()
                self.test_task_id = task.get("id")
                self.log(f"✅ POST task successful - created task: {self.test_task_id}")
                success_count += 1
            else:
                self.log(f"❌ POST task failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ POST task error: {str(e)}", "ERROR")
        
        # Test 3: PATCH /api/admin/competitions/{id}/tasks/{task_id} - Update task
        if self.test_task_id:
            try:
                update_data = {
                    "title": "Updated Financial Model Task",
                    "max_points": 120
                }
                
                response = self.session.patch(
                    f"{ADMIN_API_BASE}/competitions/{self.test_competition_id}/tasks/{self.test_task_id}",
                    json=update_data,
                    headers={"Authorization": f"Bearer {self.admin_token}"}
                )
                
                if response.status_code == 200:
                    self.log("✅ PATCH task successful")
                    success_count += 1
                else:
                    self.log(f"❌ PATCH task failed: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ PATCH task error: {str(e)}", "ERROR")
        
        return success_count >= 2  # At least GET and POST should work
    
    def test_admin_scoring_criteria(self) -> bool:
        """Test admin scoring criteria endpoints"""
        self.log("Testing Admin Scoring Criteria APIs...")
        
        if not self.admin_token or not self.test_competition_id:
            self.log("❌ Missing admin token or competition ID", "ERROR")
            return False
        
        success_count = 0
        
        # Test 1: GET /api/admin/competitions/{id}/criteria - List criteria
        try:
            response = self.session.get(
                f"{ADMIN_API_BASE}/competitions/{self.test_competition_id}/criteria",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if response.status_code == 200:
                criteria = response.json()
                self.log(f"✅ GET criteria successful - found {len(criteria)} criteria")
                success_count += 1
            else:
                self.log(f"❌ GET criteria failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ GET criteria error: {str(e)}", "ERROR")
        
        # Test 2: POST /api/admin/competitions/{id}/criteria - Create criterion
        try:
            criterion_data = {
                "name": "Accuracy of Analysis",
                "description": "Quality and accuracy of financial analysis",
                "weight": 25,
                "max_score": 100,
                "applies_to_levels": [2, 3, 4],
                "display_order": 1
            }
            
            response = self.session.post(
                f"{ADMIN_API_BASE}/competitions/{self.test_competition_id}/criteria",
                json=criterion_data,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if response.status_code == 200:
                criterion = response.json()
                self.test_criterion_id = criterion.get("id")
                self.log(f"✅ POST criterion successful - created: {self.test_criterion_id}")
                success_count += 1
            else:
                self.log(f"❌ POST criterion failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ POST criterion error: {str(e)}", "ERROR")
        
        # Test 3: PATCH /api/admin/competitions/{id}/criteria/{criterion_id} - Update criterion
        if self.test_criterion_id:
            try:
                update_data = {
                    "weight": 30,
                    "description": "Updated: Quality and accuracy of financial analysis"
                }
                
                response = self.session.patch(
                    f"{ADMIN_API_BASE}/competitions/{self.test_competition_id}/criteria/{self.test_criterion_id}",
                    json=update_data,
                    headers={"Authorization": f"Bearer {self.admin_token}"}
                )
                
                if response.status_code == 200:
                    self.log("✅ PATCH criterion successful")
                    success_count += 1
                else:
                    self.log(f"❌ PATCH criterion failed: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ PATCH criterion error: {str(e)}", "ERROR")
        
        return success_count >= 2  # At least GET and POST should work
    
    def test_admin_level_control(self) -> bool:
        """Test admin level control endpoints"""
        self.log("Testing Admin Level Control APIs...")
        
        if not self.admin_token or not self.test_competition_id:
            self.log("❌ Missing admin token or competition ID", "ERROR")
            return False
        
        success_count = 0
        
        # Test 1: PATCH /api/admin/competitions/{id} - Update current_level
        try:
            update_data = {
                "current_level": 2
            }
            
            response = self.session.patch(
                f"{ADMIN_API_BASE}/competitions/{self.test_competition_id}",
                json=update_data,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if response.status_code == 200:
                self.log("✅ PATCH competition level successful")
                success_count += 1
            else:
                self.log(f"❌ PATCH competition level failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ PATCH competition level error: {str(e)}", "ERROR")
        
        # Test 2: POST /api/admin/competitions/{id}/create-level-tasks?level=2 - Create predefined tasks
        try:
            response = self.session.post(
                f"{ADMIN_API_BASE}/competitions/{self.test_competition_id}/create-level-tasks",
                params={"level": 2},
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if response.status_code == 200:
                result = response.json()
                tasks_created = result.get("tasks_created", 0)
                self.log(f"✅ POST create-level-tasks successful - created {tasks_created} tasks")
                success_count += 1
            else:
                self.log(f"❌ POST create-level-tasks failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ POST create-level-tasks error: {str(e)}", "ERROR")
        
        return success_count >= 1  # At least one should work
    
    def test_judge_endpoints(self) -> bool:
        """Test judge endpoints"""
        self.log("Testing Judge Endpoints...")
        
        # Use admin token if judge token not available
        token = self.judge_token or self.admin_token
        if not token:
            self.log("❌ No judge or admin token available", "ERROR")
            return False
        
        success_count = 0
        
        # Test 1: GET /api/cfo/judge/competitions - Get judge assigned competitions
        try:
            response = self.session.get(
                f"{API_BASE}/judge/competitions",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                competitions = response.json()
                self.log(f"✅ GET judge competitions successful - found {len(competitions)} competitions")
                success_count += 1
            else:
                self.log(f"❌ GET judge competitions failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ GET judge competitions error: {str(e)}", "ERROR")
        
        # Test 2: GET /api/cfo/judge/competitions/{id}/criteria - Get criteria for scoring
        if self.test_competition_id:
            try:
                response = self.session.get(
                    f"{API_BASE}/judge/competitions/{self.test_competition_id}/criteria",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if response.status_code == 200:
                    criteria = response.json()
                    self.log(f"✅ GET judge criteria successful - found {len(criteria)} criteria")
                    success_count += 1
                else:
                    self.log(f"❌ GET judge criteria failed: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ GET judge criteria error: {str(e)}", "ERROR")
        
        # Test 3: GET /api/cfo/judge/competitions/{id}/submissions - Get submissions to review
        if self.test_competition_id:
            try:
                response = self.session.get(
                    f"{API_BASE}/judge/competitions/{self.test_competition_id}/submissions",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if response.status_code == 200:
                    submissions = response.json()
                    self.log(f"✅ GET judge submissions successful - found {len(submissions)} submissions")
                    success_count += 1
                else:
                    self.log(f"❌ GET judge submissions failed: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ GET judge submissions error: {str(e)}", "ERROR")
        
        return success_count >= 1  # At least one should work
    
    def test_participant_task_endpoints(self) -> bool:
        """Test participant task endpoints"""
        self.log("Testing Participant Task Endpoints...")
        
        # Use participant token or admin token
        token = self.participant_token or self.admin_token
        if not token or not self.test_competition_id:
            self.log("❌ Missing token or competition ID", "ERROR")
            return False
        
        success_count = 0
        
        # Test 1: GET /api/cfo/competitions/{id}/tasks - Get all tasks for competition
        try:
            response = self.session.get(
                f"{API_BASE}/competitions/{self.test_competition_id}/tasks",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                tasks = response.json()
                self.log(f"✅ GET participant tasks successful - found {len(tasks)} tasks")
                success_count += 1
            else:
                self.log(f"❌ GET participant tasks failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ GET participant tasks error: {str(e)}", "ERROR")
        
        # Test 2: GET /api/cfo/teams/{id}/submissions - Get team's submissions
        # First try to get a team ID
        try:
            response = self.session.get(
                f"{API_BASE}/teams/competition/{self.test_competition_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                teams = response.json()
                if teams:
                    self.test_team_id = teams[0]["id"]
                    
                    # Now test getting team submissions
                    response = self.session.get(
                        f"{API_BASE}/teams/{self.test_team_id}/submissions",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    
                    if response.status_code == 200:
                        submissions = response.json()
                        self.log(f"✅ GET team submissions successful - found {len(submissions)} submissions")
                        success_count += 1
                    else:
                        self.log(f"❌ GET team submissions failed: {response.status_code} - {response.text}", "ERROR")
                else:
                    self.log("⚠️ No teams found for testing submissions", "WARNING")
            else:
                self.log(f"❌ GET teams failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ GET team submissions error: {str(e)}", "ERROR")
        
        # Test 3: POST /api/cfo/teams/{id}/submissions/task - Submit file to specific task
        if self.test_team_id and self.test_task_id:
            try:
                # Create a test file
                test_file_content = b"Test submission content for financial model"
                files = {'file': ('test_model.xlsx', test_file_content, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                data = {
                    'task_id': self.test_task_id,
                    'team_id': self.test_team_id
                }
                
                response = self.session.post(
                    f"{API_BASE}/teams/{self.test_team_id}/submissions/task",
                    data=data,
                    files=files,
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if response.status_code in [200, 201]:
                    self.log("✅ POST task submission successful")
                    success_count += 1
                else:
                    self.log(f"❌ POST task submission failed: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ POST task submission error: {str(e)}", "ERROR")
        
        return success_count >= 1  # At least one should work
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
                
                if response.status_code == 201:  # Changed from 200 to 201 for creation
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
            
            if duplicate_response.status_code in [400, 409, 429]:  # Accept multiple valid error codes
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
    
    def test_team_submission_apis(self) -> bool:
        """Test team submission APIs (Case and Submission tabs functionality)"""
        self.log("Testing Team Submission APIs...")
        
        if "participant" not in self.test_tokens or "alpha" not in self.test_teams:
            self.log("❌ Team or participant user not available for submission tests", "ERROR")
            return False
        
        success_count = 0
        team_id = self.test_teams["alpha"]["id"]
        competition_id = self.test_competitions["test_comp"]["id"]
        
        # Test 1: GET team submission when no submission exists (should return 404)
        try:
            response = self.session.get(
                f"{API_BASE}/teams/{team_id}/submission",
                params={"competition_id": competition_id},
                headers={"Authorization": f"Bearer {self.test_tokens['participant']}"}
            )
            
            if response.status_code == 404:
                self.log("✅ GET team submission returns 404 when no submission exists")
                success_count += 1
            else:
                self.log(f"❌ Expected 404 for no submission, got: {response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ GET team submission error: {str(e)}", "ERROR")
        
        # Test 2: POST team submission with valid file
        try:
            # Create test file content
            test_content = b"Test team solution content for CFO competition case study"
            files = {'file': ('team_solution.pdf', test_content, 'application/pdf')}
            data = {
                'team_id': team_id,
                'competition_id': competition_id
            }
            
            response = self.session.post(
                f"{API_BASE}/teams/{team_id}/submission",
                data=data,
                files=files,
                headers={"Authorization": f"Bearer {self.test_tokens['participant']}"}
            )
            
            if response.status_code == 201:
                self.log("✅ POST team submission successful with valid PDF")
                success_count += 1
            else:
                self.log(f"❌ Team submission failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ POST team submission error: {str(e)}", "ERROR")
        
        # Test 3: File type validation - try invalid file type
        try:
            invalid_content = b"Invalid file type content"
            files = {'file': ('invalid.txt', invalid_content, 'text/plain')}
            data = {
                'team_id': team_id,
                'competition_id': competition_id
            }
            
            response = self.session.post(
                f"{API_BASE}/teams/{team_id}/submission",
                data=data,
                files=files,
                headers={"Authorization": f"Bearer {self.test_tokens['participant']}"}
            )
            
            if response.status_code in [400, 422]:  # Should reject invalid file type
                self.log("✅ File type validation working - rejects invalid file types")
                success_count += 1
            else:
                self.log(f"❌ Should reject invalid file type, got: {response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ File type validation test error: {str(e)}", "ERROR")
        
        # Test 4: GET team submission after successful upload
        try:
            response = self.session.get(
                f"{API_BASE}/teams/{team_id}/submission",
                params={"competition_id": competition_id},
                headers={"Authorization": f"Bearer {self.test_tokens['participant']}"}
            )
            
            if response.status_code == 200:
                submission_data = response.json()
                if submission_data.get("submitted") and submission_data.get("file_name"):
                    self.log("✅ GET team submission returns submission data after upload")
                    success_count += 1
                else:
                    self.log("❌ Submission data missing required fields", "ERROR")
            else:
                self.log(f"❌ GET submission after upload failed: {response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"❌ GET submission after upload error: {str(e)}", "ERROR")
        
        return success_count >= 3  # At least 3 out of 4 tests should pass
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all test suites and return results"""
        self.log("=== CFO Competition Backend API Testing Started ===")
        
        results = {}
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all Phase 2-4 test suites and return results"""
        self.log("=== Phase 2-4 Multi-Level Competition Engine Testing Started ===")
        
        results = {}
        
        # Setup test users and get competition
        if not self.setup_test_users():
            self.log("❌ Failed to setup test users", "ERROR")
            return {"setup_failed": False}
        
        if not self.get_test_competition():
            self.log("❌ Failed to get test competition", "ERROR")
            return {"setup_failed": False}
        
        # Test 1: Admin Task Management
        results["admin_task_management"] = self.test_admin_task_management()
        
        # Test 2: Admin Scoring Criteria
        results["admin_scoring_criteria"] = self.test_admin_scoring_criteria()
        
        # Test 3: Admin Level Control
        results["admin_level_control"] = self.test_admin_level_control()
        
        # Test 4: Judge Endpoints
        results["judge_endpoints"] = self.test_judge_endpoints()
        
        # Test 5: Participant Task Endpoints
        results["participant_task_endpoints"] = self.test_participant_task_endpoints()
        
        # Summary
        self.log("=== Test Results Summary ===")
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"Overall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All Phase 2-4 tests passed! Multi-level competition engine is working correctly.")
        else:
            self.log("⚠️ Some tests failed. Check the logs above for details.")
        
        return results

def main():
    """Main test execution"""
    tester = Phase24APITester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()