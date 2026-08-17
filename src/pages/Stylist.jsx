import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wand2, Send, Loader2, Sparkles, User, Shuffle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function Stylist() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello darling! ✨ I'm your personal AI fashion stylist with access to the latest trends and runway insights. I've reviewed your entire wardrobe and I'm here to create complete, head-to-toe looks using ONLY the items you own. I stay current with fashion trends from around the world and can style you for any occasion. What can I create for you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();

  const { data: items } = useQuery({
    queryKey: ['closetItems'],
    queryFn: () => base44.entities.ClosetItem.list(),
    initialData: [],
  });

  const createOutfitMutation = useMutation({
    mutationFn: (data) => base44.entities.Outfit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    if (!requireAuth()) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Prepare closet context
      const closetContext = items.map((item, index) => ({
        id: item.id,
        index: index + 1,
        name: item.name,
        category: item.category,
        color: item.color,
        brand: item.brand,
        season: item.season,
        photo_url: item.photo_url
      }));

      // Get conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => 
        `${msg.role === 'user' ? 'Client' : 'Stylist'}: ${msg.content}`
      ).join('\n\n');

      const systemPrompt = `You are an elite, world-class fashion stylist with real-time access to current fashion trends, runway shows, and style influencers. You have impeccable taste, deep knowledge of haute couture, designer fashion, and what's trending RIGHT NOW in the fashion world.

CLIENT'S COMPLETE WARDROBE (THESE ARE THE ONLY ITEMS YOU CAN USE):
${JSON.stringify(closetContext, null, 2)}

CONVERSATION HISTORY:
${conversationHistory}

CLIENT'S NEW MESSAGE: ${inputMessage}

CRITICAL RULES:
1. You can ONLY suggest items that are in the client's wardrobe above - NEVER suggest items they don't own
2. When suggesting outfits, ALWAYS include:
   - Main clothing pieces (tops, bottoms, dresses, or outerwear)
   - Shoes (if available in their closet)
   - Accessories (if available in their closet)
3. Create COMPLETE outfits - head to toe
4. Use current fashion trends and styling techniques
5. Reference specific items by their exact NAME from the client's closet
6. Explain your styling choices using current fashion terminology and trends

Your responsibilities:
- Provide expert fashion advice informed by current trends
- Suggest complete outfit combinations from their existing wardrobe
- Explain why certain pieces work together (colors, proportions, occasion, current trends)
- Be encouraging and boost their confidence
- Use fashion terminology appropriately but remain approachable
- Consider seasonality, color coordination, and occasion
- Stay current with fashion trends and incorporate them into your suggestions

Respond naturally as a friendly, knowledgeable stylist who's always in touch with what's happening in the fashion world right now.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: systemPrompt,
        add_context_from_internet: true, // Enable web search for current fashion trends
        response_json_schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Your response to the client"
            },
            suggested_outfit: {
              type: "object",
              description: "Optional outfit suggestion if relevant - must use ONLY items from client's closet",
              properties: {
                name: { type: "string" },
                item_ids: {
                  type: "array",
                  items: { type: "string" }
                },
                styling_notes: { type: "string" }
              }
            }
          },
          required: ["message"]
        }
      });

      const assistantMessage = {
        role: "assistant",
        content: aiResponse.message,
        outfit: aiResponse.suggested_outfit,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        role: "assistant",
        content: "I apologize, darling! I'm having a moment. Please try asking me again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleSaveOutfit = async (outfit) => {
    if (!requireAuth()) return;
    if (!outfit || !outfit.item_ids || outfit.item_ids.length === 0) return;
    
    // Validate that items exist
    const validItemIds = outfit.item_ids.filter(id => 
      items.some(item => item.id === id)
    );

    if (validItemIds.length === 0) return;

    try {
      await createOutfitMutation.mutateAsync({
        name: outfit.name,
        items: validItemIds,
        notes: outfit.styling_notes,
        occasion: "AI Stylist Suggestion"
      });
      
      // Add confirmation message
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Perfect! I've saved that outfit to your collection. You can find it in your Outfits page whenever you need it. 💕",
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Error saving outfit:", error);
    }
  };

  const handleShuffle = async () => {
    if (isTyping || isShuffling || items.length < 3) return;
    if (!requireAuth()) return;
    setIsShuffling(true);

    // Pick a random balanced subset: 1 top, 1 bottom (or dress), optionally shoes + accessory
    const categories = { tops: [], bottoms: [], dresses: [], shoes: [], accessories: [], outerwear: [] };
    items.forEach(item => { if (categories[item.category]) categories[item.category].push(item); });
    const pick = (arr) => arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

    const useDress = categories.dresses.length > 0 && Math.random() > 0.5;
    const selected = [];
    if (useDress) {
      selected.push(pick(categories.dresses));
    } else {
      const top = pick(categories.tops);
      const bottom = pick(categories.bottoms);
      if (top) selected.push(top);
      if (bottom) selected.push(bottom);
    }
    const shoe = pick(categories.shoes);
    const accessory = pick(categories.accessories);
    if (shoe) selected.push(shoe);
    if (accessory) selected.push(accessory);

    const selectedContext = selected.filter(Boolean).map(i => ({
      id: i.id, name: i.name, category: i.category, color: i.color, brand: i.brand
    }));

    const shuffleMessage = { role: "user", content: "🔀 Shuffle — surprise me with a curated outfit!", timestamp: new Date() };
    setMessages(prev => [...prev, shuffleMessage]);

    try {
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a world-class fashion stylist. A client wants a surprise outfit using ONLY these specific pieces:
${JSON.stringify(selectedContext, null, 2)}

Evaluate whether these pieces work well together (colors, style, occasion). If they clash, adjust by swapping in the most harmonious available piece from the full closet below ONLY if you must:
Full closet: ${JSON.stringify(items.map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color })), null, 2)}

Create one cohesive, stylish outfit. Explain WHY these pieces work together — colors, vibe, occasion. Be enthusiastic and concise.`,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            suggested_outfit: {
              type: "object",
              properties: {
                name: { type: "string" },
                item_ids: { type: "array", items: { type: "string" } },
                styling_notes: { type: "string" }
              }
            }
          },
          required: ["message"]
        }
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        content: aiResponse.message,
        outfit: aiResponse.suggested_outfit,
        timestamp: new Date()
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Oops, my shuffle hit a snag! Try again, darling.", timestamp: new Date() }]);
    }
    setIsShuffling(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-purple-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-purple-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-900 to-purple-300 rounded-2xl flex items-center justify-center shadow-lg">
            <Wand2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-300 bg-clip-text text-transparent">
              Your AI Fashion Stylist
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Expert styling advice from your personal fashion consultant
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-10 h-10 border-2 border-purple-400">
                    <AvatarFallback className="bg-gradient-to-br from-purple-900 to-purple-300">
                      <Wand2 className="w-5 h-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`flex flex-col gap-2 max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <Card className={`p-4 shadow-md ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-purple-900 to-purple-300 text-white' 
                      : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-purple-200 dark:border-slate-800'
                  }`}>
                    <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </Card>

                  {/* Outfit Suggestion Card */}
                  {message.outfit && message.outfit.item_ids && message.outfit.item_ids.length > 0 && (
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-lg max-w-full">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-lg text-slate-800">
                          {message.outfit.name}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {message.outfit.item_ids.slice(0, 6).map((itemId) => {
                          const item = items.find(i => i.id === itemId);
                          if (!item) return null;
                          return (
                            <div key={itemId} className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-purple-300">
                              <img
                                src={item.photo_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                                <p className="text-white text-xs font-medium truncate">
                                  {item.name}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {message.outfit.styling_notes && (
                        <p className="text-sm text-slate-700 mb-3 italic">
                          "{message.outfit.styling_notes}"
                        </p>
                      )}

                      <Button
                        onClick={() => handleSaveOutfit(message.outfit)}
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Save to My Outfits
                      </Button>
                    </Card>
                  )}

                  <span className="text-xs text-slate-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {message.role === 'user' && (
                  <Avatar className="w-10 h-10 border-2 border-purple-400">
                    <AvatarFallback className="bg-gradient-to-br from-purple-900 to-purple-300">
                      <User className="w-5 h-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <Avatar className="w-10 h-10 border-2 border-purple-400">
                <AvatarFallback className="bg-gradient-to-br from-purple-900 to-purple-300">
                  <Wand2 className="w-5 h-5 text-white" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-purple-200 dark:border-slate-800">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-purple-200 dark:border-slate-800 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Button
              onClick={handleShuffle}
              disabled={isTyping || isShuffling || items.length < 3}
              title="Shuffle — get a surprise outfit"
              className="h-12 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl text-white shrink-0"
            >
              {isShuffling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shuffle className="w-5 h-5" />}
            </Button>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about outfits, styling tips, or anything fashion..."
              disabled={isTyping || isShuffling}
              className="flex-1 h-12 text-base border-purple-200 focus:border-purple-500 rounded-xl"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || isShuffling}
              className="h-12 px-6 bg-gradient-to-r from-purple-900 to-purple-300 hover:from-purple-800 hover:to-purple-300 rounded-xl"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Your stylist has access to your entire wardrobe and can suggest complete outfits
          </p>
        </div>
      </div>
    </div>
  );
}