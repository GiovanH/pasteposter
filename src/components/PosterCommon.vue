<script>

export default {
  name: "PosterCommon",
  props: ['input'],
  data () {
    return {
      images: {},
      feedback: "",
      last_post_srcdoc: "",
      character_limit: Infinity
    }
  },
  computed: {
    isPreloaded(){
      return (!JSON.stringify(this.payload).includes("UNLOADED"))
    },
    validated() {
      if (!this.isPreloaded) return false
      return true
    },
    relLink(){
      if (this.input.link) {
        try {
          const u = new URL(this.input.link)
          u.searchParams.append('ref', this.$options.name)
          return u.toString()
        } catch {
          return this.input.link
        }
      } else {
        return this.input.link
      }
    }
  },
  methods: {

  },
  created() {
    window[`vm_${this.$options.name}`] = this
  }
}

</script>