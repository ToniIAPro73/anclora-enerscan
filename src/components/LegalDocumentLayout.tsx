import Link from 'next/link';
import Navbar from './Navbar';
import Footer from './Footer';

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalDocumentLayoutProps = {
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};

export default function LegalDocumentLayout({ title, description, updatedAt, sections }: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-screen app-shell overflow-x-hidden">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-sm font-semibold text-[#00DC82] hover:brightness-110">
            Volver a Anclora EnergyScan
          </Link>
        </div>

        <article className="surface border rounded-3xl p-6 sm:p-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#00DC82]">
            Documento legal
          </p>
          <h1 className="font-heading text-3xl font-bold text-premium sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{description}</p>
          <p className="mt-3 text-xs text-muted">Última actualización: {updatedAt}</p>

          <div className="mt-10 space-y-9">
            {sections.map((section) => (
              <section key={section.title} className="border-t pt-7" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-heading text-xl font-bold text-premium">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
