import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

interface Session {
    user: User | null;
}

interface UseRegisterUserReturn {
    isRegistering: boolean;
    error: string | null;
}

export const useRegisterUser = (session: Session | null): UseRegisterUserReturn => {
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const registerUser = async () => {
            if (!session?.user) return;
            
            try {
                setIsRegistering(true);
                setError(null);
                
                const response: Response = await fetch('/api/user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to register user');
                }

                // Registration successful
                const data = await response.json();
                // You can handle the successful registration here if needed
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred during registration');
                console.error('Registration error:', err);
            } finally {
                setIsRegistering(false);
            }
        };

        registerUser();
    }, [session]);

    return { isRegistering, error };
};