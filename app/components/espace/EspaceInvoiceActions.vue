<script setup lang="ts">
const props = defineProps<{
  canPay?: boolean
}>()

const emit = defineEmits<{
  open: []
  print: []
  pay: []
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const dropdown = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

function updatePosition() {
  const trigger = root.value?.querySelector('.trigger') as HTMLElement | null
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const gap = 4
  menuStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + gap}px`,
    left: `${rect.right}px`,
    transform: 'translateX(-100%)',
    zIndex: '200',
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    nextTick(() => updatePosition())
  }
}

function close() {
  open.value = false
}

function onOpen() {
  close()
  emit('open')
}

function onPrint() {
  close()
  emit('print')
}

function onPay() {
  close()
  emit('pay')
}

function onDocClick(event: MouseEvent) {
  if (!open.value) return
  const target = event.target as Node
  if (root.value?.contains(target)) return
  if (dropdown.value?.contains(target)) return
  close()
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function onReposition() {
  if (open.value) updatePosition()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', onReposition)
  window.addEventListener('scroll', onReposition, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onReposition)
  window.removeEventListener('scroll', onReposition, true)
})
</script>

<template>
  <div
    ref="root"
    class="menu"
  >
    <button
      type="button"
      class="trigger"
      :aria-label="$t('espace.invoices.actions')"
      :aria-expanded="open"
      @click.stop="toggle"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="5"
          r="1.8"
        />
        <circle
          cx="12"
          cy="12"
          r="1.8"
        />
        <circle
          cx="12"
          cy="19"
          r="1.8"
        />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdown"
        class="dropdown"
        role="menu"
        :style="menuStyle"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          @click="onOpen"
        >
          {{ $t('espace.invoices.open') }}
        </button>
        <button
          type="button"
          role="menuitem"
          @click="onPrint"
        >
          {{ $t('espace.invoices.print') }}
        </button>
        <button
          v-if="props.canPay"
          type="button"
          role="menuitem"
          @click="onPay"
        >
          {{ $t('espace.invoices.pay') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.menu {
  position: relative;
  display: inline-flex;
}

.trigger {
  width: 36px;
  height: 36px;
  border: 1px solid #ECF0FB;
  border-radius: 10px;
  background: #fff;
  color: var(--do-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.trigger:hover {
  color: var(--do-ink);
  background: var(--do-surface-soft);
}

.dropdown {
  min-width: 128px;
  background: #fff;
  border: 1px solid #ECF0FB;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(12, 13, 16, 0.1);
  padding: 4px;
  display: flex;
  flex-direction: column;
}

.dropdown button {
  border: 0;
  background: transparent;
  text-align: left;
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  color: #0c0d10;
}

.dropdown button:hover {
  background: #f4f6fb;
}
</style>
