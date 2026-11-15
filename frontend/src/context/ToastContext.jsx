import {
    createContext,
    useCallback,
    useContext,
    useState,
    useEffect
} from "react";

const ToastContext = createContext(null);

function ToastItem({ toast, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, 3500);

        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    return (
        <div className={`rewear-toast toast-${toast.type}`} role="status">
            <span className="toast-icon">
                {toast.type === "success" ? "✓" : toast.type === "error" ? "!" : "i"}
            </span>

            <p>{toast.message}</p>

            <button
                type="button"
                onClick={() => onClose(toast.id)}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((current) =>
            current.filter((toast) => toast.id !== id)
        );
    }, []);

    const showToast = useCallback((message, type = "success") => {
        const id = `${Date.now()}-${Math.random()}`;

        setToasts((current) => [
            ...current,
            { id, message, type }
        ]);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div className="rewear-toast-container" aria-live="polite">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={removeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }

    return context;
}