'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TreeDeciduous,
  Lock,
  Unlock,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/layout/MainLayout';
import { skillTreeApi } from '@/lib/api';
import { SkillTree, SkillNode } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function SkillTreePage() {
  const { user } = useAuth();
  const [skillTree, setSkillTree] = useState<SkillTree | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);

  useEffect(() => {
    loadSkillTree();
  }, [user]);

  const loadSkillTree = async () => {
    try {
      const address = user?.walletAddress || '';
      const result = await skillTreeApi.getByStudent(address);
      if (result.success && result.data) {
        setSkillTree(result.data);
      }
    } catch (error) {
      console.error('Error loading skill tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    const colors = ['#9CA3AF', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
    return colors[level - 1] || colors[0];
  };

  const getLevelName = (level: number) => {
    const names = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    return names[level - 1] || names[0];
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Skill Tree</h1>
            <p className="text-muted-foreground">
              Visualize your learning progression
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{skillTree?.totalXP || 0}</p>
              <p className="text-sm text-muted-foreground">Total XP</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{skillTree?.level || 1}</p>
              <p className="text-sm text-muted-foreground">Level</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {skillTree?.completedNodes}/{skillTree?.totalNodes}
              </p>
              <p className="text-sm text-muted-foreground">Skills Unlocked</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(((skillTree?.completedNodes || 0) / (skillTree?.totalNodes || 1)) * 100)}%
                  </span>
                </div>
                <Progress
                  value={((skillTree?.completedNodes || 0) / (skillTree?.totalNodes || 1)) * 100}
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skill Tree Visualization */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreeDeciduous className="w-5 h-5 text-primary" />
                Skill Progression
              </CardTitle>
              <CardDescription>
                Click on skills to see details. Locked skills require prerequisites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative min-h-[500px] bg-muted/30 rounded-lg p-8 overflow-auto">
                {/* Skill Nodes */}
                <div className="relative" style={{ width: '600px', height: '400px' }}>
                  {skillTree?.nodes && skillTree.nodes.length > 0 ? (
                    skillTree.nodes.map((node) => (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          'absolute cursor-pointer transition-all duration-300',
                          node.isLocked ? 'opacity-50' : 'hover:scale-110'
                        )}
                        style={{
                          left: `${node.position.x}px`,
                          top: `${node.position.y}px`,
                        }}
                        onClick={() => setSelectedNode(node)}
                      >
                        <div
                          className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all',
                            node.isLocked
                              ? 'bg-muted border-muted-foreground/30'
                              : 'shadow-lg'
                          )}
                          style={{
                            borderColor: node.isLocked ? undefined : getLevelColor(node.level),
                            boxShadow: node.isLocked ? undefined : `0 0 20px ${getLevelColor(node.level)}40`,
                            backgroundColor: node.isLocked ? undefined : `${getLevelColor(node.level)}20`,
                          }}
                        >
                          <span className="text-2xl">{node.icon}</span>
                          {!node.isLocked && (
                            <CheckCircle
                              className="absolute -bottom-1 -right-1 w-5 h-5 text-green-500 bg-background rounded-full"
                            />
                          )}
                          {node.isLocked && (
                            <Lock className="absolute -bottom-1 -right-1 w-5 h-5 text-muted-foreground bg-background rounded-full" />
                          )}
                        </div>
                        <p className={cn(
                          'text-xs text-center mt-2 font-medium',
                          node.isLocked ? 'text-muted-foreground' : 'text-foreground'
                        )}>
                          {node.name}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No skill tree data available</p>
                    </div>
                  )}

                  {/* Connection Lines */}
                  {skillTree?.nodes && skillTree.nodes.length > 0 && (
                    <svg className="absolute inset-0 pointer-events-none" style={{ width: '600px', height: '400px' }}>
                      {skillTree.nodes.map((node) =>
                      node.prerequisites.map((prereqId) => {
                        const prereq = skillTree?.nodes?.find(n => n.id === prereqId);
                        if (!prereq) return null;
                        return (
                          <line
                            key={`${prereqId}-${node.id}`}
                            x1={prereq.position.x + 32}
                            y1={prereq.position.y + 32}
                            x2={node.position.x + 32}
                            y2={node.position.y + 32}
                            stroke={node.isLocked ? '#9CA3AF' : getLevelColor(node.level)}
                            strokeWidth="2"
                            strokeDasharray={node.isLocked ? '5,5' : undefined}
                            opacity={0.5}
                          />
                        );
                      })
                    )}
                  </svg>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Skill Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedNode ? selectedNode.name : 'Select a Skill'}
              </CardTitle>
              <CardDescription>
                {selectedNode ? selectedNode.description : 'Click on a skill node to see details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${getLevelColor(selectedNode.level)}20` }}
                    >
                      {selectedNode.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedNode.name}</p>
                      <Badge
                        style={{ backgroundColor: getLevelColor(selectedNode.level) }}
                        className="text-white"
                      >
                        {getLevelName(selectedNode.level)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    {selectedNode.isLocked ? (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500 gap-1">
                        <Unlock className="w-3 h-3" />
                        Unlocked
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">XP Points</p>
                    <p className="text-lg font-bold">{selectedNode.xpPoints} XP</p>
                  </div>

                  {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Prerequisites</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.prerequisites.map((prereqId: string) => {
                          const prereq = skillTree?.nodes?.find((n: any) => n.id === prereqId);
                          return (
                            <Badge key={prereqId} variant="outline">
                              {prereq?.name || prereqId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedNode.credentials.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Related Credentials</p>
                      <p className="text-sm">{selectedNode.credentials.length} credential(s)</p>
                    </div>
                  )}

                  {selectedNode.unlockedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Unlocked On</p>
                      <p className="text-sm">
                        {new Date(selectedNode.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TreeDeciduous className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Click on any skill node to view its details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Branches Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Progress</CardTitle>
            <CardDescription>Your progress across different skill branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {skillTree?.branches && skillTree.branches.length > 0 ? (
                skillTree.branches.map((branch) => (
                  <div key={branch.name} className="p-4 rounded-lg border">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{branch.name}</span>
                      <span className="text-sm text-muted-foreground">{branch.progress}%</span>
                    </div>
                    <Progress value={branch.progress} className="h-2" />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground col-span-3 text-center py-4">
                  No branch data available. Submit credentials to see your skill branches.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}