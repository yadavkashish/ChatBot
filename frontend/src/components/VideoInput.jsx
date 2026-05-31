import {
  useState
} from "react";

import {
  analyzeVideos
} from "../services/api";

export default function VideoInput({
  onAnalyze,
}) {

  const [videoA,
    setVideoA] =
      useState("");

  const [videoB,
    setVideoB] =
      useState("");

  const [loading,
    setLoading] =
      useState(false);

  const handleSubmit =
    async () => {

      try {

        setLoading(true);

        const result =
          await analyzeVideos(
            videoA,
            videoB
          );

        onAnalyze(result);

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }
    };

  return (
    <div className="
      bg-zinc-900
      p-4
      rounded-xl
    ">

      <input
        type="text"
        value={videoA}
        placeholder="
          YouTube URL
        "
        onChange={(e)=>
          setVideoA(
            e.target.value
          )
        }
        className="
          w-full
          p-3
          rounded
          mb-3
          bg-zinc-800
        "
      />

      <input
        type="text"
        value={videoB}
        placeholder="
          Instagram Reel URL
        "
        onChange={(e)=>
          setVideoB(
            e.target.value
          )
        }
        className="
          w-full
          p-3
          rounded
          mb-3
          bg-zinc-800
        "
      />

      <button
        onClick={
          handleSubmit
        }
        disabled={
          loading
        }
        className="
          bg-blue-600
          px-4
          py-2
          rounded
        "
      >
        {
          loading
          ? "Analyzing..."
          : "Analyze"
        }
      </button>

    </div>
  );
}