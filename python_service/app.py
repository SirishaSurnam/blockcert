# -*- coding: utf-8 -*-
"""
BlockCert AI Microservice - 2025 Latest Versions
Compatible with PyTorch 2.2.0, Transformers 4.37.0, Sentence-Transformers 2.3.1
"""

# Set UTF-8 encoding for Windows compatibility
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util
import torch
import numpy as np
import os
import json
from dotenv import load_dotenv
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

# Load environment
load_dotenv()

app = Flask(__name__)
CORS(app)

# ============================================================================
# REDIS CONFIGURATION (for caching)
# ============================================================================
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

try:
    import redis
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    print("✅ Redis connected for caching")
    REDIS_AVAILABLE = True
except Exception as e:
    print(f"Warning: Redis not available: {e}. Using in-memory cache.")
    redis_client = None
    REDIS_AVAILABLE = False

# In-memory cache fallback
memory_cache = {}

def get_cache(key):
    """Get value from cache (Redis or memory)"""
    if REDIS_AVAILABLE and redis_client:
        try:
            value = redis_client.get(key)
            if value:
                return json.loads(value)
        except:
            pass
    return memory_cache.get(key)

def set_cache(key, value, ttl=3600):
    """Set value in cache (Redis or memory)"""
    if REDIS_AVAILABLE and redis_client:
        try:
            redis_client.setex(key, ttl, json.dumps(value))
            return
        except:
            pass
    memory_cache[key] = value

def delete_cache(key):
    """Delete from cache"""
    if REDIS_AVAILABLE and redis_client:
        try:
            redis_client.delete(key)
            return
        except:
            pass
    memory_cache.pop(key, None)

# ============================================================================
# 1. LOAD PYTORCH MODEL
# ============================================================================
print("=" * 70)
print("🚀 Loading PyTorch Model (this may take a minute)...")
print("=" * 70)

model = None
try:
    # Use smaller, faster model for quicker loading
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ Model loaded successfully!")
    print(f"📊 Model: all-MiniLM-L6-v2")
    print(f"🔢 Embedding dimension: {model.get_sentence_embedding_dimension()}")
except Exception as e:
    print(f"❌ ERROR loading model: {e}")
    print("⚠️ Service will run in fallback mode")

