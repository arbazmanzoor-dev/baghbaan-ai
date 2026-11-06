"""Optional accounts: sign up, log in, profile, validation and abuse protection."""

from __future__ import annotations

import pytest

from app.auth import normalise_phone

SIGNUP = {
    "name": "Ghulam  Nabi",
    "phone": "98765 43210",
    "password": "orchard123",
    "role": "farmer",
}


def signup(client, **overrides):
    return client.post("/auth/signup", json={**SIGNUP, **overrides})


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("9876543210", "+919876543210"),
        ("+91 98765 43210", "+919876543210"),
        ("09876543210", "+919876543210"),
        ("919876543210", "+919876543210"),
        ("0091-98765-43210", "+919876543210"),
    ],
)
def test_phone_normalisation(raw, expected) -> None:
    assert normalise_phone(raw) == expected


@pytest.mark.parametrize("raw", ["12345", "5876543210", "98765432101", "abcdefghij"])
def test_phone_rejects_invalid(raw) -> None:
    with pytest.raises(ValueError):
        normalise_phone(raw)


def test_signup_returns_token_and_profile(client) -> None:
    res = signup(client)
    assert res.status_code == 201
    body = res.json()
    assert body["token_type"] == "bearer" and body["access_token"]
    assert body["user"] == {
        **body["user"],
        "name": "Ghulam Nabi",
        "phone": "+919876543210",
        "role": "farmer",
    }
    assert "password" not in str(body) and "hash" not in str(body)


def test_duplicate_phone_is_rejected(client) -> None:
    assert signup(client).status_code == 201
    assert signup(client, phone="+91 9876543210").status_code == 409


@pytest.mark.parametrize(
    "overrides", [{"password": "short"}, {"name": "A"}, {"phone": "123"}, {"role": "admin"}]
)
def test_signup_validation(client, overrides) -> None:
    assert signup(client, **overrides).status_code == 422


def test_login_and_me(client) -> None:
    signup(client)
    res = client.post("/auth/login", json={"phone": "09876543210", "password": "orchard123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["phone"] == "+919876543210"


@pytest.mark.parametrize(
    "creds",
    [
        {"phone": "9876543210", "password": "wrong-password"},
        {"phone": "9123456789", "password": "orchard123"},  # unknown number
    ],
)
def test_login_failures_are_generic(client, creds) -> None:
    signup(client)
    res = client.post("/auth/login", json=creds)
    assert res.status_code == 401
    assert res.json()["detail"] == "Wrong phone number or password"


@pytest.mark.parametrize("header", [None, "Bearer not-a-jwt", "Basic abc"])
def test_me_requires_valid_token(client, header) -> None:
    headers = {"Authorization": header} if header else {}
    assert client.get("/auth/me", headers=headers).status_code == 401


def test_token_from_other_secret_is_rejected(make_client) -> None:
    first = make_client()
    token = signup(first).json()["access_token"]
    second = make_client(jwt_secret="a-completely-different-secret-value-123")
    assert second.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_login_is_rate_limited(make_client) -> None:
    client = make_client(auth_rate_limit="3/minute")
    codes = [
        client.post("/auth/login", json={"phone": "9876543210", "password": "x"}).status_code
        for _ in range(4)
    ]
    assert codes == [401, 401, 401, 429]


def test_scanning_does_not_require_an_account(client, sample_jpeg) -> None:
    res = client.post("/predict", files={"file": ("leaf.jpg", sample_jpeg, "image/jpeg")})
    assert res.status_code == 200
