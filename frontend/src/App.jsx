import { useState } from "react";
import VideoInput from "./components/VideoInput";
import VideoCard from "./components/VideoCard";
import ChatPanel from "./components/ChatPanel";

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

function App() {
  const [analysis, setAnalysis] = useState(null);

  const yt = analysis?.metadataA || analysis?.videoA;
  const ig = analysis?.metadataB || analysis?.videoB;

  const youtubeEngagement = (yt?.likes || 0) + (yt?.comments || 0);
  const instagramEngagement = (ig?.likes || 0) + (ig?.comments || 0);

  const youtubeScore = (yt?.views || 0) + youtubeEngagement;
  const instagramScore = (ig?.views || 0) + instagramEngagement;

  const winner = youtubeScore > instagramScore ? "YouTube" : "Instagram";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <main className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 text-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
            CreatorJoy Analyzer
          </h1>
          <p className="text-zinc-400">Compare cross-platform performance instantly</p>
        </header>

        <div className="max-w-3xl mx-auto mb-12">
          <VideoInput onAnalyze={setAnalysis} />
        </div>

        {analysis && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            
            {/* WINNER BANNER - Moved to top for better UX */}
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