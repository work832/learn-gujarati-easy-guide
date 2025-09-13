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
import { useToast } from '@/hooks/use-toast';

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

  const deleteVocabulary = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vocabulary deleted successfully!"
      });
      loadExistingContent();
    } catch (error) {
      console.error('Error deleting vocabulary:', error);
      toast({
        title: "Error",
        description: "Failed to delete vocabulary",
        variant: "destructive"
      });
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz deleted successfully!"
      });
      loadExistingContent();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive"
      });
    }
  };

  const deleteDialogue = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dialogues')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Dialogue deleted successfully!"
      });
      loadExistingContent();
    } catch (error) {
      console.error('Error deleting dialogue:', error);
      toast({
        title: "Error",
        description: "Failed to delete dialogue",
        variant: "destructive"
      });
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

  const parseCSVAndCreateQuizzes = async (csvText: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      
      // Group questions by quiz type
      const quizGroups: Record<string, any[]> = {};
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const title = values[0]?.trim();
        const questionGujarati = values[3]?.trim();
        const questionEnglish = values[4]?.trim();
        const options = [values[5]?.trim(), values[6]?.trim(), values[7]?.trim(), values[8]?.trim()];
        const correctAnswer = values[9]?.trim();
        
        if (!title || !questionGujarati || !questionEnglish) continue;
        
        if (!quizGroups[title]) {
          quizGroups[title] = [];
        }
        
        quizGroups[title].push({
          question: questionEnglish,
          question_gujarati: questionGujarati,
          options: options.filter(opt => opt && opt.length > 0),
          correct_answer: correctAnswer,
          explanation: ''
        });
      }
      
      // Create quizzes for each group
      let createdCount = 0;
      for (const [title, questions] of Object.entries(quizGroups)) {
        const { error } = await supabase
          .from('quizzes')
          .insert({
            title,
            description: `Imported ${title} - Bilingual Gujarati quiz with English and Gujarati questions`,
            quiz_type: 'game',
            difficulty_level: 2,
            time_limit: 15,
            questions: questions as any,
            created_by: user.id
          });
          
        if (!error) {
          createdCount++;
        }
      }
      
      toast({
        title: "Success",
        description: `${createdCount} quizzes created successfully from CSV!`
      });
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Error", 
        description: "Failed to parse CSV file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async () => {
    try {
      const response = await fetch('/src/assets/gujarati_quiz_55.csv');
      const csvText = await response.text();
      await parseCSVAndCreateQuizzes(csvText);
    } catch (error) {
      console.error('Error loading CSV:', error);
      toast({
        title: "Error",
        description: "Failed to load CSV file",
        variant: "destructive"
      });
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

  const addDialogueStep = () => {
    setDialogueForm(prev => ({
      ...prev,
      dialogue_data: [...prev.dialogue_data, {
        speaker: '',
        english: '',
        gujarati: '',
        transliteration: ''
      }]
    }));
  };

  const updateDialogueStep = (index: number, field: keyof DialogueStep, value: string) => {
    setDialogueForm(prev => ({
      ...prev,
      dialogue_data: prev.dialogue_data.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeDialogueStep = (index: number) => {
    setDialogueForm(prev => ({
      ...prev,
      dialogue_data: prev.dialogue_data.filter((_, i) => i !== index)
    }));
  };

  const createDialogue = async () => {
    if (!user || !dialogueForm.title || dialogueForm.dialogue_data.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in required fields and add at least one dialogue step",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('dialogues')
        .insert({
          title: dialogueForm.title,
          description: dialogueForm.description,
          scenario: dialogueForm.scenario,
          difficulty_level: dialogueForm.difficulty_level,
          dialogue_data: dialogueForm.dialogue_data as any,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Practice dialogue created successfully!"
      });

      setDialogueForm({
        title: '',
        description: '',
        scenario: '',
        difficulty_level: 1,
        dialogue_data: []
      });
    } catch (error) {
      console.error('Error creating dialogue:', error);
      toast({
        title: "Error",
        description: "Failed to create practice dialogue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Create Content</h1>
          <p className="text-muted-foreground">Create vocabulary, quizzes, and practice dialogues for students</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  <div>
                    <Label htmlFor="transliteration">Transliteration</Label>
                    <Input
                      id="transliteration"
                      value={vocabForm.gujarati_transliteration}
                      onChange={(e) => setVocabForm(prev => ({ ...prev, gujarati_transliteration: e.target.value }))}
                      placeholder="Enter transliteration"
                    />
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={vocabForm.difficulty_level.toString()}
                      onValueChange={(value) => setVocabForm(prev => ({ ...prev, difficulty_level: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Beginner</SelectItem>
                        <SelectItem value="2">Intermediate</SelectItem>
                        <SelectItem value="3">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
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
                <CardTitle>Create Quiz/Game</CardTitle>
                <CardDescription>Create interactive quizzes and games for students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/50">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Import Gujarati Quiz CSV</h3>
                  <p className="text-muted-foreground mb-4">
                    Import the pre-made Gujarati quiz with bilingual questions (English + ગુજરાતી)
                  </p>
                  <Button onClick={handleCSVImport} disabled={loading} variant="outline">
                    {loading ? 'Importing...' : 'Import Gujarati Quiz CSV'}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or create manually</span>
                  </div>
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
                  <div>
                    <Label htmlFor="quiz-type">Type</Label>
                    <Select
                      value={quizForm.quiz_type}
                      onValueChange={(value) => setQuizForm(prev => ({ ...prev, quiz_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="game">Game</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="quiz-description">Description</Label>
                  <Textarea
                    id="quiz-description"
                    value={quizForm.description}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter quiz description"
                  />
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
                      
                      <div className="grid grid-cols-2 gap-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex}>
                            <Label>Option {optIndex + 1}</Label>
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options];
                                newOptions[optIndex] = e.target.value;
                                updateQuestion(index, 'options', newOptions);
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <Label>Correct Answer</Label>
                        <Select
                          value={question.correct_answer}
                          onValueChange={(value) => updateQuestion(index, 'correct_answer', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                        <SelectContent>
                          {question.options
                            .map((option, originalIndex) => ({ option, originalIndex }))
                            .filter(({ option }) => option.trim() !== '')
                            .map(({ option, originalIndex }) => (
                              <SelectItem key={originalIndex} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
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
                <CardTitle>Create Practice Dialogue</CardTitle>
                <CardDescription>Create conversation scenarios for students to practice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      placeholder="e.g., At the market, Greeting friends"
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

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Dialogue Steps</h3>
                  <Button onClick={addDialogueStep} variant="outline" size="sm" className="gap-2">
                    <Plus size={16} />
                    Add Step
                  </Button>
                </div>

                {dialogueForm.dialogue_data.map((step, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">Step {index + 1}</Badge>
                        <Button
                          onClick={() => removeDialogueStep(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Speaker</Label>
                          <Input
                            value={step.speaker}
                            onChange={(e) => updateDialogueStep(index, 'speaker', e.target.value)}
                            placeholder="e.g., Person A, Shopkeeper"
                          />
                        </div>
                        <div>
                          <Label>English</Label>
                          <Input
                            value={step.english}
                            onChange={(e) => updateDialogueStep(index, 'english', e.target.value)}
                            placeholder="English text"
                          />
                        </div>
                        <div>
                          <Label>Gujarati</Label>
                          <Input
                            value={step.gujarati}
                            onChange={(e) => updateDialogueStep(index, 'gujarati', e.target.value)}
                            placeholder="Gujarati text"
                          />
                        </div>
                        <div>
                          <Label>Transliteration</Label>
                          <Input
                            value={step.transliteration}
                            onChange={(e) => updateDialogueStep(index, 'transliteration', e.target.value)}
                            placeholder="Pronunciation guide"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button onClick={createDialogue} disabled={loading || dialogueForm.dialogue_data.length === 0}>
                  {loading ? 'Creating...' : 'Create Dialogue'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <div className="space-y-6">
              {managementLoading ? (
                <div className="text-center py-8">Loading existing content...</div>
              ) : (
                <>
                  {/* Vocabulary Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Your Vocabulary ({existingVocabulary.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {existingVocabulary.length > 0 ? (
                        <div className="grid gap-4">
                          {existingVocabulary.map((vocab: any) => (
                            <div key={vocab.id} className="flex justify-between items-center p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{vocab.english_word} - {vocab.gujarati_word}</p>
                                <p className="text-sm text-muted-foreground">
                                  Level {vocab.difficulty_level} • Created: {new Date(vocab.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteVocabulary(vocab.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No vocabulary created yet</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quiz Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GamepadIcon className="h-5 w-5" />
                        Your Quizzes ({existingQuizzes.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {existingQuizzes.length > 0 ? (
                        <div className="grid gap-4">
                          {existingQuizzes.map((quiz: any) => (
                            <div key={quiz.id} className="flex justify-between items-center p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{quiz.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {quiz.quiz_type} • {Array.isArray(quiz.questions) ? quiz.questions.length : 0} questions • Created: {new Date(quiz.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteQuiz(quiz.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No quizzes created yet</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Dialogue Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Your Dialogues ({existingDialogues.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {existingDialogues.length > 0 ? (
                        <div className="grid gap-4">
                          {existingDialogues.map((dialogue: any) => (
                            <div key={dialogue.id} className="flex justify-between items-center p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{dialogue.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {dialogue.scenario} • {Array.isArray(dialogue.dialogue_data) ? dialogue.dialogue_data.length : 0} steps • Created: {new Date(dialogue.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteDialogue(dialogue.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No dialogues created yet</p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreateContent;