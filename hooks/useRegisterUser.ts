import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

interface Session {
    user: User | null;
}

interface UseRegisterUserReturn {
    isRegistering: boolean;
    error: string | null;
    isRegistered: boolean;
}

export const useRegisterUser = (session: Session | null): UseRegisterUserReturn => {
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);

    useEffect(() => {
        const registerUser = async () => {
            // Skip if no session, already registering, or already registered
            if (!session?.user || isRegistering || isRegistered) {
                return;
            }
            
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
                await response.json();
                setIsRegistered(true);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred during registration');
                console.error('Registration error:', err);
            } finally {
                setIsRegistering(false);
            }
        };

        registerUser();
    }, [session, isRegistering, isRegistered]);

    return { isRegistering, error, isRegistered };
};