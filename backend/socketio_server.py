import socketio
from typing import Dict, Set
from supabase_client import get_supabase_client

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

active_users: Dict[str, Set[str]] = {}
typing_users: Dict[str, Dict[str, str]] = {}

def verify_token(token: str):
    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user.email
        return None
    except:
        return None

@sio.event
async def connect(sid, environ, auth):
    print(f"Client connected: {sid}")

    if not auth or 'token' not in auth:
        print(f"Rejected connection: No token provided")
        return False

    email = verify_token(auth['token'])
    if not email:
        print(f"Rejected connection: Invalid token")
        return False

    print(f"Authenticated user: {email}")
    return True

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

    rooms = sio.rooms(sid)
    for room in rooms:
        if room.startswith('team_'):
            team_id = room.replace('team_', '')
            await sio.emit('user_left', {'sid': sid}, room=room, skip_sid=sid)

@sio.event
async def join_team(sid, data):
    team_id = data.get('team_id')
    user_id = data.get('user_id')
    user_name = data.get('user_name')

    if not team_id or not user_id:
        return {'error': 'Missing team_id or user_id'}

    room = f"team_{team_id}"
    await sio.enter_room(sid, room)

    if team_id not in active_users:
        active_users[team_id] = set()
    active_users[team_id].add(user_id)

    await sio.emit('user_joined', {
        'user_id': user_id,
        'user_name': user_name,
        'active_count': len(active_users[team_id])
    }, room=room, skip_sid=sid)

    print(f"User {user_name} joined team {team_id}")
    return {'success': True, 'room': room}

@sio.event
async def leave_team(sid, data):
    team_id = data.get('team_id')
    user_id = data.get('user_id')

    if not team_id:
        return {'error': 'Missing team_id'}

    room = f"team_{team_id}"
    await sio.leave_room(sid, room)

    if team_id in active_users and user_id in active_users[team_id]:
        active_users[team_id].discard(user_id)
        if not active_users[team_id]:
            del active_users[team_id]

    if team_id in typing_users and user_id in typing_users[team_id]:
        del typing_users[team_id][user_id]

    return {'success': True}

@sio.event
async def send_message(sid, data):
    team_id = data.get('team_id')
    message = data.get('message')

    if not team_id or not message:
        return {'error': 'Missing team_id or message'}

    room = f"team_{team_id}"

    user_id = message.get('user_id')
    if team_id in typing_users and user_id in typing_users[team_id]:
        del typing_users[team_id][user_id]
        await sio.emit('typing_indicator', {
            'typing_users': list(typing_users.get(team_id, {}).values())
        }, room=room)

    await sio.emit('new_message', message, room=room)

    return {'success': True}

@sio.event
async def typing(sid, data):
    team_id = data.get('team_id')
    user_id = data.get('user_id')
    user_name = data.get('user_name')
    is_typing = data.get('is_typing', True)

    if not team_id or not user_id:
        return {'error': 'Missing team_id or user_id'}

    room = f"team_{team_id}"

    if team_id not in typing_users:
        typing_users[team_id] = {}

    if is_typing:
        typing_users[team_id][user_id] = user_name
    else:
        if user_id in typing_users[team_id]:
            del typing_users[team_id][user_id]

    await sio.emit('typing_indicator', {
        'typing_users': list(typing_users.get(team_id, {}).values())
    }, room=room, skip_sid=sid)

    return {'success': True}

socket_app = socketio.ASGIApp(sio)
