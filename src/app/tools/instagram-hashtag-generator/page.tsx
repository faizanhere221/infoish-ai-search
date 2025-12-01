'use client'

import React, { useState } from 'react'
import { Hash, Sparkles, Copy, Check, TrendingUp, Target, Zap, Info, RefreshCw, Download, BookOpen } from 'lucide-react'
import Link from 'next/link'
interface Hashtag {
  tag: string
  category: 'popular' | 'niche' | 'trending'
  difficulty: 'easy' | 'medium' | 'hard'
  engagement_potential: 'low' | 'medium' | 'high'
  selected?: boolean
}

interface GeneratedResult {
  hashtags: Hashtag[]
  strategy_explanation: string
  related_niches: string[]
  tips: string[]
}

export default function HashtagGenerator() {
  const [description, setDescription] = useState('')
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [count, setCount] = useState(10)
  const [strategy, setStrategy] = useState<'balanced' | 'popular' | 'niche'>('balanced')
  
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [selectedHashtags, setSelectedHashtags] = useState<Set<number>>(new Set())

  const niches = [
    'Fashion & Style',
    'Food & Cooking',
    'Travel & Adventure',
    'Fitness & Health',
    'Beauty & Makeup',
    'Technology & Gadgets',
    'Business & Entrepreneurship',
    'Photography',
    'Art & Design',
    'Music & Entertainment',
    'Sports',
    'Lifestyle',
    'Education',
    'Gaming',
    'Pets & Animals',
    'Parenting',
    'Other'
  ]

  const generateHashtags = async () => {
    if (!description.trim()) {
      setError('Please enter a post description')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)
    setCopiedAll(false)

    try {
      // Simulating AI generation with predefined logic
      // This avoids CORS and authentication issues
      const generatedHashtags = await generateHashtagsLocal(
        description,
        niche,
        audience,
        count,
        strategy
      )

      setResult(generatedHashtags)

    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate hashtags. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Local hashtag generation function
  // PASTE THIS CODE TO REPLACE THE generateHashtagsLocal FUNCTION
// (Lines 87-257 in hashtag-generator.tsx)

const generateHashtagsLocal = async (
  desc: string,
  selectedNiche: string,
  targetAudience: string,
  hashtagCount: number,
  selectedStrategy: 'balanced' | 'popular' | 'niche'
): Promise<GeneratedResult> => {
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Extract keywords
  const words = desc.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)

  const stopWords = new Set([
  // Common words
  'the', 'has', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
  // Articles & Prepositions  
  'this', 'that', 'with', 'from', 'have', 'been', 'were', 'your', 'what', 'when', 'where', 'which', 'their', 'about', 'would', 'there', 'could', 'should', 'these', 'those', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
  // More common words
  'also', 'back', 'even', 'good', 'just', 'like', 'more', 'only', 'over', 'such', 'take', 'than', 'them', 'then', 'very', 'well', 'much', 'own', 'said', 'same', 'tell', 'does', 'each', 'find', 'give', 'hand', 'here', 'high', 'keep', 'last', 'long', 'made', 'make', 'most', 'move', 'part', 'seem', 'show', 'side', 'some', 'sure', 'take', 'tell', 'time', 'turn', 'want', 'way', 'well', 'will', 'work', 'year',
  // Verbs that don't work as hashtags
  'know', 'need', 'will', 'can', 'may', 'might', 'must', 'shall'
])
  
  const keywords = words.filter(word => !stopWords.has(word))

  // HASHTAG DATABASE
  const topicHashtags: Record<string, { popular: string[], niche: string[], trending: string[] }> = {
    'cricket': {
      popular: ['cricket', 'viratkohli', 'ipl', 'cricketlover', 'indiancricket', 'testcricket', 't20cricket', 'cricketfans'],
      niche: ['cricketlife', 'cricketfever', 'cricketer', 'cricketmatch', 'cricketworld', 'cricketlovers', 'cricketers'],
      trending: ['cricketreels', 'cricketvideos', 'cricketskills', 'cricketlegends', 'cricketindia']
    },
    'football': {
      popular: ['football', 'soccer', 'fifa', 'premierleague', 'championsleague', 'cr7', 'messi'],
      niche: ['footballlife', 'footballplayer', 'footballgame', 'footballseason', 'footballfan', 'soccerlife'],
      trending: ['footballreels', 'footballtraining', 'soccerskills', 'footballedits']
    },
    'ai': {
      popular: ['ai', 'chatgpt', 'artificialintelligence', 'openai', 'machinelearning', 'tech'],
      niche: ['aitools', 'aitechnology', 'aiml', 'deeplearning', 'ainews', 'aiassistant'],
      trending: ['aiproductivity', 'chatgpt4', 'generativeai', 'aiautomation']
    },
    'tech': {
      popular: ['technology', 'tech', 'innovation', 'gadgets', 'smartphone', 'techie'],
      niche: ['techlife', 'techlover', 'techy', 'techworld', 'techtrends', 'geek'],
      trending: ['techreels', 'techtips', 'techupdates', 'futuretech']
    },
    'fashion': {
      popular: ['fashion', 'style', 'ootd', 'fashionblogger', 'instafashion', 'fashionista', 'outfitoftheday'],
      niche: ['fashionstyle', 'fashiongram', 'styleinspo', 'fashionaddict', 'fashiondiaries'],
      trending: ['fashionreels', 'sustainablefashion', 'streetstyle']
    },
    'food': {
      popular: ['food', 'foodie', 'instafood', 'foodporn', 'foodblogger', 'yummy', 'delicious'],
      niche: ['foodlover', 'foodgasm', 'foodphotography', 'foodstagram', 'foodies'],
      trending: ['foodreels', 'foodtiktok', 'foodvideo', 'recipereels']
    },
    'fitness': {
      popular: ['fitness', 'gym', 'workout', 'fitnessmotivation', 'gymlife', 'fitfam'],
      niche: ['fitnessjourney', 'gymmotivation', 'workoutmotivation', 'fitnessgoals'],
      trending: ['homeworkout', 'fitnessreels', 'gymreels']
    },
    'lifestyle': {
      popular: ['lifestyle', 'life', 'daily', 'instagood', 'love', 'happy'],
      niche: ['lifestyleblogger', 'lifestylephotography', 'lifestylegoals'],
      trending: ['lifestylereels', 'lifestylevlog']
    }
  }

  // SMART DETECTION - Check in priority order
  const detectTopic = (): string => {
    // CRICKET (highest priority for sports)
    if (keywords.some(k => ['virat', 'kohli', 'cricket', 'century', 'wicket', 'batting', 'bowling', 'innings'].includes(k))) {
      return 'cricket'
    }
    
    // FOOTBALL
    if (keywords.some(k => ['football', 'ronaldo', 'messi', 'goal', 'soccer', 'fifa'].includes(k))) {
      return 'football'
    }
    
    // AI - Only if specific AI tools mentioned
    if (keywords.some(k => ['chatgpt', 'openai', 'gemini', 'claude', 'gpt'].includes(k))) {
      return 'ai'
    }
    
    // TECH - Only if tech-specific words
    if (keywords.some(k => ['technology', 'gadget', 'smartphone', 'laptop', 'computer', 'software'].includes(k))) {
      return 'tech'
    }
    
    // FITNESS
    if (keywords.some(k => ['fitness', 'gym', 'workout', 'exercise', 'muscle', 'training'].includes(k))) {
      return 'fitness'
    }
    
    // FOOD
    if (keywords.some(k => ['food', 'recipe', 'cooking', 'chef', 'restaurant', 'delicious'].includes(k))) {
      return 'food'
    }
    
    // FASHION
    if (keywords.some(k => ['fashion', 'style', 'outfit', 'dress', 'clothes', 'wear'].includes(k))) {
      return 'fashion'
    }
    
    // DEFAULT
    return 'lifestyle'
  }

  const topic = detectTopic()
  
  // Get keyword-based hashtags
  const keywordHashtags = keywords
    .filter(k => k.length >= 3 && k.length <= 20)
    .slice(0, 8)

  // Get topic hashtags
  const topicSet = topicHashtags[topic] || topicHashtags['lifestyle']
  
  // Build final list
  let allHashtags: string[] = []
  
  if (selectedStrategy === 'popular') {
    allHashtags = [
      ...keywordHashtags,
      ...topicSet.popular,
      ...topicSet.trending.slice(0, 3)
    ]
  } else if (selectedStrategy === 'niche') {
    allHashtags = [
      ...keywordHashtags,
      ...topicSet.niche,
      ...topicSet.trending,
      ...topicSet.popular.slice(0, 3)
    ]
  } else { // balanced
    allHashtags = [
      ...keywordHashtags,
      ...topicSet.popular.slice(0, 5),
      ...topicSet.niche.slice(0, 5),
      ...topicSet.trending.slice(0, 3)
    ]
  }

  // Remove duplicates and limit
  const uniqueHashtags = [...new Set(allHashtags)].slice(0, hashtagCount)

  // Create objects
  const hashtags: Hashtag[] = uniqueHashtags.map((tag) => {
    let category: 'popular' | 'niche' | 'trending' = 'niche'
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    let engagement: 'low' | 'medium' | 'high' = 'medium'

    if (keywordHashtags.includes(tag)) {
      category = 'trending'
      difficulty = 'easy'
      engagement = 'medium'
    } else if (topicSet.popular.includes(tag)) {
      category = 'popular'
      difficulty = 'hard'
      engagement = 'high'
    } else if (topicSet.trending.includes(tag)) {
      category = 'trending'
      difficulty = 'medium'
      engagement = 'high'
    }

    return { tag, category, difficulty, engagement_potential: engagement }
  })

  return {
    hashtags,
    strategy_explanation: `This ${selectedStrategy} strategy focuses on ${topic.toUpperCase()} content with hashtags related to "${keywords.slice(0, 3).join(', ')}". ${
      selectedStrategy === 'popular'
        ? 'Maximizing reach with high-traffic hashtags.'
        : selectedStrategy === 'niche'
          ? 'Targeting engaged communities.'
          : 'Balancing broad reach with targeted engagement.'
    }`,
    related_niches: Object.keys(topicHashtags).filter(t => t !== topic).slice(0, 5),
    tips: [
      `Post during peak hours for ${topic} content`,
      'Mix 3-5 popular tags with 10-15 niche tags',
      'Update hashtags regularly to avoid spam flags',
      'Use location tags if relevant',
      'Monitor which hashtags drive engagement'
    ]
  }
}



  const copyHashtag = (hashtag: string, index: number) => {
    navigator.clipboard.writeText(`#${hashtag}`)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const toggleHashtagSelection = (index: number) => {
    const newSelected = new Set(selectedHashtags)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedHashtags(newSelected)
  }

  const selectAll = () => {
    if (!result) return
    const allIndices = new Set(result.hashtags.map((_, i) => i))
    setSelectedHashtags(allIndices)
  }

  const deselectAll = () => {
    setSelectedHashtags(new Set())
  }

  const copySelectedHashtags = () => {
    if (!result) return
    const selected = result.hashtags
      .filter((_, index) => selectedHashtags.has(index))
      .map(h => `#${h.tag}`)
      .join(' ')
    
    if (selected) {
      navigator.clipboard.writeText(selected)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    }
  }

  const copyAllHashtags = () => {
    if (!result) return
    const allTags = result.hashtags.map(h => `#${h.tag}`).join(' ')
    navigator.clipboard.writeText(allTags)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const downloadHashtags = () => {
    if (!result) return
    const content = result.hashtags.map(h => `#${h.tag}`).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'instagram-hashtags.txt'
    a.click()
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'popular': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'niche': return 'bg-green-100 text-green-700 border-green-200'
      case 'trending': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'hard': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Hash className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Instagram Hashtag Generator</h1>
                <p className="text-xs sm:text-sm text-gray-600">AI-powered hashtags for maximum reach</p>
              </div>
            </div>

            <Link href="/blog/free-instagram-hashtag-generator-complete-guide">
  📖 Read: Complete Guide to Instagram Hashtags
</Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-8">
          <div className="space-y-6">
            
            {/* Post Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Post Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your post content... e.g., 'Fashion photoshoot in Karachi, traditional Pakistani dress with modern styling'"
                rows={4}
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Niche and Audience - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Niche */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Niche/Category
                </label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select niche (optional)</option>
                  {niches.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., Young professionals, Fashion lovers"
                  disabled={isLoading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Strategy Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Hashtag Strategy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setStrategy('balanced')}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    strategy === 'balanced'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  ⚖️ Balanced
                </button>
                <button
                  onClick={() => setStrategy('popular')}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    strategy === 'popular'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  🔥 Popular
                </button>
                <button
                  onClick={() => setStrategy('niche')}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    strategy === 'niche'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  🎯 Niche
                </button>
              </div>
            </div>

            {/* Hashtag Count Selection */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-3">
    Number of Hashtags
  </label>
  <div className="grid grid-cols-3 gap-3">
    <button
      onClick={() => setCount(5)}
      disabled={isLoading}
      className={`relative px-6 py-4 rounded-xl font-bold text-lg transition-all ${
        count === 5
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {count === 5 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="text-2xl font-bold mb-1">5</div>
      <div className="text-xs opacity-90">Focused</div>
    </button>
    
    <button
      onClick={() => setCount(10)}
      disabled={isLoading}
      className={`relative px-6 py-4 rounded-xl font-bold text-lg transition-all ${
        count === 10
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {count === 10 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="text-2xl font-bold mb-1">10</div>
      <div className="text-xs opacity-90">Balanced</div>
    </button>
    
    <button
      onClick={() => setCount(15)}
      disabled={isLoading}
      className={`relative px-6 py-4 rounded-xl font-bold text-lg transition-all ${
        count === 15
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {count === 15 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="text-2xl font-bold mb-1">15</div>
      <div className="text-xs opacity-90">Maximum</div>
    </button>
  </div>
  
  {/* Info text */}
  <div className="mt-3 p-3 bg-purple-50 rounded-lg">
    <p className="text-xs text-purple-700 flex items-start gap-2">
      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        {count === 5 && "Perfect for Stories and Reels - Most impactful hashtags only"}
        {count === 10 && "Recommended for Posts - Good balance of reach and relevance"}
        {count === 15 && "Maximum reach - Best for competitive niches"}
      </span>
    </p>
  </div>
</div>

            {/* Generate Button */}
            <button
              onClick={generateHashtags}
              disabled={isLoading || !description.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Hashtags...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Hashtags
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            
            {/* Strategy Explanation */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Strategy Explanation
              </h3>
              <p className="text-purple-50 leading-relaxed">
                {result.strategy_explanation}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={selectAll}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-purple-100 text-purple-700 font-semibold rounded-xl hover:bg-purple-200 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Select All ({result.hashtags.length})
                </button>
                <button
                  onClick={deselectAll}
                  disabled={selectedHashtags.size === 0}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deselect All
                </button>
                <button
                  onClick={copySelectedHashtags}
                  disabled={selectedHashtags.size === 0}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copiedAll && selectedHashtags.size > 0 ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Selected ({selectedHashtags.size})
                    </>
                  )}
                </button>
                <button
                  onClick={copyAllHashtags}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-white border-2 border-purple-500 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
                <button
                  onClick={downloadHashtags}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-white border-2 border-pink-500 text-pink-600 font-semibold rounded-xl hover:bg-pink-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={generateHashtags}
                  disabled={isLoading}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-white border-2 border-blue-500 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </div>

            {/* Hashtags Grid */}
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Hash className="w-6 h-6 text-purple-600" />
                Generated Hashtags ({result.hashtags.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {result.hashtags.map((hashtag, index) => {
                  const isSelected = selectedHashtags.has(index)
                  return (
                    <div
                      key={index}
                      onClick={() => toggleHashtagSelection(index)}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md scale-105'
                          : `border-transparent ${getCategoryColor(hashtag.category)} hover:shadow-md hover:scale-102`
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className="absolute top-2 right-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-purple-500 border-purple-500' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      {/* Hashtag Text */}
                      <div className="mb-2 pr-6">
                        <span className="font-bold text-gray-900 break-all text-sm">
                          #{hashtag.tag}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`capitalize px-2 py-0.5 rounded-full font-medium ${
                          hashtag.category === 'popular' ? 'bg-blue-100 text-blue-700' :
                          hashtag.category === 'niche' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {hashtag.category}
                        </span>
                        <span className={`font-semibold ${getDifficultyColor(hashtag.difficulty)}`}>
                          {hashtag.difficulty}
                        </span>
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyHashtag(hashtag.tag, index)
                        }}
                        className="absolute bottom-2 right-2 p-1.5 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Pro Tips
              </h3>
              <div className="space-y-3">
                {result.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Niches */}
            {result.related_niches && result.related_niches.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  Related Niches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.related_niches.map((relatedNiche, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {relatedNiche}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        

        {/* Info Section - When No Results */}
        {!result && !isLoading && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-4 text-left">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">1. Describe Your Post</h4>
                  <p className="text-sm text-gray-600">
                    Tell us what your post is about - the more details, the better hashtags we can generate!
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">2. Choose Your Strategy</h4>
                  <p className="text-sm text-gray-600">
                    Select balanced for mix, popular for reach, or niche for targeted engagement.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">3. Get AI-Powered Hashtags</h4>
                  <p className="text-sm text-gray-600">
                    Receive personalized hashtags with difficulty ratings and engagement potential!
                    
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        )}
      </div>
    </div>
    
  )
}

