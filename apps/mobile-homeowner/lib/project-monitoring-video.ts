/** Shared YouTube metadata for the project monitoring walkthrough video. */
export const PROJECT_MONITORING_VIDEO = {
  title: 'See How Project Monitoring Works',
  description:
    'Watch this quick walkthrough to understand how project tracking and updates look on BuildMyHouse.',
  youtubeUrl: 'https://youtu.be/LuIZYt1DNzw?si=n3b9RvIPkMyY10NS',
  youtubeEmbedUrl: 'https://www.youtube.com/embed/LuIZYt1DNzw',
  /** ISO 8601 date for schema.org VideoObject.uploadDate */
  youtubeUploadDate: '2026-05-26',
  videoId: 'LuIZYt1DNzw',
  watchPagePath: '/demo/project-monitoring',
} as const;

export function projectMonitoringThumbnail(quality: 'hqdefault' | 'maxresdefault' = 'hqdefault') {
  return `https://img.youtube.com/vi/${PROJECT_MONITORING_VIDEO.videoId}/${quality}.jpg`;
}

export function buildProjectMonitoringVideoJsonLd() {
  const webUrl = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
  const canonicalUrl = `${webUrl}${PROJECT_MONITORING_VIDEO.watchPagePath}`;

  return {
    '@type': 'VideoObject',
    '@id': `${canonicalUrl}#project-monitoring-video`,
    name: PROJECT_MONITORING_VIDEO.title,
    description: PROJECT_MONITORING_VIDEO.description,
    embedUrl: PROJECT_MONITORING_VIDEO.youtubeEmbedUrl,
    contentUrl: PROJECT_MONITORING_VIDEO.youtubeUrl,
    uploadDate: PROJECT_MONITORING_VIDEO.youtubeUploadDate,
    thumbnailUrl: projectMonitoringThumbnail(),
    mainEntityOfPage: canonicalUrl,
    publisher: {
      '@type': 'Organization',
      '@id': `${webUrl}/#organization`,
      name: 'BuildMyHouse Technologies',
    },
  };
}
