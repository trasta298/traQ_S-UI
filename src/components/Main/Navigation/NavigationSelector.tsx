import { createComponent } from '@vue/composition-api'

export default createComponent({
  name: 'NavigationSelector',
  setup() {
    return () => (
      <div class="navigation-selector">
        <ul>
          <li>ちゃんねる</li>
        </ul>
      </div>
    )
  }
})