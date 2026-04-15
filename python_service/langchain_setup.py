"""
LangChain Setup for BlockCert AI Service
Modular LangChain implementation with Gemini LLM
"""

import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

# LangChain imports
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain.prompts import PromptTemplate
    from langchain.chains import LLMChain
    from langchain.memory import ConversationBufferMemory
    LANGCHAIN_AVAILABLE = True
except ImportError as e:
    print("Warning: LangChain not installed:", e)
    LANGCHAIN_AVAILABLE = False

# Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')

# Global references
llm = None
career_chain = None


def initialize_langchain():
    """Initialize LangChain Gemini LLM and chains"""
    global llm, career_chain
    
    if not LANGCHAIN_AVAILABLE:
        print("LangChain not available")
        return False
    
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
        print("Warning: GEMINI_API_KEY not set in .env!")
        return False
    
    try:
        # Initialize Gemini LLM with LangChain
        llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.7,
            convert_system_message_to_human=True
        )
        
        # Create PromptTemplate for career guidance
        career_prompt = PromptTemplate(
            input_variables=["skills", "interests", "education_level", "target_career", "current_role", "experience_years"],
            template="""You are an expert career counselor for tech students in India. 

Analyze the following student profile and provide personalized career guidance:

**Student Profile:**
- Current Skills: {skills}
- Interests: {interests}
- Education Level: {education_level}
- Target Career: {target_career}
- Current Role: {current_role}
- Experience: {experience_years} years

Based on this profile, provide a JSON response with:

1. **career_recommendation**: Best suited career path with brief explanation
2. **skill_gaps**: Array of {{skill: string, priority: 'high'|'medium'|'low', reason: string}} - skills they need to learn
3. **learning_path**: Array of {{order: number, topic: string, reason: string, estimated_time: string}} - structured learning sequence
4. **recommended_courses**: Array of {{name: string, platform: string, reason: string, level: string}} - 3-5 course recommendations
5. **certifications**: Array of {{name: string, provider: string, importance: string}} - relevant certifications
6. **internship_guidance**: Array of {{title: string, type: string, description: string}} - career pathway categories (not live listings)
7. **timeline**: Estimated time to job-ready in months

Return ONLY valid JSON, no additional text. Use this exact format:

{{"career_recommendation": "...", "skill_gaps": [{{"skill": "...", "priority": "...", "reason": "..."}}], "learning_path": [{{"order": 1, "topic": "...", "reason": "...", "estimated_time": "..."}}], "recommended_courses": [{{"name": "...", "platform": "...", "reason": "...", "level": "..."}}], "certifications": [{{"name": "...", "provider": "...", "importance": "..."}}], "internship_guidance": [{{"title": "...", "type": "...", "description": "..."}}], "timeline": "X months"}}"""
        )
        
        # Create LLMChain
        career_chain = LLMChain(llm=llm, prompt=career_prompt)
        
        print("LangChain initialized successfully!")
        print(f"Model: {GEMINI_MODEL}")
        return True
        
    except Exception as e:
        print(f"Error initializing LangChain: {e}")
        return False


def generate_career_guidance(user_profile: dict) -> dict:
    """
    Generate career guidance using LangChain
    Returns dict with recommendations or error
    """
    if not career_chain:
        return {
            "success": False,
            "error": "LangChain not initialized",
            "fallback": True
        }
    
    try:
        # Prepare input for chain
        chain_input = {
            "skills": ', '.join(user_profile.get('skills', [])) if user_profile.get('skills') else 'none',
            "interests": ', '.join(user_profile.get('interests', [])) if user_profile.get('interests') else 'general tech',
            "education_level": user_profile.get('education_level', 'Bachelor\'s'),
            "target_career": user_profile.get('target_career', 'Not specified (suggest best fit)'),
            "current_role": user_profile.get('current_role', 'Student'),
            "experience_years": str(user_profile.get('experience_years', 0))
        }
        
        # Run the chain
        response = career_chain.invoke(chain_input)
        
        # Extract text response
        response_text = response.get('text', '')
        
        # Parse JSON from response
        json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
        
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = json.loads(response_text)
        
        # Build response
        return {
            "success": True,
            "from_cache": False,
            "career_recommendation": result.get("career_recommendation", ""),
            "skill_gaps": result.get("skill_gaps", []),
            "learning_path": result.get("learning_path", []),
            "recommended_courses": result.get("recommended_courses", []),
            "certifications": result.get("certifications", []),
            "internship_guidance": result.get("internship_guidance", []),
            "timeline": result.get("timeline", "6 months"),
            "model": f"langchain-{GEMINI_MODEL}"
        }
        
    except Exception as e:
        print(f"❌ LangChain error: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback": True
        }


