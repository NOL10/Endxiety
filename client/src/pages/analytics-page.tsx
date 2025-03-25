import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { moodTypes } from "@shared/schema";

// Navbar component for reuse
import NavBar from "./components/NavBar";

// Types
interface MoodDistribution {
  [mood: string]: {
    count: number;
    percentage: number;
  };
}

interface DailyMood {
  date: string;
  count: number;
  moods: string[];
}

interface WellbeingTip {
  category: string;
  title: string;
  content: string;
  icon: string;
}

interface AnalyticsData {
  moodDistribution: MoodDistribution;
  overallScore: number;
  moodsByDay: DailyMood[];
  insights: string[];
  wellbeingTips: WellbeingTip[];
  totalPosts: number;
  totalMoodEntries: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  // Fetch analytics data
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  // Chart data preparation
  const prepareChartData = () => {
    if (!data) return [];
    
    return data.moodsByDay.map(day => {
      const moodCounts = moodTypes.reduce((acc, { label }) => {
        acc[label] = day.moods.filter(m => m === label).length;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        date: format(new Date(day.date), "EEE"),
        ...moodCounts
      };
    });
  };

  return (
    <>
      <NavBar active="analytics" />
      
      <main className="pt-16 min-h-screen bg-neutral-100">
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="font-display font-bold text-2xl mb-4 md:mb-0">Your Emotional Journey</h2>
              <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : data ? (
              <>
                {/* Mood Chart Card */}
                <Card className="shadow-card mb-8">
                  <CardContent className="pt-6">
                    <h3 className="font-display font-semibold text-lg mb-5">Mood Trends</h3>
                    
                    {/* Chart container */}
                    <div className="h-64 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareChartData()}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 0,
                            bottom: 5,
                          }}
                          barGap={0}
                          barCategoryGap="15%"
                        >
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          {moodTypes.map(({ label, emoji }) => (
                            <Bar 
                              key={label} 
                              dataKey={label} 
                              name={`${emoji} ${label}`}
                              fill={getMoodColor(label)}
                              radius={[4, 4, 0, 0]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 justify-center">
                      {moodTypes.map(({ label, emoji }) => (
                        <div key={label} className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: getMoodColor(label) }}
                          ></div>
                          <span className="text-sm text-neutral-700">{emoji} {label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* AI Insights Card */}
                  <Card className="shadow-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-5">
                        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary mr-3">
                          <i className="fas fa-lightbulb"></i>
                        </div>
                        <h3 className="font-display font-semibold text-lg">AI Insights</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {data.insights.map((insight, index) => (
                          <div key={index} className="p-4 rounded-lg bg-neutral-100">
                            <h4 className="font-medium text-neutral-800 mb-2">
                              {index === 0 ? "Mood Patterns" : 
                                index === 1 ? "Stress Triggers" : "Self-Care Reminder"}
                            </h4>
                            <p className="text-neutral-700 text-sm">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Well-being Summary */}
                  <Card className="shadow-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-5">
                        <div className="w-10 h-10 rounded-full bg-secondary-light flex items-center justify-center text-secondary mr-3">
                          <i className="fas fa-heart"></i>
                        </div>
                        <h3 className="font-display font-semibold text-lg">Well-being Summary</h3>
                      </div>
                      
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-neutral-700">Overall Mood Score</span>
                          <span className="text-sm font-medium text-primary">{data.overallScore}/100</span>
                        </div>
                        <Progress value={data.overallScore} className="h-2.5" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-neutral-100 rounded-lg p-4 text-center">
                          <div className="text-2xl text-primary mb-1">
                            {calculatePositivePercentage(data.moodDistribution)}%
                          </div>
                          <div className="text-sm text-neutral-600">Positive Emotions</div>
                        </div>
                        <div className="bg-neutral-100 rounded-lg p-4 text-center">
                          <div className="text-2xl text-neutral-600 mb-1">
                            {100 - calculatePositivePercentage(data.moodDistribution)}%
                          </div>
                          <div className="text-sm text-neutral-600">Challenging Emotions</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-neutral-800 mb-3">Most Common Emotions</h4>
                        <div className="space-y-3">
                          {Object.entries(data.moodDistribution)
                            .sort(([, a], [, b]) => b.percentage - a.percentage)
                            .slice(0, 3)
                            .map(([mood, { percentage }]) => (
                              <div key={mood} className="flex items-center">
                                <span className="text-xl mr-2">
                                  {moodTypes.find(m => m.label === mood)?.emoji}
                                </span>
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>{mood}</span>
                                    <span>{percentage}%</span>
                                  </div>
                                  <Progress 
                                    value={percentage} 
                                    className="h-1.5" 
                                    indicatorClassName={moodToProgressColor(mood)}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Well-being Tips */}
                <Card className="shadow-card mt-8">
                  <CardContent className="pt-6">
                    <h3 className="font-display font-semibold text-lg mb-5">Personalized Well-being Tips</h3>
                    
                    <div className="grid md:grid-cols-3 gap-5">
                      {data.wellbeingTips.map((tip, index) => (
                        <div 
                          key={index} 
                          className={`bg-${getBackgroundColor(tip.category)}-light bg-opacity-20 p-4 rounded-lg`}
                        >
                          <div className={`text-${getBackgroundColor(tip.category)} text-xl mb-2`}>
                            <i className={tip.icon}></i>
                          </div>
                          <h4 className="font-medium text-neutral-800 mb-2">{tip.title}</h4>
                          <p className="text-sm text-neutral-700">{tip.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-neutral-500">
                    Start tracking your moods to see analytics here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

// Utility functions
function getMoodColor(mood: string): string {
  switch (mood) {
    case "Happy": return "#7C7DF3"; // primary
    case "Sad": return "#6C757D"; // neutral
    case "Angry": return "#343A40"; // dark
    case "Irritated": return "#F78D35"; // accent-dark
    case "Exhausted": return "#ADB5BD"; // neutral-500
    default: return "#7FB069"; // secondary
  }
}

function calculatePositivePercentage(moodDistribution: MoodDistribution): number {
  const positiveEmotions = ["Happy"];
  const totalEntries = Object.values(moodDistribution).reduce((sum, { count }) => sum + count, 0);
  
  if (totalEntries === 0) return 0;
  
  const positiveCount = Object.entries(moodDistribution)
    .filter(([mood]) => positiveEmotions.includes(mood))
    .reduce((sum, [, { count }]) => sum + count, 0);
  
  return Math.round((positiveCount / totalEntries) * 100);
}

function moodToProgressColor(mood: string): string {
  switch (mood) {
    case "Happy": return "bg-green-500";
    case "Sad": return "bg-blue-500";
    case "Angry": return "bg-red-500";
    case "Irritated": return "bg-orange-500";
    case "Exhausted": return "bg-purple-500";
    default: return "bg-blue-500";
  }
}

function getBackgroundColor(category: string): string {
  switch (category.toLowerCase()) {
    case "mindfulness": return "primary";
    case "physical": return "secondary";
    case "creative": case "journal": return "accent";
    case "social": return "green";
    default: return "primary";
  }
}
