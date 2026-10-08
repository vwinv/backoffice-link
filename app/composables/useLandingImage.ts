const EN_SHOTS: Record<string, string> = {
  '/images/IMG_1381.PNG': '/images/IMG_1381_en.jpeg',
  '/images/IMG_1382.PNG': '/images/IMG_1382_en.jpeg',
  '/images/IMG_1384.PNG': '/images/IMG_1384_en.jpeg',
}

export function useLandingImage(src: string) {
  const { locale } = useI18n()

  return computed(() => (locale.value === 'en' ? EN_SHOTS[src] ?? src : src))
}
