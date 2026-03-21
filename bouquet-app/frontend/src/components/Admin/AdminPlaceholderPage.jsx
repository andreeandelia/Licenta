export default function AdminPlaceholderPage({ title, description }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-base text-slate-500">{description}</p>
    </section>
  );
}
