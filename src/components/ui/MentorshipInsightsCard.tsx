'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

/**
 * Add this component to your Faculty Dashboard
 * Location: src/app/dashboard/faculty/page.tsx
 */

export function MentorshipInsightsCard() {
  const [studentAddress, setStudentAddress] = useState('');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (!studentAddress) {
      alert('Please enter a student wallet address');
      return;
    }

    setLoading(true);
    try {
      // Fetch student data first
      const studentResponse = await fetch(`/api/credentials?studentAddress=${studentAddress}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const studentData: any = await studentResponse.json();

      // Extract skills
      const skills = new Set<string>();
      (studentData.credentials as any[])?.forEach((cred: any) => {
        (cred.skills as string[])?.forEach((skill: string) => skills.add(skill));
      });

      // Get AI insights
      const insightsResponse = await fetch('/api/ai/mentorship-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          skills: Array.from(skills),
          name: studentData.student?.name || 'Student'
        })
      });

      const insightsData = await insightsResponse.json();
      if (insightsData.success) {
        setInsights(insightsData);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      alert('Failed to generate insights. Make sure the AI service is running.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI Mentorship Guidance
        </CardTitle>
        <CardDescription>
          Get intelligent insights about student progress using PyTorch AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter Student Wallet Address (0x...)"
            value={studentAddress}
            onChange={(e) => setStudentAddress(e.target.value)}
            className="font-mono text-sm"
          />
          <Button 
            onClick={generateInsights}
            disabled={loading}
            className="whitespace-nowrap"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⚙️</span>
                Analyzing...
              </>
            ) : (
              <>
                🧠 Analyze
              </>
            )}
          </Button>
        </div>

        {/* Insights Display */}
        {insights && (
          <div className="space-y-4 mt-4">
            {/* Priority Badge */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">Student:</span>
              <span>{insights.student_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold">Priority Level:</span>
              <Badge className={getPriorityColor(insights.priority)}>
                {insights.priority.toUpperCase()}
              </Badge>
            </div>

            {/* Skill Diversity Score */}
            {insights.skill_diversity_score !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Skill Diversity:</span>
                  <span className="text-sm font-bold">{insights.skill_diversity_score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${insights.skill_diversity_score}%` }}
                  />
                </div>
              </div>
            )}

            {/* Categories Covered */}
            {insights.categories_covered && insights.categories_covered.length > 0 && (
              <div>
                <span className="font-semibold text-sm block mb-2">Skill Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {insights.categories_covered.map((category: string, i: number) => (
                    <Badge key={i} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Advice */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                🎯 AI-Generated Mentorship Advice:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {insights.advice}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Navigate to student detail page
                  window.location.href = `/students/${studentAddress}`;
                }}
              >
                📊 View Full Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInsights(null)}
              >
                ✕ Clear
              </Button>
            </div>
          </div>
        )}

        {/* Example/Demo Section */}
        {!insights && !loading && (
          <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
              💡 Example AI Output:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              "Student shows strong versatility across frontend, backend, blockchain. 
              Encourage advanced projects and certifications."
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ✨ Powered by PyTorch sentence-transformers
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MentorshipInsightsCard;