import { useState } from "react";
import { analyzeVideos } from "../services/api";

export default function VideoInput({
  onAnalyze,
  onAnalyzeStart, // 1. Add the new prop here
}) {
  const [videoA, setVideoA] = useState("");
  const [videoB, setVideoB] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // 2. Trigger the stepper in App.js BEFORE the API call
      if (onAnalyzeStart) {
        onAnalyzeStart();
      }

      const result = await analyzeVideos(
        videoA,
        videoB
      );

      // 3. This will pass the data to App.js and hide the stepper
      onAnalyze(result);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-4 rounded-xl">
      <input
        type="text"
        value={videoA}
        placeholder="YouTube URL"
        onChange={(e) => setVideoA(e.target.value)}
        className="w-full p-3 rounded mb-3 bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="text"
        value={videoB}
        placeholder="Instagram Reel URL"
        onChange={(e) => setVideoB(e.target.value)}
        className="w-full p-3 rounded mb-3 bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded text-white font-medium"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </div>
  );
}