import { Link } from "react-router-dom";

function Footer() {

    return (

        <footer className="site-footer">

            <div className="footer-main">

                <div className="footer-brand">

                    <Link
                        to="/"
                        className="footer-logo"
                    >
                        ReWear
                    </Link>

                    <p>
                        Give clothes a second life.
                        <br />
                        Keep good things moving.
                    </p>

                </div>


                <div className="footer-links">

                    <div>

                        <span>
                            EXPLORE
                        </span>

                        <Link to="/">
                            Marketplace
                        </Link>

                        <Link to="/create-listing">
                            Sell Clothes
                        </Link>

                    </div>


                    <div>

                        <span>
                            ACCOUNT
                        </span>

                        <Link to="/login">
                            Login
                        </Link>

                        <Link to="/register">
                            Register
                        </Link>

                        <Link to="/my-listings">
                            My Listings
                        </Link>

                    </div>


                    <div>

                        <span>
                            HELP
                        </span>

                        <Link to="/contact">
                            Contact Us
                        </Link>

                    </div>

                </div>

            </div>


            <div className="footer-bottom">

                <span>
                    © 2026 ReWear
                </span>

                <span>
                    Made for a more circular wardrobe.
                </span>

            </div>

        </footer>

    );
}

export default Footer;