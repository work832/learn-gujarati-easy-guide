import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, PlaySquare, Gamepad2, Trophy, TrendingUp, Calendar, Star } from 'lucide-react';

const Index = () => {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher';

  if (isTeacher) {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
};

const StudentDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {profile?.display_name}! 🙏
        </h1>
        <p className="text-muted-foreground">Ready to continue your Gujarati learning journey?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Words Learned</p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <PlaySquare className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversations</p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-success/10">
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold text-foreground">{profile?.points || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-info/10">
                <Calendar className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold text-foreground">0 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Practice Flashcards</span>
            </CardTitle>
            <CardDescription>
              Review vocabulary with interactive flashcards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Start Learning
            </Button>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-muted-foreground">0%</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <PlaySquare className="h-5 w-5 text-accent" />
              <span>Conversation Practice</span>
            </CardTitle>
            <CardDescription>
              Practice speaking with AI conversation partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="lg">
              Start Speaking
            </Button>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dialogues</span>
                <span className="text-muted-foreground">0 completed</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Gamepad2 className="h-5 w-5 text-warning" />
              <span>Fun Games</span>
            </CardTitle>
            <CardDescription>
              Play games to reinforce your learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full" size="lg">
              Play Games
            </Button>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">High Score</span>
                <span className="text-muted-foreground">0</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Goal & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span>Daily Goal</span>
            </CardTitle>
            <CardDescription>Keep your learning streak alive!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Today's Progress</span>
                <span>0/10 words</span>
              </div>
              <Progress value={0} />
            </div>
            <Button className="w-full">Continue Learning</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-warning" />
              <span>Recent Achievements</span>
            </CardTitle>
            <CardDescription>Your learning milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center py-8">
                Complete your first lesson to earn achievements!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, {profile?.display_name}! 👩‍🏫
        </h1>
        <p className="text-muted-foreground">Manage your students and create engaging content</p>
      </div>

      {/* Teacher Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <PlaySquare className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Content Created</p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-success/10">
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-info/10">
                <Calendar className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground">0 lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Teachers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Create New Content</CardTitle>
            <CardDescription>Add vocabulary, dialogues, or quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Start Creating
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>View Student Progress</CardTitle>
            <CardDescription>Monitor your students' learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="lg">
              View Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
