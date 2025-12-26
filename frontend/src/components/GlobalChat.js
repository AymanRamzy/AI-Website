import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Send, MessageCircle, Loader, AlertCircle, User } from 'lucide-react';

/**
 * GlobalChat - Platform-wide chat for all authenticated users
 * 
 * Features:
 * - Real-time messaging via Supabase Realtime
 * - Loads last 50 messages on mount
 * - Auto-scroll to latest message
 * - Read-only for unauthenticated users
 */
function GlobalChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial messages
  useEffect(() => {
    loadMessages();
    
    // Subscribe to realtime inserts
    const channel = supabase
      .channel('global_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_chat_messages'
        },
        (payload) => {
          // Add new message to list
          setMessages((prev) => [...prev, payload.new]);
          // Scroll to bottom
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error: fetchError } = await supabase
        .from('global_chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (fetchError) throw fetchError;
      
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load chat messages. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to send messages.');
      return;
    }
    
    if (!newMessage.trim()) return;
    
    setSending(true);
    setError('');
    
    try {
      const { error: insertError } = await supabase
        .from('global_chat_messages')
        .insert({
          user_id: user.id,
          user_name: user.full_name || user.email?.split('@')[0] || 'Anonymous',
          message: newMessage.trim()
        });
      
      if (insertError) throw insertError;
      
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getInitials = (name) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const getAvatarColor = (userId) => {
    // Generate consistent color based on user ID
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
    ];
    const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-modex-secondary mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-modex-secondary to-modex-primary text-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="w-6 h-6 mr-3" />
            <div>
              <h3 className="font-bold text-lg">Global Chat</h3>
              <p className="text-sm opacity-90">{messages.length} messages • All participants</p>
            </div>
          </div>
          <div className="flex items-center text-sm opacity-80">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center text-red-700 text-sm flex-shrink-0">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = user?.id === msg.user_id;
            
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${getAvatarColor(msg.user_id)}`}>
                  {getInitials(msg.user_name)}
                </div>
                
                {/* Message Bubble */}
                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <span className="font-semibold text-sm text-gray-800">
                      {isOwnMessage ? 'You' : msg.user_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl ${
                    isOwnMessage 
                      ? 'bg-modex-secondary text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
        {user ? (
          <form onSubmit={sendMessage} className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-modex-secondary focus:outline-none transition-colors pr-12"
                disabled={sending}
                maxLength={500}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {newMessage.length}/500
              </span>
            </div>
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-modex-secondary hover:bg-modex-primary text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-3 bg-gray-100 rounded-xl">
            <p className="text-gray-600 text-sm">
              <User className="w-4 h-4 inline-block mr-2" />
              Please sign in to send messages
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalChat;
