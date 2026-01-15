import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { LogIn } from 'lucide-react';

export function Login() {
    const { user, signInWithGoogle, loginAnonymously, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (user && !authLoading) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    const handleGoogleSignIn = async (method: 'popup' | 'redirect') => {
        setLoginError(null);
        setIsProcessing(true);
        try {
            await signInWithGoogle(method);
        } catch (err: any) {
            if (err.message === 'INVITATION_REQUIRED') {
                setLoginError('このメールアドレスは招待されていません。管理者に連絡してください。');
            } else {
                setLoginError('ログイン中にエラーが発生しました。もう一度お試しください。');
            }
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    if (authLoading) return null;

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
                    {loginError && (
                        <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-center">
                            {loginError}
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Button
                            size="lg"
                            className="w-full gap-2 text-lg font-semibold"
                            onClick={() => handleGoogleSignIn('popup')}
                            disabled={isProcessing}
                        >
                            <LogIn className="h-5 w-5" />
                            {isProcessing ? 'Connecting...' : 'Sign in with Google'}
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
                            onClick={() => handleGoogleSignIn('redirect')}
                            disabled={isProcessing}
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
                            disabled={isProcessing}
                        >
                            Guest Login (Tester)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
