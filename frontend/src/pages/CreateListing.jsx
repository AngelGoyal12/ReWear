
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

function CreateListing() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        size: "",
        condition_status: "",
        brand: "",
        price: "",
        location: ""
    });

    const [images, setImages] = useState([]);

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleImageChange = (event) => {
        const selectedFiles = Array.from(event.target.files);

        if (selectedFiles.length > 5) {
            showToast(
                "You can upload a maximum of 5 images.",
                "error"
            );

            event.target.value = "";
            return;
        }

        setImages(selectedFiles);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const token = localStorage.getItem("token");

        if (!token) {
            showToast("Please login first.", "error");
            navigate("/login");
            return;
        }

        if (images.length === 0) {
            showToast(
                "Please upload at least one image.",
                "error"
            );

            return;
        }

        const data = new FormData();

        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("category", formData.category);
        data.append("size", formData.size);
        data.append("condition_status", formData.condition_status);
        data.append("brand", formData.brand);
        data.append("price", formData.price);
        data.append("location", formData.location);

        images.forEach((image) => {
            data.append("images", image);
        });

        try {
            const response = await fetch(
                "http://localhost:5000/api/products",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: data
                }
            );

            const result = await response.json();

            if (!response.ok) {
                showToast(
                    result.message || "Unable to create listing.",
                    "error"
                );
                return;
            }

            showToast(
                "Listing created successfully!",
                "success"
            );

            navigate("/my-listings");

        } catch (error) {
            console.error("Create listing error:", error);

            showToast(
                "Unable to connect to server.",
                "error"
            );
        }
    };

    return (
        <main className="listing-form-page">
            <div className="listing-form-heading">
                <p className="section-eyebrow">GIVE IT ANOTHER LIFE</p>
                <h1>List a <em>piece.</em></h1>
                <p>Share something you no longer wear with someone who will.</p>
            </div>

            <form className="listing-form-card" onSubmit={handleSubmit}>
                <div className="listing-form-section">
                    <div className="form-section-heading">
                        <span>01</span>
                        <div>
                            <h2>About your item</h2>
                            <p>Start with the basics.</p>
                        </div>
                    </div>

                    <div className="listing-fields">
                        <div className="listing-field full-width">
                            <label htmlFor="listing-title">Item title *</label>
                            <input
                                id="listing-title"
                                name="title"
                                placeholder="e.g. Vintage denim jacket"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="listing-field full-width">
                            <label htmlFor="listing-description">Description</label>
                            <textarea
                                id="listing-description"
                                name="description"
                                placeholder="Tell buyers a little about this piece..."
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                            />
                        </div>

                        <div className="listing-field">
                            <label htmlFor="listing-category">Category *</label>
                            <select
                                id="listing-category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select category</option>
                                <option value="Shirts">Shirts</option>
                                <option value="T-Shirts">T-Shirts</option>
                                <option value="Jeans">Jeans</option>
                                <option value="Dresses">Dresses</option>
                                <option value="Jackets">Jackets</option>
                                <option value="Shoes">Shoes</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="listing-field">
                            <label htmlFor="listing-size">Size</label>
                            <input
                                id="listing-size"
                                name="size"
                                placeholder="e.g. M, UK 8, 32"
                                value={formData.size}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="listing-field">
                            <label htmlFor="listing-condition">Condition</label>
                            <select
                                id="listing-condition"
                                name="condition_status"
                                value={formData.condition_status}
                                onChange={handleChange}
                            >
                                <option value="">Select condition</option>
                                <option value="New">New</option>
                                <option value="Like New">Like New</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                            </select>
                        </div>

                        <div className="listing-field">
                            <label htmlFor="listing-brand">Brand</label>
                            <input
                                id="listing-brand"
                                name="brand"
                                placeholder="e.g. Zara, H&M"
                                value={formData.brand}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="listing-field">
                            <label htmlFor="listing-price">Price (₹) *</label>
                            <input
                                id="listing-price"
                                type="number"
                                name="price"
                                min="1"
                                placeholder="Enter your price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="listing-field">
                            <label htmlFor="listing-location">Location</label>
                            <input
                                id="listing-location"
                                name="location"
                                placeholder="City or area"
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="listing-form-section">
                    <div className="form-section-heading">
                        <span>02</span>
                        <div>
                            <h2>Show it off</h2>
                            <p>Add up to 5 photos of your item.</p>
                        </div>
                    </div>

                    <label className="image-upload-area" htmlFor="listing-images">
                        <span className="upload-icon">＋</span>
                        <strong>Choose your photos</strong>
                        <small>JPG, PNG or WEBP · Maximum 5 images</small>
                        <input
                            id="listing-images"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleImageChange}
                        />
                    </label>

                    {images.length > 0 && (
                        <div className="selected-images">
                            {images.map((image, index) => (
                                <div
                                    className="selected-image-item"
                                    key={`${image.name}-${index}`}
                                >
                                    <span>IMG</span>
                                    <p>{image.name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="listing-form-submit">
                    <p>Every piece deserves another chance.</p>
                    <button type="submit">
                        Publish listing <span>→</span>
                    </button>
                </div>
            </form>
        </main>
    );
}

export default CreateListing;
