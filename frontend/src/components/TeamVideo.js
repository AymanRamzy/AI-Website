import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Video, VideoOff, Phone, Users, Monitor } from 'lucide-react';

function TeamVideo({ teamId, teamName, teamMembers }) {
  const { user } = useAuth();
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null); // 'group' or '1-on-1'
  const [selectedMember, setSelectedMember] = useState(null);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('TeamVideo mounted with:', { teamId, teamName, teamMembers, user });
  }, [teamId, teamName, teamMembers, user]);

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
    
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    // Load Jitsi Meet API script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      console.log('Jitsi script loaded');
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Jitsi script');
    };
    document.body.appendChild(script);

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, []);

  const startGroupCall = () => {
    console.log('Start Group Call clicked');
    console.log('Container:', jitsiContainerRef.current);
    console.log('JitsiMeetExternalAPI available:', !!window.JitsiMeetExternalAPI);

    if (!window.JitsiMeetExternalAPI) {
      console.error('Jitsi API not loaded');
      alert('Video call system is still loading. Please wait a moment and try again.');
      return;
    }

    // Set inCall first to render the container
    setInCall(true);
    setCallType('group');

    // Wait for next render cycle to ensure container exists
    setTimeout(() => {
      if (!jitsiContainerRef.current) {
        console.error('Jitsi container still not ready after render');
        alert('Error: Video container not ready. Please try again.');
        setInCall(false);
        setCallType(null);
        return;
      }

      try {
        const roomName = `modex-team-${teamId}`;
        const domain = 'meet.jit.si';

        console.log('Creating Jitsi meeting:', roomName);

        const options = {
          roomName: roomName,
          width: '100%',
          height: '600px',
          parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'profile',
            'chat',
            'recording',
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'invite',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'download',
            'help',
            'mute-everyone',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
        userInfo: {
          displayName: user.full_name,
          email: user.email,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);

      api.addEventListener('readyToClose', () => {
        console.log('Call ended');
        api.dispose();
        setInCall(false);
        setCallType(null);
      });

      api.addEventListener('participantJoined', (participant) => {
        console.log('Participant joined:', participant);
      });

      jitsiApiRef.current = api;
      console.log('Jitsi call started successfully');
      } catch (error) {
        console.error('Error starting call:', error);
        alert('Failed to start video call: ' + error.message);
        setInCall(false);
        setCallType(null);
      }
    }, 100); // Wait 100ms for React to render
  };

  const startOneOnOneCall = (member) => {
    console.log('Start 1-on-1 Call clicked with member:', member);
    
    if (!member) {
      console.error('No member selected');
      alert('Error: Cannot start call. Please try again.');
      return;
    }

    if (!window.JitsiMeetExternalAPI) {
      console.error('Jitsi API not loaded');
      alert('Video call system is still loading. Please wait a moment and try again.');
      return;
    }

    // Set inCall first to render the container
    setInCall(true);
    setCallType('1-on-1');
    setSelectedMember(member);

    // Wait for next render cycle to ensure container exists
    setTimeout(() => {
      if (!jitsiContainerRef.current) {
        console.error('Jitsi container still not ready after render');
        alert('Error: Video container not ready. Please try again.');
        setInCall(false);
        setCallType(null);
        setSelectedMember(null);
        return;
      }

      try {
        // Create unique room for 1-on-1 call (sorted user IDs for consistency)
        const userIds = [user.id, member.user_id].sort();
        const roomName = `modex-private-${userIds[0]}-${userIds[1]}`;
        const domain = 'meet.jit.si';

        const options = {
          roomName: roomName,
          width: '100%',
          height: '600px',
          parentNode: jitsiContainerRef.current,
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'chat',
              'settings',
              'videoquality',
            ],
            SHOW_JITSI_WATERMARK: false,
          },
          userInfo: {
            displayName: user.full_name,
            email: user.email,
          },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);

        api.addEventListener('readyToClose', () => {
          api.dispose();
          setInCall(false);
          setCallType(null);
          setSelectedMember(null);
        });

        jitsiApiRef.current = api;
        console.log('1-on-1 call started successfully');
      } catch (error) {
        console.error('Error starting 1-on-1 call:', error);
        alert('Failed to start video call: ' + error.message);
        setInCall(false);
        setCallType(null);
        setSelectedMember(null);
      }
    }, 100); // Wait 100ms for React to render
  };

  const endCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    setInCall(false);
    setCallType(null);
    setSelectedMember(null);
  };

  // Render in-call interface
  if (inCall) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="bg-modex-secondary text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold">
              {callType === 'group'
                ? `Group Call - ${teamName}`
                : `Private Call with ${selectedMember?.user_name}`}
            </h3>
            <p className="text-xs opacity-90">
              {callType === 'group' ? `${teamMembers.length} members` : '1-on-1 call'}
            </p>
          </div>
          <button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center font-bold transition-colors"
          >
            <Phone className="w-4 h-4 mr-2" />
            End Call
          </button>
        </div>
        <div ref={jitsiContainerRef} className="bg-gray-900" style={{ minHeight: '600px' }}></div>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-modex-secondary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video call system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-modex-light rounded-full mb-4">
          <Video className="w-10 h-10 text-modex-secondary" />
        </div>
        <h3 className="text-xl font-bold text-modex-primary mb-2">Team Video Calls</h3>
        <p className="text-gray-600 text-sm">
          Start a group call with your team or a private call with a team member
        </p>
      </div>

      {/* Group Call */}
      <div className="mb-6">
        <button
          onClick={() => {
            console.log('Button clicked!');
            startGroupCall();
          }}
          className="w-full bg-modex-accent hover:bg-modex-primary text-white px-6 py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center"
        >
          <Users className="w-5 h-5 mr-2" />
          Start Group Call ({teamMembers.length} members)
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          All team members can join this call. Screen sharing enabled.
        </p>
        {!scriptLoaded && (
          <p className="text-xs text-orange-600 mt-2 text-center font-semibold">
            Loading video system... ({scriptLoaded ? 'Ready' : 'Please wait'})
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500">Or start a private call</span>
        </div>
      </div>

      {/* 1-on-1 Calls */}
      <div className="space-y-3">
        <h4 className="font-bold text-gray-700 text-sm mb-3">Team Members</h4>
        {teamMembers
          .filter((member) => member.user_id !== user.id)
          .map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  {member.user_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{member.user_name}</p>
                  {member.team_role && (
                    <span className="text-xs text-gray-500">{member.team_role}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => startOneOnOneCall(member)}
                className="bg-modex-secondary hover:bg-modex-primary text-white px-4 py-2 rounded-lg flex items-center text-sm font-bold transition-colors"
              >
                <Video className="w-4 h-4 mr-1" />
                Call
              </button>
            </div>
          ))}
      </div>

      {/* Features Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center">
          <Monitor className="w-4 h-4 mr-2" />
          Video Call Features
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• High-quality video and audio</li>
          <li>• Screen sharing for presentations</li>
          <li>• In-call text chat</li>
          <li>• No time limits</li>
        </ul>
      </div>
    </div>
  );
}

export default TeamVideo;
