<template>
  <div :class="$style.container">
    <span :class="$style.icon">
      <icon mdi name="file-upload" :size="72" />
    </span>
    <p>ドロップしてファイルをアップロード</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Icon from '@/components/UI/Icon.vue'

export default defineComponent({
  name: 'ChannelViewFileUploadOverlay',
  components: { Icon },
  setup() {
    return {}
  }
})
</script>

<style lang="scss" module>
$messagePadding: 32px;

.container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  font-weight: bold;
  &::before {
    @include background-primary;
    top: 0;
    left: 0;
    display: block;
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.8;
    z-index: -1;
  }
}

.icon {
  @include background-secondary;
  width: 120px;
  height: 120px;
  border-radius: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
}
</style>
