import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Check, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Vocabulary {
  id: string;
  english_word: string;
  gujarati_word: string;
  gujarati_transliteration?: string;
  difficulty_level: number;
}

interface Flashcard {
  id: string;
  vocabulary_id: string;
  is_learned: boolean;
  times_reviewed: number;
  vocabulary: Vocabulary;
}

const Flashcards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashcards();
  }, [user]);

  const fetchFlashcards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select(`
          *,
          vocabulary:vocabulary_id (
            id,
            english_word,
            gujarati_word,
            gujarati_transliteration,
            difficulty_level
          )
        `)
        .eq('user_id', user.id)
        .order('created_at');

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFlashcardsFromVocabulary = async () => {
    if (!user) return;

    try {
      const { data: vocabulary, error: vocabError } = await supabase
        .from('vocabulary')
        .select('*')
        .limit(10);

      if (vocabError) throw vocabError;

      const flashcardPromises = vocabulary.map(word => 
        supabase.from('flashcards').insert({
          user_id: user.id,
          vocabulary_id: word.id
        })
      );

      await Promise.all(flashcardPromises);
      toast({
        title: "Success",
        description: "Flashcards created from vocabulary!"
      });
      fetchFlashcards();
    } catch (error) {
      console.error('Error creating flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to create flashcards",
        variant: "destructive"
      });
    }
  };

  const markAnswer = async (correct: boolean) => {
    const currentCard = flashcards[currentIndex];
    if (!currentCard) return;

    try {
      const { error } = await supabase
        .from('flashcards')
        .update({
          times_reviewed: currentCard.times_reviewed + 1,
          is_learned: correct ? true : currentCard.is_learned,
          last_reviewed: new Date().toISOString()
        })
        .eq('id', currentCard.id);

      if (error) throw error;

      // Move to next card
      setShowAnswer(false);
      setCurrentIndex((prev) => 
        prev < flashcards.length - 1 ? prev + 1 : 0
      );

      // Update local state
      setFlashcards(prev => prev.map(card => 
        card.id === currentCard.id 
          ? { ...card, times_reviewed: card.times_reviewed + 1, is_learned: correct || card.is_learned }
          : card
      ));
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading flashcards...</div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-primary">Flashcards</h1>
          <p className="text-muted-foreground">No flashcards available. Create some from vocabulary!</p>
          <Button onClick={createFlashcardsFromVocabulary} className="gap-2">
            <Plus size={16} />
            Create Flashcards
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Flashcards</h1>
          <div className="flex gap-2 items-center">
            <Badge variant="secondary">
              {currentIndex + 1} / {flashcards.length}
            </Badge>
            <Badge variant={currentCard?.is_learned ? "default" : "outline"}>
              {currentCard?.is_learned ? "Learned" : "Learning"}
            </Badge>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              {showAnswer ? "Translation" : "English Word"}
            </CardTitle>
            <CardDescription className="text-center">
              {showAnswer ? "Gujarati" : "What is this in Gujarati?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-4xl font-bold text-primary min-h-[100px] flex items-center justify-center">
              {showAnswer ? (
                <div className="space-y-2">
                  <div>{currentCard?.vocabulary.gujarati_word}</div>
                  {currentCard?.vocabulary.gujarati_transliteration && (
                    <div className="text-2xl text-muted-foreground">
                      ({currentCard.vocabulary.gujarati_transliteration})
                    </div>
                  )}
                </div>
              ) : (
                currentCard?.vocabulary.english_word
              )}
            </div>

            <div className="flex justify-center gap-4">
              {!showAnswer ? (
                <Button onClick={() => setShowAnswer(true)} size="lg">
                  <RotateCcw size={20} className="mr-2" />
                  Show Answer
                </Button>
              ) : (
                <div className="flex gap-4">
                  <Button
                    onClick={() => markAnswer(false)}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <X size={20} />
                    Need Practice
                  </Button>
                  <Button
                    onClick={() => markAnswer(true)}
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

        <div className="text-center">
          <Button variant="outline" onClick={createFlashcardsFromVocabulary} className="gap-2">
            <Plus size={16} />
            Add More Flashcards
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;