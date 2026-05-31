export function getEngagementRate(
  views,
  likes,
  comments
) {
  if (!views || views <= 0) {
    return 0;
  }

  return (
    ((likes + comments) / views) *
    100
  ).toFixed(2);
}