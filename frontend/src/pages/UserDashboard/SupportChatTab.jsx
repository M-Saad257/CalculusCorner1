import React from 'react';
import { MessageSquare, Loader2, Send } from 'lucide-react';

const SupportChatTab = ({
  chatLoading,
  chatMessages,
  chatInput,
  setChatInput,
  handleSendChatMessage,
  chatSending,
  chatEndRef,
  student
}) => {
  return (
    <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-230px)] bg-white rounded-3xl border border-border-color shadow-lg overflow-hidden animate-fadeIn text-left">
      {/* Chat Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-primary to-primary-dark text-white text-left">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 shadow-inner shrink-0">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="font-display font-bold text-sm !text-white leading-tight">Support Chat</h3>
          <span className="text-[10px] text-white/80 font-medium">Live support and appeals desk</span>
        </div>
      </div>

      {/* Chat Body */}
      <div className="grow p-6 overflow-y-auto flex flex-col gap-4 bg-bg-secondary/40 text-left">
        {chatLoading ? (
          <div className="my-auto text-center p-6 text-sm text-text-secondary">
            <Loader2 className="animate-spin mx-auto text-primary" size={24} />
            <p className="mt-2 text-xs">Loading conversation history...</p>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="my-auto text-center p-6 text-sm text-text-secondary animate-fadeIn">
            <MessageSquare className="mx-auto text-text-tertiary/40 mb-2" size={32} />
            <p className="font-semibold text-text-primary">Welcome to Support Chat</p>
            <p className="text-xs text-text-tertiary mt-1">Send a message below to start communicating with the administration team.</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isStudentSender = msg.sender_role === 'student';
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 max-w-[85%] ${isStudentSender ? 'self-end items-end' : 'self-start items-start'} animate-fadeIn`}
              >
                <div
                  className={`p-3 px-4 rounded-2xl text-sm leading-relaxed ${isStudentSender
                      ? 'bg-primary text-white rounded-br-sm shadow-sm'
                      : 'bg-white text-text-primary rounded-bl-sm border border-border-color shadow-sm'
                    }`}
                >
                  {msg.message}
                </div>
                <span className="text-[9px] text-text-tertiary font-bold px-1 select-none">
                  {new Date(msg.created_at || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Footer Input */}
      <div className="p-4 bg-white border-t border-border-color">
        <form onSubmit={handleSendChatMessage} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask administration or appeal your case..."
            className="grow px-4 py-2.5 border border-border-color rounded-full font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-inner transition-all bg-white text-text-primary"
            disabled={chatSending}
          />
          <button
            type="submit"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white border-0 shadow-md cursor-pointer hover:bg-primary-dark disabled:bg-text-tertiary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            disabled={chatSending || !chatInput.trim()}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportChatTab;
