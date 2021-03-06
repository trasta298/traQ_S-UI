<template>
  <div :class="$style.header">
    <span :class="$style.displayName">{{ state.displayName }}</span>
    <grade-badge :class="$style.badge" :user-id="userId" :is-bot="state.bot" />
    <span :class="$style.name">@{{ state.name }}</span>
    <span :class="$style.date">{{ state.date }}</span>
    <icon
      v-if="createdAt !== updatedAt"
      :class="$style.editIcon"
      :size="16"
      name="pencil"
      mdi
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, PropType } from 'vue'
import { UserId } from '@/types/entity-ids'
import store from '@/store'
import { getDisplayDate } from '@/lib/date'
import GradeBadge from './GradeBadge.vue'
import Icon from '@/components/UI/Icon.vue'

export default defineComponent({
  name: 'MessageHeader',
  props: {
    userId: {
      type: String as PropType<UserId>,
      required: true
    },
    createdAt: {
      type: String,
      required: true
    },
    updatedAt: {
      type: String,
      required: true
    }
  },
  components: { GradeBadge, Icon },
  setup(props) {
    const state = reactive({
      user: computed(() => store.state.entities.users[props.userId]),
      displayName: computed((): string => state.user?.displayName ?? 'unknown'),
      name: computed((): string => state.user?.name ?? 'unknown'),
      bot: computed((): boolean => state.user?.bot ?? false),
      date: computed(() => getDisplayDate(props.createdAt, props.updatedAt))
    })
    if (state.user === undefined) {
      store.dispatch.entities.fetchUser(props.userId)
    }
    return { state }
  }
})
</script>

<style lang="scss" module>
.header {
  display: inline-flex;
  align-items: baseline;
  min-width: 0;
}

.displayName {
  font-weight: bold;
  flex: 2;
  max-width: min-content;

  word-break: keep-all;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.badge {
  margin-left: 4px;
}

.name {
  @include color-ui-secondary;
  @include size-body2;
  margin-left: 4px;
  flex: 1;
  max-width: min-content;

  word-break: keep-all;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.date {
  @include color-ui-secondary;
  @include size-caption;
  margin-left: 4px;
}

.editIcon {
  @include color-ui-secondary;
  margin-left: 4px;
  flex-shrink: 0;
}
</style>
