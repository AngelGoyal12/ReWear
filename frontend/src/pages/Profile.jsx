import API_BASE_URL from "../utils/api";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = `${API_BASE_URL}/api/profile`;

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile");
        }

        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <main className="profile-page"><p>Loading profile...</p></main>;
  }

  if (error) {
    return (
      <main className="profile-page">
        <p className="profile-error">{error}</p>
        <Link to="/">Back to home</Link>
      </main>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="profile-page">
      <section className="profile-container">
        <div className="profile-heading">
          <div>
            <span className="profile-eyebrow">YOUR ACCOUNT</span>
            <h1>My Profile</h1>
            <p>Your personal space on ReWear.</p>
          </div>

          <Link to="/edit-profile" className="profile-edit-btn">
            Edit profile
          </Link>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">{initials}</div>

          <div className="profile-user-info">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <span className="profile-status">
              {Number(user.is_verified) === 1
                ? "Verified account"
                : "Email not verified"}
            </span>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-details-heading">
            <h2>Personal information</h2>
            <p>Your registered account details.</p>
          </div>

          <div className="profile-detail-row">
            <span>Full name</span>
            <strong>{user.name}</strong>
          </div>

          <div className="profile-detail-row">
            <span>Email address</span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-detail-row">
            <span>Member since</span>
            <strong>
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })
                : "Not available"}
            </strong>
          </div>
        </div>

        <div className="profile-bottom">
          <p>Make your ReWear experience your own.</p>
          <Link to="/my-listings">View my listings →</Link>
        </div>
      </section>
    </main>
  );
}

export default Profile;
