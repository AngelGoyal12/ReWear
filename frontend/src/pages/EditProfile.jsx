import API_BASE_URL from "../utils/api";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = `${API_BASE_URL}/api/profile`;

function EditProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

        setName(data.user.name);
        setEmail(data.user.email);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmedName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile");
      }

      setName(data.user.name);
      setEmail(data.user.email);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess("Your profile has been updated successfully.");

      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="profile-page"><p>Loading...</p></main>;
  }

  return (
    <main className="profile-page">
      <section className="profile-container edit-profile-container">
        <div className="profile-heading">
          <div>
            <span className="profile-eyebrow">YOUR ACCOUNT</span>
            <h1>Edit Profile</h1>
            <p>Keep your personal information up to date.</p>
          </div>
        </div>

        <form className="profile-edit-card" onSubmit={handleSubmit}>
          <div className="profile-form-field">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="profile-form-field">
            <label htmlFor="profile-email">Email address</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              readOnly
            />
            <small>Your registered email address cannot be changed here.</small>
          </div>

          {error && <p className="profile-error">{error}</p>}
          {success && <p className="profile-success">{success}</p>}

          <div className="profile-form-actions">
            <Link to="/profile" className="profile-cancel-btn">
              Cancel
            </Link>

            <button
              type="submit"
              className="profile-edit-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default EditProfile;
