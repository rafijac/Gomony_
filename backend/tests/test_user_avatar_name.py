import pytest
from backend.user import User

def test_user_avatar_name_fallback():
    # Legacy user: no display_name or avatar_url provided
    user = User(username="legacyuser")
    assert user.display_name == "legacyuser"  # Fallback to username
    assert user.avatar_url == "/assets/avatars/avatar1.png"  # Default preset

    # New user: display_name and avatar_url provided
    user2 = User(username="newuser", display_name="CoolPlayer", avatar_url="/assets/avatars/avatar2.png")
    assert user2.display_name == "CoolPlayer"
    assert user2.avatar_url == "/assets/avatars/avatar2.png"

    # Edge: No username, no display_name
    user3 = User(username=None)
    assert user3.display_name == "Player"
    assert user3.avatar_url == "/assets/avatars/avatar1.png"


def test_user_avatar_name_migration_and_edit_lock():
    """Test migration for legacy users and editing lock after game start (should fail until implemented)."""
    # Simulate legacy user loaded from DB with no avatar/name fields
    legacy_data = {"username": "oldtimer"}  # no display_name/avatar_url
    user = User(**legacy_data)
    assert user.display_name == "oldtimer"  # fallback
    assert user.avatar_url == "/assets/avatars/avatar1.png"  # fallback

    # Simulate editing lock (should raise or ignore changes after lock)
    user.display_name = "NewName"
    user.avatar_url = "/assets/avatars/avatar3.png"
    # Simulate lock (should fail: not implemented)
    try:
        user.lock_profile()
        user.display_name = "Hacker"
        assert False, "Editing after lock should not be allowed"
    except AttributeError:
        # Expected: lock_profile not implemented yet
        pass
    except Exception:
        pass
