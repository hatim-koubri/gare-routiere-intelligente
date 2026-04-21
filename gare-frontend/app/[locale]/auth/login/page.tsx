// LoginPage
import LoginForm from '@/components/auth/LoginForm';
import { AuthUI } from '@/components/ui/auth-fuse';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function LoginPage({ params }: { params: { locale: string } }) {
  return (
    <>
      <Header />
      <AuthUI 
        isSignIn={true}
        signInContent={{
          quote: {
            text: "La gare routière du futur — construite pour votre confort aujourd'hui.",
            author: "Gare Connect 4.0"
          }
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter">Bienvenue</h1>
            <p className="text-balance text-sm text-muted-foreground">
              Connectez-vous pour gérer vos réservations et voyages.
            </p>
          </div>
          <LoginForm />
        </div>
      </AuthUI>
      <Footer />
    </>
  );
}