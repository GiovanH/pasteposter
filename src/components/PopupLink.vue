<template>
  <a
    :href="href"
    target="popup"
    :onclick="`window.open('${href}','popup','width=600,height=600'); return false;`"
    rel="noopener">
    <slot></slot>
  </a>
</template>

<script>
export default {
  name: "PopupLink",
  props: ['href']
}

</script>