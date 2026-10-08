// Product text is sanitised on the server when saved (only p, br, strong, em, lists, h3/h4 survive).
// Plain text (the default in the admin form) keeps its line breaks.
const HAS_TAGS = /<\/?[a-z][\s\S]*>/i;

export default function RichText({ text }) {
  if (!text) return null;
  if (HAS_TAGS.test(text)) {
    // eslint-disable-next-line react/no-danger
    return <div className="prose-content space-y-3 [&_li]:ms-5 [&_ol]:list-decimal [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: text }} />;
  }
  return <p className="whitespace-pre-line leading-relaxed">{text}</p>;
}
