import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MessageCircle, GamepadIcon, Plus, Trash2, Eye, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useToast } from '@/hooks/use-toast';
import { CSVUploader } from '@/components/CSVUploader';

interface QuestionData {
  question: string;
  question_gujarati?: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

interface DialogueStep {
  speaker: string;
  english: string;
  gujarati: string;
  transliteration?: string;
}

const CreateContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { incrementActivity } = useTimeTracking({ pageName: 'create-content' });
  const [activeTab, setActiveTab] = useState('vocabulary');
  const [loading, setLoading] = useState(false);
  
  // Content management state
  const [existingVocabulary, setExistingVocabulary] = useState([]);
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [existingDialogues, setExistingDialogues] = useState([]);
  const [managementLoading, setManagementLoading] = useState(false);

  // Vocabulary form state
  const [vocabForm, setVocabForm] = useState({
    english_word: '',
    gujarati_word: '',
    gujarati_transliteration: '',
    difficulty_level: 1,
    image_url: '',
    audio_url: ''
  });

  // Quiz form state
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    quiz_type: 'game',
    difficulty_level: 1,
    time_limit: 10,
    questions: [] as QuestionData[]
  });

  // Dialogue form state
  const [dialogueForm, setDialogueForm] = useState({
    title: '',
    description: '',
    scenario: '',
    difficulty_level: 1,
    dialogue_data: [] as DialogueStep[]
  });

  // Load existing content when tab changes
  useEffect(() => {
    if (activeTab === 'manage') {
      loadExistingContent();
    }
  }, [activeTab, user]);

  const loadExistingContent = async () => {
    if (!user) return;
    
    setManagementLoading(true);
    try {
      const [vocabData, quizData, dialogueData] = await Promise.all([
        supabase.from('vocabulary').select('*').eq('created_by', user.id).order('created_at', { ascending: false }),
        supabase.from('quizzes').select('*').eq('created_by', user.id).order('created_at', { ascending: false }),
        supabase.from('dialogues').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
      ]);

      setExistingVocabulary(vocabData.data || []);
      setExistingQuizzes(quizData.data || []);
      setExistingDialogues(dialogueData.data || []);
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: "Error",
        description: "Failed to load existing content",
        variant: "destructive"
      });
    } finally {
      setManagementLoading(false);
    }
  };

  const createVocabulary = async () => {
    if (!user || !vocabForm.english_word || !vocabForm.gujarati_word) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vocabulary')
        .insert({
          ...vocabForm,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vocabulary word created successfully!"
      });

      incrementActivity(); // Track activity completion

      setVocabForm({
        english_word: '',
        gujarati_word: '',
        gujarati_transliteration: '',
        difficulty_level: 1,
        image_url: '',
        audio_url: ''
      });
    } catch (error) {
      console.error('Error creating vocabulary:', error);
      toast({
        title: "Error",
        description: "Failed to create vocabulary word",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    if (!user || !quizForm.title || quizForm.questions.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in required fields and add at least one question",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quizzes')
        .insert({
          title: quizForm.title,
          description: quizForm.description,
          quiz_type: quizForm.quiz_type,
          difficulty_level: quizForm.difficulty_level,
          time_limit: quizForm.time_limit,
          questions: quizForm.questions as any,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz created successfully!"
      });

      incrementActivity(); // Track activity completion

      setQuizForm({
        title: '',
        description: '',
        quiz_type: 'game',
        difficulty_level: 1,
        time_limit: 10,
        questions: []
      });
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: ''
      }]
    }));
  };

  const updateQuestion = (index: number, field: keyof QuestionData, value: any) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Create Learning Content</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vocabulary" className="gap-2">
              <BookOpen size={16} />
              Vocabulary
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-2">
              <GamepadIcon size={16} />
              Quiz/Game
            </TabsTrigger>
            <TabsTrigger value="dialogues" className="gap-2">
              <MessageCircle size={16} />
              Dialogue
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <Eye size={16} />
              Manage Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vocabulary">
            <Card>
              <CardHeader>
                <CardTitle>Add New Vocabulary</CardTitle>
                <CardDescription>Create new vocabulary words for students to learn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CSV Upload for Vocabulary */}
                <CSVUploader 
                  uploadType="vocabulary"
                  title="Upload Vocabulary CSV"
                  description="Upload a CSV file to bulk add vocabulary words"
                  onUploadSuccess={() => {}} 
                />
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="bg-background px-2 text-muted-foreground">Or add manually</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="english">English Word *</Label>
                    <Input
                      id="english"
                      value={vocabForm.english_word}
                      onChange={(e) => setVocabForm(prev => ({ ...prev, english_word: e.target.value }))}
                      placeholder="Enter English word"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gujarati">Gujarati Word *</Label>
                    <Input
                      id="gujarati"
                      value={vocabForm.gujarati_word}
                      onChange={(e) => setVocabForm(prev => ({ ...prev, gujarati_word: e.target.value }))}
                      placeholder="Enter Gujarati word"
                    />
                  </div>
                </div>
                <Button onClick={createVocabulary} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Vocabulary'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GamepadIcon className="h-5 w-5" />
                  Create Quiz
                </CardTitle>
                <CardDescription>Create interactive quizzes with multiple choice questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Upload Section */}
                <CSVUploader 
                  uploadType="quiz"
                  title="Upload Quiz CSV"
                  description="Upload a CSV file to bulk create or update quizzes"
                  onUploadSuccess={loadExistingContent} 
                />
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="bg-background px-2 text-muted-foreground">Or create manually</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiz-title">Title *</Label>
                    <Input
                      id="quiz-title"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter quiz title"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Questions</h3>
                  <Button onClick={addQuestion} variant="outline" size="sm" className="gap-2">
                    <Plus size={16} />
                    Add Question
                  </Button>
                </div>

                {quizForm.questions.map((question, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">Question {index + 1}</Badge>
                        <Button
                          onClick={() => removeQuestion(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Question</Label>
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                          placeholder="Enter your question"
                        />
                      </div>
                    </div>
                  </Card>
                ))}

                <Button onClick={createQuiz} disabled={loading || quizForm.questions.length === 0}>
                  {loading ? 'Creating...' : 'Create Quiz'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dialogues">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Create Dialogue
                </CardTitle>
                <CardDescription>Create conversation practice dialogues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Upload for Dialogues */}
                <CSVUploader 
                  uploadType="dialogue"
                  title="Upload Dialogue CSV"
                  description="Upload a CSV file to bulk create dialogues"
                  onUploadSuccess={loadExistingContent} 
                />
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="bg-background px-2 text-muted-foreground">Or create manually</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dialogue-title">Title *</Label>
                    <Input
                      id="dialogue-title"
                      value={dialogueForm.title}
                      onChange={(e) => setDialogueForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter dialogue title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scenario">Scenario *</Label>
                    <Input
                      id="scenario"
                      value={dialogueForm.scenario}
                      onChange={(e) => setDialogueForm(prev => ({ ...prev, scenario: e.target.value }))}
                      placeholder="e.g., At a restaurant"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dialogue-description">Description</Label>
                  <Textarea
                    id="dialogue-description"
                    value={dialogueForm.description}
                    onChange={(e) => setDialogueForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the dialogue context"
                  />
                </div>

                <Button 
                  onClick={() => {
                    // Create dialogue functionality would go here
                    toast({
                      title: "Feature Coming Soon",
                      description: "Manual dialogue creation will be available soon. Please use CSV upload for now.",
                    });
                  }} 
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Dialogue'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Manage Content</CardTitle>
                <CardDescription>View and manage your created content</CardDescription>
              </CardHeader>
              <CardContent>
                {managementLoading ? (
                  <div className="text-center py-8">Loading content...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Vocabulary Management */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Vocabulary ({existingVocabulary.length})</h3>
                      {existingVocabulary.length > 0 ? (
                        <div className="grid gap-2 max-h-40 overflow-y-auto">
                          {existingVocabulary.slice(0, 5).map((vocab: any) => (
                            <div key={vocab.id} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm">{vocab.english_word} - {vocab.gujarati_word}</span>
                              <Badge variant="outline">Level {vocab.difficulty_level}</Badge>
                            </div>
                          ))}
                          {existingVocabulary.length > 5 && (
                            <p className="text-sm text-muted-foreground">...and {existingVocabulary.length - 5} more</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No vocabulary created yet</p>
                      )}
                    </div>

                    {/* Quiz Management */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Quizzes ({existingQuizzes.length})</h3>
                      {existingQuizzes.length > 0 ? (
                        <div className="grid gap-2 max-h-40 overflow-y-auto">
                          {existingQuizzes.slice(0, 5).map((quiz: any) => (
                            <div key={quiz.id} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm">{quiz.title}</span>
                              <Badge variant="outline">{quiz.questions?.length || 0} questions</Badge>
                            </div>
                          ))}
                          {existingQuizzes.length > 5 && (
                            <p className="text-sm text-muted-foreground">...and {existingQuizzes.length - 5} more</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No quizzes created yet</p>
                      )}
                    </div>

                    {/* Dialogue Management */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Dialogues ({existingDialogues.length})</h3>
                      {existingDialogues.length > 0 ? (
                        <div className="grid gap-2 max-h-40 overflow-y-auto">
                          {existingDialogues.slice(0, 5).map((dialogue: any) => (
                            <div key={dialogue.id} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm">{dialogue.title}</span>
                              <Badge variant="outline">{dialogue.dialogue_data?.length || 0} steps</Badge>
                            </div>
                          ))}
                          {existingDialogues.length > 5 && (
                            <p className="text-sm text-muted-foreground">...and {existingDialogues.length - 5} more</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No dialogues created yet</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreateContent;