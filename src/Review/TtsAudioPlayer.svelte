<script>
  export let src;

</script>

<audio controls id='tts-audio' {src}>
  <track kind='captions'>
</audio>

<style>
  audio {
    margin-top: 20px;
    filter: sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(100%);
    width: 200px;
    height: 25px;
}

  audio:hover {
    transform: scale(1.05);
  }

</style>