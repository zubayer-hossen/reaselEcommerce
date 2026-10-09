import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { localized } from "../../utils/format.js";
import { useSeo } from "../../hooks/useSeo.js";

const META = {
  about: ["public.cms.aboutTitle", "about"],
  privacy: ["public.cms.privacyTitle", "privacy"],
  terms: ["public.cms.termsTitle", "terms"],
  returns: ["public.cms.returnsTitle", "returns"],
  shipping: ["public.cms.shippingTitle", "shipping"],
  payment: ["public.cms.paymentTitle", "payment"],
};

export default function CmsPage({ slug: routeSlug }) {
  const { slug: paramSlug } = useParams();
  const slug = routeSlug || paramSlug;
  const { lang, t } = useLanguage();
  const { settings } = useSettings();
  const meta = META[slug] || META.privacy;
  const title = t(meta[0]);
  const content = localized(
    meta[1] === "about" ? settings?.about : settings?.policies?.[meta[1]],
    lang,
  );
  useSeo({ title, description: content?.slice(0, 160) });
  const paragraphs = useMemo(
    () =>
      String(content || "")
        .split(/\n{2,}/)
        .map((x) => x.trim())
        .filter(Boolean),
    [content],
  );

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">
        {title}
      </h1>
      {paragraphs.length ? (
        <div className="mt-7 space-y-5 text-[15px] leading-8 text-muted">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-7 rounded-card border border-line bg-surface-2 p-5 text-muted">
          {t("public.cms.empty")}
        </p>
      )}
    </article>
  );
}
