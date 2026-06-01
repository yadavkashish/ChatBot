import { useState, useEffect } from "react";
import VideoInput from "./components/VideoInput";
import VideoCard from "./components/VideoCard";
import ChatPanel from "./components/ChatPanel";

// --- NEW LOADING STEPPER COMPONENT ---
function LoadingStepper() {
  const steps = ["Auth", "Extract", "Analyze", "Insights"];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 1500); 
    
    return () => clearInterval(timer);
  }, []);

  // Calculate the width of the connecting line
  const progressWidth = `${(currentStep / (steps.length - 1)) * 100}%`;

  return (
    <div className="w-full max-w-3xl mx-auto bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in-95 duration-500 my-8">
      
      <div className="flex flex-col items-center justify-center mb-12 gap-3 text-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Analyzing Content Performance...
        </h3>
        <p className="text-zinc-500 text-sm">Please wait patiently while we crunch the numbers.</p>
      </div>
      
      {/* Horizontal Stepper Container */}
      <div className="relative flex justify-between items-center w-full px-2 md:px-8">
        
        {/* Background Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-zinc-800 rounded-full z-0"></div>
        
        {/* Active Progress Line */}
        <div 
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full z-0 transition-all duration-700 ease-in-out"
          style={{ width: `calc(${progressWidth} - 3rem)` }} 
        ></div>

        {/* Step Circles */}
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all duration-500 border-4 ${
                  isCompleted ? 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                  isActive ? 'bg-zinc-950 border-indigo-400 text-indigo-400 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.2)]' :
                  'bg-zinc-950 border-zinc-800 text-zinc-600'
                }`}
              >
                {isCompleted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  index + 1
                )}
              </div>
              <span 
                className={`absolute -bottom-8 w-max text-center text-xs md:text-sm font-medium transition-colors duration-300 ${
                  isCompleted ? 'text-zinc-300' :
                  isActive ? 'text-indigo-300' :
                  'text-zinc-600'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-8"></div> {/* Spacer for the absolute positioned text */}
    </div>
  );
}

