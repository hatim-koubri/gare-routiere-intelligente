// RegisterPage
import RegisterForm from '@/components/auth/RegisterForm';
import { AuthUI } from '@/components/ui/auth-fuse';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function RegisterPage({ params }: { params: { locale: string } }) {
  return (
    <>
      <Header />
      <AuthUI 
        isSignIn={false}
        signUpContent={{
          quote: {
            text: "Chaque grand voyage commence par un simple clic. Bienvenue dans le futur.",
            author: "Gare Connect 4.0"
          }
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter">Créer un compte</h1>
            <p className="text-balance text-sm text-muted-foreground">
              Inscrivez-vous pour accéder à tous nos services premium.
            </p>
          </div>
          <RegisterForm />
        </div>
      </AuthUI>
      <Footer />
    </>
  );
}