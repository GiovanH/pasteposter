<template>
  <article class="composer col">
    <h2>Composer</h2>
    <section class="preview">
      <label>Body
        <textarea v-model="draft.body" style="height: 140px;" />
      </label>
      <label>Link
        <input type="text"
          v-model="draft.link" />
        <!-- @submit="event => draft.link = event.target.value" /> -->
        <!-- v-model="draft.link" /> -->
      </label>
      <label>Tags (space-separated)
        <input type="text"
          ref="taginput"
          @input="draft.tags = ($event.target.value.split(' ').filter(t => t.length > 0)) || undefined" />
      </label>
      <label>Label
        <input type="text"
          @input="draft.label = ($event.target.value == '' ? undefined : $event.target.value)" />
      </label>
      <label>Hide?
        <input type="checkbox" v-model="draft.hide" /></label>
      <label>Thread?
        <input type="checkbox" v-model="draft.thread" /></label>
      <label>Video
        <input type="file" ref="videoFile" @change="e => { draft.video = [...e.target.files, undefined][0] }" />
        <button @click="e => { draft.video = undefined; this.$refs.videoFile.value = '' }">x</button>
      </label>
      <label>Images ({{draft.images.length}})
        <input ref="imageDrop" placeholder="Paste images"/>
      </label>
      <div class="media">
        <img class="pointer"
          v-for="src, i in draft.images"
          :key="i"
          :src="src"
          @click="draft.images.splice(draft.images.indexOf(src), 1)" />
      </div>
        <button v-if="draft.images.length > 0" @click="draft.images=[]">Clear Images</button>
      <button @click="draft = defaultdraft">Clear All</button>
    </section>
    <section class="debug">
      <pre class="code" v-text="jsonDump" />
    </section>
  </article>
</template>

<script>
export default {
  name: "PostComposer",
  emits: ['update'],
  data() {
    return {
      defaultdraft: {
        link: "",
        body: "",
        hide: false,
        label: undefined,
        thread: false,
        images: [],
        video: undefined,
        tags: []
      },
      draft: {}
    }
  },
  created() {
    this.draft = {...this.defaultdraft, ...(this.Store.draft || {})}
  },
  mounted() {
    window.vm_composer = this
    this.$refs["taginput"].value = this.draft.tags.join(' ')
    this.$refs["imageDrop"].onpaste = (pasteEvent) => {
      // consider the first item (can be easily extended for multiple items)
      var item = pasteEvent.clipboardData.items[0];

      this.$logger.info(pasteEvent)

      if (item.type.indexOf("image") === 0) {
        var blob = item.getAsFile();

        var reader = new FileReader();
        reader.onload = (event) => {
          this.draft.images.push(event.target.result);
          this.$logger.info(this.draft.images)
        };

        reader.readAsDataURL(blob);
      }
    }
  },
  watch: {
    draft: {
      deep: true,
      handler(to) {
        this.$emit('update', to)
      },
    }
  },
  computed: {
    jsonDump() {
      return JSON.stringify(this.draft, undefined, 2)
    }
  }
}
</script>


<style scoped>

</style>
