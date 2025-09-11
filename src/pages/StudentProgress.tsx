import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, Award, Clock, Search, BookOpen, GamepadIcon, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StudentProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  points: number;
  role: string;
  created_at: string;
}

interface StudentStats {
  student: StudentProfile;
  flashcards_count: number;
  practice_sessions: number;
  quiz_attempts: number;
  avg_score: number;
  total_time: number;
  achievements: number;
}

const StudentProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudentProgress();
  }, [user]);

  const fetchStudentProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all student profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setStudents([]);
        return;
      }

      // Fetch stats for each student
      const studentStatsPromises = profiles.map(async (student) => {
        // Flashcards count
        const { count: flashcardsCount } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', student.user_id);

        // Practice sessions
        const { data: practiceSessions } = await supabase
          .from('practice_sessions')
          .select('score, feedback')
          .eq('user_id', student.user_id);

        // Quiz attempts
        const { data: quizAttempts } = await supabase
          .from('quiz_attempts')
          .select('score, max_score, time_taken')
          .eq('user_id', student.user_id);

        // User achievements
        const { count: achievementsCount } = await supabase
          .from('user_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', student.user_id);

        // Calculate average score and total time
        const totalQuizzes = quizAttempts?.length || 0;
        const avgScore = totalQuizzes > 0 
          ? Math.round((quizAttempts?.reduce((sum, attempt) => 
              sum + ((attempt.score / attempt.max_score) * 100), 0) || 0) / totalQuizzes)
          : 0;

        const totalTime = quizAttempts?.reduce((sum, attempt) => 
          sum + (attempt.time_taken || 0), 0) || 0;

        return {
          student,
          flashcards_count: flashcardsCount || 0,
          practice_sessions: practiceSessions?.length || 0,
          quiz_attempts: totalQuizzes,
          avg_score: avgScore,
          total_time: Math.round(totalTime / 60), // Convert to minutes
          achievements: achievementsCount || 0
        };
      });

      const studentStats = await Promise.all(studentStatsPromises);
      setStudents(studentStats);

    } catch (error) {
      console.error('Error fetching student progress:', error);
      toast({
        title: "Error",
        description: "Failed to load student progress data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.student.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = students.length;
  const activeStudents = students.filter(s => 
    s.flashcards_count > 0 || s.practice_sessions > 0 || s.quiz_attempts > 0
  ).length;
  const avgProgress = totalStudents > 0 
    ? Math.round(students.reduce((sum, s) => sum + s.avg_score, 0) / totalStudents) 
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading student progress...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Student Progress</h1>
          <Button onClick={fetchStudentProgress} variant="outline">
            Refresh Data
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                All registered students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeStudents}</div>
              <p className="text-xs text-muted-foreground">
                Students with activity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{avgProgress}%</div>
              <p className="text-xs text-muted-foreground">
                Across all quizzes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {Math.round((activeStudents / Math.max(totalStudents, 1)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Active participation rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Student List */}
        {filteredStudents.length === 0 ? (
          <Card className="text-center p-8">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No Students Found</CardTitle>
            <CardDescription>
              {totalStudents === 0 
                ? "No students have registered yet." 
                : "No students match your search criteria."}
            </CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStudents.map((studentData) => (
              <Card key={studentData.student.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {studentData.student.display_name || 'Unknown Student'}
                      </CardTitle>
                      <CardDescription>{studentData.student.email}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {studentData.student.points} pts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Overview */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{studentData.avg_score}%</span>
                    </div>
                    <Progress value={studentData.avg_score} className="h-2" />
                  </div>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen size={16} className="text-primary" />
                        <span className="font-semibold">{studentData.flashcards_count}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Flashcards</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <MessageCircle size={16} className="text-primary" />
                        <span className="font-semibold">{studentData.practice_sessions}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Practice</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <GamepadIcon size={16} className="text-primary" />
                        <span className="font-semibold">{studentData.quiz_attempts}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Games</p>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Study Time: {studentData.total_time}m</span>
                    <span>Achievements: {studentData.achievements}</span>
                  </div>

                  {/* Activity Level Badge */}
                  <div className="flex justify-center">
                    {studentData.flashcards_count + studentData.practice_sessions + studentData.quiz_attempts === 0 ? (
                      <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                    ) : studentData.avg_score >= 80 ? (
                      <Badge className="bg-green-500 text-white">Excellent</Badge>
                    ) : studentData.avg_score >= 60 ? (
                      <Badge className="bg-yellow-500 text-white">Good</Badge>
                    ) : (
                      <Badge className="bg-blue-500 text-white">Learning</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;