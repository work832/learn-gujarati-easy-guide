import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, Check, X, Plus, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WordBankItem {
  id: string;
  word_type: 'synonym' | 'antonym' | 'idiom';
  gujarati_word: string;
  english_word: string;
  gujarati_meaning?: string;
  english_meaning?: string;
  example_sentence_gujarati?: string;
  example_sentence_english?: string;
  difficulty_level: number;
}

interface LearningProgress {
  id: string;
  content_id: string;
  is_learned: boolean;
  times_reviewed: number;
}

const WordBank = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wordBankItems, setWordBankItems] = useState<WordBankItem[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'synonym' | 'antonym' | 'idiom'>('synonym');

  useEffect(() => {
    fetchWordBankItems();
    if (user) {
      fetchLearningProgress();
    }
  }, [user, activeTab]);

  const fetchWordBankItems = async () => {
    try {
      const { data, error } = await supabase
        .from('word_bank')
        .select('*')
        .eq('word_type', activeTab)
        .order('difficulty_level', { ascending: true });

      if (error) throw error;
      setWordBankItems(data || []);
    } catch (error) {
      console.error('Error fetching word bank items:', error);
      toast({
        title: "Error",
        description: "Failed to load word bank items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_type', 'word_bank');

      if (error) throw error;
      setLearningProgress(data || []);
    } catch (error) {
      console.error('Error fetching learning progress:', error);
    }
  };

  const markWordLearned = async (learned: boolean) => {
    if (!user || wordBankItems.length === 0) return;

    const currentItem = wordBankItems[currentIndex];
    const existingProgress = learningProgress.find(p => p.content_id === currentItem.id);

    try {
      if (existingProgress) {
        const { error } = await supabase
          .from('learning_progress')
          .update({
            is_learned: learned,
            times_reviewed: existingProgress.times_reviewed + 1,
            last_reviewed: new Date().toISOString(),
            learned_at: learned ? new Date().toISOString() : null
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('learning_progress')
          .insert({
            user_id: user.id,
            content_type: 'word_bank',
            content_id: currentItem.id,
            is_learned: learned,
            times_reviewed: 1,
            last_reviewed: new Date().toISOString(),
            learned_at: learned ? new Date().toISOString() : null
          });

        if (error) throw error;
      }

      // Move to next item
      setShowAnswer(false);
      setCurrentIndex((prev) => 
        prev < wordBankItems.length - 1 ? prev + 1 : 0
      );

      // Refresh progress
      fetchLearningProgress();

      toast({
        title: learned ? "Word Learned! 🎉" : "Keep Practicing",
        description: learned ? "+5 points earned" : "Try again later",
      });

    } catch (error) {
      console.error('Error updating learning progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const getWordTypeTitle = (type: string) => {
    switch (type) {
      case 'synonym': return 'પર્યાયવાચી (Synonyms)';
      case 'antonym': return 'વિલોમ (Antonyms)';
      case 'idiom': return 'મહાવરો (Idioms)';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading word bank...</div>
      </div>
    );
  }

  if (wordBankItems.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-primary">Word Bank</h1>
          <p className="text-muted-foreground">No {getWordTypeTitle(activeTab).toLowerCase()} available yet!</p>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="synonym">પર્યાયવાચી</TabsTrigger>
              <TabsTrigger value="antonym">વિલોમ</TabsTrigger>
              <TabsTrigger value="idiom">મહાવરો</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    );
  }

  const currentItem = wordBankItems[currentIndex];
  const currentProgress = learningProgress.find(p => p.content_id === currentItem?.id);

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Word Bank</h1>
          <div className="flex gap-2 items-center">
            <Badge variant="secondary">
              {currentIndex + 1} / {wordBankItems.length}
            </Badge>
            <Badge variant={currentProgress?.is_learned ? "default" : "outline"}>
              {currentProgress?.is_learned ? "Learned" : "Learning"}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="synonym">પર્યાયવાચી (Synonyms)</TabsTrigger>
            <TabsTrigger value="antonym">વિલોમ (Antonyms)</TabsTrigger>
            <TabsTrigger value="idiom">મહાવરો (Idioms)</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">
                  {showAnswer ? "Meaning & Translation" : getWordTypeTitle(activeTab)}
                </CardTitle>
                <CardDescription className="text-center">
                  {showAnswer ? "Learn the meaning" : `What does this ${activeTab} mean?`}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="text-4xl font-bold text-primary min-h-[100px] flex items-center justify-center">
                  {showAnswer ? (
                    <div className="space-y-4">
                      <div className="text-2xl text-secondary">
                        {currentItem?.gujarati_meaning || currentItem?.english_meaning}
                      </div>
                      {currentItem?.example_sentence_gujarati && (
                        <div className="text-lg text-muted-foreground border-l-4 border-primary pl-4">
                          <div className="font-semibold">{currentItem.example_sentence_gujarati}</div>
                          {currentItem.example_sentence_english && (
                            <div className="text-sm italic">{currentItem.example_sentence_english}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>{currentItem?.gujarati_word}</div>
                      <div className="text-2xl text-muted-foreground">
                        ({currentItem?.english_word})
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-4">
                  {!showAnswer ? (
                    <Button onClick={() => setShowAnswer(true)} size="lg">
                      <RotateCcw size={20} className="mr-2" />
                      Show Meaning
                    </Button>
                  ) : (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => markWordLearned(false)}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                      >
                        <X size={20} />
                        Need Practice
                      </Button>
                      <Button
                        onClick={() => markWordLearned(true)}
                        size="lg"
                        className="gap-2"
                      >
                        <Check size={20} />
                        Got It!
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WordBank;