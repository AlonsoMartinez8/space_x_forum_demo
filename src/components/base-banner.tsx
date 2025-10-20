type BaseBannerProps = {
  title: string;
};

export default function BaseBanner({ title }: BaseBannerProps) {
  return (
    <div className="w-full flex items-center justify-start mt-12 px-14 py-2">
      <h2 className="font-semibold text-lime-400/80"><i className="ri-arrow-right-s-line"></i> {title}</h2>
    </div>
  );
}
