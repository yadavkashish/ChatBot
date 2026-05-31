function ChatMessage({ role, content, sources }) {
  const isUser = role === "user";

  return (
    <div
      className={`mb-4 flex ${
        isUser
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-xl p-3 ${
          isUser
            ? "bg-blue-600"
            : "bg-zinc-800"
        }`}
      >
        <p>{content}</p>

        {!isUser &&
          sources?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((source, index) => (
                <span
                  key={index}
                  className="bg-zinc-700 px-2 py-1 rounded text-xs"
                >
                  {source}
                </span>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

export default ChatMessage;