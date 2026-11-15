import { useState } from "react";
import { useToast } from "../context/ToastContext";

function Contact() {

    const [submitted, setSubmitted] = useState(false);

    const { showToast } = useToast();

    const handleSubmit = async (event) => {

        event.preventDefault();

        const form = event.target;

        try {

            const response = await fetch(
                form.action,
                {
                    method: "POST",
                    body: new FormData(form),
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            if (response.ok) {

                setSubmitted(true);

                form.reset();
                showToast(
                    "Your message has been sent successfully.",
                    "success"
                );

            } else {

                showToast(
                    "Something went wrong. Please try again.",
                    "error"
                );

            }

        } catch (error) {

            console.error(
                "Contact form error:",
                error
            );

            showToast(
                "Unable to send your message. Please try again later.",
                "error"
            );
        }
    };


    return (

        <main className="contact-page">

            <section className="contact-intro">

                <p className="contact-eyebrow">
                    GET IN TOUCH
                </p>

                <h1>
                    Let's talk.
                </h1>

                <p>
                    Have a question about ReWear,
                    a listing, or something else?
                    We'd love to hear from you.
                </p>

            </section>


            <section className="contact-layout">

                <div className="contact-side">

                    <div className="contact-big-word">
                        HELLO!!
                    </div>

                    <p>
                        ReWear is about giving clothes
                        another chance — and making
                        second-hand fashion easier
                        to discover.
                    </p>

                    <div className="contact-detail">

                        {/* <span>
                            EMAIL
                        </span> */}

                        <strong>
                            Questions, ideas, feedback.
                        </strong>

                    </div>

                </div>


                <div className="contact-form-card">

                    {submitted ? (

                        <div className="contact-success">

                            <div className="success-icon">
                                ✓
                            </div>

                            <h2>
                                Message sent.
                            </h2>

                            <p>
                                Thanks for reaching out.
                                We'll get back to you soon.
                            </p>

                            <button
                                onClick={() =>
                                    setSubmitted(false)
                                }
                            >
                                Send another message
                            </button>

                        </div>

                    ) : (

                        <form
                            action="https://formspree.io/f/mkjgaqwa"
                            method="POST"
                            onSubmit={handleSubmit}
                        >

                            <div className="contact-field">

                                <label>
                                    Your name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your name"
                                    required
                                />

                            </div>


                            <div className="contact-field">

                                <label>
                                    Email address
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    required
                                />

                            </div>


                            <div className="contact-field">

                                <label>
                                    Subject
                                </label>

                                <input
                                    type="text"
                                    name="subject"
                                    placeholder="What is this about?"
                                    required
                                />

                            </div>


                            <div className="contact-field">

                                <label>
                                    Message
                                </label>

                                <textarea
                                    name="message"
                                    placeholder="Write your message..."
                                    rows="6"
                                    required
                                ></textarea>

                            </div>


                            <button
                                type="submit"
                                className="contact-submit"
                            >
                                Send Message →
                            </button>

                        </form>

                    )}

                </div>

            </section>

        </main>

    );
}

export default Contact;