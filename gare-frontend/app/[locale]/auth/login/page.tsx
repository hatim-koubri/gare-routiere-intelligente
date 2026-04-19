import LoginForm from '@/components/auth/LoginForm';
import Header from '@/components/layout/Header';

export default function LoginPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 py-12">
        <LoginForm />
      </div>
    </>
  );
}