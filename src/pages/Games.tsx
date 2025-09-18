import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Gamepad2, Star, Trophy, Clock, CheckCircle, Target, Puzzle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface InteractiveGame {
  id: string;
  title: string;
  description: string;
  game_type: 'match_following' | 'fill_blanks' | 'word_puzzle';
  game_data: any;
  difficulty_level: number;
  time_limit: number;
  max_score: number;
}

interface GameSession {
  score: number;
  timeSpent: number;
  correctAnswers: number;
  totalItems: number;
}

const Games = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { incrementActivity } = useTimeTracking({ pageName: 'games' });
  const [games, setGames] = useState<InteractiveGame[]>([]);
  const [currentGame, setCurrentGame] = useState<InteractiveGame | null>(null);
  const [gameSession, setGameSession] = useState<GameSession>({
    score: 0,
    timeSpent: 0,
    correctAnswers: 0,
    totalItems: 0
  });
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchGames();
  }, [user]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentGame && !gameComplete && !showResults && timeLeft > 0) {
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
  }, [currentGame, gameComplete, showResults, timeLeft]);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('interactive_games')
        .select('*')
        .order('difficulty_level');

      if (error) throw error;
      setGames(data || []);
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

  const startGame = (game: InteractiveGame) => {
    setCurrentGame(game);
    setGameSession({
      score: 0,
      timeSpent: 0,
      correctAnswers: 0,
      totalItems: game.game_data?.items?.length || game.game_data?.blanks?.length || 0
    });
    setGameStartTime(new Date());
    setGameComplete(false);
    setTimeLeft(game.time_limit);
    setUserAnswers({});
    setShowResults(false);
  };

  const handleTimeUp = () => {
    submitGame();
  };

  const submitGame = async () => {
    if (!currentGame || !gameStartTime || !user) return;

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - gameStartTime.getTime()) / 1000);

    let correctCount = 0;
    let totalItems = 0;

    if (currentGame.game_type === 'match_following') {
      totalItems = currentGame.game_data.pairs?.length || 0;
      currentGame.game_data.pairs?.forEach((pair: any, index: number) => {
        if (userAnswers[`pair_${index}`] === pair.gujarati) {
          correctCount++;
        }
      });
    } else if (currentGame.game_type === 'fill_blanks') {
      totalItems = currentGame.game_data.blanks?.length || 0;
      currentGame.game_data.blanks?.forEach((blank: any, index: number) => {
        if (userAnswers[`blank_${index}`]?.toLowerCase().trim() === blank.answer.toLowerCase().trim()) {
          correctCount++;
        }
      });
    }

    const finalScore = Math.round((correctCount / totalItems) * currentGame.max_score);

    const finalSession = {
      score: finalScore,
      timeSpent,
      correctAnswers: correctCount,
      totalItems
    };

    try {
      const { error } = await supabase.from('game_attempts').insert({
        user_id: user.id,
        game_id: currentGame.id,
        score: finalScore,
        max_score: currentGame.max_score,
        time_taken: timeSpent,
        answers: userAnswers
      });

      if (error) throw error;

      // Update user points
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentPoints = profileData?.points || 0;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: currentPoints + finalScore })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      incrementActivity();

      toast({
        title: "Game Complete! 🎉",
        description: `You earned ${finalScore} points!`
      });

      setGameSession(finalSession);
      setShowResults(true);
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

  const renderMatchFollowingGame = () => {
    if (!currentGame?.game_data?.pairs) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Match the Following</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium text-center">English</h4>
            {currentGame.game_data.pairs.map((pair: any, index: number) => (
              <div key={index} className="p-3 bg-muted rounded-lg text-center">
                {pair.english}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-center">Gujarati (Select Match)</h4>
            {currentGame.game_data.pairs.map((pair: any, index: number) => (
              <Button
                key={index}
                variant={userAnswers[`pair_${index}`] === pair.gujarati ? "default" : "outline"}
                className="w-full p-3"
                onClick={() => setUserAnswers(prev => ({ ...prev, [`pair_${index}`]: pair.gujarati }))}
              >
                {pair.gujarati}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFillBlanksGame = () => {
    if (!currentGame?.game_data?.paragraph || !currentGame?.game_data?.blanks) return null;

    const paragraph = currentGame.game_data.paragraph;
    const blanks = currentGame.game_data.blanks;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Fill in the Blanks</h3>
        <div className="text-lg leading-relaxed p-4 bg-muted rounded-lg">
          {paragraph.split('___').map((part: string, index: number) => (
            <span key={index}>
              {part}
              {index < blanks.length && (
                <Input
                  className="inline-block w-32 mx-2"
                  placeholder="?"
                  value={userAnswers[`blank_${index}`] || ''}
                  onChange={(e) => setUserAnswers(prev => ({ 
                    ...prev, 
                    [`blank_${index}`]: e.target.value 
                  }))}
                />
              )}
            </span>
          ))}
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Fill in the blanks with appropriate Gujarati words
        </div>
      </div>
    );
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
                <div className="text-3xl font-bold text-primary">{gameSession.correctAnswers}/{gameSession.totalItems}</div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{Math.floor(gameSession.timeSpent / 60)}:{(gameSession.timeSpent % 60).toString().padStart(2, '0')}</div>
                <div className="text-sm text-muted-foreground">Time Taken</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{Math.round((gameSession.correctAnswers / gameSession.totalItems) * 100)}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => startGame(currentGame)} variant="outline">
                Play Again
              </Button>
              <Button onClick={() => setCurrentGame(null)}>
                Choose New Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentGame) {
    const progress = timeLeft > 0 ? ((currentGame.time_limit - timeLeft) / currentGame.time_limit) * 100 : 100;
    
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">{currentGame.title}</h1>
            <Badge variant="secondary">
              {currentGame.game_type.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Time Progress</span>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span className={timeLeft <= 30 ? "text-red-500 font-bold" : ""}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          <Card>
            <CardContent className="p-6">
              {currentGame.game_type === 'match_following' && renderMatchFollowingGame()}
              {currentGame.game_type === 'fill_blanks' && renderFillBlanksGame()}
              
              <div className="flex justify-center pt-6">
                <Button onClick={submitGame} size="lg" className="w-full max-w-md">
                  Submit Game
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2 text-primary">
              <Target size={16} />
              Max Score: {currentGame.max_score}
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Puzzle size={16} />
              Level: {currentGame.difficulty_level}
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
          <h1 className="text-3xl font-bold text-primary mb-2">Interactive Games</h1>
          <p className="text-muted-foreground">Play engaging games to reinforce your learning!</p>
        </div>

        {games.length === 0 ? (
          <Card className="text-center p-8">
            <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No Games Available</CardTitle>
            <CardDescription>Interactive games will be added by teachers soon!</CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card key={game.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Gamepad2 className="w-8 h-8 text-primary" />
                    <Badge variant="outline">
                      Level {game.difficulty_level}
                    </Badge>
                  </div>
                  <CardTitle>{game.title}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Game Type:</span>
                      <span className="capitalize">{game.game_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Time Limit:</span>
                      <span>{Math.floor(game.time_limit / 60)}:{(game.time_limit % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Max Score:</span>
                      <span>{game.max_score} points</span>
                    </div>
                    <Button 
                      onClick={() => startGame(game)}
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