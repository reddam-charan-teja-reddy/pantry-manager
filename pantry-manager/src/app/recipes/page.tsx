'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/Applayout/AppLayout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPantryItems } from '@/store/pantrySlice';
import { setRecipes } from '@/store/recipesSlice';
import { PantryItem, Recipe } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChefHat,
  Clock,
  Users,
  Search,
  MessageCircle,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Heart,
  BookOpen,
} from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { se } from 'date-fns/locale';



interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function RecipesPage() {
  const dispatch = useAppDispatch();
  const { items: pantryItems, loading: pantryLoading } = useAppSelector(
    (state) => state.pantry
  );
  const recipes = useAppSelector((state) => state.recipes);
  const { authState, userDetails } = useAppSelector((state) => state.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm your cooking assistant. I can help you find recipes based on what's in your pantry, suggest meal ideas, or answer any cooking questions you have!",
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [favoriteRecipes, setFavoriteRecipes] = useState<string[]>([]);

  // Load pantry items and generate recipe suggestions
  useEffect(() => {
    if (authState && userDetails.uid && pantryItems.length === 0) {
      dispatch(fetchPantryItems(userDetails.uid));
    }
  }, [authState, userDetails.uid, dispatch, pantryItems.length]);

  useEffect(() => {
    if (pantryItems.length > 0) {
      generateRecipeSuggestions();
    }
  }, [pantryItems]);

  const generateRecipeSuggestions = async () => {
    setLoadingRecipes(true);
    try {
        const res = await fetch('/api/recipe-suggestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pantryItems: pantryItems.map((item) => item.name) }),
          });
          const data = await res.json();
          console.log(data.recipes);
          setSuggestedRecipes(data.recipes);
          dispatch(setRecipes(data.recipes));
    } catch (error) {
      toast.error('Failed to generate recipe suggestions');
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setNewMessage('');
    setChatLoading(true);

    try{
        const response = await fetch('/api/recipes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userMessage: newMessage,
                pantryItems:pantryItems.map((item) => item.name) }),
        });


        const data = await response.json();

        console.log(data);

        const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.reply || 'Sorry, I cannot generate a response. Please try again.',
            timestamp: new Date(),
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
    }
    catch (error){
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
    }
    finally{
        setChatLoading(false);
    }
  };

  


  const toggleFavorite = (recipeId: string) => {
    setFavoriteRecipes((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const filteredRecipes = suggestedRecipes.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'favorites' && favoriteRecipes.includes(recipe.id)) ||
      (selectedCategory === 'available' && recipe.inPantry.length > 0);
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All Recipes', count: suggestedRecipes.length },
    { id: 'available', label: 'Can Make Now', count: suggestedRecipes.filter(r => r.inPantry.length > 0 || 0).length },
    { id: 'favorites', label: 'Favorites', count: favoriteRecipes.length },
  ];

  return (
    <AppLayout pageTitle="Recipes">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              Recipe Suggestions
            </h1>
            <p className="text-muted-foreground">
              Discover recipes based on your pantry items
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generateRecipeSuggestions}
              disabled={loadingRecipes}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingRecipes ? 'animate-spin' : ''}`} />
              Refresh Suggestions
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Cooking Assistant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Cooking Assistant
                  </DialogTitle>
                  <DialogDescription>
                    Ask me anything about recipes, cooking tips, or meal planning!
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col h-[500px]">
                  <ScrollArea className="flex-1 p-4 border rounded-lg">
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`flex gap-2 max-w-[80%] ${
                              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {message.role === 'user' ? (
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary-foreground" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                                  <Bot className="h-4 w-4 text-secondary-foreground" />
                                </div>
                              )}
                            </div>
                            <div
                              className={`rounded-lg p-3 ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-secondary-foreground'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                              <Bot className="h-4 w-4 text-secondary-foreground" />
                            </div>
                            <div className="bg-secondary rounded-lg p-3">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 mt-4">
                    <Textarea
                      placeholder="Ask me about recipes, cooking tips, or meal planning..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[60px]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || chatLoading}
                      size="icon"
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pantry Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your Pantry Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pantryLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading pantry items...</span>
              </div>
            ) : pantryItems.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You have {pantryItems.length} items in your pantry
                </p>
                <div className="flex flex-wrap gap-2">
                  {pantryItems.slice(0, 8).map((item) => (
                    <Badge key={item.id} variant="secondary">
                      {item.name} ({item.quantity} {item.unit})
                    </Badge>
                  ))}
                  {pantryItems.length > 8 && (
                    <Badge variant="outline">+{pantryItems.length - 8} more</Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No pantry items found. Add some items to get personalized recipe suggestions!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.label} ({category.count})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Recipe Grid */}
        {loadingRecipes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <Image
                    src={recipe.imageUrl || '/sample_img.avif'}
                    alt={recipe.title}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => toggleFavorite(recipe.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favoriteRecipes.includes(recipe.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-600'
                      }`}
                    />
                  </Button>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{recipe.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {recipe.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>30 min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>2-4 servings</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {recipe.inPantry.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">
                          ✓ You have: {recipe.inPantry.length} ingredients
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.inPantry.slice(0, 3).map((ingredient) => (
                            <Badge key={ingredient} variant="secondary" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                          {recipe.inPantry.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{recipe.inPantry.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {recipe.missing.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-orange-600 mb-1">
                          Need to buy: {recipe.missing.length} ingredients
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.missing.slice(0, 3).map((ingredient) => (
                            <Badge key={ingredient} variant="outline" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                          {recipe.missing.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{recipe.missing.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    View Recipe
                  </Button>
                  <Button variant="outline" size="sm">
                    Add to List
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? `No recipes match "${searchTerm}"`
                  : 'Add some items to your pantry to get personalized recipe suggestions!'}
              </p>
              <Button onClick={generateRecipeSuggestions} disabled={loadingRecipes}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New Suggestions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}