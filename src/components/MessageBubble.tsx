interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

const MessageBubble = ({ role, content }: MessageBubbleProps) => {
  if (role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="bg-primary text-primary-foreground rounded-[18px_18px_4px_18px] px-3.5 py-2.5 max-w-[75%] text-[15px] leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="text-foreground max-w-[90%] text-[15px] leading-[1.7] whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

export default MessageBubble;
