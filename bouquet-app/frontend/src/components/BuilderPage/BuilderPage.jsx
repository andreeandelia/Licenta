import { Helmet } from "react-helmet-async";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Builder from "../Builder/Builder";
import {
  getSeoMeta,
  getOpenGraphTags,
  getCanonicalUrl,
} from "../../utils/seoHelper";

export default function BuilderPage() {
  const meta = getSeoMeta.builder;
  const og = getOpenGraphTags.builder;

  return (
    <div className="page-shell">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="og:title" content={og.ogTitle} />
        <meta name="og:description" content={og.ogDescription} />
        <meta name="og:image" content={og.ogImage} />
        <meta name="og:url" content={og.ogUrl} />
        <meta name="og:type" content="website" />
        <link rel="canonical" href={getCanonicalUrl("/builder")} />
      </Helmet>
      <Navbar />
      <main className="page-main">
        <Builder />
      </main>
      <Footer />
    </div>
  );
}
