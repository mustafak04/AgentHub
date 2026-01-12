/**
 * Client-side validation helpers
 * Gereksiz API/Firebase çağrılarını önlemek için
 */

// Email format validation
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (!password) {
        return { valid: false, message: 'Şifre gerekli' };
    }
    if (password.length < 6) {
        return { valid: false, message: 'Şifre en az 6 karakter olmalı' };
    }
    return { valid: true };
};

// Message validation
export const validateMessage = (
    message: string,
    maxLength: number = 2000
): { valid: boolean; message?: string } => {
    const trimmed = message.trim();

    if (trimmed === '') {
        return { valid: false, message: 'Mesaj boş olamaz' };
    }

    if (message.length > maxLength) {
        return { valid: false, message: `Mesaj ${maxLength} karakterden uzun olamaz` };
    }

    return { valid: true };
};

// Rate limiting helper
export const createRateLimiter = (minIntervalMs: number = 500) => {
    let lastCallTime = 0;

    return {
        canProceed: (): boolean => {
            const now = Date.now();
            if (now - lastCallTime < minIntervalMs) {
                return false;
            }
            lastCallTime = now;
            return true;
        },
        reset: () => {
            lastCallTime = 0;
        }
    };
};
