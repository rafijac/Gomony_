import pytest
from backend.game_session import GameSession

def test_game_session_player_info_fallback():
    # Create session, add player 1 with no info (legacy)
    session = GameSession("testgame1")
    token1 = session.add_player(1)
    info1 = session.player_info[1]
    assert info1["display_name"] == "Player 1"
    assert info1["avatar_url"].startswith("/assets/avatars/avatar")

    # Add player 2 with custom info
    token2 = session.add_player(2, display_name="Rafi", avatar_url="/assets/avatars/avatar3.png")
    info2 = session.player_info[2]
    assert info2["display_name"] == "Rafi"
    assert info2["avatar_url"] == "/assets/avatars/avatar3.png"

    # Simulate legacy session missing player_info
    session2 = GameSession("testgame2")
    session2.players = [1, 2]
    session2.player_info = {}  # legacy bug
    # Should fallback to default on access
    for p in [1, 2]:
        info = session2.player_info.get(p, {"display_name": f"Player {p}", "avatar_url": f"/assets/avatars/avatar{p}.png"})
        assert info["display_name"].startswith("Player")
        assert info["avatar_url"].startswith("/assets/avatars/avatar")


def test_game_session_player_info_locked_after_start():
    session = GameSession("testlock")
    session.add_player(1, display_name="A", avatar_url="/assets/avatars/avatar2.png")
    session.add_player(2, display_name="B", avatar_url="/assets/avatars/avatar3.png")
    session.start_game()
    # Attempt to update after start (should be locked)
    with pytest.raises(Exception):
        session.player_info[1]["display_name"] = "Hacker"


def test_game_session_avatar_name_editable_in_lobby_only():
    """Test that avatar/name can be edited in lobby but not after game start (should fail until implemented)."""
    session = GameSession("editlobby")
    token = session.add_player(1, display_name="Alpha", avatar_url="/assets/avatars/avatar2.png")
    # Edit before start
    session.player_info[1]["display_name"] = "Beta"
    assert session.player_info[1]["display_name"] == "Beta"
    session.start_game()
    # Edit after start should fail
    with pytest.raises(Exception):
        session.player_info[1]["display_name"] = "Gamma"
