import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Play, Mic, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DialogueEntry {
  speaker: string;
  english: string;
  gujarati: string;
  transliteration?: string;
}

interface Dialogue {
  id: string;
  title: string;
  description: string;
  scenario: string;
  difficulty_level: number;
  dialogue_data: DialogueEntry[];
}

interface PracticeSession {
  id: string;
  dialogue_id: string;
  user_id: string;
  score?: number;
  feedback?: any;
  completed_at?: string;
}

const Practice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [selectedDialogue, setSelectedDialogue] = useState<Dialogue | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [practiceMode, setPracticeMode] = useState<'read' | 'speak' | 'write'>('read');
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDialogues();
  }, []);

  const fetchDialogues = async () => {
    try {
      const { data, error } = await supabase
        .from('dialogues')
        .select('*')
        .order('difficulty_level');

      if (error) throw error;
      setDialogues((data || []).map((d: any) => {
        let parsed: DialogueEntry[] = [];
        if (Array.isArray(d.dialogue_data)) {
          parsed = (d.dialogue_data as any[]).map((item: any) => ({
            speaker: String(item?.speaker ?? ''),
            english: String(item?.english ?? ''),
            gujarati: String(item?.gujarati ?? ''),
            transliteration: item?.transliteration ? String(item.transliteration) : undefined,
          }));
        } else if (typeof d.dialogue_data === 'string') {
          try {
            const arr = JSON.parse(d.dialogue_data);
            if (Array.isArray(arr)) {
              parsed = arr.map((item: any) => ({
                speaker: String(item?.speaker ?? ''),
                english: String(item?.english ?? ''),
                gujarati: String(item?.gujarati ?? ''),
                transliteration: item?.transliteration ? String(item.transliteration) : undefined,
              }));
            }
          } catch (e) {
            parsed = [];
          }
        }
        return {
          id: d.id,
          title: d.title ?? '',
          description: d.description ?? '',
          scenario: d.scenario ?? '',
          difficulty_level: d.difficulty_level ?? 1,
          dialogue_data: parsed,
        } as Dialogue;
      }));
    } catch (error) {
      console.error('Error fetching dialogues:', error);
      toast({
        title: "Error",
        description: "Failed to load practice dialogues",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startPractice = (dialogue: Dialogue) => {
    setSelectedDialogue(dialogue);
    setCurrentStep(0);
    setUserResponse('');
    setShowTranslation(false);
  };

  const nextStep = () => {
    if (selectedDialogue && currentStep < selectedDialogue.dialogue_data.length - 1) {
      setCurrentStep(prev => prev + 1);
      setUserResponse('');
      setShowTranslation(false);
    } else {
      completePractice();
    }
  };

  const completePractice = async () => {
    if (!selectedDialogue || !user) return;

    try {
      const { error } = await supabase.from('practice_sessions').insert({
        user_id: user.id,
        dialogue_id: selectedDialogue.id,
        score: 80, // Basic scoring for now
        feedback: {
          mode: practiceMode,
          completed_steps: currentStep + 1,
          total_steps: selectedDialogue.dialogue_data.length
        }
      });

      if (error) throw error;

      toast({
        title: "Practice Complete!",
        description: "Great job practicing the dialogue!"
      });

      setSelectedDialogue(null);
    } catch (error) {
      console.error('Error saving practice session:', error);
      toast({
        title: "Error",
        description: "Failed to save practice session",
        variant: "destructive"
      });
    }
  };

  const playAudio = (text: string) => {
    // Basic text-to-speech (will work in browsers that support it)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'gu-IN'; // Gujarati language code
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Audio Not Available",
        description: "Text-to-speech is not supported in this browser",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading practice dialogues...</div>
      </div>
    );
  }

  if (selectedDialogue) {
    const currentEntry = selectedDialogue.dialogue_data[currentStep];
    
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">{selectedDialogue.title}</h1>
            <Badge variant="secondary">
              Step {currentStep + 1} / {selectedDialogue.dialogue_data.length}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Practice Mode</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={practiceMode === 'read' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPracticeMode('read')}
                  >
                    Read
                  </Button>
                  <Button
                    variant={practiceMode === 'speak' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPracticeMode('speak')}
                  >
                    Speak
                  </Button>
                  <Button
                    variant={practiceMode === 'write' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPracticeMode('write')}
                  >
                    Write
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold">
                  Speaker: {currentEntry.speaker}
                </div>
                
                <div className="space-y-3">
                  <div className="text-xl font-bold text-primary">
                    {currentEntry.english}
                  </div>
                  
                  {showTranslation && (
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-secondary">
                        {currentEntry.gujarati}
                      </div>
                      {currentEntry.transliteration && (
                        <div className="text-lg text-muted-foreground">
                          ({currentEntry.transliteration})
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTranslation(!showTranslation)}
                  >
                    {showTranslation ? 'Hide' : 'Show'} Translation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playAudio(currentEntry.gujarati)}
                    className="gap-2"
                  >
                    <Volume2 size={16} />
                    Play Audio
                  </Button>
                </div>
              </div>

              {practiceMode === 'write' && (
                <div className="space-y-4">
                  <label className="text-sm font-medium">
                    Try writing the Gujarati translation:
                  </label>
                  <Textarea
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder="Type your response in Gujarati..."
                    className="min-h-[100px]"
                  />
                </div>
              )}

              {practiceMode === 'speak' && (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Practice speaking the Gujarati phrase out loud
                  </p>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Mic size={20} />
                    Start Recording (Coming Soon)
                  </Button>
                </div>
              )}

              <div className="flex justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDialogue(null)}
                >
                  Exit Practice
                </Button>
                <Button onClick={nextStep} size="lg">
                  {currentStep < selectedDialogue.dialogue_data.length - 1 ? 'Next' : 'Complete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Conversation Practice</h1>
          <p className="text-muted-foreground">Practice real-world Gujarati conversations</p>
        </div>

        {dialogues.length === 0 ? (
          <Card className="text-center p-8">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No Practice Dialogues Available</CardTitle>
            <CardDescription>Practice dialogues will be added by teachers soon!</CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dialogues.map((dialogue) => (
              <Card key={dialogue.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <MessageCircle className="w-8 h-8 text-primary" />
                    <Badge variant="outline">
                      Level {dialogue.difficulty_level}
                    </Badge>
                  </div>
                  <CardTitle>{dialogue.title}</CardTitle>
                  <CardDescription>{dialogue.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <strong>Scenario:</strong> {dialogue.scenario}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Steps:</span>
                      <span>{dialogue.dialogue_data.length}</span>
                    </div>
                    <Button 
                      onClick={() => startPractice(dialogue)}
                      className="w-full gap-2"
                    >
                      <Play size={16} />
                      Start Practice
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

export default Practice;