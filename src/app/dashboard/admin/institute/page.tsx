'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Settings, Save, Loader2, CheckCircle, User, GraduationCap } from 'lucide-react';

interface InstituteUser {
  userId: string;
  email: string;
  role: string;
  status: string;
  firstName: string;
  lastName: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
}

interface Institute {
  id: string;
  name: string;
  code: string;
  domain: string;
  description?: string;
  isActive: boolean;
  settings?: {
    requireApproval: boolean;
    allowStudentRegistration: boolean;
    allowFacultyRegistration: boolean;
    allowEmployerRegistration: boolean;
  };
}

export default function InstituteManagementPage() {
  const { user } = useAuth();
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [students, setStudents] = useState<InstituteUser[]>([]);
  const [faculty, setFaculty] = useState<InstituteUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    domain: '',
    description: '',
    settings: {
      requireApproval: true,
      allowStudentRegistration: true,
      allowFacultyRegistration: true,
      allowEmployerRegistration: true,
    },
  });

  useEffect(() => {
    const fetchInstitute = async () => {
      if (!user?.instituteId) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        // Fetch institute details
        const instituteResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/institutes/${user.instituteId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const instituteData = await instituteResponse.json();

        if (instituteData.success && instituteData.data) {
          setInstitute(instituteData.data);
          setFormData({
            name: instituteData.data.name || '',
            code: instituteData.data.code || '',
            domain: instituteData.data.domain || '',
            description: instituteData.data.description || '',
            settings: instituteData.data.settings || {
              requireApproval: true,
              allowStudentRegistration: true,
              allowFacultyRegistration: true,
              allowEmployerRegistration: true,
            },
          });
        }

        // Fetch students
        const studentsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users?role=student`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const studentsData = await studentsResponse.json();
        if (studentsData.success && studentsData.data) {
          setStudents(studentsData.data);
        }

        // Fetch faculty
        const facultyResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users?role=faculty`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const facultyData = await facultyResponse.json();
        if (facultyData.success && facultyData.data) {
          setFaculty(facultyData.data);
        }
      } catch (error) {
        console.error('Failed to fetch institute:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstitute();
  }, [user?.instituteId]);

  const handleSave = async () => {
    if (!user?.instituteId) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/institutes/${user.instituteId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();

      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save institute:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user?.instituteId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Institute Associated</h2>
            <p className="text-muted-foreground">
              You don't have an institute associated with your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Institute</h1>
          <p className="text-muted-foreground mt-1">
            Manage your institute settings and view members
          </p>
        </div>
        <Badge variant={institute?.isActive ? 'default' : 'secondary'}>
          {institute?.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Institute Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Institute Details
            </CardTitle>
            <CardDescription>Basic information about your institute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Institute Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter institute name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Institute Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., MITU"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Email Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
                  placeholder="e.g., mit.edu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your institute"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Registration Settings
            </CardTitle>
            <CardDescription>Configure who can register for your institute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Admin Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Students and faculty need approval before accessing
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.settings.requireApproval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, requireApproval: e.target.checked },
                  })
                }
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Student Registration</Label>
              </div>
              <input
                type="checkbox"
                checked={formData.settings.allowStudentRegistration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowStudentRegistration: e.target.checked },
                  })
                }
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Faculty Registration</Label>
              </div>
              <input
                type="checkbox"
                checked={formData.settings.allowFacultyRegistration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowFacultyRegistration: e.target.checked },
                  })
                }
                className="w-5 h-5"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Students ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No students registered yet</p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.userId}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {student.profile?.firstName || student.firstName} {student.profile?.lastName || student.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <Badge variant={student.status === 'approved' ? 'default' : 'secondary'}>
                    {student.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faculty Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Faculty ({faculty.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {faculty.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No faculty members registered yet</p>
          ) : (
            <div className="space-y-2">
              {faculty.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {member.profile?.firstName || member.firstName} {member.profile?.lastName || member.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={member.status === 'approved' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saveSuccess && (
          <span className="flex items-center text-green-600 text-sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Changes saved successfully
          </span>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
