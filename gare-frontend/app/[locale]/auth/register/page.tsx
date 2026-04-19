import RegisterForm from '@/components/auth/RegisterForm';
import Header from '@/components/layout/Header';

export default function RegisterPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 py-12">
        <RegisterForm />
      </div>
    </>
  );
}