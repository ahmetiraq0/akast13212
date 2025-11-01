import React, { useState } from 'react';
import { User } from '../types';
import WelcomeModal from './WelcomeModal';
import { auth, db, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, getAdditionalUserInfo, AuthErrorCodes } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { GoogleIcon, SpinnerIcon } from './icons';

interface AuthPageProps {
    setIsGuest: (isGuest: boolean) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ setIsGuest }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [welcomeUser, setWelcomeUser] = useState<User | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged in App.tsx will handle the rest
        } catch (error: any) {
            console.error("Login error:", error);
            if (error.code === AuthErrorCodes.INVALID_LOGIN_CREDENTIALS) {
                setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
            } else {
                setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            const newUser: User = {
                id: firebaseUser.uid,
                email: email,
                role: 'user',
                isActive: false,
                createdAt: new Date().toISOString()
            };

            // Create user profile in Firestore
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            
            setWelcomeUser(newUser); // Show welcome modal
        } catch (error: any) {
            console.error("Registration error:", error);
            if (error.code === AuthErrorCodes.EMAIL_EXISTS) {
                setError('هذا البريد الإلكتروني مسجل بالفعل. الرجاء تسجيل الدخول.');
            } else {
                 setError('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const additionalUserInfo = getAdditionalUserInfo(result);
    
            if (additionalUserInfo?.isNewUser) {
                const firebaseUser = result.user;
                const newUser: User = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email!, // Google sign-in guarantees an email
                    role: 'user',
                    isActive: false,
                    createdAt: new Date().toISOString()
                };
    
                await setDoc(doc(db, "users", firebaseUser.uid), newUser);
                setWelcomeUser(newUser);
            }
            // If it's not a new user, onAuthStateChanged in App.tsx will take over.
        } catch (error: any) {
            console.error("Google Sign-In error:", error);
            setError('حدث خطأ أثناء تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGuest = () => {
        setIsGuest(true);
    };
    
    // onAuthStateChanged will log the user in, so we just close the modal.
    const handleWelcomeModalClose = () => {
        setWelcomeUser(null);
    };

    const renderForm = () => {
        const handleSubmit = isLoginView ? handleLogin : handleRegister;
        return (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        البريد الإلكتروني
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        كلمة المرور
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={isLoginView ? "current-password" : "new-password"}
                            required
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'جاري...' : (isLoginView ? 'تسجيل الدخول' : 'إنشاء حساب جديد')}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <>
            <WelcomeModal 
                isOpen={!!welcomeUser}
                user={welcomeUser}
                onClose={handleWelcomeModalClose}
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        إدارة الأقساط
                    </h1>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {isLoginView ? 'سجل الدخول إلى حسابك' : 'أنشئ حساباً جديداً للبدء'}
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
                        {error && <div className="mb-4 text-center text-sm bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-md">{error}</div>}
                        {renderForm()}
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">أو</span>
                                </div>
                            </div>

                             <div className="mt-6">
                                <div>
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading || isGoogleLoading}
                                        className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGoogleLoading ? (
                                            <SpinnerIcon className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <>
                                                <GoogleIcon className="w-5 h-5 mr-3" />
                                                <span>تسجيل الدخول عبر Google</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <div>
                                    <button
                                        onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
                                        disabled={isLoading || isGoogleLoading}
                                        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>{isLoginView ? 'إنشاء حساب' : 'لدي حساب بالفعل'}</span>
                                    </button>
                                </div>
                                <div>
                                    <button
                                        onClick={handleGuest}
                                        disabled={isLoading || isGoogleLoading}
                                        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>الدخول كضيف</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AuthPage;