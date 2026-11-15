
import { useEffect, useRef, useState } from "react";

function ScrollReveal({
    children,
    className = "",
    delay = 0,
    direction = "up"
}) {
    const elementRef = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = elementRef.current;

        if (!element) return;

        // Respect reduced-motion preferences
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(element);
                }
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={elementRef}
            style={{ "--reveal-delay": `${delay}ms` }}
            className={`scroll-reveal reveal-${direction} ${
                visible ? "scroll-visible" : ""
            } ${className}`}
        >
            {children}
        </div>
    );
}

export default ScrollReveal;
