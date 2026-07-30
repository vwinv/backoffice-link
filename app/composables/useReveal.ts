export function useReveal() {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const nodes = document.querySelectorAll('.reveal')
    if (!nodes.length) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer?.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -40px 0px' },
    )

    nodes.forEach((node) => observer?.observe(node))
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })
}
