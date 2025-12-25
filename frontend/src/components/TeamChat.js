import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { Send, Paperclip, FileText, X, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function TeamChat({ teamId, teamMembers }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const channelRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load message history on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chat/messages/${teamId}`, {
          params: { limit: 100 },
        });
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };
    
    fetchMessages();
  }, [teamId]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!teamId || !user) return;

    // Create channel for this team's chat
    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          console.log('New message received:', payload.new);
          // Add new message to state (avoid duplicates)
          setMessages((prev) => {
            const exists = prev.some(m => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, {
              id: payload.new.id,
              team_id: payload.new.team_id,
              user_id: payload.new.user_id,
              user_name: payload.new.user_name,
              message_type: payload.new.message_type,
              content: payload.new.content,
              file_url: payload.new.file_url,
              file_name: payload.new.file_name,
              file_size: payload.new.file_size,
              timestamp: payload.new.created_at,
              edited: payload.new.edited,
              edited_at: payload.new.edited_at
            }];
          });
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime status:', status);
        setConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [teamId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedFile) return;

    let fileData = null;

    // Upload file if selected
    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await axios.post(`${API_URL}/api/chat/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        fileData = uploadResponse.data;
      } catch (error) {
        console.error('File upload failed:', error);
        alert('Failed to upload file');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    try {
      const messageData = {
        team_id: teamId,
        message_type: fileData ? (fileData.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file') : 'text',
        content: newMessage.trim() || (fileData ? fileData.file_name : ''),
        file_url: fileData?.file_url,
        file_name: fileData?.file_name,
        file_size: fileData?.file_size,
      };

      // Save to database via API
      // Supabase Realtime will broadcast the new message automatically
      await axios.post(`${API_URL}/api/chat/messages`, messageData);

      // Clear input
      setNewMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessage = (message) => {
    const isOwn = message.user_id === user?.id;

    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
          {!isOwn && (
            <div className="text-xs text-gray-600 mb-1 font-semibold">{message.user_name}</div>
          )}
          <div
            className={`rounded-lg px-4 py-2 ${
              isOwn
                ? 'bg-modex-secondary text-white rounded-br-none'
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}
          >
            {message.message_type === 'image' && message.file_url && (
              <div className="mb-2">
                <img
                  src={`${API_URL}${message.file_url}`}
                  alt={message.file_name}
                  className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                  onClick={() => window.open(`${API_URL}${message.file_url}`, '_blank')}
                />
              </div>
            )}
            {message.message_type === 'file' && message.file_url && (
              <div className="mb-2 flex items-center space-x-2 bg-white/10 p-2 rounded">
                <FileText className="w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <a
                    href={`${API_URL}${message.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline block truncate"
                  >
                    {message.file_name}
                  </a>
                  <span className="text-xs opacity-75">{formatFileSize(message.file_size)}</span>
                </div>
              </div>
            )}
            {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
          </div>
          <div className="text-xs text-gray-500 mt-1">{formatTimestamp(message.timestamp)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border-2 border-gray-200">
      {/* Header */}
      <div className="bg-modex-secondary text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <div>
          <h3 className="font-bold">Team Chat</h3>
          <p className="text-xs opacity-90">
            {connected ? `${teamMembers?.length || 0} members • Live` : 'Connecting...'}
          </p>
        </div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
        {selectedFile && (
          <div className="mb-2 flex items-center justify-between bg-blue-50 p-2 rounded">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">{selectedFile.name}</span>
              <span className="text-xs text-blue-600">{formatFileSize(selectedFile.size)}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-600 hover:text-modex-secondary transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none"
            disabled={uploading}
          />
          
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || uploading}
            className="bg-modex-secondary text-white p-2 rounded-lg hover:bg-modex-primary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TeamChat;
