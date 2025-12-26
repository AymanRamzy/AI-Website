import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Send, MessageCircle, Users, ArrowLeft, Loader, 
  Shield, RefreshCw, FileText 
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * AdminTeamChat - Admin component to monitor and chat with teams
 * Allows admins to view all teams and their chat messages
 * Admin messages are marked with a shield icon
 */
function AdminTeamChat() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all teams
  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/teams`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Load team chat when selected
  const selectTeam = async (team) => {
    setSelectedTeam(team);
    setLoadingChat(true);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/teams/${team.id}/chat`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
    setLoadingChat(false);
  };

  // Subscribe to real-time updates when team is selected
  useEffect(() => {
    if (!selectedTeam) return;

    const channel = supabase
      .channel(`admin-team-chat-${selectedTeam.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `team_id=eq.${selectedTeam.id}`
        },
        (payload) => {
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
              is_admin: payload.new.is_admin
            }];
          });
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [selectedTeam]);

  // Send admin message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeam) return;

    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/teams/${selectedTeam.id}/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      if (response.ok) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSending(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Render message
  const renderMessage = (message) => {
    const isAdmin = message.is_admin || message.user_name?.includes('Admin');
    const isOwnAdmin = message.user_id === user?.id && isAdmin;

    return (
      <div key={message.id} className={`flex ${isOwnAdmin ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[75%]`}>
          <div className="flex items-center gap-1 mb-1">
            {isAdmin && <Shield className="w-3 h-3 text-blue-600" />}
            <span className={`text-xs font-semibold ${isAdmin ? 'text-blue-600' : 'text-gray-600'}`}>
              {message.user_name}
            </span>
          </div>
          <div
            className={`rounded-lg px-4 py-2 ${
              isAdmin
                ? 'bg-blue-100 border border-blue-300 text-blue-900'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {message.message_type === 'file' && message.file_url && (
              <div className="mb-2 flex items-center space-x-2 bg-white/50 p-2 rounded">
                <FileText className="w-5 h-5 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <a
                    href={`${API_URL}${message.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline block truncate"
                  >
                    {message.file_name}
                  </a>
                  <span className="text-xs text-gray-500">{formatFileSize(message.file_size)}</span>
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

  // Teams list view
  if (!selectedTeam) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Team Chats</h2>
                <p className="text-sm text-blue-100">Monitor and support teams</p>
              </div>
            </div>
            <button
              onClick={fetchTeams}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Teams List */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500">Loading teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No teams found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => selectTeam(team)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-left border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{team.name}</h3>
                      <p className="text-xs text-gray-500">
                        {team.member_count} members • {team.status}
                      </p>
                    </div>
                  </div>
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedTeam(null);
              setMessages([]);
            }}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold">{selectedTeam.name}</h3>
            <p className="text-xs text-blue-100">
              {connected ? 'Live • Admin Support Mode' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-yellow-300" />
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loadingChat ? (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet in this team chat</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Admin Message Input */}
      <div className="border-t border-gray-200 p-4 bg-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-blue-600 font-semibold">Sending as Admin Support</span>
        </div>
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a support message..."
            className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminTeamChat;
