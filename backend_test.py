#!/usr/bin/env python3
"""
Backend API Test Suite for Mydemy AI Learning Platform
Tests the learning session endpoints as specified in the review request
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Configuration
BACKEND_URL = "https://career-quest-ai-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test data - using real IDs from seeded database
TEST_USER_ID = "test_user_2024"
TEST_COURSE_ID = "69b7f90f1d5843d9aa76f018"  # UX Design Fundamentals
TEST_LESSON_ID = "69b7f90f1d5843d9aa76f01a"  # UX Design คืออะไร?

def log_test(test_name: str, status: str, details: str = ""):
    """Log test results with consistent formatting"""
    status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{status_emoji} {test_name}: {status}")
    if details:
        print(f"   Details: {details}")

def test_health_check():
    """Test basic API health"""
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Mydemy Learning API":
                log_test("Health Check", "PASS", f"API version: {data.get('version')}")
                return True
            else:
                log_test("Health Check", "FAIL", f"Unexpected response: {data}")
        else:
            log_test("Health Check", "FAIL", f"Status: {response.status_code}")
    except Exception as e:
        log_test("Health Check", "FAIL", f"Exception: {str(e)}")
    return False

def test_courses_listing():
    """Test GET /api/courses"""
    try:
        response = requests.get(f"{API_BASE}/courses", timeout=10)
        if response.status_code == 200:
            courses = response.json()
            if isinstance(courses, list) and len(courses) >= 5:
                course_titles = [c.get("title", "") for c in courses]
                expected_courses = ["UX Design", "Data Analysis", "Digital Marketing", "Project Management", "Learning Designer"]
                
                found_courses = []
                for expected in expected_courses:
                    found = any(expected in title for title in course_titles)
                    if found:
                        found_courses.append(expected)
                
                if len(found_courses) >= 4:  # At least 4 out of 5 courses should be found
                    log_test("Courses Listing", "PASS", f"Found {len(courses)} courses including: {', '.join(found_courses)}")
                    return True, courses
                else:
                    log_test("Courses Listing", "FAIL", f"Missing expected courses. Found: {course_titles}")
            else:
                log_test("Courses Listing", "FAIL", f"Expected array with >=5 courses, got: {len(courses) if isinstance(courses, list) else type(courses)}")
        else:
            log_test("Courses Listing", "FAIL", f"Status: {response.status_code}, Response: {response.text[:200]}")
    except Exception as e:
        log_test("Courses Listing", "FAIL", f"Exception: {str(e)}")
    return False, []

def test_start_learning_session(lesson_id: str, user_id: str):
    """Test POST /api/learning/session/start/{lesson_id}"""
    try:
        url = f"{API_BASE}/learning/session/start/{lesson_id}?user_id={user_id}"
        response = requests.post(url, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["session_id", "questions", "success"]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                log_test("Start Learning Session", "FAIL", f"Missing fields: {missing_fields}")
                return False, None
            
            if not data.get("success", False):
                log_test("Start Learning Session", "FAIL", f"API returned success=false: {data.get('error', 'Unknown error')}")
                return False, None
                
            questions = data.get("questions", [])
            if not isinstance(questions, list) or len(questions) < 3:
                log_test("Start Learning Session", "FAIL", f"Expected >=3 questions, got: {len(questions) if isinstance(questions, list) else type(questions)}")
                return False, None
            
            # Check question types
            question_types = [q.get("type") for q in questions]
            expected_types = ["multiple_choice", "true_false", "fill_blank", "scenario"]
            has_variety = len(set(question_types).intersection(expected_types)) >= 2
            
            if has_variety:
                log_test("Start Learning Session", "PASS", 
                        f"Session ID: {data.get('session_id')}, {len(questions)} questions with types: {list(set(question_types))}")
                return True, data
            else:
                log_test("Start Learning Session", "FAIL", f"Limited question variety: {question_types}")
                return False, data
        else:
            log_test("Start Learning Session", "FAIL", f"Status: {response.status_code}, Response: {response.text[:300]}")
    except Exception as e:
        log_test("Start Learning Session", "FAIL", f"Exception: {str(e)}")
    
    return False, None

def test_submit_learning_session(session_data: Dict[str, Any], user_id: str):
    """Test POST /api/learning/session/submit"""
    try:
        session_id = session_data.get("session_id")
        questions = session_data.get("questions", [])
        
        if not session_id or not questions:
            log_test("Submit Learning Session", "FAIL", "No session_id or questions from start session")
            return False, None
        
        # Generate realistic answers for different question types
        answers = []
        for i, question in enumerate(questions):
            q_type = question.get("type", "multiple_choice")
            
            if q_type == "multiple_choice" or q_type == "scenario" or q_type == "image_question":
                # Choose first option (index 0) for consistency
                answers.append({"question_index": i, "answer": 0})
            elif q_type == "true_false":
                answers.append({"question_index": i, "answer": True})
            elif q_type == "fill_blank":
                # Use a generic answer that might match
                answers.append({"question_index": i, "answer": "answer"})
            else:
                # Default fallback
                answers.append({"question_index": i, "answer": 0})
        
        payload = {
            "session_id": session_id,
            "answers": answers
        }
        
        url = f"{API_BASE}/learning/session/submit?user_id={user_id}"
        response = requests.post(url, json=payload, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["success", "score", "passed", "results"]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                log_test("Submit Learning Session", "FAIL", f"Missing fields: {missing_fields}")
                return False, None
            
            if not data.get("success", False):
                log_test("Submit Learning Session", "FAIL", f"API returned success=false: {data.get('error', 'Unknown error')}")
                return False, None
            
            score = data.get("score", 0)
            passed = data.get("passed", False)
            results = data.get("results", [])
            
            if not isinstance(score, (int, float)) or score < 0 or score > 100:
                log_test("Submit Learning Session", "FAIL", f"Invalid score: {score}")
                return False, None
                
            if len(results) != len(questions):
                log_test("Submit Learning Session", "FAIL", f"Results count mismatch: {len(results)} vs {len(questions)}")
                return False, None
            
            log_test("Submit Learning Session", "PASS", 
                    f"Score: {score}%, Passed: {passed}, {len(results)} results")
            return True, data
        else:
            log_test("Submit Learning Session", "FAIL", f"Status: {response.status_code}, Response: {response.text[:300]}")
    except Exception as e:
        log_test("Submit Learning Session", "FAIL", f"Exception: {str(e)}")
    
    return False, None

def test_check_lesson_unlock(lesson_id: str, user_id: str):
    """Test GET /api/learning/unlock/{lesson_id}"""
    try:
        url = f"{API_BASE}/learning/unlock/{lesson_id}?user_id={user_id}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["is_unlocked", "knowledge_score"]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                log_test("Check Lesson Unlock", "FAIL", f"Missing fields: {missing_fields}")
                return False, None
            
            is_unlocked = data.get("is_unlocked")
            knowledge_score = data.get("knowledge_score", 0)
            
            if not isinstance(is_unlocked, bool):
                log_test("Check Lesson Unlock", "FAIL", f"is_unlocked should be boolean, got: {type(is_unlocked)}")
                return False, None
            
            if not isinstance(knowledge_score, (int, float)) or knowledge_score < 0 or knowledge_score > 100:
                log_test("Check Lesson Unlock", "FAIL", f"Invalid knowledge_score: {knowledge_score}")
                return False, None
            
            log_test("Check Lesson Unlock", "PASS", 
                    f"Unlocked: {is_unlocked}, Knowledge Score: {knowledge_score}%")
            return True, data
        else:
            log_test("Check Lesson Unlock", "FAIL", f"Status: {response.status_code}, Response: {response.text[:300]}")
    except Exception as e:
        log_test("Check Lesson Unlock", "FAIL", f"Exception: {str(e)}")
    
    return False, None

def test_course_progress(course_id: str, user_id: str):
    """Test GET /api/learning/progress/{course_id}"""
    try:
        url = f"{API_BASE}/learning/progress/{course_id}?user_id={user_id}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["course_id", "total_lessons", "overall_progress"]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                log_test("Course Progress", "FAIL", f"Missing fields: {missing_fields}")
                return False, None
            
            total_lessons = data.get("total_lessons", 0)
            overall_progress = data.get("overall_progress", 0)
            unlocked_lessons = data.get("unlocked_lessons", 0)
            
            if not isinstance(total_lessons, int) or total_lessons < 0:
                log_test("Course Progress", "FAIL", f"Invalid total_lessons: {total_lessons}")
                return False, None
            
            if not isinstance(overall_progress, (int, float)) or overall_progress < 0 or overall_progress > 100:
                log_test("Course Progress", "FAIL", f"Invalid overall_progress: {overall_progress}")
                return False, None
            
            log_test("Course Progress", "PASS", 
                    f"Progress: {overall_progress}%, {unlocked_lessons}/{total_lessons} lessons unlocked")
            return True, data
        else:
            log_test("Course Progress", "FAIL", f"Status: {response.status_code}, Response: {response.text[:300]}")
    except Exception as e:
        log_test("Course Progress", "FAIL", f"Exception: {str(e)}")
    
    return False, None

def run_all_tests():
    """Execute all tests in sequence"""
    print("🧪 Starting Mydemy AI Learning API Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test User ID: {TEST_USER_ID}")
    print(f"Test Lesson ID: {TEST_LESSON_ID}")
    print(f"Test Course ID: {TEST_COURSE_ID}")
    print("=" * 60)
    
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "details": []
    }
    
    # Test 1: Health Check
    test_name = "Health Check"
    results["total"] += 1
    if test_health_check():
        results["passed"] += 1
        results["details"].append(f"✅ {test_name}")
    else:
        results["failed"] += 1
        results["details"].append(f"❌ {test_name}")
    
    # Test 2: Courses Listing
    test_name = "Courses Listing"
    results["total"] += 1
    success, courses = test_courses_listing()
    if success:
        results["passed"] += 1
        results["details"].append(f"✅ {test_name}")
    else:
        results["failed"] += 1
        results["details"].append(f"❌ {test_name}")
    
    # Test 3: Start Learning Session
    test_name = "Start Learning Session"
    results["total"] += 1
    session_success, session_data = test_start_learning_session(TEST_LESSON_ID, TEST_USER_ID)
    if session_success:
        results["passed"] += 1
        results["details"].append(f"✅ {test_name}")
    else:
        results["failed"] += 1
        results["details"].append(f"❌ {test_name}")
    
    # Test 4: Submit Learning Session (depends on Test 3)
    test_name = "Submit Learning Session"
    results["total"] += 1
    if session_success and session_data:
        submit_success, submit_data = test_submit_learning_session(session_data, TEST_USER_ID)
        if submit_success:
            results["passed"] += 1
            results["details"].append(f"✅ {test_name}")
        else:
            results["failed"] += 1
            results["details"].append(f"❌ {test_name}")
    else:
        log_test("Submit Learning Session", "SKIP", "Start session failed")
        results["details"].append(f"⚠️ {test_name} (SKIPPED)")
    
    # Test 5: Check Lesson Unlock
    test_name = "Check Lesson Unlock"
    results["total"] += 1
    if test_check_lesson_unlock(TEST_LESSON_ID, TEST_USER_ID):
        results["passed"] += 1
        results["details"].append(f"✅ {test_name}")
    else:
        results["failed"] += 1
        results["details"].append(f"❌ {test_name}")
    
    # Test 6: Course Progress
    test_name = "Course Progress"
    results["total"] += 1
    if test_course_progress(TEST_COURSE_ID, TEST_USER_ID):
        results["passed"] += 1
        results["details"].append(f"✅ {test_name}")
    else:
        results["failed"] += 1
        results["details"].append(f"❌ {test_name}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    for detail in results["details"]:
        print(detail)
    
    print(f"\nTotal: {results['total']}")
    print(f"Passed: {results['passed']} ✅")
    print(f"Failed: {results['failed']} ❌")
    print(f"Success Rate: {(results['passed']/results['total']*100):.1f}%")
    
    # Return overall success status
    return results["failed"] == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)