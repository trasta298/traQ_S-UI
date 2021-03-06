<template>
  <modal-frame
    :title="title"
    :subtitle="subtitle"
    icon-name="hash"
    :class="$style.container"
  >
    <form-input
      label="チャンネル名"
      :class="$style.input"
      v-model="channelName"
    />
    <form-button
      label="作成"
      :disabled="!isCreateEnabled"
      :class="$style.button"
      @click="createChannel"
    />
  </modal-frame>
</template>

<script lang="ts">
import { defineComponent, computed, ref, Ref, SetupContext } from 'vue'
import store from '@/store'
import useChannelPath from '@/use/channelPath'
import ModalFrame from '../Common/ModalFrame.vue'
import FormInput from '@/components/UI/FormInput.vue'
import FormButton from '@/components/UI/FormButton.vue'
import { changeChannelById } from '@/router/channel'

const useCreateChannel = (
  props: { parentChannelId?: string },
  context: SetupContext,
  channelNameRef: Ref<string>
) => {
  const { channelIdToPathString } = useChannelPath()

  const createChannel = async () => {
    const parentChannelPath = props.parentChannelId
      ? `${channelIdToPathString(props.parentChannelId)}/`
      : ''
    if (
      !confirm(
        `本当に#${
          parentChannelPath + channelNameRef.value
        }を作成しますか？ (チャンネルの削除や移動、チャンネル名の変更はできません。)`
      )
    ) {
      return
    }

    try {
      const channel = await store.dispatch.entities.createChannel({
        name: channelNameRef.value,
        parent: props.parentChannelId ?? null
      })

      // 新規作成なのでホームチャンネルにならないため、全体のみ再構築
      await store.dispatch.domain.channelTree.constructChannelTree()

      await store.dispatch.ui.modal.popModal()
      changeChannelById(channel.id)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('チャンネル作成に失敗しました', e)

      store.commit.ui.toast.addToast({
        type: 'error',
        text: 'チャンネル作成に失敗しました'
      })
    }
  }
  return { createChannel }
}

export default defineComponent({
  name: 'ChannelCreateModal',
  components: {
    ModalFrame,
    FormInput,
    FormButton
  },
  props: {
    parentChannelId: String
  },
  setup(props, context) {
    const channelName = ref('')
    const { createChannel } = useCreateChannel(props, context, channelName)
    const { channelIdToPathString } = useChannelPath()
    const title = computed(
      () => (props.parentChannelId ? '子' : '') + 'チャンネルを作成'
    )
    const subtitle = computed(() =>
      props.parentChannelId
        ? channelIdToPathString(props.parentChannelId, true)
        : 'ルートチャンネル作成'
    )
    const isCreateEnabled = computed(() => channelName.value !== '')
    return {
      channelName,
      createChannel,
      title,
      subtitle,
      isCreateEnabled
    }
  }
})
</script>

<style lang="scss" module>
.input {
  margin-bottom: 16px;
  width: 100%;
}
.button {
  display: block;
  margin-left: auto;
}
</style>
