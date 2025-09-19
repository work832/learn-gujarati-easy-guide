import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Trophy, BookOpen, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Quiz {
  id: string;
  title: string;
  description: string;
  quiz_type: string;
  questions: any[];
  difficulty_level: number;
  time_limit: number;
  category_id: string;
  created_at: string;
}

interface QuizAttempt {
  id: string;
  score: number;
  max_score: number;
  time_taken: number;
  completed_at: string;
}

export default function Quiz() {
  const { user, profile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    fetchQuizzes();
    if (user) {
      fetchAttempts();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedQuiz && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedQuiz, timeRemaining]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizStartTime(new Date());
    setTimeRemaining(quiz.time_limit * 60); // Convert minutes to seconds
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz || !user || !quizStartTime) return;

    const endTime = new Date();
    const timeTaken = Math.floor((endTime.getTime() - quizStartTime.getTime()) / 1000);
    
    let score = 0;
    const maxScore = selectedQuiz.questions.length;

    selectedQuiz.questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        score++;
      }
    });

    try {
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: selectedQuiz.id,
          score,
          max_score: maxScore,
          time_taken: timeTaken,
          answers
        });

      if (error) throw error;

      toast.success(`Quiz completed! Score: ${score}/${maxScore}`);
      setSelectedQuiz(null);
      fetchAttempts();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (level: number) => {
    const levels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return levels[level] || 'Unknown';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading quizzes...</div>
      </div>
    );
  }

  if (selectedQuiz) {
    const currentQ = selectedQuiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedQuiz.questions.length) * 100;

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{selectedQuiz.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeRemaining)}</span>
              </div>
              <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
                Exit Quiz
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mb-4" />
          <p className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {selectedQuiz.questions.length}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQ.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQ.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={answers[currentQuestion] === option ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-4"
                  onClick={() => handleAnswerSelect(currentQuestion, option)}
                >
                  {option}
                </Button>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion === selectedQuiz.questions.length - 1 ? (
                <Button onClick={handleSubmitQuiz}>
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(prev => prev + 1)}
                  disabled={!answers[currentQuestion]}
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quiz Section</h1>
          <p className="text-gray-600">Test your Gujarati knowledge with interactive quizzes</p>
        </div>
        {profile?.role === 'teacher' && (
          <Button onClick={() => window.location.href = '/create-content'}>
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        )}
      </div>

      {attempts.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Your Recent Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {attempts.slice(0, 6).map((attempt) => (
                <div key={attempt.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium">
                      Score: {attempt.score}/{attempt.max_score}
                    </div>
                    <Badge variant={attempt.score / attempt.max_score >= 0.8 ? "default" : "secondary"}>
                      {Math.round((attempt.score / attempt.max_score) * 100)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    Time: {Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                <Badge className={getDifficultyColor(quiz.difficulty_level)}>
                  {getDifficultyText(quiz.difficulty_level)}
                </Badge>
              </div>
              <CardDescription>{quiz.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{quiz.questions.length} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.time_limit} min</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => startQuiz(quiz)}
                >
                  Start Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {quizzes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Quizzes Available</h3>
            <p className="text-gray-600 mb-4">
              {profile?.role === 'teacher' 
                ? 'Create your first quiz to get started!' 
                : 'Check back later for new quizzes from your teachers.'}
            </p>
            {profile?.role === 'teacher' && (
              <Button onClick={() => window.location.href = '/create-content'}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Quiz
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}