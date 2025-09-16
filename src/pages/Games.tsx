import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GamepadIcon, Star, Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface Quiz {
  id: string;
  title: string;
  description: string;
  quiz_type: string;
  difficulty_level: number;
  time_limit?: number;
  questions: any[];
}

interface GameSession {
  score: number;
  timeSpent: number;
  questionsCorrect: number;
  totalQuestions: number;
}

interface CompletedQuiz {
  quiz_id: string;
  completed: boolean;
}

const Games = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { incrementActivity } = useTimeTracking({ pageName: 'games' });
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentGame, setCurrentGame] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [gameSession, setGameSession] = useState<GameSession>({
    score: 0,
    timeSpent: 0,
    questionsCorrect: 0,
    totalQuestions: 0
  });
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<CompletedQuiz[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');

  useEffect(() => {
    fetchGames();
    if (user) {
      fetchCompletedQuizzes();
    }
  }, [user]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentGame && !gameComplete && !showAnswer && timeLeft > 0 && !isAnswered) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentGame, gameComplete, showAnswer, timeLeft, isAnswered]);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .in('quiz_type', ['game', 'quiz'])
        .order('difficulty_level');

      if (error) throw error;
      setQuizzes((data || []).map(quiz => ({
        ...quiz,
        questions: Array.isArray(quiz.questions) ? quiz.questions : []
      })));
    } catch (error) {
      console.error('Error fetching games:', error);
      toast({
        title: "Error",
        description: "Failed to load games",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedQuizzes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('quiz_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const completed = (data || []).map(attempt => ({
        quiz_id: attempt.quiz_id,
        completed: true
      }));
      
      setCompletedQuizzes(completed);
    } catch (error) {
      console.error('Error fetching completed quizzes:', error);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startGame = (quiz: Quiz) => {
    // Shuffle questions for randomization
    const shuffled = shuffleArray(quiz.questions);
    setShuffledQuestions(shuffled);
    
    setCurrentGame(quiz);
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setGameSession({
      score: 0,
      timeSpent: 0,
      questionsCorrect: 0,
      totalQuestions: shuffled.length
    });
    setGameStartTime(new Date());
    setGameComplete(false);
    setTimeLeft(15);
    setShowAnswer(false);
    setIsAnswered(false);
  };

  const handleTimeUp = () => {
    if (!currentGame) return;
    
    const question = shuffledQuestions[currentQuestion];
    setCorrectAnswer(question.correct_answer);
    setShowAnswer(true);
    
    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  const submitAnswer = () => {
    if (!currentGame || !selectedAnswer || isAnswered) return;

    setIsAnswered(true);
    const question = shuffledQuestions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct_answer;
    
    setCorrectAnswer(question.correct_answer);

    if (isCorrect) {
      setGameSession(prev => ({
        ...prev,
        score: prev.score + 10,
        questionsCorrect: prev.questionsCorrect + 1
      }));
      
      incrementActivity(); // Track correct answer as activity
      
      toast({
        title: "Correct! 🎉",
        description: "+10 points",
        variant: "default"
      });
    } else {
      toast({
        title: "Incorrect 😞",
        description: `Correct answer: ${question.correct_answer}`,
        variant: "destructive"
      });
    }

    setShowAnswer(true);
    
    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  const nextQuestion = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
      setTimeLeft(15);
      setShowAnswer(false);
      setIsAnswered(false);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    if (!currentGame || !gameStartTime || !user) return;

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - gameStartTime.getTime()) / 1000);

    const finalSession = {
      ...gameSession,
      timeSpent
    };

    // Check if user has already completed this quiz
    const isAlreadyCompleted = completedQuizzes.some(cq => cq.quiz_id === currentGame.id);

    try {
      // Save quiz attempt
      const { error: attemptError } = await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        quiz_id: currentGame.id,
        score: finalSession.score,
        max_score: finalSession.totalQuestions * 10,
        time_taken: timeSpent,
        answers: shuffledQuestions.map((q, index) => ({
          question_id: index,
          selected_answer: index <= currentQuestion ? selectedAnswer : null,
          correct: index < currentQuestion ? selectedAnswer === q.correct_answer : false
        }))
      });

      if (attemptError) throw attemptError;

      // Update user points only if not already completed
      if (!isAlreadyCompleted) {
        const { data: profileData, error: fetchError } = await supabase
          .from('profiles')
          .select('points')
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const currentPoints = profileData?.points || 0;
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ points: currentPoints + finalSession.score })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        toast({
          title: "Quiz Complete! 🎉",
          description: `You earned ${finalSession.score} points!`
        });
      } else {
        toast({
          title: "Quiz Complete!",
          description: "No points earned (already completed)"
        });
      }

      // Update completed quizzes list
      if (!isAlreadyCompleted) {
        setCompletedQuizzes(prev => [...prev, { quiz_id: currentGame.id, completed: true }]);
      }

      setGameSession(finalSession);
      setGameComplete(true);
      
    } catch (error) {
      console.error('Error saving game result:', error);
      toast({
        title: "Error",
        description: "Failed to save game result",
        variant: "destructive"
      });
    }
  };

  const restartGame = () => {
    setCurrentGame(null);
    setGameComplete(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading games...</div>
      </div>
    );
  }

  if (gameComplete && currentGame) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-3xl">Game Complete!</CardTitle>
            <CardDescription>Great job playing {currentGame.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{gameSession.score}</div>
                <div className="text-sm text-muted-foreground">Points Earned</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{gameSession.questionsCorrect}/{gameSession.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{Math.floor(gameSession.timeSpent / 60)}:{(gameSession.timeSpent % 60).toString().padStart(2, '0')}</div>
                <div className="text-sm text-muted-foreground">Time Taken</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{Math.round((gameSession.questionsCorrect / gameSession.totalQuestions) * 100)}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => startGame(currentGame)} variant="outline">
                Play Again
              </Button>
              <Button onClick={restartGame}>
                Choose New Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentGame) {
    const question = shuffledQuestions[currentQuestion];
    const progress = ((currentQuestion) / shuffledQuestions.length) * 100;
    
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">{currentGame.title}</h1>
            <Badge variant="secondary">
              {currentQuestion + 1} / {shuffledQuestions.length}
            </Badge>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress: {Math.round(progress)}%</span>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span className={timeLeft <= 5 ? "text-red-500 font-bold" : ""}>{timeLeft}s</span>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg">
                {question.question_gujarati && (
                  <div className="mb-2 text-2xl font-bold text-primary">
                    {question.question_gujarati}
                  </div>
                )}
                <div className="text-base text-muted-foreground">
                  {question.question}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.options.map((option: string, index: number) => {
                let buttonVariant: "default" | "outline" | "destructive" | "secondary" = "outline";
                let icon = null;
                
                if (showAnswer) {
                  if (option === correctAnswer) {
                    buttonVariant = "default";
                    icon = <CheckCircle className="w-4 h-4 text-green-500" />;
                  } else if (option === selectedAnswer && option !== correctAnswer) {
                    buttonVariant = "destructive";
                    icon = <XCircle className="w-4 h-4 text-red-500" />;
                  }
                } else if (selectedAnswer === option) {
                  buttonVariant = "secondary";
                }

                return (
                  <Button
                    key={index}
                    variant={buttonVariant}
                    className="w-full text-left justify-between p-4 h-auto text-lg"
                    onClick={() => !showAnswer && !isAnswered && setSelectedAnswer(option)}
                    disabled={showAnswer || isAnswered}
                  >
                    <span className="text-right">{option}</span>
                    {icon}
                  </Button>
                );
              })}
              
              {!showAnswer && (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={submitAnswer} 
                    disabled={!selectedAnswer || isAnswered}
                    size="lg"
                    className="w-full"
                  >
                    Submit Answer
                  </Button>
                </div>
              )}

              {showAnswer && (
                <div className="text-center pt-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedAnswer === correctAnswer ? "Correct! 🎉" : "Moving to next question..."}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2 text-primary">
              <Star size={16} />
              Score: {gameSession.score}
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Trophy size={16} />
              Correct: {gameSession.questionsCorrect}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Fun Games</h1>
          <p className="text-muted-foreground">Learn Gujarati through interactive games!</p>
        </div>

        {quizzes.length === 0 ? (
          <Card className="text-center p-8">
            <GamepadIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No Games Available</CardTitle>
            <CardDescription>Games will be added by teachers soon!</CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const isCompleted = completedQuizzes.some(cq => cq.quiz_id === quiz.id);
              
              return (
                <Card key={quiz.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <GamepadIcon className="w-8 h-8 text-primary" />
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline">
                          Level {quiz.difficulty_level}
                        </Badge>
                        {isCompleted && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>{quiz.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Questions:</span>
                        <span>{quiz.questions.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Time per Question:</span>
                        <span>15 seconds</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Points per Correct:</span>
                        <span>10 points</span>
                      </div>
                      <Button 
                        onClick={() => startGame(quiz)}
                        className="w-full"
                        variant={isCompleted ? "outline" : "default"}
                      >
                        {isCompleted ? 'Play Again (No Points)' : 'Start Game'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;