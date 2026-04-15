'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Calendar, MessageCircle, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/MainLayout';
import { mentorsApi } from '@/lib/api';
import { Mentor } from '@/types';

export default function MentorshipPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const result = await mentorsApi.getAll();
      if (result.success && result.data) {
        setMentors(result.data);
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-3xl font-bold">Mentorship Network</h1>
            <p className="text-muted-foreground">
              Connect with verified industry professionals
            </p>
          </div>
          <div className="relative">
            <Input placeholder="Search mentors..." className="w-64" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{mentors.length}</p>
              <p className="text-sm text-muted-foreground">Available Mentors</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">150+</p>
              <p className="text-sm text-muted-foreground">Sessions Completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold">4.8</p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Mentor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={mentor.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                        {mentor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{mentor.name}</h3>
                        {mentor.available ? (
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{mentor.title}</p>
                      <p className="text-xs text-muted-foreground">{mentor.company}</p>
                    </div>
                  </div>

                  {mentor.bio && (
                    <p className="text-sm text-muted-foreground mb-4">{mentor.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-4">
                    {mentor.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {mentor.skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{mentor.skills.length - 4}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{mentor.rating}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {mentor.sessions} sessions
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={!mentor.available}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Book Session
                    </Button>
                    <Button variant="outline" size="icon">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}