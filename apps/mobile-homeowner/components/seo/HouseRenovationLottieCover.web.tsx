import BrandedLottieCover from '@/components/seo/BrandedLottieCover';

export default function HouseRenovationLottieCover({
  className = 'mb-4',
  height = 220,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <BrandedLottieCover
      animationUrl="/lottie/house-renovation.json"
      label="House renovation illustration"
      placeholder="house"
      className={className}
      height={height}
    />
  );
}
