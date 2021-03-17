<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    /** Initial number */
    start: {
      type: Number,
      required: true,
    },
  },
})
</script>
