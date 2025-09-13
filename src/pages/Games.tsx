import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GamepadIcon, Star, Trophy, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

const Games = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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

  useEffect(() => {
    fetchGames();
  }, []);

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

  const startGame = (quiz: Quiz) => {
    setCurrentGame(quiz);
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setGameSession({
      score: 0,
      timeSpent: 0,
      questionsCorrect: 0,
      totalQuestions: quiz.questions.length
    });
    setGameStartTime(new Date());
    setGameComplete(false);
  };

  const submitAnswer = () => {
    if (!currentGame || !selectedAnswer) return;

    const question = currentGame.questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct_answer;

    if (isCorrect) {
      setGameSession(prev => ({
        ...prev,
        score: prev.score + 10,
        questionsCorrect: prev.questionsCorrect + 1
      }));
    }

    // Move to next question or finish game
    if (currentQuestion < currentGame.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
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

    try {
      // Save quiz attempt
      const { error } = await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        quiz_id: currentGame.id,
        score: finalSession.score,
        max_score: finalSession.totalQuestions * 10,
        time_taken: timeSpent,
        answers: currentGame.questions.map((q, index) => ({
          question_id: index,
          selected_answer: index <= currentQuestion ? selectedAnswer : null,
          correct: index < currentQuestion ? selectedAnswer === q.correct_answer : false
        }))
      });

      if (error) throw error;

      setGameSession(finalSession);
      setGameComplete(true);
      
      toast({
        title: "Game Complete!",
        description: `You scored ${finalSession.score} points!`
      });
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
    const question = currentGame.questions[currentQuestion];
    
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">{currentGame.title}</h1>
            <Badge variant="secondary">
              Question {currentQuestion + 1} / {currentGame.questions.length}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">{question.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {question.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={selectedAnswer === option ? "default" : "outline"}
                  className="w-full text-left justify-start"
                  onClick={() => setSelectedAnswer(option)}
                >
                  {option}
                </Button>
              ))}
              
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={submitAnswer} 
                  disabled={!selectedAnswer}
                  size="lg"
                >
                  {currentQuestion < currentGame.questions.length - 1 ? 'Next Question' : 'Finish Game'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star size={16} />
              Score: {gameSession.score}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              Time: {gameStartTime ? Math.floor((Date.now() - gameStartTime.getTime()) / 1000) : 0}s
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
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <GamepadIcon className="w-8 h-8 text-primary" />
                    <Badge variant="outline">
                      Level {quiz.difficulty_level}
                    </Badge>
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
                    {quiz.time_limit && (
                      <div className="flex justify-between text-sm">
                        <span>Time Limit:</span>
                        <span>{quiz.time_limit} minutes</span>
                      </div>
                    )}
                    <Button 
                      onClick={() => startGame(quiz)}
                      className="w-full"
                    >
                      Start Game
                    </Button>
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

export default Games;