# ============================================================================
# 2. CAREER PATHS DATABASE
# ============================================================================
CAREER_PATHS = {
    "blockchain_developer": {
        "title": "Blockchain Developer",
        "salary_range": "₹8-20 LPA",
        "demand": "High",
        "required_skills": ["solidity", "smart contracts", "web3", "ethereum", "javascript"],
        "nice_to_have": ["hardhat", "truffle", "openzeppelin", "ipfs"],
        "learning_steps": [
            "JavaScript Fundamentals (2 weeks)",
            "Blockchain Basics (1 week)",
            "Solidity Programming (3 weeks)",
            "Smart Contract Development (4 weeks)",
            "DApp Building (4 weeks)"
        ],
        "companies": ["ConsenSys", "Polygon", "Chainlink", "Alchemy"]
    },
    "frontend_developer": {
        "title": "Frontend Developer",
        "salary_range": "₹5-15 LPA",
        "demand": "Very High",
        "required_skills": ["react", "javascript", "html", "css", "typescript"],
        "nice_to_have": ["next.js", "tailwind", "redux", "graphql"],
        "learning_steps": [
            "HTML & CSS Mastery (2 weeks)",
            "JavaScript ES6+ (3 weeks)",
            "React Fundamentals (3 weeks)",
            "State Management (2 weeks)",
            "TypeScript (2 weeks)"
        ],
        "companies": ["Google", "Amazon", "Microsoft", "Flipkart", "Swiggy"]
    },
    "backend_developer": {
        "title": "Backend Developer",
        "salary_range": "₹6-18 LPA",
        "demand": "High",
        "required_skills": ["node.js", "express", "mongodb", "sql", "api design"],
        "nice_to_have": ["redis", "rabbitmq", "microservices", "docker"],
        "learning_steps": [
            "Node.js Fundamentals (2 weeks)",
            "Express.js & REST APIs (3 weeks)",
            "Database Design (2 weeks)",
            "Authentication & Security (2 weeks)",
            "Microservices (3 weeks)"
        ],
        "companies": ["Amazon", "Uber", "PayTM", "PhonePe", "CRED"]
    },
    "fullstack_developer": {
        "title": "Full Stack Developer",
        "salary_range": "₹7-20 LPA",
        "demand": "Very High",
        "required_skills": ["react", "node.js", "mongodb", "javascript", "api design"],
        "nice_to_have": ["docker", "aws", "ci/cd", "typescript"],
        "learning_steps": [
            "Frontend Development (6 weeks)",
            "Backend Development (6 weeks)",
            "Database Management (3 weeks)",
            "DevOps Basics (2 weeks)",
            "System Design (3 weeks)"
        ],
        "companies": ["Startups", "Product Companies", "Service Companies"]
    },
    "data_scientist": {
        "title": "Data Scientist",
        "salary_range": "₹8-25 LPA",
        "demand": "High",
        "required_skills": ["python", "machine learning", "statistics", "pandas", "sql"],
        "nice_to_have": ["deep learning", "pytorch", "tensorflow", "nlp"],
        "learning_steps": [
            "Python Programming (3 weeks)",
            "Statistics & Probability (3 weeks)",
            "Machine Learning (4 weeks)",
            "Deep Learning (4 weeks)",
            "MLOps (3 weeks)"
        ],
        "companies": ["Google", "Microsoft", "Amazon", "Flipkart"]
    },
    "devops_engineer": {
        "title": "DevOps Engineer",
        "salary_range": "₹7-22 LPA",
        "demand": "High",
        "required_skills": ["docker", "kubernetes", "ci/cd", "linux", "cloud"],
        "nice_to_have": ["terraform", "ansible", "jenkins", "prometheus"],
        "learning_steps": [
            "Linux Administration (2 weeks)",
            "Docker & Containers (2 weeks)",
            "Kubernetes (3 weeks)",
            "CI/CD Pipelines (2 weeks)",
            "Cloud Platforms (4 weeks)"
        ],
        "companies": ["AWS", "Google Cloud", "Microsoft Azure", "Startups"]
    }
}

# ============================================================================
# 3. COURSE DATABASE
# ============================================================================
COURSE_DATABASE = [
    {
        "id": 1,
        "title": "Complete Blockchain Development",
        "platform": "Udemy",
        "skills": ["blockchain", "solidity", "smart contracts", "web3"],
        "duration": "40 hours",
        "level": "intermediate"
    },
    {
        "id": 2,
        "title": "React - The Complete Guide 2025",
        "platform": "Udemy",
        "skills": ["react", "javascript", "frontend", "hooks"],
        "duration": "48 hours",
        "level": "beginner"
    },
    {
        "id": 3,
        "title": "Node.js Backend Masterclass",
        "platform": "Udemy",
        "skills": ["node.js", "express", "mongodb", "api"],
        "duration": "35 hours",
        "level": "intermediate"
    },
    {
        "id": 4,
        "title": "Machine Learning with PyTorch",
        "platform": "Coursera",
        "skills": ["python", "pytorch", "machine learning", "deep learning"],
        "duration": "60 hours",
        "level": "advanced"
    },
    {
        "id": 5,
        "title": "Docker & Kubernetes Complete Course",
        "platform": "Udemy",
        "skills": ["docker", "kubernetes", "devops", "cloud"],
        "duration": "30 hours",
        "level": "intermediate"
    },
    {
        "id": 6,
        "title": "Full Stack Web Development Bootcamp",
        "platform": "Udemy",
        "skills": ["react", "node.js", "mongodb", "fullstack"],
        "duration": "80 hours",
        "level": "beginner"
    }
]

# Pre-calculate course embeddings
course_embeddings = None
if model:
    try:
        descriptions = [f"{c['title']} {' '.join(c['skills'])}" for c in COURSE_DATABASE]
        course_embeddings = model.encode(descriptions, convert_to_tensor=True)
        print("✅ Course embeddings pre-calculated")
    except Exception as e:
        print(f"⚠️ Could not generate course embeddings: {e}")

