# src/utils/session_token_helpers.py
import secrets
import time

_session_tokens = {}

def create_session_token(expires_in=3600):
    token = secrets.token_hex(16)
    _session_tokens[token] = {'valid': True, 'expires': time.time() + expires_in}
    return token

def validate_session_token(token):
    info = _session_tokens.get(token)
    if not info or not info['valid']:
        return False
    if info['expires'] < time.time():
        info['valid'] = False
        return False
    return True

def expire_session_token(token):
    if token in _session_tokens:
        _session_tokens[token]['valid'] = False
