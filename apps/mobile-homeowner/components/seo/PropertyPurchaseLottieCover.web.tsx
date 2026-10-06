import BrandedLottieCover from '@/components/seo/BrandedLottieCover';

export default function PropertyPurchaseLottieCover({
  className = 'mb-4',
  height = 320,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <BrandedLottieCover
      animationUrl="/lottie/property-purchase-cover.json"
      label="Illustration of a property purchase being reviewed and approved"
      placeholder="house"
      className={className}
      height={height}
    />
  );
}