// --- EXISTING COMPARISON BAR ---
function ComparisonBar({
  label,
  a,
  b,
  colorA = "bg-red-500", // YouTube Red
  colorB = "bg-fuchsia-500", // Instagram Pink
}) {
  const max = Math.max(a || 0, b || 0, 1);
  const percentA = ((a || 0) / max) * 100;
  const percentB = ((b || 0) / max) * 100;

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-end mb-3">
        <span className="font-medium text-zinc-200">{label}</span>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="text-sm font-semibold text-zinc-300">
            {(a || 0).toLocaleString()} <span className="text-zinc-500 font-normal ml-1">YT</span>
          </span>
          <span className="text-sm font-semibold text-zinc-300">
            {(b || 0).toLocaleString()} <span className="text-zinc-500 font-normal ml-1">IG</span>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {/* YouTube Bar */}
        <div className="w-full bg-zinc-800/50 rounded-full h-2.5 overflow-hidden border border-zinc-800">
          <div
            className={`${colorA} h-full rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${percentA}%` }}
          />
        </div>
        {/* Instagram Bar */}
        <div className="w-full bg-zinc-800/50 rounded-full h-2.5 overflow-hidden border border-zinc-800">
          <div
            className={`${colorB} h-full rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${percentB}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
function App() {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // New state for loading

  const yt = analysis?.metadataA || analysis?.videoA;
  const ig = analysis?.metadataB || analysis?.videoB;

  const youtubeEngagement = (yt?.likes || 0) + (yt?.comments || 0);
  const instagramEngagement = (ig?.likes || 0) + (ig?.comments || 0);

  const youtubeScore = (yt?.views || 0) + youtubeEngagement;
  const instagramScore = (ig?.views || 0) + instagramEngagement;

  const winner = youtubeScore > instagramScore ? "YouTube" : "Instagram";

  // New handler functions to manage state
  const handleAnalyzeStart = () => {
    setIsAnalyzing(true);
    setAnalysis(null); // Clear previous results while loading
  };

  const handleAnalyzeComplete = (data) => {
    setAnalysis(data);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <main className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 text-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
            Cross Platform Analyzer
          </h1>
          <p className="text-zinc-400">Compare cross-platform performance instantly</p>
        </header>

        <div className="max-w-3xl mx-auto mb-12">
          {/* Update VideoInput to use the new handlers */}
          <VideoInput 
            onAnalyzeStart={handleAnalyzeStart} 
            onAnalyze={handleAnalyzeComplete} 
          />
        </div>

        {/* SHOW LOADING STEPPER */}
        {isAnalyzing && !analysis && (
          <LoadingStepper />
        )}

        {/* SHOW RESULTS */}
        {analysis && !isAnalyzing && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            
            {/* WINNER BANNER */}
            <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 overflow-hidden shadow-2xl shadow-indigo-500/10">
              <div className="bg-zinc-950/90 backdrop-blur-xl p-8 rounded-[15px] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                <div>
                  <h2 className="text-zinc-400 font-medium text-sm tracking-wider uppercase mb-1">Overall Winner</h2>
                  <p className="text-2xl md:text-3xl font-bold">
                    {winner === "YouTube" ? "YouTube Video " : "Instagram Reel "} 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                      Performs Better
                    </span>
                  </p>
                </div>
                <div className="text-5xl bg-zinc-900 p-4 rounded-full border border-zinc-800 shadow-inner">
                  🏆
                </div>
              </div>
            </div>

            {/* VIDEO CARDS */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-lg">
                <VideoCard title="YouTube Video" data={yt} />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-lg">
                <VideoCard title="Instagram Reel" data={ig} />
              </div>
            </div>

            {/* DASHBOARD GRID: BARS & TABLE */}
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* COMPARISON BARS */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-lg">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <span>📊</span> Performance Breakdown
                </h2>
                <div className="space-y-6">
                  <ComparisonBar label="Views" a={yt?.views} b={ig?.views} />
                  <ComparisonBar label="Likes" a={yt?.likes} b={ig?.likes} />
                  <ComparisonBar label="Comments" a={yt?.comments} b={ig?.comments} />
                  <ComparisonBar label="Followers" a={yt?.followers} b={ig?.followers} />
                  <div className="pt-6 mt-6 border-t border-zinc-800">
                    <ComparisonBar 
                      label="Total Engagement" 
                      a={youtubeEngagement} 
                      b={instagramEngagement} 
                      colorA="bg-blue-500" 
                      colorB="bg-indigo-500" 
                    />
                  </div>
                </div>
              </div>

              {/* STATS TABLE */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-lg flex flex-col">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span>📑</span> Detailed Metrics
                </h2>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                        <th className="py-4 px-4 font-medium w-1/3">Metric</th>
                        <th className="py-4 px-4 font-medium text-right">YouTube</th>
                        <th className="py-4 px-4 font-medium text-right">Instagram</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      <tr className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-4 px-4 font-medium text-zinc-300">Views</td>
                        <td className="py-4 px-4 text-right tabular-nums">{(yt?.views || 0).toLocaleString()}</td>
                        <td className="py-4 px-4 text-right tabular-nums">{(ig?.views || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-4 px-4 font-medium text-zinc-300">Likes</td>
                        <td className="py-4 px-4 text-right tabular-nums">{(yt?.likes || 0).toLocaleString()}</td>
                        <td className="py-4 px-4 text-right tabular-nums">{(ig?.likes || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-4 px-4 font-medium text-zinc-300">Comments</td>
                        <td className="py-4 px-4 text-right tabular-nums">{(yt?.comments || 0).toLocaleString()}</td>
                        <td className="py-4 px-4 text-right tabular-nums">{(ig?.comments || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-4 px-4 font-medium text-zinc-300">Followers</td>
                        <td className="py-4 px-4 text-right tabular-nums">{(yt?.followers || 0).toLocaleString()}</td>
                        <td className="py-4 px-4 text-right tabular-nums">{(ig?.followers || 0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* CHAT PANEL */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1 shadow-lg mt-8">
              <ChatPanel />
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}

export default App;