# Auto-initialize on import
if LANGCHAIN_AVAILABLE:
    initialize_langchain()


# ============================================================================
# CHAT HISTORY STORAGE - Using Redis or In-Memory
# ============================================================================

import time

# In-memory fallback for chat history (if Redis not available)
chat_history_store = {}
chat_history_ttl = 3600  # 1 hour


def save_chat_history(session_id: str, history: list) -> bool:
    """
    Save chat history to Redis or in-memory store
    """
    try:
        # Try to use Redis first
        from app import REDIS_AVAILABLE, redis_client
        
        if REDIS_AVAILABLE and redis_client:
            key = f"chat_history:{session_id}"
            redis_client.setex(key, chat_history_ttl, json.dumps(history))
            return True
        else:
            # Use in-memory fallback
            chat_history_store[session_id] = {
                "history": history,
                "timestamp": time.time()
            }
            return True
    except Exception as e:
        print(f"Error saving chat history: {e}")
        return False


def get_chat_history(session_id: str) -> list:
    """
    Get chat history from Redis or in-memory store
    """
    try:
        from app import REDIS_AVAILABLE, redis_client
        
        if REDIS_AVAILABLE and redis_client:
            key = f"chat_history:{session_id}"
            value = redis_client.get(key)
            if value:
                return json.loads(value)
            return []
        else:
            # Use in-memory fallback
            if session_id in chat_history_store:
                data = chat_history_store[session_id]
                # Check if expired
                if time.time() - data["timestamp"] < chat_history_ttl:
                    return data["history"]
                else:
                    del chat_history_store[session_id]
            return []
    except Exception as e:
        print(f"Error getting chat history: {e}")
        return []


# ============================================================================
# CHATBOT FUNCTIONS - Conversational Career Guidance
# ============================================================================

# Chat prompt for conversational AI
CHAT_PROMPT = """You are a friendly and expert career counselor for tech students in India. 
You help students understand career options, suggest courses, certifications, and internships.
You provide actionable advice in a conversational, easy-to-understand way.

Keep your responses concise, encouraging, and practical.
If you don't know something, be honest about it.

User's profile context: {context}

Conversation history:
{history}

User: {input}
Career Counselor:"""

# Guided wizard prompts for each step
WIZARD_PROMPTS = {
    1: {
        "question": "What are your current skills? (e.g., Python, JavaScript, React, SQL)",
        "field": "skills",
        "prompt": "Ask the user about their technical skills, programming languages they know, frameworks they've used."
    },
    2: {
        "question": "What are your interests? (e.g., web development, data science, AI/ML)",
        "field": "interests",
        "prompt": "Ask about their areas of interest within technology."
    },
    3: {
        "question": "What's your education level? (e.g., High School, Undergraduate, Master's)",
        "field": "education_level",
        "prompt": "Ask about their current education status."
    },
    4: {
        "question": "What career are you targeting? (e.g., Software Engineer, Data Scientist)",
        "field": "target_career",
        "prompt": "Ask about their dream job or career goal."
    },
    5: {
        "question": "How many years of experience do you have?",
        "field": "experience_years",
        "prompt": "Ask about their work experience in years."
    }
}


