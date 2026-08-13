<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  logoUrl?: string | null
  brandColor?: string | null
  size?: number
}>(), {
  logoUrl: null,
  brandColor: null,
  size: 40,
})

const { baseURL } = useApi()

const resolvedLogo = computed(() => {
  const url = props.logoUrl?.trim()
  if (!url) return null
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  if (url.startsWith('/')) {
    // /uploads/... servi par l’API (hors /api/v1)
    const origin = baseURL.replace(/\/api\/v1\/?$/, '')
    return `${origin}${url}`
  }
  return url
})

const initials = computed(() => {
  const parts = props.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'EQ'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
})

const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.max(12, Math.round(props.size * 0.36))}px`,
  background: props.brandColor?.trim() || 'var(--do-blue-soft)',
  color: props.brandColor?.trim() ? '#fff' : 'var(--do-blue)',
}))

const failed = ref(false)
watch(() => props.logoUrl, () => {
  failed.value = false
})
</script>

<template>
  <span
    class="team-mark"
    :style="avatarStyle"
    :aria-label="name"
    role="img"
  >
    <img
      v-if="resolvedLogo && !failed"
      :src="resolvedLogo"
      :alt="name"
      @error="failed = true"
    >
    <span
      v-else
      class="initials"
    >{{ initials }}</span>
  </span>
</template>

<style scoped>
.team-mark {
  display: inline-grid;
  place-items: center;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--do-ink) 8%, transparent);
}

.team-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.initials {
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
}
</style>
