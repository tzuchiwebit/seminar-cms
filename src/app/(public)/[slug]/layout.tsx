import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import FloatingRegister from "@/components/public/FloatingRegister";

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <>
      <Navbar slug={slug} />
      <main className="min-h-screen">{children}</main>
      <Footer slug={slug} />
      <FloatingRegister />
    </>
  );
}