def create_chat_memory():
    """Create conversation memory for chatbot"""
    return ConversationBufferMemory(
        memory_key="history",
        input_key="input",
        return_messages=True
    )


def generate_chat_response(message: str, history: list, context: dict = None, mode: str = "chat") -> dict:
    """
    Generate chat response using LangChain with conversation history
    
    Args:
        message: User's message
        history: List of previous messages [{role: 'user'|'assistant', content: str}]
        context: User profile context (skills, interests, etc.)
        mode: 'chat' for free conversation, 'wizard' for guided mode
    
    Returns:
        dict with response, suggestions, and mode info
    """
    if not llm:
        return {
            "success": False,
            "response": "Sorry, the AI service is not available right now.",
            "error": "LLM not initialized"
        }
    
    try:
        # Build context string from user profile
        context_str = ""
        if context:
            context_parts = []
            for key, value in context.items():
                if value:
                    context_parts.append(f"{key}: {value}")
            context_str = ", ".join(context_parts)
        
        if not context_str:
            context_str = "No profile information provided yet."
        
        # Build history string
        history_str = ""
        if history:
            for msg in history[-10:]:  # Last 10 messages
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                if role == 'user':
                    history_str += f"User: {content}\n"
                else:
                    history_str += f"Career Counselor: {content}\n"
        
        # For wizard mode, guide through steps
        if mode == "wizard":
            current_step = context.get('wizard_step', 1) if context else 1
            if current_step <= 5:
                wizard_info = WIZARD_PROMPTS[current_step]
                response = f"{wizard_info['question']}\n\n{wizard_info['prompt']}"
                return {
                    "success": True,
                    "response": response,
                    "mode": "wizard",
                    "step": current_step,
                    "total_steps": 5,
                    "field": wizard_info['field'],
                    "suggestions": ["I'll add my skills now", "Skip this question", "Go back"]
                }
            else:
                # Wizard complete - generate final recommendations
                return generate_wizard_completion(context)
        
        # For chat mode, use conversational prompt
        prompt = CHAT_PROMPT.format(
            context=context_str,
            history=history_str,
            input=message
        )
        
        # Generate response using LangChain
        response = llm.invoke(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        # Generate suggestions based on context
        suggestions = [
            "What courses should I take?",
            "What certifications help?",
            "How do I prepare for interviews?"
        ]
        
        if not context or not context.get('skills'):
            suggestions.insert(0, "Tell me about your skills")
        
        return {
            "success": True,
            "response": response_text,
            "mode": "chat",
            "suggestions": suggestions
        }
        
    except Exception as e:
        print(f"Chat error: {e}")
        return {
            "success": False,
            "response": "Sorry, I encountered an error. Please try again.",
            "error": str(e)
        }


def generate_wizard_completion(context: dict) -> dict:
    """Generate final recommendations after wizard completion"""
    if not career_chain:
        return {
            "success": False,
            "response": "Sorry, couldn't generate recommendations.",
            "error": "Career chain not initialized"
        }
    
    try:
        # Prepare input for career guidance chain
        chain_input = {
            "skills": context.get('skills', 'not specified'),
            "interests": context.get('interests', 'general tech'),
            "education_level": context.get('education_level', "Bachelor's"),
            "target_career": context.get('target_career', 'Not specified'),
            "current_role": context.get('current_role', 'Student'),
            "experience_years": str(context.get('experience_years', 0))
        }
        
        response = career_chain.invoke(chain_input)
        response_text = response.get('text', '')
        
        return {
            "success": True,
            "response": "Great! I've collected all the information. Here are your personalized career recommendations:\n\n" + response_text[:1000],
            "mode": "wizard_complete",
            "suggestions": [
                "Tell me more about this career",
                "What courses should I start with?",
                "Switch to free chat mode"
            ]
        }
        
    except Exception as e:
        return {
            "success": False,
            "response": f"Error generating recommendations: {str(e)}",
            "error": str(e)
        }
