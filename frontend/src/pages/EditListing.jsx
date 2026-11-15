import { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";
import API_BASE_URL from "../utils/api";
import {
    useNavigate,
    useParams
} from "react-router-dom";
import { getProductImageUrls } from "../utils/productImages";

function EditListing() {
    const { id } = useParams();
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

    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/products/${id}`
                );

                const data = await response.json();

                if (!response.ok) {
                    showToast(data.message, "error");
                    return;
                }

                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                    category: data.category || "",
                    size: data.size || "",
                    condition_status:
                        data.condition_status || "",
                    brand: data.brand || "",
                    price: data.price || "",
                    location: data.location || ""
                });

                if (data.images) {
                    try {
                        setExistingImages(getProductImageUrls(data));
                    } catch (error) {
                        console.error(
                            "Error reading existing images:",
                            error
                        );
                    }
                } else if (data.image_url) {
                    setExistingImages([
                        data.image_url
                    ]);
                }

            } catch (error) {
                console.error(
                    "Error fetching product:",
                    error
                );
            }
        };

        fetchProduct();
    }, [id]);

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleImageChange = (event) => {
        const selectedFiles = Array.from(
            event.target.files
        );

        if (selectedFiles.length > 5) {
            showToast(
                "You can only select up to 5 images.",
                "error"
            );
            event.target.value = ""; // Clear the file input
            return;
        }

        setNewImages(selectedFiles);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const token = localStorage.getItem("token");

        if (!token) {
            showToast("Please login first.", "error");
            navigate("/login");
            return;
        }

        try {
            const data = new FormData();

            data.append("title", formData.title);
            data.append(
                "description",
                formData.description
            );
            data.append(
                "category",
                formData.category
            );
            data.append("size", formData.size);
            data.append(
                "condition_status",
                formData.condition_status
            );
            data.append("brand", formData.brand);
            data.append("price", formData.price);
            data.append(
                "location",
                formData.location
            );

            newImages.forEach((image) => {
                data.append("images", image);
            });

            const response = await fetch(
                `${API_BASE_URL}/api/products/${id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    },
                    body: data
                }
            );

            const result =
                await response.json();

            if (!response.ok) {
                showToast(result.message, "error");
                return;
            }

            showToast(
                "Listing updated successfully!",
                "success"
            );
            

            navigate("/my-listings");

        } catch (error) {
            console.error(
                "Update listing error:",
                error
            );

            showToast(
                "Unable to connect to server",
                "error"
            );
        }
    };

    
    return (
        <main className="listing-form-page">
            <div className="listing-form-heading">
                <p className="section-eyebrow">YOUR WARDROBE, YOUR WAY</p>
                <h1>Edit your <em>listing.</em></h1>
                <p>Make changes to your item details or add new photos.</p>
            </div>

            <form className="listing-form-card" onSubmit={handleSubmit}>
                <div className="listing-form-section">
                    <div className="form-section-heading">
                        <span>01</span>
                        <div>
                            <h2>Item details</h2>
                            <p>Update the information buyers see.</p>
                        </div>
                    </div>

                    <div className="listing-fields">
                        <div className="listing-field full-width">
                            <label htmlFor="edit-title">Item title *</label>
                            <input
                                id="edit-title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Item title"
                                required
                            />
                        </div>

                        <div className="listing-field full-width">
                            <label htmlFor="edit-description">Description</label>
                            <textarea
                                id="edit-description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your item..."
                                rows="4"
                            />
                        </div>

                        <div className="listing-field">
                            <label htmlFor="edit-category">Category *</label>
                            <select
                                id="edit-category"
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
                            <label htmlFor="edit-size">Size</label>
                            <input
                                id="edit-size"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                placeholder="Size"
                            />
                        </div>

                        <div className="listing-field">
                            <label htmlFor="edit-condition">Condition</label>
                            <select
                                id="edit-condition"
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
                            <label htmlFor="edit-brand">Brand</label>
                            <input
                                id="edit-brand"
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                placeholder="Brand"
                            />
                        </div>

                        <div className="listing-field">
                            <label htmlFor="edit-price">Price (₹) *</label>
                            <input
                                id="edit-price"
                                type="number"
                                min="1"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Price"
                                required
                            />
                        </div>

                        <div className="listing-field">
                            <label htmlFor="edit-location">Location</label>
                            <input
                                id="edit-location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Location"
                            />
                        </div>
                    </div>
                </div>

                <div className="listing-form-section">
                    <div className="form-section-heading">
                        <span>02</span>
                        <div>
                            <h2>Current photos</h2>
                            <p>Your existing listing images.</p>
                        </div>
                    </div>

                    {existingImages.length === 0 ? (
                        <p className="no-existing-images">No images uploaded yet.</p>
                    ) : (
                        <div className="existing-images-grid">
                            {existingImages.map((image, index) => (
                                <img
                                    key={`${image}-${index}`}
                                    src={image}
                                    alt={`${formData.title} ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="listing-form-section">
                    <div className="form-section-heading">
                        <span>03</span>
                        <div>
                            <h2>Add new photos</h2>
                            <p>Select up to 5 replacement/additional images.</p>
                        </div>
                    </div>

                    <label className="image-upload-area" htmlFor="edit-images">
                        <span className="upload-icon">＋</span>
                        <strong>Choose new photos</strong>
                        <small>JPG, PNG or WEBP · Maximum 5 selected images</small>
                        <input
                            id="edit-images"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleImageChange}
                        />
                    </label>

                    {newImages.length > 0 && (
                        <div className="selected-images">
                            {newImages.map((image, index) => (
                                <div className="selected-image-item" key={`${image.name}-${index}`}>
                                    <span>IMG</span>
                                    <p>{image.name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="listing-form-submit">
                    <p>Your changes will update this listing.</p>
                    <button type="submit">Save changes <span>→</span></button>
                </div>
            </form>
        </main>
    );

}

export default EditListing;