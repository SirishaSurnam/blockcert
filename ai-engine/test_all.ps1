# BlockCert AI - Complete Test Suite
# Run this after starting both Python service and ai-engine

Write-Host "`n" -NoNewline
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "  BlockCert AI - Test Suite" -ForegroundColor Green
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Test 1: Python Service
Write-Host "[1/7] Testing Python Service (5001)..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get
    Write-Host "  ✅ Status: $($result.status)" -ForegroundColor Green
    Write-Host "  ✅ Model: $($result.model)" -ForegroundColor Green
    Write-Host "  ✅ PyTorch: $($result.pytorch_version)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ FAILED: Python service not running" -ForegroundColor Red
    Write-Host "  → Start with: cd python_service && venv\Scripts\activate && python app.py" -ForegroundColor Yellow
}

# Test 2: AI Engine
Write-Host "`n[2/7] Testing AI Engine (5002)..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:5002/api/ai/health" -Method Get
    Write-Host "  ✅ Node Service: $($result.node_service)" -ForegroundColor Green
    Write-Host "  ✅ Python Integration: $($result.integration)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ FAILED: AI Engine not running" -ForegroundColor Red
    Write-Host "  → Start with: cd ai-engine && npm start" -ForegroundColor Yellow
}

# Test 3: Career Guidance
Write-Host "`n[3/7] Testing Career Guidance..." -ForegroundColor Yellow
try {
    $body = @{
        skills = @("javascript", "react", "node.js")
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:5002/api/ai/career-guidance" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  ✅ Found $($result.career_options.Count) career matches" -ForegroundColor Green
    Write-Host "  ✅ Top match: $($result.career_options[0].title) ($($result.career_options[0].match_score)%)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Skill Gap
Write-Host "`n[4/7] Testing Skill Gap Analysis..." -ForegroundColor Yellow
try {
    $body = @{
        current_skills = @("javascript", "react")
        target_career = "fullstack_developer"
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:5002/api/ai/skill-gap" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  ✅ Career: $($result.career)" -ForegroundColor Green
    Write-Host "  ✅ Completion: $($result.completion_percentage)%" -ForegroundColor Green
    Write-Host "  ✅ Status: $($result.readiness_status)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Learning Path
Write-Host "`n[5/7] Testing Learning Path..." -ForegroundColor Yellow
try {
    $body = @{
        target_career = "frontend_developer"
        current_skills = @("javascript")
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:5002/api/ai/learning-path" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  ✅ Career: $($result.career)" -ForegroundColor Green
    Write-Host "  ✅ Progress: $($result.progress_percentage)%" -ForegroundColor Green
    Write-Host "  ✅ Steps: $($result.total_steps)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Course Recommendations
Write-Host "`n[6/7] Testing Course Recommendations..." -ForegroundColor Yellow
try {
    $body = @{
        skills = @("react", "javascript")
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:5002/api/ai/recommend-courses" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  ✅ Found $($result.recommendations.Count) course recommendations" -ForegroundColor Green
    if ($result.recommendations.Count -gt 0) {
        Write-Host "  ✅ Top course: $($result.recommendations[0].title) ($($result.recommendations[0].match_score)%)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Mentorship Insights
Write-Host "`n[7/7] Testing Mentorship Insights..." -ForegroundColor Yellow
try {
    $body = @{
        skills = @("javascript", "react", "node.js")
        name = "Test Student"
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:5002/api/ai/mentorship-insights" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  ✅ Advice: $($result.advice)" -ForegroundColor Green
    Write-Host "  ✅ Priority: $($result.priority)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" -NoNewline
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "  Test Suite Complete!" -ForegroundColor Green
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""