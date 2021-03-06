<template>
  <div :class="$style.container">
    <span
      v-if="isPinned && !isMinimum"
      :class="$style.text"
      @click="withClose(removePinned)"
    >
      ピン留めを外す
    </span>
    <span
      v-else-if="!isMinimum"
      :class="$style.text"
      @click="withClose(addPinned)"
    >
      ピン留め
    </span>
    <span :class="$style.text" @click="withClose(showClipCreateModal)">
      クリップ
    </span>
    <span
      v-if="isMine && !isMinimum"
      :class="$style.text"
      @click="withClose(editMessage)"
    >
      編集
    </span>
    <span :class="$style.text" @click="withClose(copyLink)">
      リンクをコピー
    </span>
    <span :class="$style.text" @click="withClose(copyMd)">
      Markdownをコピー
    </span>
    <span
      v-if="isMine && !isMinimum"
      :class="$style.text"
      @click="withClose(deleteMessage)"
    >
      削除
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import store from '@/store'
import apis, { embeddingOrigin } from '@/lib/apis'
import { MessageId } from '@/types/entity-ids'
import clipboard from '@cloudcmd/clipboard'

const execWithToast = async (
  successText: string | undefined,
  errorText: string,
  func: () => void | Promise<void>
) => {
  try {
    await func()
    if (successText) {
      store.commit.ui.toast.addToast({
        type: 'info',
        text: successText
      })
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(errorText, e)

    store.commit.ui.toast.addToast({
      type: 'error',
      text: errorText
    })
  }
}

const usePinToggler = (props: { messageId: MessageId }) => {
  const addPinned = async () => {
    execWithToast(undefined, 'ピン留めに失敗しました', () =>
      store.dispatch.domain.messagesView.addPinned({
        messageId: props.messageId
      })
    )
  }
  const removePinned = async () => {
    execWithToast(undefined, 'ピン留めの解除に失敗しました', () =>
      store.dispatch.domain.messagesView.removePinned({
        messageId: props.messageId
      })
    )
  }
  return { addPinned, removePinned }
}

const useMessageChanger = (props: { messageId: MessageId }) => {
  const editMessage = () => {
    store.commit.domain.messagesView.setEditingMessageId(props.messageId)
  }
  const deleteMessage = () => {
    if (!confirm('本当にメッセージを削除しますか？')) return

    execWithToast(
      'メッセージを削除しました',
      'メッセージの削除に失敗しました',
      async () => {
        await apis.deleteMessage(props.messageId)
      }
    )
  }
  return { editMessage, deleteMessage }
}

const useCopy = (props: { messageId: MessageId }) => {
  const copyLink = async () => {
    const link = `${embeddingOrigin}/messages/${props.messageId}`
    execWithToast('コピーしました', 'コピーに失敗しました', () =>
      clipboard.writeText(link)
    )
  }
  const copyMd = async () => {
    const content =
      store.state.entities.messages[props.messageId]?.content ?? ''
    execWithToast('コピーしました', 'コピーに失敗しました', () =>
      clipboard.writeText(content)
    )
  }
  return { copyLink, copyMd }
}

const useShowClipCreateModal = (props: { messageId: MessageId }) => {
  const showClipCreateModal = () => {
    store.dispatch.ui.modal.pushModal({
      type: 'clip-create',
      messageId: props.messageId
    })
  }
  return { showClipCreateModal }
}

export default defineComponent({
  name: 'MessageToolsMenu',
  props: {
    messageId: {
      type: String as PropType<MessageId>,
      default: ''
    }
  },
  setup(props) {
    const isPinned = computed(() =>
      store.getters.domain.messagesView.isPinned(props.messageId)
    )
    const isMine = computed(
      () =>
        store.state.entities.messages[props.messageId]?.userId ===
        store.state.domain.me.detail?.id
    )
    const isMinimum = computed(
      () => store.state.ui.messageContextMenu.isMinimum
    )

    const { copyLink, copyMd } = useCopy(props)
    const { addPinned, removePinned } = usePinToggler(props)
    const { editMessage, deleteMessage } = useMessageChanger(props)
    const { showClipCreateModal } = useShowClipCreateModal(props)
    const withClose = async (func: () => void | Promise<void>) => {
      await func()
      store.dispatch.ui.messageContextMenu.closeMessageContextMenu()
    }

    return {
      isPinned,
      isMine,
      isMinimum,
      addPinned,
      removePinned,
      copyLink,
      copyMd,
      editMessage,
      deleteMessage,
      showClipCreateModal,
      withClose
    }
  }
})
</script>

<style lang="scss" module>
.container {
  @include background-primary;
  @include color-ui-secondary;
  @include drop-shadow-default;
  display: grid;
  width: max-content;
  padding: 8px 16px;
  border-radius: 4px;
  position: absolute;
  contain: content;
}

.text {
  margin: 2px 0;
  cursor: pointer;
}
</style>
