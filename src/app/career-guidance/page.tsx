'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { skillTreeApi } from '@/lib/api';

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}

export default function CareerGuidance() {
  const [skills, setSkills] = useState<string[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillsLoading, setSkillsLoading] = useState(true);

  useEffect(() => {
    fetchUserSkills();
  }, []);

  const fetchUserSkills = async () => {
    setSkillsLoading(true);
    try {
      const result = await skillTreeApi.getMySkills();
      
      if (result.success && result.data) {
        setSkills(result.data.skills || []);
      } else {
        setSkills([]);
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
      setSkills(['javascript', 'react', 'node.js', 'mongodb']);
    } finally {
      setSkillsLoading(false);
    }
  };

  const getCareerGuidance = async () => {
    if (skills.length === 0) {
      setError('No skills found. Please add some credentials first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5002/api/ai/career-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills })
      });

      const data = await response.json();

      if (data.success) {
        setCareers(data.career_options || []);
      } else {
        setError(data.error || 'Failed to get career guidance');
      }
    } catch (err: any) {
      setError('AI service unavailable. Make sure services are running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">AI Career Guidance</h1>
          <p className="text-gray-600">
            Get personalized career recommendations powered by AI
          </p>
        </div>

        {/* Get Quick Results - ABOVE Chatbot */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Get Quick Results</h2>
          
          {/* Skills Section */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3">Your Verified Skills</h3>
            
            {skillsLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.length > 0 ? (
                  skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No skills found. Add some credentials first.</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={getCareerGuidance}
            disabled={loading || skills.length === 0 || skillsLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Analyzing with AI...
              </>
            ) : (
              <>
                🤖 Get AI Career Guidance
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Career Options Results */}
        {careers.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mb-4">🚀 Recommended Career Paths</h2>
            
            {careers.map((career, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl ${
                  index === 0 ? 'border-2 border-green-500' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {career.title}
                      {index === 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                          Best Match
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {career.salary_range} • {career.demand} Demand
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-green-600">
                      {career.match_score}%
                    </div>
                    <div className="text-xs text-gray-500">Match Score</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${career.match_score}%` }}
                    />
                  </div>
                </div>

                {/* Guidance */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm font-medium text-blue-900">
                    📝 {career.guidance}
                  </p>
                </div>

                {/* Missing Skills */}
                {career.missing_skills && career.missing_skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-2">
                      Missing Skills ({career.missing_skills.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {career.missing_skills.slice(0, 5).map((skill: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-semibold">Next Action:</span>
                    <p className="text-gray-700">{career.next_action}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Est. Time:</span>
                    <p className="text-gray-700">{career.estimated_time}</p>
                  </div>
                </div>

                {/* Companies */}
                <div>
                  <p className="text-sm font-semibold mb-2">🏢 Top Hiring Companies:</p>
                  <div className="flex flex-wrap gap-2">
                    {career.top_companies?.map((company: string, i: number) => (
                      <span key={i} className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State for Results */}
        {!loading && careers.length === 0 && !error && (
          <div className="text-center py-8 bg-white rounded-lg shadow-lg mb-8">
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="text-xl font-bold mb-2">Ready to discover your career path?</h3>
            <p className="text-gray-600">
              Click the button above to get AI-powered career guidance
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
