import ResponsableLayout from '@/components/responsable/common/ResponsableLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ResponsableLayout>{children}</ResponsableLayout>;
}
