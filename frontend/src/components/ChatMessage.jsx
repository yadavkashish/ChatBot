export default function ChatMessage({ role, content, sources }) {
  const isUser = role === "user";

  return (
    <div className={`mb-6 flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-lg border border-indigo-400/30 text-sm">
          🤖
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-zinc-800/80 border border-zinc-700/50 text-zinc-200 rounded-tl-sm backdrop-blur-sm"
        }`}
      >
        {/* break-words fixes the overflow issue from your image */}
        <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {content}
        </div>

        {!isUser && sources?.length > 0 && (
          <div className="mt-3 pt-3 flex flex-wrap gap-2 border-t border-zinc-700/50">
            {sources.map((source, index) => (
              <span
                key={index}
                className="bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-md text-[10px] font-medium text-zinc-400 uppercase tracking-wider"
              >
                {source}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center shadow-lg border border-zinc-600 text-sm">
          👤
        </div>
      )}
    </div>
  );
}