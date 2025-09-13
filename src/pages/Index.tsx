import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Users, BookOpen, MessageCircle, GamepadIcon, Trophy, Calendar, Target, TrendingUp, Award, PlaySquare, Gamepad2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
        <Link to="/flashcards">
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
        </Link>

        <Link to="/practice">
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
        </Link>

        <Link to="/games">
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
        </Link>
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
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    contentCreated: 0,
    activeStudents: 0,
    thisWeek: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherStats();
  }, [user]);

  const fetchTeacherStats = async () => {
    if (!user) return;

    try {
      // Count total students
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Count content created by this teacher
      const [vocabCount, quizCount, dialogueCount] = await Promise.all([
        supabase.from('vocabulary').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('dialogues').select('*', { count: 'exact', head: true }).eq('created_by', user.id)
      ]);

      const totalContent = (vocabCount.count || 0) + (quizCount.count || 0) + (dialogueCount.count || 0);

      // Count active students (those who have done some activity)
      const { data: activeStudentIds } = await supabase
        .from('flashcards')
        .select('user_id')
        .not('user_id', 'is', null);

      const uniqueActiveStudents = new Set(activeStudentIds?.map(item => item.user_id) || []).size;

      // This week's activities (simplified)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: thisWeekActivity } = await supabase
        .from('practice_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      setStats({
        totalStudents: studentCount || 0,
        contentCreated: totalContent,
        activeStudents: uniqueActiveStudents,
        thisWeek: thisWeekActivity || 0
      });
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-primary">Welcome back, {user?.user_metadata?.display_name || 'Teacher'}!</h2>
          <p className="text-muted-foreground">Here's what's happening with your students today.</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Your Role</div>
          <div className="text-lg font-semibold text-primary">Teacher</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Registered learners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Created</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.contentCreated}</div>
            <p className="text-xs text-muted-foreground">
              Vocabulary, quizzes, dialogues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              Currently learning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Practice sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/create-content">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Create New Content</CardTitle>
                    <CardDescription>Add vocabulary, quizzes, or dialogues</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/student-progress">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <BarChart className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle>View Student Progress</CardTitle>
                    <CardDescription>Monitor learning analytics</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Teaching Impact</CardTitle>
          <CardDescription>Your contribution to student learning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Student Engagement Rate</span>
              <span className="font-semibold">
                {stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-secondary/20 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: stats.totalStudents > 0 
                    ? `${Math.round((stats.activeStudents / stats.totalStudents) * 100)}%` 
                    : '0%' 
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeStudents} out of {stats.totalStudents} students are actively learning
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
