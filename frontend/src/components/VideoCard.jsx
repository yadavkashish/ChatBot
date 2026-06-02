export default function VideoCard({ title, data }) {
  if (!data) return null;

  // Format the raw ISO date into a readable format (e.g., "June 1, 2026")
  const formattedDate = data.uploadDate
    ? new Date(data.uploadDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown Date";

  return (
    <div className="bg-zinc-900 p-6 rounded-xl h-full flex flex-col">
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 mb-6 border-b border-zinc-800 pb-3">
        {title}
      </h2>

      <div className="space-y-4 text-sm md:text-base flex-grow">
        
        <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
          <span className="text-zinc-400">Creator</span>
          <span className="font-medium text-zinc-100 truncate max-w-[60%]">
            @{data.creator}
          </span>
        </div>

        <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
          <span className="text-zinc-400">Views</span>
          <span className="font-medium text-zinc-100">
            {(data.views || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
          <span className="text-zinc-400">Likes</span>
          <span className="font-medium text-zinc-100">
            {(data.likes || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
          <span className="text-zinc-400">Comments</span>
          <span className="font-medium text-zinc-100">
            {(data.comments || 0).toLocaleString()}
          </span>
        </div>

        {/* FOOLPROOF DURATION CHECK: Hide if missing, 0, or "N/A" */}
        {data.duration && data.duration !== "N/A" && data.duration !== "0:00" && data.duration !== 0 && (
          <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
            <span className="text-zinc-400">Duration</span>
            <span className="font-medium text-zinc-100">
              {data.duration}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-1">
          <span className="text-zinc-400">Uploaded</span>
          <span className="font-medium text-zinc-100 text-right">
            {formattedDate}
          </span>
        </div>

      </div>
    </div>
  );
}