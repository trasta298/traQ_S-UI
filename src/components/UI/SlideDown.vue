<template>
  <transition
    name="slide-vertical"
    @enter="setHeight"
    @after-enter="unsetHeight"
    @before-leave="setHeight"
    @leave="unsetHeight"
  >
    <div v-if="isOpen" :class="$style.wrapper">
      <slot />
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { rAF } from '@/lib/util/timer'

export default defineComponent({
  name: 'SlideDown',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    }
  },
  setup() {
    const setHeight = ($el: HTMLElement) => {
      $el.style.height = `${$el.scrollHeight}px`
    }
    const unsetHeight = async ($el: HTMLElement) => {
      // フレームずらさないと処理がまとめられてheightのセットがされないことにされるため
      await rAF()
      await rAF()
      $el.style.height = (null as unknown) as string
    }
    return { setHeight, unsetHeight }
  }
})
</script>

<style lang="scss" module>
.wrapper {
  overflow: hidden;
}
</style>
