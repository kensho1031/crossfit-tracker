import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a0f',
                    color: '#00ffff',
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: 'sans-serif'
                }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>SYSTEM ERROR</h2>
                    <p style={{ color: 'rgba(0, 255, 255, 0.7)', fontSize: '0.9rem', maxWidth: '400px', marginBottom: '2rem' }}>
                        予期せぬエラーが発生しました。アプリをリセットするか、再読み込みをお試しください。
                    </p>

                    {this.state.error && (
                        <div style={{
                            background: 'rgba(255, 0, 0, 0.1)',
                            border: '1px solid rgba(255, 0, 0, 0.3)',
                            padding: '1rem',
                            borderRadius: '8px',
                            color: '#ff4d4d',
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            marginBottom: '2rem',
                            textAlign: 'left',
                            width: '100%',
                            maxWidth: '500px',
                            overflow: 'auto',
                            maxHeight: '150px'
                        }}>
                            {this.state.error.toString()}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px 20px',
                                background: '#00ffff',
                                color: '#0a0a0f',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            再読み込み
                        </button>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = '/';
                            }}
                            style={{
                                padding: '10px 20px',
                                background: 'transparent',
                                border: '1px solid rgba(0, 255, 255, 0.3)',
                                color: '#00ffff',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            アプリをリセット
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