# ============================================================================
# 4. HEALTH CHECK
# ============================================================================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "running",
        "service": "BlockCert AI Microservice",
        "model": "all-MiniLM-L6-v2",
        "model_loaded": model is not None,
        "pytorch_version": torch.__version__,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "endpoints": [
            "/health",
            "/recommend-courses",
            "/career-guidance",
            "/skill-gap-analysis",
            "/learning-path",
            "/mentorship-insights"
        ]
    })

# ============================================================================
# 5. COURSE RECOMMENDATIONS
# ============================================================================
@app.route('/recommend-courses', methods=['POST'])
def recommend_courses():
    if not model:
        return jsonify({"error": "AI model not loaded"}), 503
    
    try:
        data = request.json
        skills = data.get('skills', [])
        
        if not skills:
            return jsonify({"error": "No skills provided"}), 400
        
        # Create query from skills
        query_text = " ".join(skills)
        query_embedding = model.encode(query_text, convert_to_tensor=True)
        
        # Calculate cosine similarity
        cos_scores = util.cos_sim(query_embedding, course_embeddings)[0]
        
        # Get top 5 results
        top_results = torch.topk(cos_scores, k=min(5, len(COURSE_DATABASE)))
        
        recommendations = []
        for score, idx in zip(top_results.values.tolist(), top_results.indices.tolist()):
            course = COURSE_DATABASE[idx]
            recommendations.append({
                "course_id": course['id'],
                "title": course['title'],
                "platform": course['platform'],
                "skills": course['skills'],
                "duration": course['duration'],
                "level": course['level'],
                "match_score": round(float(score) * 100, 2),
                "reason": f"Matches your skills in {', '.join(skills[:3])}"
            })
        
        return jsonify({
            "success": True,
            "query_skills": skills,
            "recommendations": recommendations
        })
        
    except Exception as e:
        print(f"Error in recommend_courses: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================================================
# 6. CAREER GUIDANCE (MAIN FEATURE!)
# ============================================================================
@app.route('/career-guidance', methods=['POST'])
def career_guidance():
    if not model:
        return jsonify({"error": "AI model not loaded"}), 503
    
    try:
        data = request.json
        skills = data.get('skills', [])
        
        if not skills:
            return jsonify({"error": "No skills provided"}), 400
        
        # Normalize skills
        skills_lower = [s.lower().replace('.js', '').replace('js', 'javascript') for s in skills]
        current_embeddings = model.encode(skills_lower, convert_to_tensor=True)
        
        career_matches = []
        
        # Analyze each career path
        for career_id, career in CAREER_PATHS.items():
            required_skills = career['required_skills']
            required_embeddings = model.encode(required_skills, convert_to_tensor=True)
            
            # Calculate match score using cosine similarity
            all_similarities = []
            for req_emb in required_embeddings:
                similarities = util.cos_sim(req_emb, current_embeddings)[0]
                max_sim = torch.max(similarities).item() if len(similarities) > 0 else 0
                all_similarities.append(max_sim)
            
            match_score = np.mean(all_similarities) * 100
            
            # Only show careers with >20% match
            if match_score > 20:
                # Find missing skills
                missing_skills = []
                for i, req_skill in enumerate(required_skills):
                    if all_similarities[i] < 0.6:
                        missing_skills.append(req_skill)
                
                # Generate guidance
                if match_score >= 70:
                    guidance = f"You're well-suited for {career['title']}! Focus on: {', '.join(missing_skills[:3]) if missing_skills else 'advanced certifications'}"
                    action = "Start applying for jobs"
                elif match_score >= 40:
                    guidance = f"Good foundation for {career['title']}. Learn: {', '.join(missing_skills[:3])}"
                    action = "Complete 2-3 projects and apply"
                else:
                    guidance = f"Consider {career['title']} as future path. Build foundation in: {', '.join(missing_skills[:3])}"
                    action = "Start with beginner courses"
                
                career_matches.append({
                    "career_id": career_id,
                    "title": career['title'],
                    "match_score": round(match_score, 2),
                    "salary_range": career['salary_range'],
                    "demand": career['demand'],
                    "missing_skills_count": len(missing_skills),
                    "missing_skills": missing_skills[:5],
                    "guidance": guidance,
                    "next_action": action,
                    "estimated_time": f"{len(missing_skills) * 2} weeks" if missing_skills else "Ready now",
                    "top_companies": career['companies'][:4]
                })
        
        # Sort by match score
        career_matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Overall recommendation
        if career_matches:
            top_match = career_matches[0]
            overall_recommendation = f"Based on your skills, {top_match['title']} is your best match ({top_match['match_score']:.0f}% fit). {top_match['guidance']}"
        else:
            overall_recommendation = "Build foundational skills in programming, databases, and web development first."
        
        return jsonify({
            "success": True,
            "current_skills": skills,
            "overall_recommendation": overall_recommendation,
            "career_options": career_matches[:5],
            "total_careers_analyzed": len(CAREER_PATHS)
        })
        
    except Exception as e:
        print(f"Error in career_guidance: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================================================
# 7. SKILL GAP ANALYSIS
# ============================================================================
@app.route('/skill-gap-analysis', methods=['POST'])
def skill_gap_analysis():
    if not model:
        return jsonify({"error": "AI model not loaded"}), 503
    
    try:
        data = request.json
        current_skills = data.get('current_skills', [])
        target_career = data.get('target_career', 'fullstack_developer')
        
        if target_career not in CAREER_PATHS:
            return jsonify({"error": "Invalid career path"}), 400
        
        career = CAREER_PATHS[target_career]
        required_skills = career['required_skills']
        
        # Normalize and encode
        current_skills_lower = [s.lower() for s in current_skills]
        current_embeddings = model.encode(current_skills_lower, convert_to_tensor=True)
        required_embeddings = model.encode(required_skills, convert_to_tensor=True)
        
        missing_skills = []
        acquired_skills = []
        
        for req_skill in required_skills:
            req_embedding = model.encode(req_skill, convert_to_tensor=True)
            similarities = util.cos_sim(req_embedding, current_embeddings)[0]
            max_similarity = torch.max(similarities).item() if len(similarities) > 0 else 0
            
            if max_similarity > 0.6:
                acquired_skills.append({
                    "skill": req_skill,
                    "proficiency": round(max_similarity * 100, 2)
                })
            else:
                priority = "critical" if max_similarity < 0.3 else "important"
                missing_skills.append({
                    "skill": req_skill,
                    "priority": priority,
                    "current_proficiency": round(max_similarity * 100, 2)
                })
        
        completion = round((len(acquired_skills) / len(required_skills)) * 100, 2)
        
        if completion >= 80:
            readiness = "Ready to Apply"
            readiness_color = "green"
        elif completion >= 50:
            readiness = "Almost Ready"
            readiness_color = "yellow"
        else:
            readiness = "Needs Preparation"
            readiness_color = "red"
        
        return jsonify({
            "success": True,
            "career": career['title'],
            "completion_percentage": completion,
            "readiness_status": readiness,
            "readiness_color": readiness_color,
            "acquired_skills": acquired_skills,
            "missing_skills": missing_skills,
            "nice_to_have": career['nice_to_have']
        })
        
    except Exception as e:
        print(f"Error in skill_gap_analysis: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================================================
# 8. LEARNING PATH
# ============================================================================
@app.route('/learning-path', methods=['POST'])
def learning_path():
    try:
        data = request.json
        target_career = data.get('target_career', 'fullstack_developer')
        current_skills = data.get('current_skills', [])
        
        if target_career not in CAREER_PATHS:
            return jsonify({"error": "Invalid career path"}), 400
        
        career = CAREER_PATHS[target_career]
        steps = career['learning_steps']
        
        # Determine completed steps (simple check)
        current_skills_lower = [s.lower() for s in current_skills]
        completed_steps = []
        pending_steps = []
        
        for i, step in enumerate(steps):
            step_lower = step.lower()
            is_completed = any(skill in step_lower or step_lower.split()[0] in skill for skill in current_skills_lower)
            
            if is_completed:
                completed_steps.append({"step": i+1, "description": step, "status": "completed"})
            else:
                pending_steps.append({"step": i+1, "description": step, "status": "pending"})
        
        progress = round((len(completed_steps) / len(steps)) * 100, 2)
        
        return jsonify({
            "success": True,
            "career": career['title'],
            "progress_percentage": progress,
            "completed_steps": completed_steps,
            "pending_steps": pending_steps,
            "total_steps": len(steps),
            "estimated_time": f"{len(pending_steps) * 2} weeks" if pending_steps else "Completed",
            "next_step": pending_steps[0] if pending_steps else None
        })
        
    except Exception as e:
        print(f"Error in learning_path: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================================================
# 9. MENTORSHIP INSIGHTS
# ============================================================================
@app.route('/mentorship-insights', methods=['POST'])
def mentorship_insights():
    try:
        data = request.json
        skills = data.get('skills', [])
        name = data.get('name', 'Student')
        
        if not skills:
            return jsonify({
                "success": True,
                "student_name": name,
                "advice": f"{name} has no verified skills yet. Immediate onboarding and guidance required.",
                "priority": "urgent",
                "categories_covered": [],
                "skill_diversity_score": 0
            })
        
        # Analyze skill diversity
        skill_categories = {
            "frontend": ["react", "html", "css", "javascript", "vue", "angular"],
            "backend": ["node", "express", "mongodb", "sql", "api"],
            "blockchain": ["solidity", "web3", "smart contract", "ethereum"],
            "devops": ["docker", "kubernetes", "ci/cd", "aws", "cloud"]
        }
        
        skills_lower = [s.lower() for s in skills]
        categories_covered = []
        
        for category, keywords in skill_categories.items():
            if any(kw in skill for kw in keywords for skill in skills_lower):
                categories_covered.append(category)
        
        # Generate advice
        skill_count = len(skills)
        category_count = len(categories_covered)
        
        if category_count >= 3:
            advice = f"{name} shows strong versatility across {', '.join(categories_covered)}. Encourage advanced projects and certifications."
            priority = "low"
        elif category_count == 2:
            advice = f"{name} is developing well in {', '.join(categories_covered)}. Suggest exploring one more domain for full-stack readiness."
            priority = "medium"
        elif category_count == 1:
            advice = f"{name} is focused on {categories_covered[0]}. Recommend broadening skills or deepening expertise with advanced projects."
            priority = "high"
        else:
            advice = f"{name} needs guidance on skill direction. Schedule mentorship session to discuss career goals."
            priority = "urgent"
        
        diversity_score = round((category_count / 4) * 100, 2)
        
        return jsonify({
            "success": True,
            "student_name": name,
            "advice": advice,
            "priority": priority,
            "categories_covered": categories_covered,
            "skill_diversity_score": diversity_score,
            "total_skills": skill_count
        })
        
    except Exception as e:
        print(f"Error in mentorship_insights: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================================================
# 10. GEMINI AI CAREER GUIDANCE (Personalized with LLM)
# ============================================================================
import google.generativeai as genai

# Import LangChain setup for Gemini (with fallback to original)
try:
    from langchain_setup import generate_career_guidance, generate_chat_response, initialize_langchain, LANGCHAIN_AVAILABLE, save_chat_history, get_chat_history
    # Initialize LangChain on startup
    initialize_langchain()
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("LangChain not available, will use original Gemini calls")

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')  # Default but can be overridden in .env
genai.configure(api_key=GEMINI_API_KEY)

# Cache for recommendations (simple in-memory)
recommendation_cache = {}

def get_gemini_model():
    """Initialize Gemini model"""
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
        print("⚠️ GEMINI_API_KEY not set in .env!")
        return None
    try:
        print(f"🔧 Initializing Gemini model: {GEMINI_MODEL}...")
        model = genai.GenerativeModel(GEMINI_MODEL)
        print("✅ Gemini model initialized!")
        return model
    except Exception as e:
        print(f"❌ Error initializing Gemini: {e}")
        import traceback
        traceback.print_exc()
        return None

gemini_model = get_gemini_model()

@app.route('/ai-career-guidance', methods=['POST'])
def ai_career_guidance():
    """
    AI-powered personalized career guidance using Gemini LLM
    Analyzes user background, skills, interests to generate:
    - Personalized learning paths
    - Course recommendations
    - Certification suggestions
    - Internship pathway guidance
    """
    
    # Check cache first
    cache_key = None
    
    try:
        data = request.json
        
        # Extract user profile
        user_profile = {
            'skills': data.get('skills', []),
            'interests': data.get('interests', []),
            'education_level': data.get('education_level', 'undergraduate'),
            'target_career': data.get('target_career', ''),
            'current_role': data.get('current_role', 'student'),
            'experience_years': data.get('experience_years', 0)
        }
        
        # Create cache key
        cache_key = f"{'_'.join(sorted(user_profile['skills']))}_{user_profile['target_career']}"
        
        # Check cache
        if cache_key in recommendation_cache:
            cached_result = recommendation_cache[cache_key]
            cached_result['from_cache'] = True
            return jsonify(cached_result)
        
        # Check if Gemini is available
        if not gemini_model:
            return jsonify({
                "success": False,
                "error": "Gemini API not configured. Please add GEMINI_API_KEY to .env file.",
                "fallback": True
            }), 503
        
        # Try LangChain first, fallback to original Gemini if it fails
        use_langchain = LANGCHAIN_AVAILABLE
        model_used = "gemini-2.5-flash-lite"
        
        if use_langchain:
            try:
                # Use LangChain for Gemini calls
                result = generate_career_guidance(user_profile)
                if result:
                    guidance_response = result
                    guidance_response["model"] = "langchain-gemini"
                    model_used = "langchain-gemini"
                else:
                    # LangChain returned empty, fall back
                    use_langchain = False
            except Exception as lc_error:
                print(f"LangChain failed, falling back to original Gemini: {lc_error}")
                use_langchain = False
        
        if not use_langchain:
            # Fallback to original Gemini API call
            if not gemini_model:
                return jsonify({
                    "success": False,
                    "error": "Gemini API not configured. Please add GEMINI_API_KEY to .env file.",
                    "fallback": True
                }), 503
            
            # Build prompt for Gemini
            skills_str = ', '.join(user_profile['skills']) if user_profile['skills'] else 'none'
            interests_str = ', '.join(user_profile['interests']) if user_profile['interests'] else 'general tech'
            
            prompt = f"""You are an expert career counselor for tech students in India. 

Analyze the following student profile and provide personalized career guidance:

**Student Profile:**
- Current Skills: {skills_str}
- Interests: {interests_str}
- Education Level: {user_profile['education_level']}
- Target Career: {user_profile['target_career'] or 'Not specified (suggest best fit)'}
- Current Role: {user_profile['current_role']}
- Experience: {user_profile['experience_years']} years

Based on this profile, provide a JSON response with:

1. **career_recommendation**: Best suited career path with brief explanation
2. **skill_gaps**: Array of {{skill: string, priority: 'high'|'medium'|'low', reason: string}} - skills they need to learn
3. **learning_path**: Array of {{order: number, topic: string, reason: string, estimated_time: string}} - structured learning sequence
4. **recommended_courses**: Array of {{name: string, platform: string, reason: string, level: string}} - 3-5 course recommendations
5. **certifications**: Array of {{name: string, provider: string, importance: string}} - relevant certifications
6. **internship_guidance**: Array of {{title: string, type: string, description: string}} - career pathway categories (not live listings)
7. **timeline**: Estimated time to job-ready in months

Return ONLY valid JSON, no additional text. Use this exact format:

{{{{"career_recommendation": "...", "skill_gaps": [{{"skill": "...", "priority": "...", "reason": "..."}}], "learning_path": [{{"order": 1, "topic": "...", "reason": "...", "estimated_time": "..."}}], "recommended_courses": [{{"name": "...", "platform": "...", "reason": "...", "level": "..."}}], "certifications": [{{"name": "...", "provider": "...", "importance": "..."}}], "internship_guidance": [{{"title": "...", "type": "...", "description": "..."}}], "timeline": "X months"}}
"""
            
            # Generate response using original Gemini
            response = gemini_model.generate_content(prompt)
            
            # Parse response
            import re
            import json
            
            # Extract JSON from response
            response_text = response.text
            json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
            
            if json_match:
                result = json.loads(json_match.group())
            else:
                # Try to parse entire response as JSON
                result = json.loads(response_text)
            
            # Build response
            guidance_response = {
                "success": True,
                "from_cache": False,
                "career_recommendation": result.get("career_recommendation", ""),
                "skill_gaps": result.get("skill_gaps", []),
                "learning_path": result.get("learning_path", []),
                "recommended_courses": result.get("recommended_courses", []),
                "certifications": result.get("certifications", []),
                "internship_guidance": result.get("internship_guidance", []),
                "timeline": result.get("timeline", "6 months"),
                "model": model_used
            }
        
        # Cache the result (simple TTL - cache for 1 hour)
        recommendation_cache[cache_key] = guidance_response
        
        # Limit cache size
        if len(recommendation_cache) > 100:
            # Remove oldest entries
            keys_to_remove = list(recommendation_cache.keys())[:50]
            for key in keys_to_remove:
                del recommendation_cache[key]
        
        return jsonify(guidance_response)
        
    except Exception as e:
        print(f"Error in ai_career_guidance: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to generate AI recommendations"
        }), 500


# ============================================================================
# 12. CAREER CHATBOT - Conversational AI Career Guidance
# ============================================================================

@app.route('/chat/career', methods=['POST'])
def career_chat():
    """
    Conversational career guidance chatbot (Chat mode only)
    Uses Redis/in-memory for session-based history storage
    
    Request JSON:
    - message: string (user's message)
    - session_id: string (unique session identifier)
    - context: object (user profile: skills, interests, etc.)
    """
    try:
        data = request.json
        
        message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        context = data.get('context', {})
        
        # Get chat history from Redis/in-memory
        history = get_chat_history(session_id)
        
        # Generate chat response (chat mode only)
        result = generate_chat_response(message, history, context, mode='chat')
        
        # Save updated history to Redis/in-memory
        if result.get('success'):
            # Add user message and assistant response to history
            new_history = history + [
                {"role": "user", "content": message},
                {"role": "assistant", "content": result.get('response', '')}
            ]
            # Keep only last 20 messages to avoid too much context
            new_history = new_history[-20:]
            save_chat_history(session_id, new_history)
            result['history'] = new_history
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in career_chat: {e}")
        return jsonify({
            "success": False,
            "response": "Sorry, I encountered an error. Please try again.",
            "error": str(e)
        }), 500


@app.route('/chat/career/history', methods=['DELETE'])
def clear_chat_history():
    """Clear chat history for a session"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        save_chat_history(session_id, [])
        return jsonify({"success": True, "message": "Chat history cleared"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================================================
# 11. PERSONALIZED RECOMMENDATIONS (Courses, Certifications, Internships)
# Uses Gemini LLM with Redis caching
# ============================================================================

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """
    Get personalized recommendations for courses, certifications, and internships
    based on user's skills, projects, education, and career goals.
    
    Request body:
    - skills: list of user's skills
    - projects: list of user's projects
    - certifications: list of user's certifications
    - education: user's education background
    - target_career: desired career path
    
    Cached in Redis for 1 hour for optimization.
    """
    try:
        data = request.json
        
        # Extract user profile
        user_profile = {
            'skills': data.get('skills', []),
            'projects': data.get('projects', []),
            'certifications': data.get('certifications', []),
            'education': data.get('education', {}),
            'target_career': data.get('target_career', '')
        }
        
        # Create cache key
        cache_key = f"recs:{'_'.join(sorted(user_profile['skills']))}:{user_profile['target_career']}"
        
        # Check cache first
        cached = get_cache(cache_key)
        if cached:
            cached['from_cache'] = True
            return jsonify(cached)
        
        # Check if Gemini is available
        if not gemini_model:
            return jsonify({
                "success": False,
                "error": "Gemini API not configured",
                "fallback": True
            }), 503
        
        # Build prompt for Gemini
        skills_str = ', '.join(user_profile['skills']) if user_profile['skills'] else 'none'
        projects_str = ', '.join(user_profile['projects']) if user_profile['projects'] else 'none'
        certs_str = ', '.join(user_profile['certifications']) if user_profile['certifications'] else 'none'
        education_str = f"{user_profile['education'].get('degree', 'N/A')} in {user_profile['education'].get('field', 'N/A')}" if user_profile.get('education') else 'Not specified'
        
        prompt = f"""You are an expert career advisor for tech students in India.

Analyze the following student profile and provide personalized recommendations:

**Student Profile:**
- Skills: {skills_str}
- Projects: {projects_str}
- Certifications: {certs_str}
- Education: {education_str}
- Target Career: {user_profile['target_career'] or 'Not specified (suggest best fit)'}

Provide recommendations in this JSON format (ONLY valid JSON, no additional text):

{{{{
    "courses": [
        {{"title": "Course Name", "platform": "Platform (Coursera/Udemy/etc)", "reason": "Why recommended for this student", "level": "Beginner/Intermediate/Advanced"}}
    ],
    "certifications": [
        {{"name": "Certification Name", "provider": "Provider (Google/AWS/Microsoft/etc)", "reason": "Why this certification matters", "priority": "High/Medium/Low"}}
    ],
    "internships": [
        {{"title": "Internship Type/Role", "company_type": "Startup/FAANG/MSA", "description": "What they will learn/gain", "prerequisites": "Skills needed"}}
    ]
}}}}
"""
        
        # Generate response
        response = gemini_model.generate_content(prompt)
        
        # Parse response - handle nested JSON properly
        import re
        
        response_text = response.text
        print(f"📝 Raw Gemini response: {response_text[:500]}...")
        
        # Try to find JSON in the response
        try:
            # First try direct parse
            result = json.loads(response_text)
        except:
            # Try to extract JSON using a more robust approach
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                try:
                    result = json.loads(json_str)
                except:
                    # Last resort - try regex for first-level JSON
                    result = {
                        "courses": [],
                        "certifications": [],
                        "internships": []
                    }
                    print("⚠️ Failed to parse Gemini JSON response")
            else:
                result = {
                    "courses": [],
                    "certifications": [],
                    "internships": []
                }
        
        print(f"📋 Parsed result: {result}")
        
        # Build response
        recommendations = {
            "success": True,
            "from_cache": False,
            "courses": result.get("courses", []),
            "certifications": result.get("certifications", []),
            "internships": result.get("internships", []),
            "model": GEMINI_MODEL,
            "cached_at": None
        }
        
        # Cache the result for 1 hour
        set_cache(cache_key, recommendations, ttl=3600)
        
        return jsonify(recommendations)
        
    except Exception as e:
        print(f"❌ Error in get_recommendations: {e}")
        import traceback
        traceback.print_exc()
        
        # Check for quota exceeded error (ResourceExhausted from google.api_core)
        error_str = str(e)
        from google.api_core.exceptions import ResourceExhausted
        
        if isinstance(e, ResourceExhausted) or '429' in error_str or 'quota' in error_str.lower() or 'RESOURCE_EXHAUSTED' in error_str or 'limit: 0' in error_str:
            return jsonify({
                "success": False,
                "error": "Gemini API quota exceeded",
                "message": "You have exceeded your Gemini API free tier quota. Please wait 24 hours for quota to reset, or use a different API key.",
                "fallback": True
            }), 429
        
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to generate recommendations"
        }), 500

@app.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear recommendation cache"""
    global recommendation_cache
    recommendation_cache = {}
    return jsonify({"success": True, "message": "Cache cleared"})

# ============================================================================
# RUN SERVER
# ============================================================================
if __name__ == '__main__':
    PORT = int(os.getenv('FLASK_PORT', 5001))
    print("\n" + "=" * 70)
    print(f"🚀 BlockCert AI Microservice Starting...")
    print(f"📍 Port: {PORT}")
    print(f"🧠 Model: {'✅ Loaded (PyTorch ' + torch.__version__ + ')' if model else '❌ Not Loaded'}")
    print(f"🤖 Gemini: {'✅ Configured (' + GEMINI_MODEL + ')' if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here' else '⚠️ Not configured (add GEMINI_API_KEY to .env)'}")
    print(f"💻 Device: {'GPU (CUDA)' if torch.cuda.is_available() else 'CPU'}")
    print("=" * 70 + "\n")
    
    app.run(host='0.0.0.0', port=PORT, debug=True)