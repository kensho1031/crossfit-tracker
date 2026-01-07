import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { LogIn } from 'lucide-react';

export function Login() {
    const { user, signInWithGoogle, loginAnonymously, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !loading) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) return null; // Or a spinner, but AuthContext has global loader

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md border-primary/20 bg-card shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-primary">
                        CrossFit Tracker
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        Sign in to track your progress
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Button
                            size="lg"
                            className="w-full gap-2 text-lg font-semibold"
                            onClick={() => signInWithGoogle('popup')}
                        >
                            <LogIn className="h-5 w-5" />
                            Sign in with Google
                        </Button>
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Or for mobile
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full gap-2 text-lg"
                            onClick={() => signInWithGoogle('redirect')}
                        >
                            Sign in via Redirect
                        </Button>
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Guest Access
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="lg"
                            className="w-full gap-2 text-lg border-2 border-dashed border-muted hover:border-primary/50"
                            onClick={() => loginAnonymously()}
                        >
                            Guest Login (Tester)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
