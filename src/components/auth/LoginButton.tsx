import { useAuth } from '../../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export function LoginButton() {
    const { signInWithGoogle, loginAnonymously } = useAuth();

    return (
        <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
                onClick={() => signInWithGoogle('popup')}
                className="flex items-center justify-center gap-2 bg-white text-black py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors w-full"
            >
                <LogIn size={20} />
                <span>Googleでログイン</span>
            </button>

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">または</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <button
                onClick={() => loginAnonymously()}
                className="flex items-center justify-center gap-2 bg-transparent border border-gray-600 text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-white/5 transition-colors w-full text-sm"
            >
                <span>ゲストとして利用する</span>
            </button>
        </div>
    );
}
